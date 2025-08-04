-- Create trigger to automatically send email notifications when package status changes
CREATE OR REPLACE TRIGGER notify_shopper_package_status_trigger
    AFTER UPDATE ON public.packages
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_shopper_package_status();