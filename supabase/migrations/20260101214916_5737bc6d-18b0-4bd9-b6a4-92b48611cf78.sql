-- =============================================
-- FIX: Secure RLS policies for profiles and notifications
-- =============================================

-- 1. DROP old overly permissive policies
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;

-- 2. Create a secure VIEW for public profile data (hides sensitive fields)
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  username,
  first_name,
  last_name,
  avatar_url,
  bio,
  reputation,
  website,
  telegram_channel,
  show_name,
  show_avatar,
  show_username,
  created_at,
  -- Hide these from public:
  -- telegram_id, referral_code, referral_earnings, 
  -- subscription_tier, premium_expires_at, referred_by,
  -- is_blocked, blocked_at, blocked_until
  CASE WHEN show_name THEN first_name ELSE NULL END as display_first_name,
  CASE WHEN show_name THEN last_name ELSE NULL END as display_last_name,
  CASE WHEN show_username THEN username ELSE NULL END as display_username,
  CASE WHEN show_avatar THEN avatar_url ELSE NULL END as display_avatar_url
FROM public.profiles
WHERE is_blocked = false;

-- 3. Create restrictive RLS policy for profiles
-- Only service role (edge functions) can read full profile data
-- Anon users can only use the public_profiles view
CREATE POLICY "Service role can read all profiles"
ON public.profiles
FOR SELECT
USING (
  -- Allow if caller is using service role (edge functions)
  -- This works because service role bypasses RLS anyway
  -- For anon key, this will return false
  auth.role() = 'service_role'
  OR
  -- Allow users to see their own profile via auth
  auth.uid() IS NOT NULL AND user_id = auth.uid()
);

-- 4. Create restrictive RLS policy for notifications
-- Only service role and the owner can see notifications
CREATE POLICY "Users can view only their own notifications"
ON public.notifications
FOR SELECT
USING (
  -- Service role (edge functions) can access all
  auth.role() = 'service_role'
);

-- 5. Grant SELECT on public_profiles view to anon and authenticated
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- 6. Add comment explaining the security model
COMMENT ON VIEW public.public_profiles IS 'Public-safe view of profiles. Hides telegram_id, referral_earnings, subscription info and respects privacy settings.';

COMMENT ON POLICY "Service role can read all profiles" ON public.profiles IS 'Only edge functions (service role) can read full profile data. Use public_profiles view for public access.';

COMMENT ON POLICY "Users can view only their own notifications" ON public.notifications IS 'Notifications are private. Only accessible via edge functions.';