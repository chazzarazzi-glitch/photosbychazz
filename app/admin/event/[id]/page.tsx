'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database } from '@/lib/database.types';
import { format } from 'date-fns';
import { ArrowLeft, Check, Trash2, Eye, EyeOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

type Event = Database['public']['Tables']['events']['Row'];
type Photo = Database['public']['Tables']['photos']['Row'];

export default function EventModeration({ params }: { params: { id: string } }) {
  return (
    <ProtectedRoute>
      <EventModerationView eventId={params.id} />
    </ProtectedRoute>
  );
}

function EventModerationView({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<Event | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('pending');
  const router = useRouter();

  useEffect(() => {
    loadEventAndPhotos();
  }, [eventId]);

  async function loadEventAndPhotos() {
    setLoading(true);

    const { data: eventData } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .maybeSingle();

    if (eventData) {
      setEvent(eventData);
    }

    const { data: photosData } = await supabase
      .from('photos')
      .select('*')
      .eq('event_id', eventId)
      .order('taken_at', { ascending: true });

    if (photosData) {
      setPhotos(photosData);
    }

    setLoading(false);
  }

  async function togglePhotoVisibility(photoId: string, currentVisibility: boolean) {
    const newVisibility = !currentVisibility;
    const { error } = await supabase
      .from('photos')
      .update({ is_visible: newVisibility })
      .eq('id', photoId);

    if (!error) {
      setPhotos((current) =>
        current.map((p) => (p.id === photoId ? { ...p, is_visible: newVisibility } : p))
      );
    }
  }

  async function deletePhoto(photoId: string) {
    if (!confirm('Are you sure you want to delete this photo?')) {
      return;
    }

    const { error } = await supabase
      .from('photos')
      .delete()
      .eq('id', photoId);

    if (!error) {
      setPhotos((current) => current.filter((p) => p.id !== photoId));
    }
  }

  const pendingPhotos = photos.filter((p) => !p.is_visible);
  const livePhotos = photos.filter((p) => p.is_visible);

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <p className="text-zinc-500 text-center">Loading...</p>
        </main>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-black">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Event not found.</AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }

  const title = event.display_name || format(new Date(event.created_at), 'MMM dd, yyyy');

  return (
    <div className="min-h-screen bg-black">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Button
            variant="ghost"
            className="text-zinc-400 hover:text-white mb-4"
            onClick={() => router.push('/admin')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <h1 className="text-4xl font-bold text-white mb-2">{title}</h1>
          <p className="text-zinc-400">
            {pendingPhotos.length} pending / {livePhotos.length} live / {photos.length} total
          </p>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="bg-zinc-900 border-zinc-800 mb-8">
            <TabsTrigger
              value="pending"
              className="data-[state=active]:bg-white data-[state=active]:text-black"
            >
              <EyeOff className="h-4 w-4 mr-2" />
              Pending ({pendingPhotos.length})
            </TabsTrigger>
            <TabsTrigger
              value="live"
              className="data-[state=active]:bg-white data-[state=active]:text-black"
            >
              <Eye className="h-4 w-4 mr-2" />
              Live ({livePhotos.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {pendingPhotos.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-zinc-500">No pending photos</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {pendingPhotos.map((photo) => (
                  <PhotoCard
                    key={photo.id}
                    photo={photo}
                    onApprove={() => togglePhotoVisibility(photo.id, photo.is_visible)}
                    onDelete={() => deletePhoto(photo.id)}
                    isPending
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="live">
            {livePhotos.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-zinc-500">No live photos</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {livePhotos.map((photo) => (
                  <PhotoCard
                    key={photo.id}
                    photo={photo}
                    onApprove={() => togglePhotoVisibility(photo.id, photo.is_visible)}
                    onDelete={() => deletePhoto(photo.id)}
                    isPending={false}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

interface PhotoCardProps {
  photo: Photo;
  onApprove: () => void;
  onDelete: () => void;
  isPending: boolean;
}

function PhotoCard({ photo, onApprove, onDelete, isPending }: PhotoCardProps) {
  return (
    <div className="relative group bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800">
      <div className="aspect-square relative">
        <img
          src={photo.image_url}
          alt="Event photo"
          className="object-cover w-full h-full"
        />
      </div>

      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
        <Button
          size="lg"
          onClick={onApprove}
          className={isPending ? 'bg-green-600 hover:bg-green-700' : 'bg-zinc-700 hover:bg-zinc-600'}
        >
          {isPending ? (
            <>
              <Check className="h-5 w-5 mr-2" />
              Approve
            </>
          ) : (
            <>
              <EyeOff className="h-5 w-5 mr-2" />
              Hide
            </>
          )}
        </Button>
        <Button
          size="lg"
          variant="destructive"
          onClick={onDelete}
          className="bg-red-600 hover:bg-red-700"
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
