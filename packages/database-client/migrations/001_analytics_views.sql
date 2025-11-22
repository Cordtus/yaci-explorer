-- Analytics Views for Yaci Explorer
-- These views pre-aggregate data to minimize frontend complexity
-- Apply to your PostgreSQL database after the core schema is set up

-- Daily transaction volume (last 30 days)
CREATE OR REPLACE VIEW api.tx_volume_daily AS
SELECT
  DATE(timestamp) as date,
  COUNT(*) as count
FROM api.transactions_main
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY DATE(timestamp)
ORDER BY date DESC;

-- Hourly transaction volume (last 24 hours)
CREATE OR REPLACE VIEW api.tx_volume_hourly AS
SELECT
  DATE_TRUNC('hour', timestamp) as hour,
  COUNT(*) as count
FROM api.transactions_main
WHERE timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', timestamp)
ORDER BY hour DESC;

-- Message type distribution
CREATE OR REPLACE VIEW api.message_type_stats AS
SELECT
  type,
  COUNT(*) as count
FROM api.messages_main
WHERE type IS NOT NULL
GROUP BY type
ORDER BY count DESC
LIMIT 20;

-- Overall chain statistics
CREATE OR REPLACE VIEW api.chain_stats AS
SELECT
  (SELECT MAX(id) FROM api.blocks_raw) as latest_block,
  (SELECT COUNT(*) FROM api.transactions_main) as total_transactions,
  (SELECT COUNT(*) FROM api.transactions_main WHERE error IS NOT NULL) as failed_transactions,
  (SELECT COUNT(DISTINCT sender) FROM api.messages_main WHERE sender IS NOT NULL) as unique_addresses;

-- Fee revenue by denomination
CREATE OR REPLACE VIEW api.fee_revenue AS
SELECT
  coin->>'denom' as denom,
  SUM((coin->>'amount')::numeric) as total_amount
FROM api.transactions_main,
     jsonb_array_elements(fee->'amount') as coin
WHERE fee->'amount' IS NOT NULL
GROUP BY coin->>'denom'
ORDER BY total_amount DESC;

-- Block time statistics (last 100 blocks)
CREATE OR REPLACE VIEW api.block_time_stats AS
WITH block_times AS (
  SELECT
    id,
    EXTRACT(EPOCH FROM (
      (data->'block'->'header'->>'time')::timestamptz -
      LAG((data->'block'->'header'->>'time')::timestamptz) OVER (ORDER BY id)
    )) as block_time
  FROM api.blocks_raw
  ORDER BY id DESC
  LIMIT 100
)
SELECT
  ROUND(AVG(block_time)::numeric, 2) as avg_block_time,
  ROUND(MIN(block_time)::numeric, 2) as min_block_time,
  ROUND(MAX(block_time)::numeric, 2) as max_block_time
FROM block_times
WHERE block_time > 0 AND block_time < 100;

-- Gas usage distribution
CREATE OR REPLACE VIEW api.gas_usage_distribution AS
SELECT
  CASE
    WHEN gas_used < 100000 THEN '0-100k'
    WHEN gas_used < 250000 THEN '100k-250k'
    WHEN gas_used < 500000 THEN '250k-500k'
    WHEN gas_used < 1000000 THEN '500k-1M'
    ELSE '1M+'
  END as range,
  COUNT(*) as count
FROM api.transactions_main
WHERE gas_used IS NOT NULL
GROUP BY 1
ORDER BY
  CASE range
    WHEN '0-100k' THEN 1
    WHEN '100k-250k' THEN 2
    WHEN '250k-500k' THEN 3
    WHEN '500k-1M' THEN 4
    ELSE 5
  END;

-- Transaction success rate
CREATE OR REPLACE VIEW api.tx_success_rate AS
SELECT
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE error IS NULL) as successful,
  COUNT(*) FILTER (WHERE error IS NOT NULL) as failed,
  ROUND(
    COUNT(*) FILTER (WHERE error IS NULL)::numeric / NULLIF(COUNT(*), 0) * 100,
    2
  ) as success_rate_percent
FROM api.transactions_main;

-- Function: Get transaction stats for a time window
CREATE OR REPLACE FUNCTION api.tx_stats_in_window(
  window_minutes INTEGER DEFAULT 60
)
RETURNS TABLE(
  tx_count BIGINT,
  avg_gas_used NUMERIC,
  success_rate NUMERIC
) AS $$
SELECT
  COUNT(*),
  ROUND(AVG(gas_used)::numeric, 0),
  ROUND(
    COUNT(*) FILTER (WHERE error IS NULL)::numeric / NULLIF(COUNT(*), 0) * 100,
    2
  )
FROM api.transactions_main
WHERE timestamp >= NOW() - (window_minutes || ' minutes')::interval;
$$ LANGUAGE SQL STABLE;

-- Function: Get transaction count for time range
CREATE OR REPLACE FUNCTION api.tx_count_in_range(
  minutes INTEGER DEFAULT NULL,
  hours INTEGER DEFAULT NULL,
  days INTEGER DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
  interval_str TEXT;
BEGIN
  IF minutes IS NOT NULL THEN
    interval_str := minutes || ' minutes';
  ELSIF hours IS NOT NULL THEN
    interval_str := hours || ' hours';
  ELSIF days IS NOT NULL THEN
    interval_str := days || ' days';
  ELSE
    interval_str := '1 hour';
  END IF;

  RETURN (
    SELECT COUNT(*)
    FROM api.transactions_main
    WHERE timestamp >= NOW() - interval_str::interval
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant access to PostgREST role (adjust role name as needed)
-- GRANT SELECT ON ALL TABLES IN SCHEMA api TO web_anon;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA api TO web_anon;

COMMENT ON VIEW api.tx_volume_daily IS 'Daily transaction counts for last 30 days';
COMMENT ON VIEW api.tx_volume_hourly IS 'Hourly transaction counts for last 24 hours';
COMMENT ON VIEW api.message_type_stats IS 'Top 20 message types by count';
COMMENT ON VIEW api.chain_stats IS 'Overall chain statistics';
COMMENT ON VIEW api.fee_revenue IS 'Total fee revenue by denomination';
COMMENT ON VIEW api.block_time_stats IS 'Block time statistics from last 100 blocks';
COMMENT ON VIEW api.gas_usage_distribution IS 'Distribution of gas usage across transactions';
COMMENT ON VIEW api.tx_success_rate IS 'Overall transaction success rate';
COMMENT ON FUNCTION api.tx_stats_in_window IS 'Get transaction stats for a specific time window in minutes';
COMMENT ON FUNCTION api.tx_count_in_range IS 'Get transaction count for a time range (specify one of: minutes, hours, days)';
