-- IBC Denom Detection Trigger v2
-- Detects IBC denoms in transfer events from amount attributes
BEGIN;

-- Update the detection function to properly parse amount values
CREATE OR REPLACE FUNCTION api.detect_ibc_denoms()
RETURNS TRIGGER AS $$
DECLARE
  msg_record RECORD;
  denom_value TEXT;
  amount_obj JSONB;
  raw_data JSONB;
  amount_str TEXT;
  ibc_match TEXT;
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
      OR m.type LIKE '%MsgTimeout%'
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
  END LOOP;

  -- Scan events for amount attributes containing ibc/ denoms
  -- Format is: <amount><denom> e.g. "42000000000000000000ibc/ABC123..."
  FOR amount_str IN
    SELECT DISTINCT e.attr_value
    FROM api.events_main e
    WHERE e.id = NEW.id
    AND e.attr_key = 'amount'
    AND e.attr_value LIKE '%ibc/%'
  LOOP
    -- Extract the ibc/... portion using regex
    -- Match pattern: ibc/ followed by hex characters
    ibc_match := substring(amount_str FROM 'ibc/[A-F0-9]+');
    IF ibc_match IS NOT NULL THEN
      INSERT INTO api.ibc_denom_pending (ibc_denom, first_seen_tx, first_seen_height)
      VALUES (ibc_match, NEW.id, NEW.height)
      ON CONFLICT (ibc_denom) DO NOTHING;
      PERFORM pg_notify('ibc_denom_pending', ibc_match);
    END IF;
  END LOOP;

  -- Also check standalone denom attributes
  FOR denom_value IN
    SELECT DISTINCT e.attr_value
    FROM api.events_main e
    WHERE e.id = NEW.id
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

COMMIT;
