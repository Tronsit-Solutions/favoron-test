
-- 1. apply_quote_pricing: solo cuando quote o delivery cambian
DROP TRIGGER IF EXISTS packages_apply_quote_pricing ON packages;
CREATE TRIGGER packages_apply_quote_pricing
  BEFORE INSERT OR UPDATE OF quote, delivery_method, confirmed_delivery_address, user_id
  ON packages FOR EACH ROW EXECUTE FUNCTION apply_quote_pricing();

-- 2. sync_legacy_product_fields: solo cuando products_data cambia
DROP TRIGGER IF EXISTS trg_sync_legacy_fields_from_products_data ON packages;
CREATE TRIGGER trg_sync_legacy_fields_from_products_data
  BEFORE INSERT OR UPDATE OF products_data
  ON packages FOR EACH ROW EXECUTE FUNCTION sync_legacy_product_fields();

-- 3. ensure_admin_tip_in_products: solo cuando admin_assigned_tip o products_data cambian
DROP TRIGGER IF EXISTS trg_ensure_admin_tip_in_products ON packages;
CREATE TRIGGER trg_ensure_admin_tip_in_products
  BEFORE INSERT OR UPDATE OF admin_assigned_tip, products_data
  ON packages FOR EACH ROW EXECUTE FUNCTION ensure_admin_tip_in_products();

-- 4. preserve_product_item_links: solo cuando products_data o item_link cambian
DROP TRIGGER IF EXISTS preserve_product_links_trigger ON packages;
CREATE TRIGGER preserve_product_links_trigger
  BEFORE INSERT OR UPDATE OF products_data, item_link
  ON packages FOR EACH ROW EXECUTE FUNCTION preserve_product_item_links();

-- 5. auto_approve_prime_payments: solo cuando payment_receipt cambia
DROP TRIGGER IF EXISTS zzzz_auto_approve_prime_payments_trigger ON packages;
CREATE TRIGGER zzzz_auto_approve_prime_payments_trigger
  BEFORE UPDATE OF payment_receipt
  ON packages FOR EACH ROW EXECUTE FUNCTION auto_approve_prime_payments();

-- 6. auto_approve_prime_payments_after: solo cuando payment_receipt cambia
DROP TRIGGER IF EXISTS zzzz_auto_approve_prime_payments_after_trigger ON packages;
CREATE TRIGGER zzzz_auto_approve_prime_payments_after_trigger
  AFTER UPDATE OF payment_receipt
  ON packages FOR EACH ROW EXECUTE FUNCTION auto_approve_prime_payments_after();

-- 7. notify_admins_payment_receipt: solo cuando payment_receipt cambia
DROP TRIGGER IF EXISTS trigger_notify_admins_payment_receipt ON packages;
CREATE TRIGGER trigger_notify_admins_payment_receipt
  AFTER UPDATE OF payment_receipt
  ON packages FOR EACH ROW EXECUTE FUNCTION notify_admins_payment_receipt();

-- 8. auto_transition_to_in_transit: solo cuando purchase_confirmation cambia
DROP TRIGGER IF EXISTS packages_auto_in_transit ON packages;
CREATE TRIGGER packages_auto_in_transit
  BEFORE UPDATE OF purchase_confirmation
  ON packages FOR EACH ROW EXECUTE FUNCTION auto_transition_to_in_transit();
