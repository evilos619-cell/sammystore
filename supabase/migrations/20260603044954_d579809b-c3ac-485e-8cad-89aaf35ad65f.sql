
-- credit_wallet & purchase_with_wallet: only service_role should invoke directly.
REVOKE EXECUTE ON FUNCTION public.credit_wallet(uuid, numeric, payment_provider, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.credit_wallet(uuid, numeric, payment_provider, text, text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.purchase_with_wallet(uuid, uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.purchase_with_wallet(uuid, uuid, integer) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.assign_credential_to_order(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.assign_credential_to_order(uuid, uuid) TO service_role;

-- has_role is invoker-safe to be public (used by RLS); leave as-is.
-- handle_new_user is a trigger; lock it down.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
