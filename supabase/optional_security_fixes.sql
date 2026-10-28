-- OPTIONAL — NOT applied automatically. Recommended by the Supabase security advisor (October 2026).
--
-- The function public.rls_auto_enable() was not created by LEWTA's schema.sql (it usually comes
-- from a Supabase template). It runs with administrator rights and can currently be called by
-- anyone through the API. LEWTA never calls it. This removes public access to it.
-- It does not change any table or any student data.

revoke execute on function public.rls_auto_enable() from anon, authenticated, public;

-- Also recommended (no SQL needed): Supabase Dashboard → Authentication → Policies/Settings →
-- turn on "Leaked password protection".
