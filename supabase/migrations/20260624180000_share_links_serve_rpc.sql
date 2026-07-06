-- Atomic public share serve: increment view_count only when link is still active and unexpired.

CREATE OR REPLACE FUNCTION serve_public_share_link(p_share_id uuid)
RETURNS SETOF share_links
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE share_links
  SET view_count = view_count + 1,
      updated_at = NOW()
  WHERE id = p_share_id
    AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW())
  RETURNING *;
$$;
