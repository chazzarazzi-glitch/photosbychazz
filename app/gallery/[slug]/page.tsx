'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Navigation } from '@/components/navigation';
import { GalleryView } from '@/components/gallery-view';
import { format } from 'date-fns';

interface Event {
  id: string;
  slug: string;
  display_name: string | null;
  created_at: string;
}

interface Photo {
  id: string;
  event_id: string;
  image_url: string;
  is_visible: boolean;
  source: string;
  google_drive_file_id: string | null;
  taken_at: string;
  created_at: string;
}

export default function GalleryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [event, setEvent] = useState<Event | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function loadEventAndPhotos() {
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (eventError || !eventData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setEvent(eventData);

      const { data: photosData, error: photosError } = await supabase
        .from('photos')
        .select('*')
        .eq('event_id', eventData.id)
        .eq('is_visible', true)
        .order('taken_at', { ascending: true });

      if (!photosError && photosData) {
        setPhotos(photosData);
      }

      setLoading(false);
    }

    loadEventAndPhotos();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (notFound || !event) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">404</h1>
          <p className="text-zinc-400">Event not found</p>
        </div>
      </div>
    );
  }

  const title = event.display_name || format(new Date(event.created_at), 'MMM dd, yyyy');

  return (
    <div className="min-h-screen bg-black">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">{title}</h1>
          <p className="text-zinc-400">
            {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
          </p>
        </div>

        <GalleryView eventId={event.id} initialPhotos={photos} />
      </main>
    </div>
  );
}
