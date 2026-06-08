-- ============================================================
-- Fix credential claim: look for already-assigned credentials
-- (purchase_with_wallet calls assign_credential_to_order which
--  marks the credential but does NOT set order_items.delivered_payload)
-- This updated function finds that credential and stores its
-- content directly in delivered_payload, then deletes the row.
-- ============================================================

CREATE OR REPLACE FUNCTION public.user_claim_credential(
  _order_id  uuid,
  _product_id uuid
) RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_order_user_id uuid;
  v_cred_id       uuid;
  v_content       text;
  v_label         text;
  v_existing      text;
BEGIN
  -- Ownership check
  SELECT user_id INTO v_order_user_id FROM public.orders WHERE id = _order_id;
  IF v_order_user_id IS NULL THEN RAISE EXCEPTION 'order not found'; END IF;
  IF v_order_user_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'forbidden'; END IF;

  -- Already delivered? Return existing payload content directly.
  SELECT delivered_payload INTO v_existing
    FROM public.order_items
    WHERE order_id = _order_id AND product_id = _product_id
      AND delivered_payload IS NOT NULL
    LIMIT 1;

  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('assigned', true, 'content', v_existing, 'label', null);
  END IF;

  -- Check: was a credential already assigned to this order by purchase_with_wallet?
  -- purchase_with_wallet calls assign_credential_to_order which sets order_id on the credential
  -- but does NOT set order_items.delivered_payload — we fix that here.
  SELECT id, content, label INTO v_cred_id, v_content, v_label
    FROM public.product_credentials
    WHERE order_id = _order_id
      AND product_id = _product_id
    LIMIT 1;

  IF v_cred_id IS NOT NULL THEN
    -- Store content in delivered_payload so it persists after we delete the credential
    UPDATE public.order_items
      SET delivered_payload = v_content
      WHERE order_id = _order_id AND product_id = _product_id;

    -- Delete credential — user has the content now
    DELETE FROM public.product_credentials WHERE id = v_cred_id;

    RETURN jsonb_build_object('assigned', true, 'content', v_content, 'label', v_label);
  END IF;

  -- No credential assigned yet — claim the next available one
  SELECT id INTO v_cred_id
    FROM public.product_credentials
    WHERE product_id = _product_id
      AND order_id IS NULL
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

  IF v_cred_id IS NULL THEN
    RETURN jsonb_build_object('assigned', false, 'content', null, 'label', null);
  END IF;

  SELECT content, label INTO v_content, v_label
    FROM public.product_credentials WHERE id = v_cred_id;

  -- Store content directly in delivered_payload
  UPDATE public.order_items
    SET delivered_payload = v_content
    WHERE order_id = _order_id AND product_id = _product_id;

  -- Delete credential — user has the content now
  DELETE FROM public.product_credentials WHERE id = v_cred_id;

  RETURN jsonb_build_object('assigned', true, 'content', v_content, 'label', v_label);
END;
$$;

REVOKE ALL ON FUNCTION public.user_claim_credential(uuid, uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.user_claim_credential(uuid, uuid) TO authenticated;
