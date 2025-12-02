'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Navigation } from '@/components/navigation';
import { EventCard } from '@/components/event-card';

interface EventWithCount {
  id: string;
  slug: string;
  display_name: string;
  coverImageUrl: string | null;
  created_at: string;
  photoCount: number;
}

export default function Home() {
  const [events, setEvents] = useState<EventWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvents() {
      const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !events) {
        setLoading(false);
        return;
      }

      const eventsWithCounts = await Promise.all(
        events.map(async (event) => {
          const { count } = await supabase
            .from('photos')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id)
            .eq('is_visible', true);

          let coverImageUrl = event.cover_image_url;

          if (!coverImageUrl) {
            const { data: firstPhoto } = await supabase
              .from('photos')
              .select('image_url')
              .eq('event_id', event.id)
              .eq('is_visible', true)
              .order('taken_at', { ascending: true })
              .limit(1)
              .maybeSingle();

            if (firstPhoto) {
              coverImageUrl = firstPhoto.image_url;
            }
          }

          return {
            id: event.id,
            slug: event.slug,
            display_name: event.display_name,
            coverImageUrl,
            created_at: event.created_at,
            photoCount: count || 0,
          };
        })
      );

      setEvents(eventsWithCounts);
      setLoading(false);
    }

    loadEvents();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Event Galleries</h1>
          <p className="text-zinc-400">Browse through our collection of event photography</p>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-zinc-500 text-lg">No events yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard
                key={event.id}
                slug={event.slug}
                displayName={event.display_name}
                coverImageUrl={event.coverImageUrl}
                createdAt={event.created_at}
                photoCount={event.photoCount}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
