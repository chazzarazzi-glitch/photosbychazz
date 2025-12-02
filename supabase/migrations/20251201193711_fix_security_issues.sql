/*
  # Fix Security Issues

  ## Changes Made

  1. **Remove Unused Indexes**
    - Drop `idx_photos_event_id` (redundant - covered by composite index)
    - Drop `idx_photos_is_visible` (redundant - covered by composite index)
    - Drop `idx_events_google_drive_folder` (unused - not queried by app)
    - Drop `idx_photos_google_drive_file` (unused - not queried by app)
    - Drop `idx_sync_logs_event` (unused - minimal queries to sync_logs)
    - Keep `idx_photos_event_visible` which efficiently handles both queries

  2. **Fix Multiple Permissive Policies**
    - Combine the two SELECT policies on photos table into a single policy
    - Public users can view visible photos (is_visible = true)
    - Authenticated users can view all photos (including hidden)
    - This eliminates policy conflicts and improves performance

  ## Security Notes
  - The composite index `idx_photos_event_visible` provides optimal performance for:
    - Queries filtering by event_id
    - Queries filtering by is_visible
    - Queries filtering by both (most common case)
  - Single permissive policy is more efficient and clearer than multiple overlapping policies
*/

-- Remove unused indexes
DROP INDEX IF EXISTS idx_photos_event_id;
DROP INDEX IF EXISTS idx_photos_is_visible;
DROP INDEX IF EXISTS idx_events_google_drive_folder;
DROP INDEX IF EXISTS idx_photos_google_drive_file;
DROP INDEX IF EXISTS idx_sync_logs_event;

-- Fix multiple permissive policies by dropping the redundant ones and creating a single comprehensive policy
DROP POLICY IF EXISTS "Anyone can view visible photos" ON photos;
DROP POLICY IF EXISTS "Authenticated users can view all photos" ON photos;

-- Create a single optimized SELECT policy that handles both cases
CREATE POLICY "Users can view photos based on auth status"
  ON photos
  FOR SELECT
  USING (
    CASE 
      WHEN auth.role() = 'authenticated' THEN true
      ELSE is_visible = true
    END
  );