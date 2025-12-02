'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Photo = Database['public']['Tables']['photos']['Row'];

interface GalleryViewProps {
  eventId: string;
  initialPhotos: Photo[];
}

export function GalleryView({ eventId, initialPhotos }: GalleryViewProps) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel(`photos:event_id=eq.${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'photos',
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newPhoto = payload.new as Photo;
            if (newPhoto.is_visible) {
              setPhotos((current) => [...current, newPhoto].sort((a, b) =>
                new Date(a.taken_at).getTime() - new Date(b.taken_at).getTime()
              ));
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedPhoto = payload.new as Photo;
            if (updatedPhoto.is_visible) {
              setPhotos((current) => {
                const exists = current.find((p) => p.id === updatedPhoto.id);
                if (exists) {
                  return current.map((p) => (p.id === updatedPhoto.id ? updatedPhoto : p));
                } else {
                  return [...current, updatedPhoto].sort((a, b) =>
                    new Date(a.taken_at).getTime() - new Date(b.taken_at).getTime()
                  );
                }
              });
            } else {
              setPhotos((current) => current.filter((p) => p.id !== updatedPhoto.id));
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedPhoto = payload.old as Photo;
            setPhotos((current) => current.filter((p) => p.id !== deletedPhoto.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  if (photos.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-zinc-500 text-lg">No photos available yet. Check back soon!</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo) => (
          <button
            key={photo.id}
            onClick={() => setSelectedPhoto(photo)}
            className="aspect-square relative overflow-hidden rounded-lg bg-zinc-800 hover:opacity-80 transition-opacity group"
          >
            <img
              src={photo.image_url}
              alt="Event photo"
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
            />
          </button>
        ))}
      </div>

      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-6xl w-full bg-black border-zinc-800 p-0">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 text-white hover:bg-zinc-800"
              onClick={() => setSelectedPhoto(null)}
            >
              <X className="h-6 w-6" />
            </Button>
            {selectedPhoto && (
              <img
                src={selectedPhoto.image_url}
                alt="Event photo"
                className="w-full h-auto max-h-[90vh] object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
