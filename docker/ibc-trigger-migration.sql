-- IBC Denom Detection Trigger Migration
-- Detects new IBC denoms in transfer transactions and queues them for resolution
BEGIN;

-- Table to track pending IBC denoms that need resolution
CREATE TABLE IF NOT EXISTS api.ibc_denom_pending (
  ibc_denom TEXT PRIMARY KEY,
  first_seen_tx TEXT,
  first_seen_height BIGINT,
  attempts INT DEFAULT 0,
  last_attempt TIMESTAMP WITH TIME ZONE,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ibc_pending_attempts ON api.ibc_denom_pending(attempts) WHERE attempts < 3;

-- Function to detect IBC denoms in transfer messages
CREATE OR REPLACE FUNCTION api.detect_ibc_denoms()
RETURNS TRIGGER AS $$
DECLARE
  msg_record RECORD;
  denom_value TEXT;
  amount_obj JSONB;
  raw_data JSONB;
BEGIN
  -- Look for IBC-related messages in this transaction
  FOR msg_record IN
    SELECT m.id, m.message_index, m.type, m.metadata
    FROM api.messages_main m
    WHERE m.id = NEW.id
    AND (
      m.type LIKE '%MsgTransfer%'
      OR m.type LIKE '%MsgRecvPacket%'
      OR m.type LIKE '%MsgAcknowledgement%'
      OR m.type LIKE '%MsgUpdateClient%'
    )
  LOOP
    -- Get raw message data for deeper inspection
    SELECT data INTO raw_data
    FROM api.messages_raw
    WHERE id = msg_record.id AND message_index = msg_record.message_index;

    -- Check token.denom in metadata (MsgTransfer)
    IF msg_record.metadata ? 'token' AND msg_record.metadata->'token' ? 'denom' THEN
      denom_value := msg_record.metadata->'token'->>'denom';
      IF denom_value LIKE 'ibc/%' THEN
        INSERT INTO api.ibc_denom_pending (ibc_denom, first_seen_tx, first_seen_height)
        VALUES (denom_value, NEW.id, NEW.height)
        ON CONFLICT (ibc_denom) DO NOTHING;
        PERFORM pg_notify('ibc_denom_pending', denom_value);
      END IF;
    END IF;

    -- Check raw data for token denom
    IF raw_data ? 'token' AND raw_data->'token' ? 'denom' THEN
      denom_value := raw_data->'token'->>'denom';
      IF denom_value LIKE 'ibc/%' THEN
        INSERT INTO api.ibc_denom_pending (ibc_denom, first_seen_tx, first_seen_height)
        VALUES (denom_value, NEW.id, NEW.height)
        ON CONFLICT (ibc_denom) DO NOTHING;
        PERFORM pg_notify('ibc_denom_pending', denom_value);
      END IF;
    END IF;

    -- Check for packet data that might contain IBC denoms (MsgRecvPacket)
    IF raw_data ? 'packet' AND raw_data->'packet' ? 'data' THEN
      BEGIN
        -- Packet data is often base64 encoded JSON, try to extract denom
        -- We'll let the daemon handle the complex parsing
        PERFORM pg_notify('ibc_packet_received', raw_data->'packet'->>'data');
      EXCEPTION WHEN OTHERS THEN
        -- Ignore parse errors
      END;
    END IF;
  END LOOP;

  -- Also scan events for fungible_token_packet events with denom
  FOR denom_value IN
    SELECT DISTINCT e.attr_value
    FROM api.events_main e
    WHERE e.id = NEW.id
    AND e.event_type IN ('fungible_token_packet', 'transfer', 'recv_packet', 'send_packet')
    AND e.attr_key = 'denom'
    AND e.attr_value LIKE 'ibc/%'
  LOOP
    INSERT INTO api.ibc_denom_pending (ibc_denom, first_seen_tx, first_seen_height)
    VALUES (denom_value, NEW.id, NEW.height)
    ON CONFLICT (ibc_denom) DO NOTHING;
    PERFORM pg_notify('ibc_denom_pending', denom_value);
  END LOOP;

  -- Scan fee amounts for IBC denoms
  IF NEW.fee IS NOT NULL AND NEW.fee ? 'amount' THEN
    FOR amount_obj IN SELECT * FROM jsonb_array_elements(NEW.fee->'amount')
    LOOP
      denom_value := amount_obj->>'denom';
      IF denom_value LIKE 'ibc/%' THEN
        INSERT INTO api.ibc_denom_pending (ibc_denom, first_seen_tx, first_seen_height)
        VALUES (denom_value, NEW.id, NEW.height)
        ON CONFLICT (ibc_denom) DO NOTHING;
        PERFORM pg_notify('ibc_denom_pending', denom_value);
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_detect_ibc_denoms ON api.transactions_main;
CREATE TRIGGER trigger_detect_ibc_denoms
AFTER INSERT ON api.transactions_main
FOR EACH ROW
EXECUTE FUNCTION api.detect_ibc_denoms();

-- Function to mark a denom as resolved (called by daemon after successful resolution)
CREATE OR REPLACE FUNCTION api.mark_ibc_denom_resolved(_ibc_denom TEXT)
RETURNS VOID
LANGUAGE SQL
AS $$
  DELETE FROM api.ibc_denom_pending WHERE ibc_denom = _ibc_denom;
$$;

-- Function to mark a denom resolution attempt failed
CREATE OR REPLACE FUNCTION api.mark_ibc_denom_failed(_ibc_denom TEXT, _error TEXT)
RETURNS VOID
LANGUAGE SQL
AS $$
  UPDATE api.ibc_denom_pending
  SET attempts = attempts + 1,
      last_attempt = NOW(),
      error = _error
  WHERE ibc_denom = _ibc_denom;
$$;

-- Function to get pending IBC denoms for resolution
CREATE OR REPLACE FUNCTION api.get_pending_ibc_denoms(_limit INT DEFAULT 50)
RETURNS TABLE (
  ibc_denom TEXT,
  first_seen_tx TEXT,
  attempts INT
)
LANGUAGE SQL STABLE
AS $$
  SELECT ibc_denom, first_seen_tx, attempts
  FROM api.ibc_denom_pending
  WHERE attempts < 5
  AND (last_attempt IS NULL OR last_attempt < NOW() - INTERVAL '5 minutes')
  ORDER BY created_at
  LIMIT _limit;
$$;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON api.ibc_denom_pending TO web_anon;
GRANT EXECUTE ON FUNCTION api.mark_ibc_denom_resolved(text) TO web_anon;
GRANT EXECUTE ON FUNCTION api.mark_ibc_denom_failed(text, text) TO web_anon;
GRANT EXECUTE ON FUNCTION api.get_pending_ibc_denoms(int) TO web_anon;

COMMIT;
