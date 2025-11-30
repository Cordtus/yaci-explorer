-- =============================================================================
-- YACI Explorer Complete Schema
-- Consolidated from migrations 001-019
-- For fresh database initialization only
-- =============================================================================

BEGIN;

-- =============================================================================
-- EXTENSIONS
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- =============================================================================
-- CORE TABLES (populated by Yaci indexer)
-- =============================================================================

-- Raw block data
CREATE TABLE IF NOT EXISTS api.blocks_raw (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  tx_count INT DEFAULT 0
);

-- Raw transaction data
CREATE TABLE IF NOT EXISTS api.transactions_raw (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL
);

-- Parsed transaction metadata
CREATE TABLE IF NOT EXISTS api.transactions_main (
  id TEXT PRIMARY KEY,
  height BIGINT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE,
  fee JSONB,
  memo TEXT,
  error TEXT,
  proposal_ids TEXT[]
);

-- Raw message data
CREATE TABLE IF NOT EXISTS api.messages_raw (
  id TEXT NOT NULL,
  message_index INT NOT NULL,
  data JSONB,
  PRIMARY KEY (id, message_index)
);

-- Parsed message metadata
CREATE TABLE IF NOT EXISTS api.messages_main (
  id TEXT NOT NULL,
  message_index INT NOT NULL,
  type TEXT,
  sender TEXT,
  mentions TEXT[],
  metadata JSONB,
  PRIMARY KEY (id, message_index)
);

-- Raw events data
CREATE TABLE IF NOT EXISTS api.events_raw (
  id TEXT NOT NULL,
  event_index BIGINT NOT NULL,
  data JSONB NOT NULL,
  PRIMARY KEY (id, event_index),
  FOREIGN KEY (id) REFERENCES api.transactions_raw(id) ON DELETE CASCADE
);

-- Parsed events
CREATE TABLE IF NOT EXISTS api.events_main (
  id TEXT NOT NULL,
  event_index INT NOT NULL,
  attr_index INT NOT NULL,
  event_type TEXT NOT NULL,
  attr_key TEXT,
  attr_value TEXT,
  msg_index INT,
  PRIMARY KEY (id, event_index, attr_index)
);

