# Security Setup Guide

## Required Configuration

### Enable Password Breach Protection

For production use, you **MUST** enable password breach protection in your Supabase dashboard.

**Steps:**

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Policies**
3. Find **"Password Protection"** or **"Leaked Password Protection"**
4. Enable the toggle to check passwords against HaveIBeenPwned.org
5. Save the changes

**What this does:**
- Prevents users from creating accounts with compromised passwords
- Checks passwords against the HaveIBeenPwned database
- Enhances overall security by blocking known leaked credentials

**Note:** This setting cannot be configured via migration files and must be manually enabled through the Supabase dashboard.

## Security Issues Fixed

### ✅ Removed Unused Indexes
- Dropped 5 unused indexes that were consuming storage and maintenance overhead
- Kept the optimal composite index `idx_photos_event_visible` for query performance

### ✅ Fixed Multiple Permissive Policies
- Combined overlapping SELECT policies on the photos table into a single efficient policy
- Public users can only see visible photos (`is_visible = true`)
- Authenticated users can see all photos (including hidden ones for moderation)

### ⚠️ Password Breach Protection
- **Action Required:** Must be enabled manually via Supabase dashboard (see steps above)
- This is a critical security feature for production deployments

## Production Checklist

Before going live in Miami:

- [ ] Enable Password Breach Protection in Supabase dashboard
- [ ] Verify Supabase Storage bucket `event-photos` is created and public
- [ ] Create admin user account via Supabase Auth dashboard
- [ ] Test login flow and photo approval workflow
- [ ] Confirm Google Drive sync works with a test folder
- [ ] Verify real-time updates work in the gallery view
- [ ] Check mobile responsiveness for on-site management

## Database Security Summary

**Row Level Security (RLS):** ✅ Enabled on all tables

**Current Policies:**
- Events: Public read, authenticated full access
- Photos: Conditional read (visible to public, all to admin), authenticated full access
- Sync Logs: Authenticated users only

**Indexes:** Optimized for performance with minimal overhead

**Foreign Keys:** Proper CASCADE deletion configured
