-- VERIFY SECURITY SETUP AFTER SQL EXECUTION
-- Run this in Supabase SQL Editor to confirm everything is working

-- Test 1: Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('admin_users', 'courier_profiles', 'wallets', 'wallet_transactions', 'orders')
ORDER BY tablename;

-- Test 2: Check if policies exist
SELECT tablename, policyname, qual 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Test 3: Check if functions exist
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('is_admin', 'is_courier', 'add_to_wallet_secure', 'debit_wallet_secure')
ORDER BY routine_name;

-- Expected output:
-- ✅ 5 tables with rowsecurity = true (RLS enabled)
-- ✅ 9 policies created
-- ✅ 4 functions created
-- If all above show results → Security setup is COMPLETE ✅
