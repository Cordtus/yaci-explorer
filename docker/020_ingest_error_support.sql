-- Migration 020: Support for transaction ingest errors
-- When yaci fails to fetch transaction details (e.g., oversized transactions),
-- it stores error metadata instead of failing the entire block.
-- This migration adds support for handling and displaying these partial transactions.

BEGIN;

-- Make height nullable to allow ingest error transactions
-- (They won't have height in the raw data structure)
ALTER TABLE api.transactions_main ALTER COLUMN height DROP NOT NULL;

-- Add ingest_error column to store error metadata directly
ALTER TABLE api.transactions_main ADD COLUMN IF NOT EXISTS ingest_error JSONB;

-- Index for finding transactions with ingest errors
CREATE INDEX IF NOT EXISTS idx_tx_ingest_error ON api.transactions_main(id) WHERE ingest_error IS NOT NULL;

-- Update the trigger function to handle ingest errors
CREATE OR REPLACE FUNCTION update_transaction_main()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  error_text TEXT;
  proposal_ids TEXT[];
  ingest_err JSONB;
  tx_height BIGINT;
  tx_timestamp TIMESTAMPTZ;
BEGIN
  -- Check if this is an ingest error transaction
  -- Yaci stores failed transactions as: {"error": "...", "hash": "...", "reason": "..."}
  IF NEW.data ? 'error' AND NOT NEW.data ? 'txResponse' THEN
    -- This is an ingest error - store the error metadata
    ingest_err := jsonb_build_object(
      'message', NEW.data->>'error',
      'reason', NEW.data->>'reason',
      'hash', NEW.data->>'hash'
    );

    INSERT INTO api.transactions_main (id, fee, memo, error, height, timestamp, proposal_ids, ingest_error)
    VALUES (
      NEW.id,
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      ingest_err
    )
    ON CONFLICT (id) DO UPDATE
    SET fee = EXCLUDED.fee,
        memo = EXCLUDED.memo,
        error = EXCLUDED.error,
        height = EXCLUDED.height,
        timestamp = EXCLUDED.timestamp,
        proposal_ids = EXCLUDED.proposal_ids,
        ingest_error = EXCLUDED.ingest_error;

    RETURN NEW;
  END IF;

  -- Normal transaction processing
  error_text := NEW.data->'txResponse'->>'rawLog';

  IF error_text IS NULL THEN
    error_text := extract_proposal_failure_logs(NEW.data);
  END IF;

  proposal_ids := extract_proposal_ids(NEW.data->'txResponse'->'events');
  tx_height := (NEW.data->'txResponse'->>'height')::BIGINT;
  tx_timestamp := (NEW.data->'txResponse'->>'timestamp')::TIMESTAMPTZ;

  INSERT INTO api.transactions_main (id, fee, memo, error, height, timestamp, proposal_ids, ingest_error)
  VALUES (
            NEW.id,
            NEW.data->'tx'->'authInfo'->'fee',
            NEW.data->'tx'->'body'->>'memo',
            error_text,
            tx_height,
            tx_timestamp,
            proposal_ids,
            NULL
         )
  ON CONFLICT (id) DO UPDATE
  SET fee = EXCLUDED.fee,
      memo = EXCLUDED.memo,
      error = EXCLUDED.error,
      height = EXCLUDED.height,
      timestamp = EXCLUDED.timestamp,
      proposal_ids = EXCLUDED.proposal_ids,
      ingest_error = EXCLUDED.ingest_error;

  -- Insert top level messages (only for normal transactions)
  INSERT INTO api.messages_raw (id, message_index, data)
  SELECT
    NEW.id,
    message_index - 1,
    message
  FROM jsonb_array_elements(NEW.data->'tx'->'body'->'messages') WITH ORDINALITY AS message(message, message_index)
  ON CONFLICT (id, message_index) DO UPDATE
  SET data = EXCLUDED.data;

  -- Insert nested messages (e.g., within proposals)
  INSERT INTO api.messages_raw (id, message_index, data)
  SELECT
    NEW.id,
    10000 + ((top_level.msg_index - 1) * 1000) + sub_level.sub_index,
    sub_level.sub_msg
  FROM jsonb_array_elements(NEW.data->'tx'->'body'->'messages')
       WITH ORDINALITY AS top_level(msg, msg_index)
       CROSS JOIN LATERAL (
         SELECT sub_msg, sub_index
         FROM jsonb_array_elements(top_level.msg->'messages')
              WITH ORDINALITY AS inner_msg(sub_msg, sub_index)
       ) AS sub_level
  WHERE top_level.msg->>'@type' = '/cosmos.group.v1.MsgSubmitProposal'
    AND top_level.msg->'messages' IS NOT NULL
  ON CONFLICT (id, message_index) DO UPDATE
  SET data = EXCLUDED.data;

  RETURN NEW;
END;
$$;

-- Update get_transaction_detail to return ingest_error
CREATE OR REPLACE FUNCTION api.get_transaction_detail(_hash text)
RETURNS jsonb
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  result jsonb;
BEGIN
  PERFORM api.maybe_priority_decode(_hash);

  SELECT jsonb_build_object(
    'id', t.id,
    'fee', t.fee,
    'memo', t.memo,
    'error', t.error,
    'height', t.height,
    'timestamp', t.timestamp,
    'proposal_ids', t.proposal_ids,
    'ingest_error', t.ingest_error,
    'messages', COALESCE(msg.messages, '[]'::jsonb),
    'events', COALESCE(evt.events, '[]'::jsonb),
    'evm_data', evm.evm,
    'evm_logs', COALESCE(logs.logs, '[]'::jsonb),
    'raw_data', r.data
  ) INTO result
  FROM api.transactions_main t
  LEFT JOIN api.transactions_raw r ON t.id = r.id
  LEFT JOIN LATERAL (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', m.id,
        'message_index', m.message_index,
        'type', m.type,
        'sender', m.sender,
        'mentions', m.mentions,
        'metadata', m.metadata,
        'data', mr.data
      ) ORDER BY m.message_index
    ) AS messages
    FROM api.messages_main m
    LEFT JOIN api.messages_raw mr ON m.id = mr.id AND m.message_index = mr.message_index
    WHERE m.id = _hash
  ) msg ON TRUE
  LEFT JOIN LATERAL (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', e.id,
        'event_index', e.event_index,
        'attr_index', e.attr_index,
        'event_type', e.event_type,
        'attr_key', e.attr_key,
        'attr_value', e.attr_value,
        'msg_index', e.msg_index
      ) ORDER BY e.event_index, e.attr_index
    ) AS events
    FROM api.events_main e
    WHERE e.id = _hash
  ) evt ON TRUE
  LEFT JOIN LATERAL (
    SELECT jsonb_build_object(
      'hash', ev.hash,
      'from', ev."from",
      'to', ev."to",
      'nonce', ev.nonce,
      'gasLimit', ev.gas_limit::text,
      'gasPrice', ev.gas_price::text,
      'maxFeePerGas', ev.max_fee_per_gas::text,
      'maxPriorityFeePerGas', ev.max_priority_fee_per_gas::text,
      'value', ev.value::text,
      'data', ev.data,
      'type', ev.type,
      'chainId', ev.chain_id::text,
      'gasUsed', ev.gas_used,
      'status', ev.status,
      'functionName', ev.function_name,
      'functionSignature', ev.function_signature
    ) AS evm
    FROM api.evm_transactions ev
    WHERE ev.tx_id = _hash
  ) evm ON TRUE
  LEFT JOIN LATERAL (
    SELECT jsonb_agg(
      jsonb_build_object(
        'logIndex', l.log_index,
        'address', l.address,
        'topics', l.topics,
        'data', l.data
      ) ORDER BY l.log_index
    ) AS logs
    FROM api.evm_logs l
    WHERE l.tx_id = _hash
  ) logs ON TRUE
  WHERE t.id = _hash;

  RETURN result;
