# Event Photography Platform

A specialized Next.js application for managing and displaying event photography galleries with real-time photo moderation capabilities.

## Features

- **Lazy Event Generation**: Events automatically get gallery pages when added to the database
- **Real-time Updates**: Approved photos appear instantly in public galleries without page refresh
- **Admin Dashboard**: Protected photo moderation interface with approve/delete actions
- **Darkroom Theme**: Professional dark aesthetic perfect for photography
- **Touch-Friendly**: Large buttons optimized for mobile moderation during events
- **Public Galleries**: Beautiful grid layouts for event photo browsing

## Pre-Flight Setup Checklist

Before deploying this application, you must complete the following setup steps in your Supabase project:

### 1. Create Storage Bucket

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Storage** in the left sidebar
4. Click **Create a new bucket**
5. Set bucket name to: `event-photos`
6. Set **Public bucket** to `ON` (this allows public read access)
7. Click **Create bucket**

### 2. Configure Storage Policies

After creating the bucket, set up the following policies:

1. In the Storage section, click on the `event-photos` bucket
2. Go to the **Policies** tab
3. Add the following policies:

**Policy 1: Public Read Access**
- Policy name: `Public read access`
- Operation: `SELECT`
- Target roles: `public`
- Policy definition: `true`

**Policy 2: Authenticated Upload**
- Policy name: `Authenticated users can upload`
- Operation: `INSERT`
- Target roles: `authenticated`
- Policy definition: `true`

**Policy 3: Authenticated Delete**
- Policy name: `Authenticated users can delete`
- Operation: `DELETE`
- Target roles: `authenticated`
- Policy definition: `true`

Alternatively, you can run this SQL in the SQL Editor:

```sql
-- Enable public read access to event-photos bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-photos', 'event-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow public to view files
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'event-photos');

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'event-photos');

-- Allow authenticated users to delete files
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'event-photos');
```

### 3. Database Migration

The database tables have already been created via the Supabase migration system. The following tables exist:

- `events` - Stores event information (slug, display_name, cover_image_url, etc.)
- `photos` - Stores photo records with visibility control (is_visible defaults to false)

**Note**: All Row Level Security (RLS) policies are already configured.

### 4. Configure Authentication Redirect URLs

1. In your Supabase Dashboard, go to **Authentication** → **URL Configuration**
2. Add the following URLs to **Redirect URLs**:
   - `https://events.chazzgold.art/` (production)
   - `http://localhost:3000/` (local development)

### 5. Create Admin User

1. In your Supabase Dashboard, go to **Authentication** → **Users**
2. Click **Add user** → **Create new user**
3. Enter your admin email and password
4. Click **Create user**
5. (Optional) Confirm the email if required

### 6. Environment Variables

The following environment variables are already configured in your `.env` file:

```
NEXT_PUBLIC_SUPABASE_URL=https://qdyqxtbeblueljyzmzds.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Usage Guide

### For Administrators

#### Accessing the Admin Dashboard

1. Navigate to `/login`
2. Enter your admin credentials
3. You'll be redirected to `/admin`

#### Managing Events

1. From the admin dashboard, you'll see all events
2. Click **Rename** to update an event's display name
3. Click **Manage Photos** to moderate photos for that event

#### Moderating Photos

1. The photo triage view has two tabs:
   - **Pending**: Photos hidden from public view (is_visible = false)
   - **Live**: Photos visible to the public (is_visible = true)

2. For pending photos:
   - Click **Approve** to make the photo visible (it will appear in real-time on the public gallery)
   - Click the trash icon to delete the photo permanently

3. For live photos:
   - Click **Hide** to remove from public view
   - Click the trash icon to delete the photo permanently

### For Public Users

#### Viewing Galleries

1. Visit the homepage to see all available events
2. Each event card shows:
   - Event title (or date if no custom name)
   - Cover photo (or first visible photo)
   - Photo count

3. Click an event card to view its gallery
4. Click any photo to view it in full screen
5. Photos approved by admin appear instantly via real-time updates

### Adding Events and Photos

Events and photos are typically added via external automation, but you can also add them manually:

#### Manually Add an Event

```sql
INSERT INTO events (slug, display_name, cover_image_url)
VALUES ('smith-wedding', 'Smith Wedding', 'https://qdyqxtbeblueljyzmzds.supabase.co/storage/v1/object/public/event-photos/smith-wedding/cover.jpg');
```

#### Manually Add a Photo

```sql
INSERT INTO photos (event_id, image_url, is_visible)
VALUES (
  'your-event-id-here',
  'https://qdyqxtbeblueljyzmzds.supabase.co/storage/v1/object/public/event-photos/smith-wedding/photo1.jpg',
  false
);
```

**Note**: Photos are hidden by default (is_visible = false) until approved by an admin.

## Image Upload Pattern

When uploading images to Supabase Storage, use this URL pattern:

```
https://qdyqxtbeblueljyzmzds.supabase.co/storage/v1/object/public/event-photos/{event-slug}/{filename}
```

Example:
```
https://qdyqxtbeblueljyzmzds.supabase.co/storage/v1/object/public/event-photos/smith-wedding/IMG_1234.jpg
```

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Tech Stack

- **Next.js 13** (App Router)
- **Supabase** (Database, Auth, Storage, Realtime)
- **Tailwind CSS** (Styling)
- **shadcn/ui** (UI Components)
- **Lucide React** (Icons)
- **TypeScript** (Type Safety)

## Deployment

This application is designed to be deployed on a subdomain (e.g., `events.chazzgold.art`).

The navigation includes a "Back to Main Portfolio" button that links to `https://chazzgold.art`.

## Security Notes

- All photos are hidden by default until an admin approves them
- Admin routes are protected by authentication
- Row Level Security (RLS) ensures public users only see visible photos
- Authenticated users have full access to manage events and photos
- Storage policies control file access appropriately

## License

Private project for chazzgold.art