-- =============================================================================
-- CORE INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_tx_height ON api.transactions_main(height DESC);
CREATE INDEX IF NOT EXISTS idx_tx_timestamp ON api.transactions_main(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_tx_error_not_null ON api.transactions_main(id) WHERE error IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_msg_type ON api.messages_main(type);
CREATE INDEX IF NOT EXISTS idx_msg_sender ON api.messages_main(sender);
CREATE INDEX IF NOT EXISTS idx_msg_mentions ON api.messages_main USING GIN(mentions);
CREATE INDEX IF NOT EXISTS idx_messages_id ON api.messages_main(id);
CREATE INDEX IF NOT EXISTS idx_event_type ON api.events_main(event_type);
CREATE INDEX IF NOT EXISTS idx_events_id ON api.events_main(id);
CREATE INDEX IF NOT EXISTS idx_transactions_height ON api.transactions_main(height);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON api.transactions_main(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_blocks_tx_count ON api.blocks_raw(tx_count) WHERE tx_count > 0;

-- =============================================================================
-- EVM DOMAIN TABLES
-- =============================================================================

-- Decoded EVM transactions
CREATE TABLE IF NOT EXISTS api.evm_transactions (
  tx_id TEXT PRIMARY KEY REFERENCES api.transactions_main(id) ON DELETE CASCADE,
  hash TEXT NOT NULL UNIQUE,
  "from" TEXT NOT NULL,
  "to" TEXT,
  nonce BIGINT NOT NULL,
  gas_limit BIGINT NOT NULL,
  gas_price NUMERIC NOT NULL,
  max_fee_per_gas NUMERIC,
  max_priority_fee_per_gas NUMERIC,
  value NUMERIC NOT NULL,
  data TEXT,
  type SMALLINT NOT NULL DEFAULT 0,
  chain_id BIGINT,
  gas_used BIGINT,
  status SMALLINT DEFAULT 1,
  function_name TEXT,
  function_signature TEXT,
  decoded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evm_tx_hash ON api.evm_transactions(hash);
CREATE INDEX IF NOT EXISTS idx_evm_tx_from ON api.evm_transactions("from");
CREATE INDEX IF NOT EXISTS idx_evm_tx_to ON api.evm_transactions("to");

-- EVM logs (from tx receipts)
CREATE TABLE IF NOT EXISTS api.evm_logs (
  tx_id TEXT NOT NULL REFERENCES api.evm_transactions(tx_id) ON DELETE CASCADE,
  log_index INT NOT NULL,
  address TEXT NOT NULL,
  topics TEXT[] NOT NULL,
  data TEXT,
  PRIMARY KEY (tx_id, log_index)
);

CREATE INDEX IF NOT EXISTS idx_evm_log_address ON api.evm_logs(address);
CREATE INDEX IF NOT EXISTS idx_evm_log_topic0 ON api.evm_logs((topics[1]));

-- Known EVM tokens (ERC-20, ERC-721, ERC-1155)
CREATE TABLE IF NOT EXISTS api.evm_tokens (
  address TEXT PRIMARY KEY,
  name TEXT,
  symbol TEXT,
  decimals INT,
  type TEXT NOT NULL,
  total_supply NUMERIC,
  first_seen_tx TEXT,
  first_seen_height BIGINT,
  verified BOOLEAN DEFAULT FALSE,
  metadata JSONB
);

-- EVM token transfers (parsed from Transfer events)
CREATE TABLE IF NOT EXISTS api.evm_token_transfers (
  tx_id TEXT NOT NULL,
  log_index INT NOT NULL,
  token_address TEXT NOT NULL REFERENCES api.evm_tokens(address),
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  value NUMERIC NOT NULL,
  PRIMARY KEY (tx_id, log_index),
  FOREIGN KEY (tx_id, log_index) REFERENCES api.evm_logs(tx_id, log_index) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_token_transfer_from ON api.evm_token_transfers(from_address);
CREATE INDEX IF NOT EXISTS idx_token_transfer_to ON api.evm_token_transfers(to_address);
CREATE INDEX IF NOT EXISTS idx_token_transfer_token ON api.evm_token_transfers(token_address);

-- EVM contracts (metadata, ABI storage)
CREATE TABLE IF NOT EXISTS api.evm_contracts (
  address TEXT PRIMARY KEY,
  creator TEXT,
  creation_tx TEXT,
  creation_height BIGINT,
  bytecode_hash TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  name TEXT,
  abi JSONB,
  source_code TEXT,
  compiler_version TEXT,
  metadata JSONB
);

-- =============================================================================
-- COSMOS DOMAIN TABLES
-- =============================================================================

-- Validators (enriched via RPC queries)
CREATE TABLE IF NOT EXISTS api.validators (
  operator_address TEXT PRIMARY KEY,
  consensus_address TEXT,
  moniker TEXT,
  identity TEXT,
  website TEXT,
  details TEXT,
  commission_rate NUMERIC,
  commission_max_rate NUMERIC,
  commission_max_change_rate NUMERIC,
  min_self_delegation NUMERIC,
  tokens NUMERIC,
  delegator_shares NUMERIC,
  status TEXT,
  jailed BOOLEAN DEFAULT FALSE,
  creation_height BIGINT,
  first_seen_tx TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_validator_status ON api.validators(status);
CREATE INDEX IF NOT EXISTS idx_validator_tokens ON api.validators(tokens DESC);

-- Governance proposals (from 001_complete_schema - may be deprecated by governance_proposals)
CREATE TABLE IF NOT EXISTS api.proposals (
  id BIGINT PRIMARY KEY,
  title TEXT,
  summary TEXT,
  proposer TEXT,
  status TEXT,
  submit_time TIMESTAMP WITH TIME ZONE,
  deposit_end_time TIMESTAMP WITH TIME ZONE,
  voting_start_time TIMESTAMP WITH TIME ZONE,
  voting_end_time TIMESTAMP WITH TIME ZONE,
  total_deposit JSONB,
  final_tally JSONB,
  metadata JSONB,
  creation_tx TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proposal_status ON api.proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposal_proposer ON api.proposals(proposer);

-- Governance votes
CREATE TABLE IF NOT EXISTS api.proposal_votes (
  proposal_id BIGINT NOT NULL REFERENCES api.proposals(id) ON DELETE CASCADE,
  voter TEXT NOT NULL,
  option TEXT NOT NULL,
  weight NUMERIC DEFAULT 1,
  tx_id TEXT,
  timestamp TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY (proposal_id, voter)
);

CREATE INDEX IF NOT EXISTS idx_vote_voter ON api.proposal_votes(voter);

-- Chain parameters (populated by chain-params-daemon)
CREATE TABLE IF NOT EXISTS api.chain_params (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- IBC connections (comprehensive info from gRPC queries)
CREATE TABLE IF NOT EXISTS api.ibc_connections (
  channel_id TEXT NOT NULL,
  port_id TEXT NOT NULL,
  connection_id TEXT,
  client_id TEXT,
  counterparty_chain_id TEXT,
  counterparty_channel_id TEXT,
  counterparty_port_id TEXT,
  counterparty_client_id TEXT,
  counterparty_connection_id TEXT,
  state TEXT,
  ordering TEXT,
  version TEXT,
  client_status TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (channel_id, port_id)
);

CREATE INDEX IF NOT EXISTS idx_ibc_connections_chain ON api.ibc_connections(counterparty_chain_id);
CREATE INDEX IF NOT EXISTS idx_ibc_connections_state ON api.ibc_connections(state);

-- IBC denom traces (resolved from ibc/HASH to base denom)
CREATE TABLE IF NOT EXISTS api.ibc_denom_traces (
  ibc_denom TEXT PRIMARY KEY,
  base_denom TEXT NOT NULL,
  path TEXT NOT NULL,
  source_channel TEXT,
  source_chain_id TEXT,
  symbol TEXT,
  decimals INT DEFAULT 6,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ibc_denom_base ON api.ibc_denom_traces(base_denom);
CREATE INDEX IF NOT EXISTS idx_ibc_denom_channel ON api.ibc_denom_traces(source_channel);

-- Legacy IBC channels table (for backward compatibility)
CREATE TABLE IF NOT EXISTS api.ibc_channels (
  channel_id TEXT NOT NULL,
  port_id TEXT NOT NULL,
  counterparty_channel_id TEXT,
  counterparty_port_id TEXT,
  connection_id TEXT,
  state TEXT,
  ordering TEXT,
  version TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (channel_id, port_id)
);

-- Denomination metadata (for display)
CREATE TABLE IF NOT EXISTS api.denom_metadata (
  denom TEXT PRIMARY KEY,
  symbol TEXT NOT NULL,
  decimals INT NOT NULL DEFAULT 6,
  ibc_hash TEXT,
  description TEXT,
  logo_uri TEXT,
  coingecko_id TEXT,
  is_native BOOLEAN DEFAULT false,
  ibc_source_chain TEXT,
  ibc_source_denom TEXT,
  evm_contract TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- GOVERNANCE TABLES (trigger-populated from indexed data)
-- =============================================================================

CREATE TABLE IF NOT EXISTS api.governance_proposals (
  proposal_id BIGINT PRIMARY KEY,
  submit_tx_hash TEXT NOT NULL,
  submit_height BIGINT NOT NULL,
  submit_time TIMESTAMPTZ NOT NULL,
  proposer TEXT,
  title TEXT,
  summary TEXT,
  metadata TEXT,
  proposal_type TEXT,
  status TEXT NOT NULL DEFAULT 'PROPOSAL_STATUS_DEPOSIT_PERIOD',
  deposit_end_time TIMESTAMPTZ,
  voting_start_time TIMESTAMPTZ,
  voting_end_time TIMESTAMPTZ,
  yes_count TEXT,
  no_count TEXT,
  abstain_count TEXT,
  no_with_veto_count TEXT,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS api.governance_snapshots (
  id SERIAL PRIMARY KEY,
  proposal_id BIGINT REFERENCES api.governance_proposals(proposal_id),
  status TEXT NOT NULL,
  yes_count TEXT NOT NULL,
  no_count TEXT NOT NULL,
  abstain_count TEXT NOT NULL,
  no_with_veto_count TEXT NOT NULL,
  total_voting_power TEXT,
  snapshot_time TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(proposal_id, snapshot_time)
);

CREATE INDEX IF NOT EXISTS idx_proposals_status ON api.governance_proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_voting_end ON api.governance_proposals(voting_end_time);
CREATE INDEX IF NOT EXISTS idx_proposals_submit_time ON api.governance_proposals(submit_time DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_proposal ON api.governance_snapshots(proposal_id, snapshot_time DESC);

-- =============================================================================
-- ANALYTICS VIEWS
-- =============================================================================

-- Chain statistics
CREATE OR REPLACE VIEW api.chain_stats AS
SELECT
  (SELECT MAX(id) FROM api.blocks_raw) AS latest_block,
  (SELECT COUNT(*) FROM api.transactions_main) AS total_transactions,
  (SELECT COUNT(DISTINCT sender) FROM api.messages_main WHERE sender IS NOT NULL) AS unique_addresses,
  (SELECT COUNT(*) FROM api.evm_transactions) AS evm_transactions,
  (SELECT COUNT(*) FROM api.validators WHERE status = 'BOND_STATUS_BONDED') AS active_validators;

-- Transaction volume daily
CREATE OR REPLACE VIEW api.tx_volume_daily AS
SELECT
  DATE(timestamp) AS date,
  COUNT(*) AS count
FROM api.transactions_main
WHERE timestamp IS NOT NULL
GROUP BY DATE(timestamp)
ORDER BY date DESC;

-- Transaction volume hourly
CREATE OR REPLACE VIEW api.tx_volume_hourly AS
SELECT
  DATE_TRUNC('hour', timestamp) AS hour,
  COUNT(*) AS count
FROM api.transactions_main
WHERE timestamp IS NOT NULL
GROUP BY DATE_TRUNC('hour', timestamp)
ORDER BY hour DESC;

-- Message type distribution
CREATE OR REPLACE VIEW api.message_type_stats AS
SELECT
  type,
  COUNT(*) AS count
FROM api.messages_main
WHERE type IS NOT NULL
GROUP BY type
ORDER BY count DESC;

-- Gas usage distribution
CREATE OR REPLACE VIEW api.gas_usage_distribution AS
SELECT
  CASE
    WHEN (fee->>'gasLimit')::bigint < 100000 THEN '0-100k'
    WHEN (fee->>'gasLimit')::bigint < 250000 THEN '100k-250k'
    WHEN (fee->>'gasLimit')::bigint < 500000 THEN '250k-500k'
    WHEN (fee->>'gasLimit')::bigint < 1000000 THEN '500k-1M'
    ELSE '1M+'
  END AS gas_range,
  COUNT(*) AS count
FROM api.transactions_main
WHERE fee->>'gasLimit' IS NOT NULL
GROUP BY 1
ORDER BY MIN((fee->>'gasLimit')::bigint);

-- Transaction success rate
CREATE OR REPLACE VIEW api.tx_success_rate AS
SELECT
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE error IS NULL) AS successful,
  COUNT(*) FILTER (WHERE error IS NOT NULL) AS failed,
  ROUND(100.0 * COUNT(*) FILTER (WHERE error IS NULL) / NULLIF(COUNT(*), 0), 2) AS success_rate_percent
FROM api.transactions_main;

-- Fee revenue by denomination
CREATE OR REPLACE VIEW api.fee_revenue AS
SELECT
  fee_item->>'denom' AS denom,
  SUM((fee_item->>'amount')::numeric) AS total_amount
FROM api.transactions_main,
  jsonb_array_elements(fee->'amount') AS fee_item
GROUP BY fee_item->>'denom';

-- EVM transaction map (Cosmos hash to ETH hash)
CREATE OR REPLACE VIEW api.evm_tx_map AS
SELECT
  tx_id,
  hash AS ethereum_tx_hash,
  "from",
  "to",
  gas_used
FROM api.evm_transactions;

-- Pending EVM transactions to decode
CREATE OR REPLACE VIEW api.evm_pending_decode AS
SELECT
  t.id AS tx_id,
  t.height,
  t.timestamp,
  m.data->>'raw' AS raw_bytes,
  MAX(CASE WHEN e.attr_key = 'ethereumTxHash' THEN e.attr_value END) AS ethereum_tx_hash,
  MAX(CASE WHEN e.attr_key = 'txGasUsed' THEN e.attr_value::bigint END) AS gas_used
FROM api.transactions_main t
JOIN api.messages_main mm ON t.id = mm.id
JOIN api.messages_raw m ON mm.id = m.id AND mm.message_index = m.message_index
JOIN api.events_main e ON t.id = e.id AND e.event_type = 'ethereum_tx'
WHERE mm.type LIKE '%MsgEthereumTx%'
  AND NOT EXISTS (SELECT 1 FROM api.evm_transactions ev WHERE ev.tx_id = t.id)
GROUP BY t.id, t.height, t.timestamp, m.data->>'raw';

-- Active governance proposals
CREATE OR REPLACE VIEW api.governance_active_proposals AS
SELECT
  proposal_id,
  status,
  voting_end_time,
  deposit_end_time
FROM api.governance_proposals
WHERE status IN (
  'PROPOSAL_STATUS_DEPOSIT_PERIOD',
  'PROPOSAL_STATUS_VOTING_PERIOD'
)
ORDER BY proposal_id DESC;

-- Query stats (for monitoring)
CREATE OR REPLACE VIEW api.query_stats AS
SELECT
  LEFT(query, 100) AS query,
  calls,
  total_exec_time,
  mean_exec_time,
  rows
FROM pg_stat_statements
WHERE query LIKE '%api.%'
ORDER BY mean_exec_time DESC;

-- =============================================================================
-- MATERIALIZED VIEWS
-- =============================================================================

-- Daily transaction statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS api.mv_daily_tx_stats AS
WITH daily_txs AS (
  SELECT
    date_trunc('day', timestamp)::date AS date,
    COUNT(*)::bigint AS total_txs,
    COUNT(*) FILTER (WHERE error IS NULL)::bigint AS successful_txs,
    COUNT(*) FILTER (WHERE error IS NOT NULL)::bigint AS failed_txs
  FROM api.transactions_main
  GROUP BY date_trunc('day', timestamp)::date
),
daily_senders AS (
  SELECT
    date_trunc('day', t.timestamp)::date AS date,
    COUNT(DISTINCT m.sender)::bigint AS unique_senders
  FROM api.transactions_main t
  JOIN api.messages_main m ON m.id = t.id
  GROUP BY date_trunc('day', t.timestamp)::date
)
SELECT
  dt.date,
  dt.total_txs,
  dt.successful_txs,
  dt.failed_txs,
  COALESCE(ds.unique_senders, 0) AS unique_senders
FROM daily_txs dt
LEFT JOIN daily_senders ds ON ds.date = dt.date;

CREATE UNIQUE INDEX IF NOT EXISTS mv_daily_tx_stats_date_idx ON api.mv_daily_tx_stats(date);

-- Hourly transaction statistics for last 7 days
CREATE MATERIALIZED VIEW IF NOT EXISTS api.mv_hourly_tx_stats AS
SELECT
  date_trunc('hour', timestamp) AS hour,
  COUNT(*)::bigint AS tx_count
FROM api.transactions_main
WHERE timestamp >= NOW() - INTERVAL '7 days'
GROUP BY date_trunc('hour', timestamp);

CREATE UNIQUE INDEX IF NOT EXISTS mv_hourly_tx_stats_hour_idx ON api.mv_hourly_tx_stats(hour);

-- Message type distribution
CREATE MATERIALIZED VIEW IF NOT EXISTS api.mv_message_type_stats AS
WITH totals AS (
  SELECT COUNT(*)::numeric AS total
  FROM api.messages_main
),
type_counts AS (
  SELECT
    type AS message_type,
    COUNT(*)::bigint AS count
  FROM api.messages_main
  GROUP BY type
)
SELECT
  tc.message_type,
  tc.count,
  ROUND((tc.count::numeric / t.total * 100)::numeric, 2) AS percentage
FROM type_counts tc
CROSS JOIN totals t;

CREATE UNIQUE INDEX IF NOT EXISTS mv_message_type_stats_type_idx ON api.mv_message_type_stats(message_type);

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Extract Bech32-like addresses from JSONB
CREATE OR REPLACE FUNCTION extract_addresses(msg JSONB)
RETURNS TEXT[]
LANGUAGE SQL STABLE
AS $$
WITH addresses AS (
  SELECT unnest(
    regexp_matches(
      msg::text,
      E'(?<=[\\"\'\\\\s]|^)([a-z0-9]{2,83}1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{38,})(?=[\\"\'\\\\s]|$)',
      'g'
    )
  ) AS addr
)
SELECT array_agg(DISTINCT addr)
FROM addresses;
$$;

-- Filter metadata from message
CREATE OR REPLACE FUNCTION extract_metadata(msg JSONB)
RETURNS JSONB
LANGUAGE SQL STABLE
AS $$
  WITH keys_to_remove AS (
      SELECT ARRAY['@type', 'sender', 'executor', 'admin', 'voter', 'messages', 'proposalId', 'proposers', 'authority', 'fromAddress']::text[] AS keys
  )
  SELECT msg - (SELECT keys FROM keys_to_remove)
$$;

-- Extract proposal failure logs
CREATE OR REPLACE FUNCTION extract_proposal_failure_logs(json_data JSONB)
RETURNS TEXT
LANGUAGE sql
AS $$
WITH
  events AS (
    SELECT jsonb_array_elements(json_data->'txResponse'->'events') AS event
  ),
  typed_attributes AS (
    SELECT
      event->>'type' AS event_type,
      jsonb_array_elements(event->'attributes') AS attribute
    FROM events
  )
  SELECT
    TRIM(BOTH '"' FROM typed_attributes.attribute->>'value') AS logs
  FROM typed_attributes
  WHERE
    typed_attributes.event_type = 'cosmos.group.v1.EventExec'
    AND typed_attributes.attribute->>'key' = 'logs'
    AND EXISTS (
      SELECT 1
      FROM typed_attributes t2
      WHERE t2.event_type = typed_attributes.event_type
        AND t2.attribute->>'key' = 'result'
        AND t2.attribute->>'value' = '"PROPOSAL_EXECUTOR_RESULT_FAILURE"'
    )
  LIMIT 1;
$$;

-- Extract proposal IDs from events
CREATE OR REPLACE FUNCTION extract_proposal_ids(events JSONB)
RETURNS TEXT[]
LANGUAGE plpgsql
AS $$
DECLARE
  proposal_ids TEXT[];
BEGIN
   SELECT
     ARRAY_AGG(DISTINCT TRIM(BOTH '"' FROM attr->>'value'))
   INTO proposal_ids
   FROM jsonb_array_elements(events) AS ev(event)
   CROSS JOIN LATERAL jsonb_array_elements(ev.event->'attributes') AS attr
   WHERE attr->>'key' = 'proposal_id';

  RETURN proposal_ids;
END;
$$;

-- Extract msg_index from event
CREATE OR REPLACE FUNCTION api.extract_event_msg_index(ev jsonb)
RETURNS bigint
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(a->>'value','')::bigint
  FROM jsonb_array_elements(ev->'attributes') a
  WHERE a->>'key' = 'msg_index'
  LIMIT 1
$$;

-- =============================================================================
-- TRIGGER FUNCTIONS
-- =============================================================================

-- Parse raw transaction into transactions_main
CREATE OR REPLACE FUNCTION update_transaction_main()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  error_text TEXT;
  proposal_ids TEXT[];
BEGIN
  error_text := NEW.data->'txResponse'->>'rawLog';

  IF error_text IS NULL THEN
    error_text := extract_proposal_failure_logs(NEW.data);
  END IF;

  proposal_ids := extract_proposal_ids(NEW.data->'txResponse'->'events');

  INSERT INTO api.transactions_main (id, fee, memo, error, height, timestamp, proposal_ids)
  VALUES (
            NEW.id,
            NEW.data->'tx'->'authInfo'->'fee',
            NEW.data->'tx'->'body'->>'memo',
            error_text,
            (NEW.data->'txResponse'->>'height')::BIGINT,
            (NEW.data->'txResponse'->>'timestamp')::TIMESTAMPTZ,
            proposal_ids
         )
  ON CONFLICT (id) DO UPDATE
  SET fee = EXCLUDED.fee,
      memo = EXCLUDED.memo,
      error = EXCLUDED.error,
      height = EXCLUDED.height,
      timestamp = EXCLUDED.timestamp,
      proposal_ids = EXCLUDED.proposal_ids;

  -- Insert top level messages
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

-- Parse raw message into messages_main
CREATE OR REPLACE FUNCTION update_message_main()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  sender TEXT;
  mentions TEXT[];
  metadata JSONB;
  decoded_bytes BYTEA;
  decoded_text TEXT;
  decoded_json JSONB;
  new_addresses TEXT[];
BEGIN
  sender := COALESCE(
    NULLIF(NEW.data->>'sender', ''),
    NULLIF(NEW.data->>'fromAddress', ''),
    NULLIF(NEW.data->>'admin', ''),
    NULLIF(NEW.data->>'voter', ''),
    NULLIF(NEW.data->>'address', ''),
    NULLIF(NEW.data->>'executor', ''),
    NULLIF(NEW.data->>'authority', ''),
    NULLIF(New.data->>'granter', ''),
    (
      SELECT jsonb_array_elements_text(NEW.data->'proposers')
      LIMIT 1
    ),
    (
      CASE
        WHEN jsonb_typeof(NEW.data->'inputs') = 'array'
             AND jsonb_array_length(NEW.data->'inputs') > 0
        THEN NEW.data->'inputs'->0->>'address'
        ELSE NULL
      END
    )
  );

  mentions := extract_addresses(NEW.data);
  metadata := extract_metadata(NEW.data);

  -- Extract decoded data from IBC packet
  IF NEW.data->>'@type' = '/ibc.core.channel.v1.MsgRecvPacket' THEN
    IF metadata->'packet' ? 'data' THEN
      BEGIN
        decoded_bytes := decode(metadata->'packet'->>'data', 'base64');
        decoded_text := convert_from(decoded_bytes, 'UTF8');
        decoded_json := decoded_text::jsonb;
        metadata := metadata || jsonb_build_object('decodedData', decoded_json);
        IF decoded_json ? 'sender' THEN
          sender := decoded_json->>'sender';
        END IF;
        new_addresses := extract_addresses(decoded_json);
        SELECT array_agg(DISTINCT addr) INTO mentions
        FROM unnest(mentions || new_addresses) AS addr;
      EXCEPTION WHEN OTHERS THEN
        UPDATE api.transactions_main
        SET error = 'Error decoding base64 packet data'
        WHERE id = NEW.id;
      END;
    END IF;
  END IF;

  INSERT INTO api.messages_main (id, message_index, type, sender, mentions, metadata)
  VALUES (
           NEW.id,
           NEW.message_index,
           NEW.data->>'@type',
           sender,
           mentions,
           metadata
         )
  ON CONFLICT (id, message_index) DO UPDATE
  SET type = EXCLUDED.type,
      sender = EXCLUDED.sender,
      mentions = EXCLUDED.mentions,
      metadata = EXCLUDED.metadata;

  RETURN NEW;
END;
$$;

-- Insert raw events from transaction
CREATE OR REPLACE FUNCTION api.update_events_raw()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  ev jsonb;
  ev_ord int;
BEGIN
  DELETE FROM api.events_raw WHERE id = NEW.id;

  FOR ev, ev_ord IN
    SELECT e, (ord::int - 1)
    FROM jsonb_array_elements(NEW.data->'txResponse'->'events') WITH ORDINALITY AS t(e, ord)
  LOOP
    INSERT INTO api.events_raw (id, event_index, data)
    VALUES (NEW.id, ev_ord, ev);
  END LOOP;

  RETURN NEW;
END $$;

-- Parse raw event into events_main
CREATE OR REPLACE FUNCTION api.update_event_main()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  a jsonb;
  a_ord int;
  msg_idx bigint;
  ev_type text;
BEGIN
  msg_idx := api.extract_event_msg_index(NEW.data);
  ev_type := NEW.data->>'type';

  DELETE FROM api.events_main
  WHERE id = NEW.id AND event_index = NEW.event_index;

  FOR a, a_ord IN
    SELECT attr, (ord::int - 1)
    FROM jsonb_array_elements(NEW.data->'attributes') WITH ORDINALITY AS t(attr, ord)
  LOOP
    INSERT INTO api.events_main (
      id, event_index, attr_index, event_type, attr_key, attr_value, msg_index
    ) VALUES (
      NEW.id,
      NEW.event_index,
      a_ord,
      ev_type,
      a->>'key',
      a->>'value',
      msg_idx
    );
  END LOOP;

  RETURN NEW;
END $$;

-- Update block tx_count on new transaction
CREATE OR REPLACE FUNCTION api.update_block_tx_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE api.blocks_raw
  SET tx_count = tx_count + 1
  WHERE id = NEW.height;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Detect proposal submissions from indexed data
CREATE OR REPLACE FUNCTION api.detect_proposal_submission()
RETURNS TRIGGER AS $$
DECLARE
  msg_record RECORD;
  raw_data JSONB;
  prop_id BIGINT;
  prop_title TEXT;
  prop_summary TEXT;
  prop_metadata TEXT;
BEGIN
  FOR msg_record IN
    SELECT m.id, m.message_index, m.type, m.metadata, m.sender
    FROM api.messages_main m
    WHERE m.id = NEW.id
    AND m.type LIKE '%MsgSubmitProposal%'
  LOOP
    prop_id := NULL;
    prop_title := NULL;
    prop_summary := NULL;
    prop_metadata := NULL;

    SELECT data INTO raw_data
    FROM api.messages_raw
    WHERE id = msg_record.id AND message_index = msg_record.message_index;

    IF msg_record.metadata ? 'proposalId' THEN
      prop_id := (msg_record.metadata->>'proposalId')::BIGINT;
    END IF;

    IF prop_id IS NULL THEN
      SELECT (e.attr_value)::BIGINT INTO prop_id
      FROM api.events_main e
      WHERE e.id = NEW.id
      AND e.event_type = 'submit_proposal'
      AND e.attr_key = 'proposal_id'
      LIMIT 1;
    END IF;

    IF raw_data IS NOT NULL THEN
      prop_title := raw_data->>'title';
      prop_summary := raw_data->>'summary';
      prop_metadata := raw_data->>'metadata';
    END IF;

    IF prop_id IS NOT NULL THEN
      INSERT INTO api.governance_proposals (
        proposal_id,
        submit_tx_hash,
        submit_height,
        submit_time,
        proposer,
        title,
        summary,
        metadata,
        status
      ) VALUES (
        prop_id,
        NEW.id,
        NEW.height,
        NEW.timestamp,
        msg_record.sender,
        prop_title,
        prop_summary,
        prop_metadata,
        'PROPOSAL_STATUS_DEPOSIT_PERIOD'
      )
      ON CONFLICT (proposal_id) DO UPDATE SET
        title = COALESCE(EXCLUDED.title, api.governance_proposals.title),
        summary = COALESCE(EXCLUDED.summary, api.governance_proposals.summary),
        metadata = COALESCE(EXCLUDED.metadata, api.governance_proposals.metadata),
        last_updated = NOW();
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Track votes from indexed MsgVote transactions
CREATE OR REPLACE FUNCTION api.track_governance_vote()
RETURNS TRIGGER AS $$
DECLARE
  msg_record RECORD;
  prop_id BIGINT;
  vote_option TEXT;
BEGIN
  FOR msg_record IN
    SELECT m.id, m.metadata, m.sender
    FROM api.messages_main m
    WHERE m.id = NEW.id
    AND m.type LIKE '%MsgVote%'
  LOOP
    prop_id := (msg_record.metadata->>'proposalId')::BIGINT;
    vote_option := msg_record.metadata->>'option';

    IF prop_id IS NOT NULL AND vote_option IS NOT NULL THEN
      UPDATE api.governance_proposals
      SET
        yes_count = CASE
          WHEN vote_option = 'VOTE_OPTION_YES'
          THEN (COALESCE(yes_count::bigint, 0) + 1)::TEXT
          ELSE yes_count
        END,
        no_count = CASE
          WHEN vote_option = 'VOTE_OPTION_NO'
          THEN (COALESCE(no_count::bigint, 0) + 1)::TEXT
          ELSE no_count
        END,
        abstain_count = CASE
          WHEN vote_option = 'VOTE_OPTION_ABSTAIN'
          THEN (COALESCE(abstain_count::bigint, 0) + 1)::TEXT
          ELSE abstain_count
        END,
        no_with_veto_count = CASE
          WHEN vote_option = 'VOTE_OPTION_NO_WITH_VETO'
          THEN (COALESCE(no_with_veto_count::bigint, 0) + 1)::TEXT
          ELSE no_with_veto_count
        END,
        status = 'PROPOSAL_STATUS_VOTING_PERIOD',
        last_updated = NOW()
      WHERE proposal_id = prop_id;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Helper function to trigger priority EVM decode
CREATE OR REPLACE FUNCTION api.maybe_priority_decode(_tx_id text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM api.evm_pending_decode WHERE tx_id = _tx_id) THEN
    PERFORM pg_notify('evm_decode_priority', _tx_id);
  END IF;
END;
$$;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

DROP TRIGGER IF EXISTS new_transaction_update ON api.transactions_raw;
DROP TRIGGER IF EXISTS new_message_update ON api.messages_raw;
DROP TRIGGER IF EXISTS new_transaction_events_raw ON api.transactions_raw;
DROP TRIGGER IF EXISTS new_event_update ON api.events_raw;
DROP TRIGGER IF EXISTS trigger_update_block_tx_count ON api.transactions_main;
DROP TRIGGER IF EXISTS trigger_detect_proposals ON api.transactions_main;
DROP TRIGGER IF EXISTS trigger_track_votes ON api.transactions_main;

CREATE TRIGGER new_transaction_update
AFTER INSERT OR UPDATE
ON api.transactions_raw
FOR EACH ROW
EXECUTE FUNCTION update_transaction_main();

CREATE TRIGGER new_message_update
AFTER INSERT OR UPDATE
ON api.messages_raw
FOR EACH ROW
EXECUTE FUNCTION update_message_main();

CREATE TRIGGER new_transaction_events_raw
AFTER INSERT OR UPDATE OF data
ON api.transactions_raw
FOR EACH ROW
EXECUTE FUNCTION api.update_events_raw();

CREATE TRIGGER new_event_update
AFTER INSERT OR UPDATE OF data
ON api.events_raw
FOR EACH ROW
EXECUTE FUNCTION api.update_event_main();

CREATE TRIGGER trigger_update_block_tx_count
AFTER INSERT ON api.transactions_main
FOR EACH ROW
EXECUTE FUNCTION api.update_block_tx_count();

CREATE TRIGGER trigger_detect_proposals
AFTER INSERT ON api.transactions_main
FOR EACH ROW
EXECUTE FUNCTION api.detect_proposal_submission();

CREATE TRIGGER trigger_track_votes
AFTER INSERT ON api.transactions_main
FOR EACH ROW
EXECUTE FUNCTION api.track_governance_vote();

-- =============================================================================
-- RPC FUNCTIONS
-- =============================================================================

-- Universal search
CREATE OR REPLACE FUNCTION api.universal_search(_query text)
RETURNS jsonb
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  results jsonb := '[]'::jsonb;
  trimmed text := trim(_query);
  block_result jsonb;
  tx_result jsonb;
  evm_tx_result jsonb;
  addr_result jsonb;
BEGIN
  -- Check for block height (numeric)
  IF trimmed ~ '^\d+$' THEN
    SELECT jsonb_build_object(
      'type', 'block',
      'value', jsonb_build_object('id', id),
      'score', 100
    ) INTO block_result
    FROM api.blocks_raw
    WHERE id = trimmed::bigint;

    IF block_result IS NOT NULL THEN
      results := results || block_result;
    END IF;
  END IF;

  -- Check for EVM hash (0x prefix, 64 hex chars)
  IF trimmed ~* '^0x[a-f0-9]{64}$' THEN
    SELECT jsonb_build_object(
      'type', 'evm_transaction',
      'value', jsonb_build_object('tx_id', tx_id, 'hash', hash),
      'score', 100
    ) INTO evm_tx_result
    FROM api.evm_transactions
    WHERE hash = lower(trimmed);

    IF evm_tx_result IS NOT NULL THEN
      results := results || evm_tx_result;
    END IF;
  END IF;

  -- Check for Cosmos tx hash (64 hex, no 0x)
  IF trimmed ~ '^[a-fA-F0-9]{64}$' THEN
    SELECT jsonb_build_object(
      'type', 'transaction',
      'value', jsonb_build_object('id', id),
      'score', 100
    ) INTO tx_result
    FROM api.transactions_main
    WHERE id = lower(trimmed);

    IF tx_result IS NOT NULL THEN
      results := results || tx_result;
    END IF;
  END IF;

  -- Check for EVM address (0x prefix, 40 hex chars)
  IF trimmed ~* '^0x[a-f0-9]{40}$' THEN
    results := results || jsonb_build_object(
      'type', 'evm_address',
      'value', jsonb_build_object('address', lower(trimmed)),
      'score', 90
    );
  END IF;

  -- Check for Cosmos address (bech32)
  IF trimmed ~ '^[a-z]+1[a-z0-9]{38,}$' THEN
    results := results || jsonb_build_object(
      'type', 'address',
      'value', jsonb_build_object('address', trimmed),
      'score', 90
    );
  END IF;

  RETURN results;
END;
$$;

-- Get transaction detail with EVM data (with priority decode trigger)
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

-- Get paginated transactions with extended filters
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
           (_status = 'success' AND t.error IS NULL) OR
           (_status = 'failed' AND t.error IS NOT NULL))
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
    ORDER BY t.height DESC, t.id
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
        'ingest_error', NULL
      ) ORDER BY p.height DESC
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

-- Get transactions by address
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
    ORDER BY t.height DESC
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
        'ingest_error', NULL
      ) ORDER BY p.height DESC
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

-- Get address statistics
CREATE OR REPLACE FUNCTION api.get_address_stats(_address text)
RETURNS jsonb
LANGUAGE sql STABLE
AS $$
  WITH tx_ids AS (
    SELECT DISTINCT m.id
    FROM api.messages_main m
    WHERE m.sender = _address OR _address = ANY(m.mentions)
  ),
  aggregated AS (
    SELECT
      COUNT(DISTINCT t.id) AS transaction_count,
      MIN(t.timestamp) AS first_seen,
      MAX(t.timestamp) AS last_seen
    FROM api.transactions_main t
    JOIN tx_ids ON t.id = tx_ids.id
  )
  SELECT jsonb_build_object(
    'address', _address,
    'transaction_count', transaction_count,
    'first_seen', first_seen,
    'last_seen', last_seen
  )
  FROM aggregated;
$$;

-- Get paginated blocks
CREATE OR REPLACE FUNCTION api.get_blocks_paginated(
  _limit int DEFAULT 20,
  _offset int DEFAULT 0,
  _min_tx_count int DEFAULT NULL,
  _from_date timestamp DEFAULT NULL,
  _to_date timestamp DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql STABLE
AS $$
  WITH filtered_blocks AS (
    SELECT b.id, b.data, b.tx_count
    FROM api.blocks_raw b
    WHERE
      (_min_tx_count IS NULL OR b.tx_count >= _min_tx_count)
      AND (_from_date IS NULL OR (b.data->'block'->'header'->>'time')::timestamp >= _from_date)
      AND (_to_date IS NULL OR (b.data->'block'->'header'->>'time')::timestamp <= _to_date)
    ORDER BY b.id DESC
  ),
  total AS (
    SELECT COUNT(*) AS count FROM filtered_blocks
  ),
  paginated AS (
    SELECT * FROM filtered_blocks
    LIMIT _limit OFFSET _offset
  )
  SELECT jsonb_build_object(
    'data', COALESCE(jsonb_agg(
      jsonb_build_object(
        'id', p.id,
        'data', p.data,
        'tx_count', COALESCE(p.tx_count, 0)
      ) ORDER BY p.id DESC
    ), '[]'::jsonb),
    'pagination', jsonb_build_object(
      'total', (SELECT count FROM total),
      'limit', _limit,
      'offset', _offset,
      'has_next', _offset + _limit < (SELECT count FROM total),
      'has_prev', _offset > 0
    )
  )
  FROM paginated p;
$$;

-- Get block time analysis
CREATE OR REPLACE FUNCTION api.get_block_time_analysis(_limit int DEFAULT 100)
RETURNS jsonb
LANGUAGE sql STABLE
AS $$
  WITH block_times AS (
    SELECT
      id,
      (data->'block'->'header'->>'time')::timestamp AS block_time,
      LAG((data->'block'->'header'->>'time')::timestamp) OVER (ORDER BY id) AS prev_time
    FROM api.blocks_raw
    ORDER BY id DESC
    LIMIT _limit
  ),
  diffs AS (
    SELECT EXTRACT(EPOCH FROM (block_time - prev_time)) AS diff_seconds
    FROM block_times
    WHERE prev_time IS NOT NULL
  )
  SELECT jsonb_build_object(
    'avg', ROUND(AVG(diff_seconds)::numeric, 2),
    'min', ROUND(MIN(diff_seconds)::numeric, 2),
    'max', ROUND(MAX(diff_seconds)::numeric, 2)
  )
  FROM diffs;
$$;

-- Get governance proposals
CREATE OR REPLACE FUNCTION api.get_governance_proposals(
  _limit INT DEFAULT 20,
  _offset INT DEFAULT 0,
  _status TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE SQL STABLE
AS $$
  WITH filtered AS (
    SELECT p.*
    FROM api.governance_proposals p
    WHERE (_status IS NULL OR p.status = _status)
    ORDER BY p.proposal_id DESC
    LIMIT _limit OFFSET _offset
  ),
  total AS (
    SELECT COUNT(*) AS count
    FROM api.governance_proposals
    WHERE (_status IS NULL OR status = _status)
  ),
  with_snapshots AS (
    SELECT
      f.*,
      s.snapshot_time AS last_snapshot_time
    FROM filtered f
    LEFT JOIN LATERAL (
      SELECT snapshot_time
      FROM api.governance_snapshots
      WHERE proposal_id = f.proposal_id
      ORDER BY snapshot_time DESC
      LIMIT 1
    ) s ON TRUE
  )
  SELECT jsonb_build_object(
    'data', COALESCE(jsonb_agg(
      jsonb_build_object(
        'proposal_id', ws.proposal_id,
        'title', ws.title,
        'summary', ws.summary,
        'status', ws.status,
        'submit_time', ws.submit_time,
        'deposit_end_time', ws.deposit_end_time,
        'voting_start_time', ws.voting_start_time,
        'voting_end_time', ws.voting_end_time,
        'proposer', ws.proposer,
        'tally', jsonb_build_object(
          'yes', ws.yes_count,
          'no', ws.no_count,
          'abstain', ws.abstain_count,
          'no_with_veto', ws.no_with_veto_count
        ),
        'last_updated', ws.last_updated,
        'last_snapshot_time', ws.last_snapshot_time
      ) ORDER BY ws.proposal_id DESC
    ), '[]'::jsonb),
    'pagination', jsonb_build_object(
      'total', (SELECT count FROM total),
      'limit', _limit,
      'offset', _offset,
      'has_next', _offset + _limit < (SELECT count FROM total),
      'has_prev', _offset > 0
    )
  )
  FROM with_snapshots ws;
$$;

-- Compute proposal tally from indexed votes
CREATE OR REPLACE FUNCTION api.compute_proposal_tally(_proposal_id bigint)
RETURNS jsonb
LANGUAGE sql STABLE
AS $$
  SELECT jsonb_build_object(
    'yes', COUNT(*) FILTER (WHERE m.metadata->>'option' = 'VOTE_OPTION_YES'),
    'no', COUNT(*) FILTER (WHERE m.metadata->>'option' = 'VOTE_OPTION_NO'),
    'abstain', COUNT(*) FILTER (WHERE m.metadata->>'option' = 'VOTE_OPTION_ABSTAIN'),
    'no_with_veto', COUNT(*) FILTER (WHERE m.metadata->>'option' = 'VOTE_OPTION_NO_WITH_VETO')
  )
  FROM api.messages_main m
  WHERE m.type LIKE '%MsgVote%'
  AND (m.metadata->>'proposalId')::bigint = _proposal_id;
$$;

-- Refresh analytics views (admin only)
CREATE OR REPLACE FUNCTION api.refresh_analytics_views()
RETURNS void
LANGUAGE sql
AS $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY api.mv_daily_tx_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY api.mv_hourly_tx_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY api.mv_message_type_stats;
$$;

-- =============================================================================
-- IBC AND CHAIN PARAMS RPC FUNCTIONS
-- =============================================================================

-- Get chain parameters
CREATE OR REPLACE FUNCTION api.get_chain_params()
RETURNS JSONB
LANGUAGE SQL STABLE
AS $$
  SELECT jsonb_object_agg(key, value)
  FROM api.chain_params;
$$;

-- Get IBC connections with full route info
CREATE OR REPLACE FUNCTION api.get_ibc_connections(
  _limit INT DEFAULT 50,
  _offset INT DEFAULT 0,
  _chain_id TEXT DEFAULT NULL,
  _state TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE SQL STABLE
AS $$
  WITH filtered AS (
    SELECT *
    FROM api.ibc_connections
    WHERE (_chain_id IS NULL OR counterparty_chain_id = _chain_id)
      AND (_state IS NULL OR state = _state)
    ORDER BY counterparty_chain_id, channel_id
    LIMIT _limit OFFSET _offset
  ),
  total AS (
    SELECT COUNT(*) AS count
    FROM api.ibc_connections
    WHERE (_chain_id IS NULL OR counterparty_chain_id = _chain_id)
      AND (_state IS NULL OR state = _state)
  )
  SELECT jsonb_build_object(
    'data', COALESCE(jsonb_agg(
      jsonb_build_object(
        'channel_id', f.channel_id,
        'port_id', f.port_id,
        'connection_id', f.connection_id,
        'client_id', f.client_id,
        'counterparty_chain_id', f.counterparty_chain_id,
        'counterparty_channel_id', f.counterparty_channel_id,
        'counterparty_port_id', f.counterparty_port_id,
        'counterparty_client_id', f.counterparty_client_id,
        'counterparty_connection_id', f.counterparty_connection_id,
        'state', f.state,
        'ordering', f.ordering,
        'client_status', f.client_status,
        'is_active', f.state = 'STATE_OPEN' AND f.client_status = 'Active',
        'updated_at', f.updated_at
      )
      ORDER BY f.counterparty_chain_id, f.channel_id
    ), '[]'::jsonb),
    'pagination', jsonb_build_object(
      'total', (SELECT count FROM total),
      'limit', _limit,
      'offset', _offset,
      'has_next', _offset + _limit < (SELECT count FROM total),
      'has_prev', _offset > 0
    )
  )
  FROM filtered f;
$$;

-- Get IBC connection by channel
CREATE OR REPLACE FUNCTION api.get_ibc_connection(_channel_id TEXT, _port_id TEXT DEFAULT 'transfer')
RETURNS JSONB
LANGUAGE SQL STABLE
AS $$
  SELECT jsonb_build_object(
    'channel_id', channel_id,
    'port_id', port_id,
    'connection_id', connection_id,
    'client_id', client_id,
    'counterparty_chain_id', counterparty_chain_id,
    'counterparty_channel_id', counterparty_channel_id,
    'counterparty_port_id', counterparty_port_id,
    'counterparty_client_id', counterparty_client_id,
    'counterparty_connection_id', counterparty_connection_id,
    'state', state,
    'ordering', ordering,
    'client_status', client_status,
    'is_active', state = 'STATE_OPEN' AND client_status = 'Active',
    'updated_at', updated_at
  )
  FROM api.ibc_connections
  WHERE channel_id = _channel_id AND port_id = _port_id;
$$;

-- Get IBC denom traces
CREATE OR REPLACE FUNCTION api.get_ibc_denom_traces(
  _limit INT DEFAULT 50,
  _offset INT DEFAULT 0,
  _base_denom TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE SQL STABLE
AS $$
  WITH filtered AS (
    SELECT t.*, c.counterparty_chain_id
    FROM api.ibc_denom_traces t
    LEFT JOIN api.ibc_connections c ON t.source_channel = c.channel_id AND c.port_id = 'transfer'
    WHERE (_base_denom IS NULL OR t.base_denom ILIKE '%' || _base_denom || '%')
    ORDER BY t.base_denom, t.ibc_denom
    LIMIT _limit OFFSET _offset
  ),
  total AS (
    SELECT COUNT(*) AS count
    FROM api.ibc_denom_traces
    WHERE (_base_denom IS NULL OR base_denom ILIKE '%' || _base_denom || '%')
  )
  SELECT jsonb_build_object(
    'data', COALESCE(jsonb_agg(
      jsonb_build_object(
        'ibc_denom', f.ibc_denom,
        'base_denom', f.base_denom,
        'path', f.path,
        'source_channel', f.source_channel,
        'source_chain_id', COALESCE(f.source_chain_id, f.counterparty_chain_id),
        'symbol', f.symbol,
        'decimals', f.decimals,
        'updated_at', f.updated_at
      )
      ORDER BY f.base_denom, f.ibc_denom
    ), '[]'::jsonb),
    'pagination', jsonb_build_object(
      'total', (SELECT count FROM total),
      'limit', _limit,
      'offset', _offset,
      'has_next', _offset + _limit < (SELECT count FROM total),
      'has_prev', _offset > 0
    )
  )
  FROM filtered f;
$$;

-- Resolve IBC denom to base denom and source info
CREATE OR REPLACE FUNCTION api.resolve_ibc_denom(_ibc_denom TEXT)
RETURNS JSONB
LANGUAGE SQL STABLE
AS $$
  SELECT jsonb_build_object(
    'ibc_denom', t.ibc_denom,
    'base_denom', t.base_denom,
    'path', t.path,
    'source_channel', t.source_channel,
    'source_chain_id', COALESCE(t.source_chain_id, c.counterparty_chain_id),
    'symbol', t.symbol,
    'decimals', t.decimals,
    'route', jsonb_build_object(
      'channel_id', c.channel_id,
      'connection_id', c.connection_id,
      'client_id', c.client_id,
      'counterparty_channel_id', c.counterparty_channel_id,
      'counterparty_connection_id', c.counterparty_connection_id,
      'counterparty_client_id', c.counterparty_client_id
    )
  )
  FROM api.ibc_denom_traces t
  LEFT JOIN api.ibc_connections c ON t.source_channel = c.channel_id AND c.port_id = 'transfer'
  WHERE t.ibc_denom = _ibc_denom;
$$;

-- Get unique counterparty chains
CREATE OR REPLACE FUNCTION api.get_ibc_chains()
RETURNS JSONB
LANGUAGE SQL STABLE
AS $$
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'chain_id', counterparty_chain_id,
      'channel_count', channel_count,
      'open_channels', open_channels,
      'active_channels', active_channels
    )
    ORDER BY counterparty_chain_id
  ), '[]'::jsonb)
  FROM (
    SELECT
      counterparty_chain_id,
      COUNT(*) AS channel_count,
      COUNT(*) FILTER (WHERE state = 'STATE_OPEN') AS open_channels,
      COUNT(*) FILTER (WHERE state = 'STATE_OPEN' AND client_status = 'Active') AS active_channels
    FROM api.ibc_connections
    WHERE counterparty_chain_id IS NOT NULL
    GROUP BY counterparty_chain_id
  ) chains;
$$;

-- =============================================================================
-- IBC DENOM PENDING TABLE AND TRIGGER
-- =============================================================================

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

-- Function to detect IBC denoms in transfer messages (v3 - focuses on MsgRecvPacket)
CREATE OR REPLACE FUNCTION api.detect_ibc_denoms()
RETURNS TRIGGER AS $$
DECLARE
  msg_record RECORD;
  amount_str TEXT;
  ibc_match TEXT;
BEGIN
  -- Look for MsgRecvPacket messages - these indicate inbound IBC transfers
  FOR msg_record IN
    SELECT m.id, m.message_index, m.type, m.metadata
    FROM api.messages_main m
    WHERE m.id = NEW.id
    AND m.type = '/ibc.core.channel.v1.MsgRecvPacket'
  LOOP
    -- For MsgRecvPacket, the IBC denom will appear in associated transfer events
    -- Check the events for this transaction for amount attributes containing ibc/
    FOR amount_str IN
      SELECT DISTINCT e.attr_value
      FROM api.events_main e
      WHERE e.id = NEW.id
      AND e.attr_key = 'amount'
      AND e.attr_value LIKE '%ibc/%'
    LOOP
      -- Extract the ibc/... portion using regex
      -- Match pattern: ibc/ followed by hex characters (uppercase)
      ibc_match := substring(amount_str FROM 'ibc/[A-F0-9]+');
      IF ibc_match IS NOT NULL THEN
        INSERT INTO api.ibc_denom_pending (ibc_denom, first_seen_tx, first_seen_height)
        VALUES (ibc_match, NEW.id, NEW.height)
        ON CONFLICT (ibc_denom) DO NOTHING;
        PERFORM pg_notify('ibc_denom_pending', ibc_match);
      END IF;
    END LOOP;

    -- Also check for standalone denom attributes in fungible_token_packet events
    FOR ibc_match IN
      SELECT DISTINCT e.attr_value
      FROM api.events_main e
      WHERE e.id = NEW.id
      AND e.event_type = 'fungible_token_packet'
      AND e.attr_key = 'denom'
      AND e.attr_value LIKE 'ibc/%'
    LOOP
      INSERT INTO api.ibc_denom_pending (ibc_denom, first_seen_tx, first_seen_height)
      VALUES (ibc_match, NEW.id, NEW.height)
      ON CONFLICT (ibc_denom) DO NOTHING;
      PERFORM pg_notify('ibc_denom_pending', ibc_match);
    END LOOP;
  END LOOP;

  -- Also check for outbound transfers (MsgTransfer) with IBC denoms
  FOR msg_record IN
    SELECT m.id, m.message_index, m.type, m.metadata
    FROM api.messages_main m
    WHERE m.id = NEW.id
    AND m.type LIKE '%MsgTransfer%'
  LOOP
    -- Check token.denom in metadata
    IF msg_record.metadata ? 'token' AND msg_record.metadata->'token' ? 'denom' THEN
      ibc_match := msg_record.metadata->'token'->>'denom';
      IF ibc_match LIKE 'ibc/%' THEN
        INSERT INTO api.ibc_denom_pending (ibc_denom, first_seen_tx, first_seen_height)
        VALUES (ibc_match, NEW.id, NEW.height)
        ON CONFLICT (ibc_denom) DO NOTHING;
        PERFORM pg_notify('ibc_denom_pending', ibc_match);
      END IF;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the IBC denom detection trigger
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

-- =============================================================================
-- ROLES AND PERMISSIONS
-- =============================================================================

-- Create analytics admin role for refresh operations
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'analytics_admin') THEN
    CREATE ROLE analytics_admin NOLOGIN;
  END IF;
END
$$;

-- Grant read access to all tables and views
GRANT SELECT ON ALL TABLES IN SCHEMA api TO web_anon;
GRANT USAGE ON SCHEMA api TO web_anon;

-- Grant execute on public functions
GRANT EXECUTE ON FUNCTION api.universal_search(text) TO web_anon;
GRANT EXECUTE ON FUNCTION api.get_transaction_detail(text) TO web_anon;
GRANT EXECUTE ON FUNCTION api.get_transactions_paginated(int, int, text, bigint, bigint, bigint, text, timestamptz, timestamptz) TO web_anon;
GRANT EXECUTE ON FUNCTION api.get_transactions_by_address(text, int, int) TO web_anon;
GRANT EXECUTE ON FUNCTION api.get_address_stats(text) TO web_anon;
GRANT EXECUTE ON FUNCTION api.get_blocks_paginated(int, int, int, timestamp, timestamp) TO web_anon;
GRANT EXECUTE ON FUNCTION api.get_block_time_analysis(int) TO web_anon;
GRANT EXECUTE ON FUNCTION api.get_governance_proposals(int, int, text) TO web_anon;
GRANT EXECUTE ON FUNCTION api.compute_proposal_tally(bigint) TO web_anon;

-- Restrict refresh_analytics_views to admin only (prevents DoS)
GRANT EXECUTE ON FUNCTION api.refresh_analytics_views() TO analytics_admin;

-- IBC and chain params functions
GRANT EXECUTE ON FUNCTION api.get_chain_params() TO web_anon;
GRANT EXECUTE ON FUNCTION api.get_ibc_connections(int, int, text, text) TO web_anon;
GRANT EXECUTE ON FUNCTION api.get_ibc_connection(text, text) TO web_anon;
GRANT EXECUTE ON FUNCTION api.get_ibc_denom_traces(int, int, text) TO web_anon;
GRANT EXECUTE ON FUNCTION api.resolve_ibc_denom(text) TO web_anon;
GRANT EXECUTE ON FUNCTION api.get_ibc_chains() TO web_anon;

-- IBC denom pending functions
GRANT SELECT, INSERT, UPDATE, DELETE ON api.ibc_denom_pending TO web_anon;
GRANT EXECUTE ON FUNCTION api.mark_ibc_denom_resolved(text) TO web_anon;
GRANT EXECUTE ON FUNCTION api.mark_ibc_denom_failed(text, text) TO web_anon;
GRANT EXECUTE ON FUNCTION api.get_pending_ibc_denoms(int) TO web_anon;

COMMIT;
