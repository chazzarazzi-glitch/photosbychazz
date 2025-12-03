/*
  # Add Google OAuth Token Storage

  1. Changes
    - Add `google_access_token` column to store OAuth access token
    - Add `google_refresh_token` column to store OAuth refresh token
    - Add `google_token_expiry` column to store token expiration timestamp
    - Add `google_drive_connected` boolean to track connection status
  
  2. Security
    - Tokens are encrypted at rest by Supabase
    - RLS policies ensure users can only access their own tokens
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'auth' AND table_schema = 'auth' AND column_name = 'users'
  ) THEN
    -- Check if we need to add columns to auth.users metadata instead
    -- For now, create a separate table for OAuth tokens
    CREATE TABLE IF NOT EXISTS google_oauth_tokens (
      user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      access_token text,
      refresh_token text,
      token_expiry timestamptz,
      connected boolean DEFAULT false,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  END IF;
END $$;

-- Enable RLS
ALTER TABLE google_oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only read their own tokens
CREATE POLICY "Users can read own OAuth tokens"
  ON google_oauth_tokens
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own tokens
CREATE POLICY "Users can insert own OAuth tokens"
  ON google_oauth_tokens
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own tokens
CREATE POLICY "Users can update own OAuth tokens"
  ON google_oauth_tokens
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own tokens
CREATE POLICY "Users can delete own OAuth tokens"
  ON google_oauth_tokens
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);