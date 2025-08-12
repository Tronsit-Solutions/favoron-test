-- Add quote_expired status to enum if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t 
                   JOIN pg_enum e ON t.oid = e.enumtypid  
                   WHERE t.typname = 'package_status' AND e.enumlabel = 'quote_expired') THEN
        ALTER TYPE package_status ADD VALUE 'quote_expired';
    END IF;
END $$;

-- Function to expire old quotes
CREATE OR REPLACE FUNCTION expire_old_quotes()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    expired_count INTEGER := 0;
    package_record RECORD;
BEGIN
    -- Get packages with expired quotes
    FOR package_record IN 
        SELECT id, user_id, matched_trip_id, item_description
        FROM packages 
        WHERE quote_expires_at < NOW() 
          AND status = 'quote_sent'
    LOOP
        -- Update package status to expired
        UPDATE packages 
        SET status = 'quote_expired',
            updated_at = NOW()
        WHERE id = package_record.id;
        
        -- Notify shopper
        PERFORM create_notification(
            package_record.user_id,
            '⏰ Tu cotización ha expirado',
            'La cotización para "' || package_record.item_description || '" ha expirado. Puedes solicitar una nueva cotización.',
            'quote',
            'normal',
            NULL,
            jsonb_build_object(
                'package_id', package_record.id,
                'action', 'quote_expired'
            )
        );
        
        -- Notify traveler if assigned
        IF package_record.matched_trip_id IS NOT NULL THEN
            PERFORM create_notification(
                (SELECT user_id FROM trips WHERE id = package_record.matched_trip_id),
                '⏰ Cotización expirada',
                'Tu cotización para "' || package_record.item_description || '" ha expirado. El shopper puede solicitar una nueva.',
                'quote', 
                'normal',
                NULL,
                jsonb_build_object(
                    'package_id', package_record.id,
                    'action', 'quote_expired'
                )
            );
        END IF;
        
        expired_count := expired_count + 1;
    END LOOP;
    
    RETURN expired_count;
END;
$$;

-- Function to handle quote expiration on package updates
CREATE OR REPLACE FUNCTION handle_quote_expiration_on_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if quote_expires_at was just set and is in the future
    IF NEW.quote_expires_at IS NOT NULL 
       AND (OLD.quote_expires_at IS NULL OR OLD.quote_expires_at != NEW.quote_expires_at)
       AND NEW.quote_expires_at > NOW()
       AND NEW.status = 'quote_sent' THEN
        
        -- Schedule expiration check (this would run periodically)
        RAISE NOTICE 'Quote expiration scheduled for package % at %', NEW.id, NEW.quote_expires_at;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger for quote expiration handling
DROP TRIGGER IF EXISTS quote_expiration_trigger ON packages;
CREATE TRIGGER quote_expiration_trigger
    AFTER UPDATE ON packages
    FOR EACH ROW
    EXECUTE FUNCTION handle_quote_expiration_on_update();

-- Expire existing old quotes
SELECT expire_old_quotes();