-- IBC Denom Detection Trigger v3
-- Focuses on MsgRecvPacket for inbound IBC transfers
BEGIN;

-- Update the detection function to focus on MsgRecvPacket
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

COMMIT;
