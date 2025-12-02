'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Cloud, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

interface GoogleDriveSyncProps {
  eventId: string;
  googleDriveFolderId?: string | null;
  onSyncComplete: () => void;
}

export function GoogleDriveSync({ eventId, googleDriveFolderId, onSyncComplete }: GoogleDriveSyncProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [folderId, setFolderId] = useState(googleDriveFolderId || '');
  const [accessToken, setAccessToken] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSync() {
    if (!folderId || !accessToken) {
      setError('Please provide both Folder ID and Access Token');
      return;
    }

    setSyncing(true);
    setError('');
    setSuccess('');

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/sync-google-drive`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          googleDriveFolderId: folderId,
          accessToken: accessToken,
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

            <div className="space-y-2">
              <Label htmlFor="access-token" className="text-white">Access Token</Label>
              <Input
                id="access-token"
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="Enter your Google OAuth access token"
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 font-mono text-sm"
              />
              <p className="text-xs text-zinc-500">
                You need a Google OAuth access token with Drive API permissions.{' '}
                <a
                  href="https://developers.google.com/oauthplayground/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  Get one from OAuth Playground
                </a>
              </p>
            </div>

            <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 space-y-2">
              <h4 className="text-white font-medium text-sm">How to get your access token:</h4>
              <ol className="text-xs text-zinc-400 space-y-1 list-decimal list-inside">
                <li>Visit the OAuth 2.0 Playground (link above)</li>
                <li>Select "Drive API v3" from the list</li>
                <li>Check "https://www.googleapis.com/auth/drive.readonly"</li>
                <li>Click "Authorize APIs" and sign in with Google</li>
                <li>Click "Exchange authorization code for tokens"</li>
                <li>Copy the "Access token" value</li>
              </ol>
            </div>
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
            <Button
              onClick={handleSync}
              disabled={syncing || !folderId || !accessToken}
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
