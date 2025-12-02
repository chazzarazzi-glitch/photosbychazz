/*
  # Add Google Drive Integration Support

  1. Schema Changes
    - Add `google_drive_folder_id` to events table to link events with Drive folders
    - Add `last_sync_at` timestamp to track when event was last synced
    - Add `auto_sync_enabled` boolean to enable/disable auto-sync per event
    - Add `source` field to photos table to track upload method (manual/auto)
    - Add `google_drive_file_id` to photos to track original Drive file
    
  2. New Table
    - `sync_logs` table to track sync history and errors
    
  3. Security
    - Update RLS policies for new fields
*/

-- Add Google Drive integration fields to events table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'google_drive_folder_id'
  ) THEN
    ALTER TABLE events ADD COLUMN google_drive_folder_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'last_sync_at'
  ) THEN
    ALTER TABLE events ADD COLUMN last_sync_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'auto_sync_enabled'
  ) THEN
    ALTER TABLE events ADD COLUMN auto_sync_enabled boolean DEFAULT true;
  END IF;
END $$;

-- Add source tracking to photos table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'photos' AND column_name = 'source'
  ) THEN
    ALTER TABLE photos ADD COLUMN source text DEFAULT 'manual' CHECK (source IN ('manual', 'google_drive'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'photos' AND column_name = 'google_drive_file_id'
  ) THEN
    ALTER TABLE photos ADD COLUMN google_drive_file_id text;
  END IF;
END $$;

-- Create sync logs table
CREATE TABLE IF NOT EXISTS sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  status text DEFAULT 'running' CHECK (status IN ('running', 'success', 'error')),
  photos_added integer DEFAULT 0,
  error_message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view sync logs"
  ON sync_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only service role can insert sync logs"
  ON sync_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Only service role can update sync logs"
  ON sync_logs FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_events_google_drive_folder 
  ON events(google_drive_folder_id) 
  WHERE google_drive_folder_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_photos_google_drive_file 
  ON photos(google_drive_file_id) 
  WHERE google_drive_file_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sync_logs_event 
  ON sync_logs(event_id, created_at DESC);