END;
$$;

-- Update get_transactions_paginated to return ingest_error
CREATE OR REPLACE FUNCTION api.get_transactions_paginated(
  _limit int DEFAULT 20,
  _offset int DEFAULT 0,
  _status text DEFAULT NULL,
  _block_height bigint DEFAULT NULL,
  _block_height_min bigint DEFAULT NULL,
  _block_height_max bigint DEFAULT NULL,
  _message_type text DEFAULT NULL,
  _timestamp_min timestamptz DEFAULT NULL,
  _timestamp_max timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql STABLE
AS $$
  WITH filtered_txs AS (
    SELECT DISTINCT t.id
    FROM api.transactions_main t
    LEFT JOIN api.messages_main m ON t.id = m.id
    WHERE (_status IS NULL OR
           (_status = 'success' AND t.error IS NULL AND t.ingest_error IS NULL) OR
           (_status = 'failed' AND (t.error IS NOT NULL OR t.ingest_error IS NOT NULL)))
      AND (_block_height IS NULL OR t.height = _block_height)
      AND (_block_height_min IS NULL OR t.height >= _block_height_min)
      AND (_block_height_max IS NULL OR t.height <= _block_height_max)
      AND (_message_type IS NULL OR m.type = _message_type)
      AND (_timestamp_min IS NULL OR t.timestamp >= _timestamp_min)
      AND (_timestamp_max IS NULL OR t.timestamp <= _timestamp_max)
  ),
  paginated AS (
    SELECT t.*
    FROM api.transactions_main t
    JOIN filtered_txs f ON t.id = f.id
    ORDER BY t.height DESC NULLS LAST, t.id
    LIMIT _limit OFFSET _offset
  ),
  total AS (
    SELECT COUNT(*) AS count FROM filtered_txs
  ),
  tx_messages AS (
    SELECT
      m.id,
      jsonb_agg(
        jsonb_build_object(
          'id', m.id,
          'message_index', m.message_index,
          'type', m.type,
          'sender', m.sender,
          'mentions', m.mentions,
          'metadata', m.metadata
        ) ORDER BY m.message_index
      ) AS messages
    FROM api.messages_main m
    WHERE m.id IN (SELECT id FROM paginated)
    GROUP BY m.id
  ),
  tx_events AS (
    SELECT
      e.id,
      jsonb_agg(
        jsonb_build_object(
          'id', e.id,
          'event_index', e.event_index,
          'attr_index', e.attr_index,
          'event_type', e.event_type,
          'attr_key', e.attr_key,
          'attr_value', e.attr_value,
          'msg_index', e.msg_index
        ) ORDER BY e.event_index, e.attr_index
      ) AS events
    FROM api.events_main e
    WHERE e.id IN (SELECT id FROM paginated)
    GROUP BY e.id
  )
  SELECT jsonb_build_object(
    'data', COALESCE(jsonb_agg(
      jsonb_build_object(
        'id', p.id,
        'height', p.height,
        'timestamp', p.timestamp,
        'fee', p.fee,
        'memo', p.memo,
        'error', p.error,
        'proposal_ids', p.proposal_ids,
        'messages', COALESCE(m.messages, '[]'::jsonb),
        'events', COALESCE(e.events, '[]'::jsonb),
        'ingest_error', p.ingest_error
      ) ORDER BY p.height DESC NULLS LAST
    ), '[]'::jsonb),
    'pagination', jsonb_build_object(
      'total', (SELECT count FROM total),
      'limit', _limit,
      'offset', _offset,
      'has_next', _offset + _limit < (SELECT count FROM total),
      'has_prev', _offset > 0
    )
  )
  FROM paginated p
  LEFT JOIN tx_messages m ON p.id = m.id
  LEFT JOIN tx_events e ON p.id = e.id;
$$;

-- Update get_transactions_by_address to return ingest_error
CREATE OR REPLACE FUNCTION api.get_transactions_by_address(
  _address text,
  _limit int DEFAULT 50,
  _offset int DEFAULT 0
)
RETURNS jsonb
LANGUAGE sql STABLE
AS $$
  WITH addr_txs AS (
    SELECT DISTINCT m.id
    FROM api.messages_main m
    WHERE m.sender = _address OR _address = ANY(m.mentions)
  ),
  paginated AS (
    SELECT t.*
    FROM api.transactions_main t
    JOIN addr_txs a ON t.id = a.id
    ORDER BY t.height DESC NULLS LAST
    LIMIT _limit OFFSET _offset
  ),
  total AS (
    SELECT COUNT(*) AS count FROM addr_txs
  ),
  tx_messages AS (
    SELECT
      m.id,
      jsonb_agg(
        jsonb_build_object(
          'id', m.id,
          'message_index', m.message_index,
          'type', m.type,
          'sender', m.sender,
          'mentions', m.mentions,
          'metadata', m.metadata
        ) ORDER BY m.message_index
      ) AS messages
    FROM api.messages_main m
    WHERE m.id IN (SELECT id FROM paginated)
    GROUP BY m.id
  ),
  tx_events AS (
    SELECT
      e.id,
      jsonb_agg(
        jsonb_build_object(
          'id', e.id,
          'event_index', e.event_index,
          'attr_index', e.attr_index,
          'event_type', e.event_type,
          'attr_key', e.attr_key,
          'attr_value', e.attr_value,
          'msg_index', e.msg_index
        ) ORDER BY e.event_index, e.attr_index
      ) AS events
    FROM api.events_main e
    WHERE e.id IN (SELECT id FROM paginated)
    GROUP BY e.id
  )
  SELECT jsonb_build_object(
    'data', COALESCE(jsonb_agg(
      jsonb_build_object(
        'id', p.id,
        'height', p.height,
        'timestamp', p.timestamp,
        'fee', p.fee,
        'memo', p.memo,
        'error', p.error,
        'proposal_ids', p.proposal_ids,
        'messages', COALESCE(m.messages, '[]'::jsonb),
        'events', COALESCE(e.events, '[]'::jsonb),
        'ingest_error', p.ingest_error
      ) ORDER BY p.height DESC NULLS LAST
    ), '[]'::jsonb),
    'pagination', jsonb_build_object(
      'total', (SELECT count FROM total),
      'limit', _limit,
      'offset', _offset,
      'has_next', _offset + _limit < (SELECT count FROM total),
      'has_prev', _offset > 0
    )
  )
  FROM paginated p
  LEFT JOIN tx_messages m ON p.id = m.id
  LEFT JOIN tx_events e ON p.id = e.id;
$$;

-- Update tx_success_rate view to account for ingest errors
CREATE OR REPLACE VIEW api.tx_success_rate AS
SELECT
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE error IS NULL AND ingest_error IS NULL) AS successful,
  COUNT(*) FILTER (WHERE error IS NOT NULL OR ingest_error IS NOT NULL) AS failed,
  ROUND(100.0 * COUNT(*) FILTER (WHERE error IS NULL AND ingest_error IS NULL) / NULLIF(COUNT(*), 0), 2) AS success_rate_percent
FROM api.transactions_main;

COMMIT;
