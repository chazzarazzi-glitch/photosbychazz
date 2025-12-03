'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Cloud, RefreshCw, AlertCircle, CheckCircle2, Link2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface GoogleDriveSyncProps {
  eventId: string;
  googleDriveFolderId?: string | null;
  onSyncComplete: () => void;
}

export function GoogleDriveSync({ eventId, googleDriveFolderId, onSyncComplete }: GoogleDriveSyncProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [folderId, setFolderId] = useState(googleDriveFolderId || '');
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [checkingConnection, setCheckingConnection] = useState(true);

  useEffect(() => {
    checkGoogleConnection();
  }, []);

  async function checkGoogleConnection() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCheckingConnection(false);
        return;
      }

      const { data, error } = await supabase
        .from('google_oauth_tokens')
        .select('connected')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && data?.connected) {
        setIsConnected(true);
      }
    } catch (err) {
      console.error('Error checking Google connection:', err);
    } finally {
      setCheckingConnection(false);
    }
  }

  function handleConnectGoogle() {
    window.location.href = '/api/auth/google?redirect=/admin';
  }

  async function handleSync() {
    if (!folderId) {
      setError('Please provide a Folder ID');
      return;
    }

    if (!isConnected) {
      setError('Please connect your Google Drive account first');
      return;
    }

    setSyncing(true);
    setError('');
    setSuccess('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/sync-google-drive`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          googleDriveFolderId: folderId,
          eventId: eventId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Sync failed');
      }

      setSuccess(`Successfully synced ${data.photosAdded} new photos!`);
      setTimeout(() => {
        setShowDialog(false);
        onSyncComplete();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to sync photos');
    } finally {
      setSyncing(false);
    }
  }

  function extractFolderId(input: string): string {
    const match = input.match(/folders\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : input.trim();
  }

  function handleFolderIdChange(value: string) {
    setFolderId(extractFolderId(value));
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
        onClick={() => setShowDialog(true)}
      >
        <Cloud className="h-4 w-4 mr-1" />
        {googleDriveFolderId ? 'Sync Again' : 'Sync from Drive'}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Sync from Google Drive</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Connect this event to a Google Drive folder to automatically import photos
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive" className="bg-red-950 border-red-800">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-950 border-green-800">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                <AlertDescription className="text-green-400">{success}</AlertDescription>
              </Alert>
            )}

            {!isConnected && !checkingConnection && (
              <Alert className="bg-blue-950 border-blue-800">
                <Link2 className="h-4 w-4 text-blue-400" />
                <AlertDescription className="text-blue-400">
                  You need to connect your Google Drive account first.
                </AlertDescription>
              </Alert>
            )}

            {!isConnected && !checkingConnection ? (
              <div className="flex flex-col items-center justify-center py-6 space-y-4">
                <p className="text-zinc-400 text-sm text-center">
                  Connect your Google Drive account to sync photos automatically
                </p>
                <Button
                  onClick={handleConnectGoogle}
                  className="bg-white text-black hover:bg-zinc-200"
                >
                  <Link2 className="h-4 w-4 mr-2" />
                  Connect Google Drive
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="folder-id" className="text-white">Google Drive Folder ID or URL</Label>
                <Input
                  id="folder-id"
                  value={folderId}
                  onChange={(e) => handleFolderIdChange(e.target.value)}
                  placeholder="Enter folder ID or paste folder URL"
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 font-mono text-sm"
                />
                <p className="text-xs text-zinc-500">
                  Paste the full Google Drive URL (e.g., https://drive.google.com/drive/folders/ABC123) or just the folder ID
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={syncing}
              className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
            >
              Cancel
            </Button>
            {isConnected && (
              <Button
                onClick={handleSync}
                disabled={syncing || !folderId}
                className="bg-white text-black hover:bg-zinc-200"
              >
                {syncing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <Cloud className="h-4 w-4 mr-2" />
                    Sync Photos
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
