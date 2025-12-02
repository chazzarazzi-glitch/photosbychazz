'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FolderPlus, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

interface CreateEventFromDriveProps {
  onEventCreated: () => void;
}

export function CreateEventFromDrive({ onEventCreated }: CreateEventFromDriveProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [folderId, setFolderId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleCreate() {
    if (!folderId || !accessToken) {
      setError('Please provide both Folder ID and Access Token');
      return;
    }

    setCreating(true);
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
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create event');
      }

      setSuccess(`Event created with ${data.photosAdded} photos!`);
      setTimeout(() => {
        setShowDialog(false);
        setFolderId('');
        setAccessToken('');
        onEventCreated();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to create event');
    } finally {
      setCreating(false);
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
        className="bg-white text-black hover:bg-zinc-200"
        onClick={() => setShowDialog(true)}
      >
        <FolderPlus className="h-4 w-4 mr-2" />
        Import from Google Drive
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Create Event from Google Drive</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Import photos from a Google Drive folder to create a new event
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
              <Label htmlFor="new-folder-id" className="text-white">Google Drive Folder ID or URL</Label>
              <Input
                id="new-folder-id"
                value={folderId}
                onChange={(e) => handleFolderIdChange(e.target.value)}
                placeholder="Enter folder ID or paste folder URL"
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 font-mono text-sm"
              />
              <p className="text-xs text-zinc-500">
                The folder name will be used as the event name
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-access-token" className="text-white">Access Token</Label>
              <Input
                id="new-access-token"
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="Enter your Google OAuth access token"
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 font-mono text-sm"
              />
              <p className="text-xs text-zinc-500">
                Need an access token?{' '}
                <a
                  href="https://developers.google.com/oauthplayground/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  Get one here
                </a>
              </p>
            </div>

            <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 space-y-2">
              <h4 className="text-white font-medium text-sm">Quick Setup Guide:</h4>
              <ol className="text-xs text-zinc-400 space-y-1 list-decimal list-inside">
                <li>Visit OAuth 2.0 Playground (link above)</li>
                <li>Select "Drive API v3"</li>
                <li>Check "https://www.googleapis.com/auth/drive.readonly"</li>
                <li>Click "Authorize APIs" and sign in</li>
                <li>Click "Exchange authorization code for tokens"</li>
                <li>Copy the "Access token"</li>
              </ol>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={creating}
              className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating || !folderId || !accessToken}
              className="bg-white text-black hover:bg-zinc-200"
            >
              {creating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Create Event
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
