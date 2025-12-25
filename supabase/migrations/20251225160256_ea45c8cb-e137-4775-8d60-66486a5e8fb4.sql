-- Eliminar el trigger duplicado de notificaciones al shopper
-- Mantener solo trigger_notify_shopper_package_status
DROP TRIGGER IF EXISTS notify_shopper_package_status_trigger ON packages;

-- Eliminar el trigger duplicado de sync_legacy_product_fields
-- Mantener solo trg_sync_legacy_fields_from_products_data
DROP TRIGGER IF EXISTS trg_sync_legacy_product_fields ON packages;