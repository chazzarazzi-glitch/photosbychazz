'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, Calendar, Image, Clock, Settings } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';
import { format } from 'date-fns';
import { GoogleDriveSync } from '@/components/google-drive-sync';
import { SyncAllSubfolders } from '@/components/sync-all-subfolders';

type Event = Database['public']['Tables']['events']['Row'];

export default function AdminPage() {
  return (
    <ProtectedRoute>
      <AdminDashboard />
    </ProtectedRoute>
  );
}

function AdminDashboard() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [photoCounts, setPhotoCounts] = useState<Record<string, { total: number; visible: number }>>({});

  async function loadEvents() {
    setLoading(true);

    const { data: eventsData } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    if (eventsData) {
      setEvents(eventsData);

      const counts: Record<string, { total: number; visible: number }> = {};
      for (const event of eventsData) {
        const { data: photos } = await supabase
          .from('photos')
          .select('id, is_visible')
          .eq('event_id', event.id);

        counts[event.id] = {
          total: photos?.length || 0,
          visible: photos?.filter(p => p.is_visible).length || 0,
        };
      }
      setPhotoCounts(counts);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadEvents();
  }, []);

  async function handleSignOut() {
    await signOut();
    router.push('/');
  }

  return (
    <div className="min-h-screen bg-black">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Event Dashboard</h1>
            {user && (
              <p className="text-zinc-400">Logged in as: {user.email}</p>
            )}
          </div>
          <Button
            variant="outline"
            className="bg-zinc-900 border-zinc-700 text-white hover:bg-zinc-800"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <div className="mb-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Google Drive Sync</CardTitle>
                  <CardDescription className="text-zinc-400">
                    Automatically sync all subfolders from Miami 2025 as separate galleries
                  </CardDescription>
                </div>
                <SyncAllSubfolders onSyncComplete={loadEvents} />
              </div>
            </CardHeader>
          </Card>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-white text-xl">Loading events...</div>
          </div>
        ) : events.length === 0 ? (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">No Events Yet</CardTitle>
              <CardDescription className="text-zinc-400">
                Use the Google Drive sync button below to create your first event.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => {
              const counts = photoCounts[event.id] || { total: 0, visible: 0 };
              return (
                <Card key={event.id} className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-white mb-1">
                          {event.display_name || format(new Date(event.created_at), 'MMM dd, yyyy')}
                        </CardTitle>
                        <CardDescription className="text-zinc-500">
                          {event.slug}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center text-zinc-400">
                        <Image className="h-4 w-4 mr-2" />
                        <span>{counts.visible} / {counts.total} photos</span>
                      </div>
                      {event.last_sync_at && (
                        <div className="flex items-center text-zinc-400">
                          <Clock className="h-4 w-4 mr-2" />
                          <span>Synced {format(new Date(event.last_sync_at), 'MMM dd')}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-white text-black hover:bg-zinc-200"
                        onClick={() => router.push(`/admin/event/${event.id}`)}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Manage
                      </Button>
                      <GoogleDriveSync
                        eventId={event.id}
                        googleDriveFolderId={event.google_drive_folder_id}
                        onSyncComplete={loadEvents}
                      />
                    </div>

                    {event.google_drive_folder_id && (
                      <div className="text-xs text-zinc-500 font-mono truncate">
                        Drive: {event.google_drive_folder_id}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
