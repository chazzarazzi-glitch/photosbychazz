/*
  # Event Photography Platform Database Schema

  ## Overview
  This migration creates the core database structure for a specialized event photography platform
  that supports 'lazy' event creation and real-time photo moderation.

  ## New Tables

  ### `events`
  The events table stores information about photo galleries for different events (weddings, parties, etc.).
  - `id` (uuid, primary key) - Unique identifier for each event
  - `slug` (text, unique, not null) - URL-friendly identifier (e.g., 'smith-wedding')
  - `display_name` (text, nullable) - Human-readable event title (can be null for lazy-generated events)
  - `cover_image_url` (text, nullable) - URL to cover image in Supabase Storage
  - `created_at` (timestamptz) - Timestamp of event creation

  ### `photos`
  The photos table stores individual photos for each event with visibility control.
  - `id` (uuid, primary key) - Unique identifier for each photo
  - `event_id` (uuid, foreign key) - References events table
  - `image_url` (text, not null) - URL to image in Supabase Storage
  - `is_visible` (boolean, default: false) - Controls public visibility (hidden by default until approved)
  - `taken_at` (timestamptz) - Timestamp when photo was taken/uploaded
  - `created_at` (timestamptz) - Timestamp of database record creation

  ## Security

  ### Row Level Security (RLS)
  - Both tables have RLS enabled
  - Public users can read visible events and approved photos only
  - Authenticated users (admin) have full access to manage events and photos
  
  ### RLS Policies
  
  #### Events Table:
  1. Public SELECT - Anyone can view all events
  2. Admin Full Access - Authenticated users can perform all operations
  
  #### Photos Table:
  1. Public SELECT (Visible Only) - Anonymous users can only see approved photos (is_visible = true)
  2. Admin Full Access - Authenticated users can perform all operations

  ## Important Notes
  - Photos are hidden by default (`is_visible = false`) until an admin approves them
  - The slug field is unique and used for URL routing
  - Foreign key constraint ensures photos are linked to valid events
  - Indexes are added on event_id and is_visible for query performance
*/

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  display_name text,
  cover_image_url text,
  created_at timestamptz DEFAULT now()
);

-- Create photos table
CREATE TABLE IF NOT EXISTS photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  is_visible boolean DEFAULT false,
  taken_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_photos_event_id ON photos(event_id);
CREATE INDEX IF NOT EXISTS idx_photos_is_visible ON photos(is_visible);
CREATE INDEX IF NOT EXISTS idx_photos_event_visible ON photos(event_id, is_visible);

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Events table policies
-- Policy 1: Anyone can view all events (needed for public gallery listing)
CREATE POLICY "Anyone can view events"
  ON events
  FOR SELECT
  TO public
  USING (true);

-- Policy 2: Authenticated users can insert events
CREATE POLICY "Authenticated users can insert events"
  ON events
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy 3: Authenticated users can update events
CREATE POLICY "Authenticated users can update events"
  ON events
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy 4: Authenticated users can delete events
CREATE POLICY "Authenticated users can delete events"
  ON events
  FOR DELETE
  TO authenticated
  USING (true);

-- Photos table policies
-- Policy 1: Anyone can view visible photos (is_visible = true)
CREATE POLICY "Anyone can view visible photos"
  ON photos
  FOR SELECT
  TO public
  USING (is_visible = true);

-- Policy 2: Authenticated users can view all photos (including hidden ones)
CREATE POLICY "Authenticated users can view all photos"
  ON photos
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy 3: Authenticated users can insert photos
CREATE POLICY "Authenticated users can insert photos"
  ON photos
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy 4: Authenticated users can update photos
CREATE POLICY "Authenticated users can update photos"
  ON photos
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy 5: Authenticated users can delete photos
CREATE POLICY "Authenticated users can delete photos"
  ON photos
  FOR DELETE
  TO authenticated
  USING (true);