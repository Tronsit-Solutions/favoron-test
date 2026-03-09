-- 1. notifications: replace WITH CHECK (true) with admin-only
DROP POLICY IF EXISTS "System can insert notifications for users" ON notifications;
CREATE POLICY "Admins can insert notifications" ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

-- 2. admin_profile_access_log: replace WITH CHECK (true) with admin-only
DROP POLICY IF EXISTS "System can insert audit logs" ON admin_profile_access_log;
CREATE POLICY "Only admins can insert audit logs" ON admin_profile_access_log
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

-- 3. trip_payment_accumulator: scope to traveler's own trips or admin
DROP POLICY IF EXISTS "System can insert trip payment accumulator" ON trip_payment_accumulator;
CREATE POLICY "Travelers and admins can insert trip payment accumulator" ON trip_payment_accumulator
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::user_role)
    OR (traveler_id = auth.uid() AND trip_id IN (
      SELECT id FROM trips WHERE user_id = auth.uid()
    ))
  );

-- 4. whatsapp_notification_logs: replace WITH CHECK (true) with admin-only
DROP POLICY IF EXISTS "System can insert whatsapp logs" ON whatsapp_notification_logs;
CREATE POLICY "Only admins can insert whatsapp logs" ON whatsapp_notification_logs
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::user_role));