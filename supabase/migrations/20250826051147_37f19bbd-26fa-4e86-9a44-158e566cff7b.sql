-- Ensure the new view uses security invoker explicitly
ALTER VIEW public.package_products_view SET (security_invoker = on);

-- Re-comment the view for clarity
COMMENT ON VIEW public.package_products_view IS 'Flattened per-product view from packages.products_data preserving order (product_index starts at 1). Security invoker enforced.';