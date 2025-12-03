'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FolderSync, RefreshCw, AlertCircle, CheckCircle2, Link2, Folder } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { TARGET_FOLDER_ID } from '@/lib/google-drive-actions';

interface SyncAllSubfoldersProps {
  onSyncComplete: () => void;
}

interface SyncResult {
  folderName: string;
  eventId?: string;
  photosAdded?: number;
  success: boolean;
  error?: string;
}

export function SyncAllSubfolders({ onSyncComplete }: SyncAllSubfoldersProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<SyncResult[]>([]);
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

  async function handleSyncAll() {
    if (!isConnected) {
      setError('Please connect your Google Drive account first');
      return;
    }

    setSyncing(true);
    setError('');
    setResults([]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/sync-all-subfolders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parentFolderId: TARGET_FOLDER_ID,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Sync failed');
      }

      setResults(data.results || []);

      setTimeout(() => {
        setShowDialog(false);
        onSyncComplete();
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to sync subfolders');
    } finally {
      setSyncing(false);
    }
  }

  const successCount = results.filter(r => r.success).length;
  const totalPhotos = results.reduce((sum, r) => sum + (r.photosAdded || 0), 0);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
        onClick={() => setShowDialog(true)}
      >
        <FolderSync className="h-4 w-4 mr-1" />
        Auto-Sync All Folders
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Auto-Sync All Subfolders</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Automatically sync all subfolders from the Miami 2025 folder. Each subfolder will become a separate gallery.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive" className="bg-red-950 border-red-800">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
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
                  Connect your Google Drive account to automatically sync all subfolders
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
              <div className="space-y-4">
                {!syncing && results.length === 0 && (
                  <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Folder className="h-5 w-5 text-blue-400 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-white font-medium mb-1">Miami 2025 Folder</h4>
                        <p className="text-sm text-zinc-400">
                          This will scan for all subfolders and create a separate gallery for each one.
                          Existing galleries will be updated with new photos.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {syncing && (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center space-y-3">
                      <RefreshCw className="h-8 w-8 text-blue-400 animate-spin mx-auto" />
                      <p className="text-white font-medium">Syncing subfolders...</p>
                      <p className="text-sm text-zinc-400">This may take a few moments</p>
                    </div>
                  </div>
                )}

                {results.length > 0 && (
                  <div className="space-y-3">
                    <Alert className="bg-green-950 border-green-800">
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                      <AlertDescription className="text-green-400">
                        Successfully synced {successCount} folder{successCount !== 1 ? 's' : ''} with {totalPhotos} new photo{totalPhotos !== 1 ? 's' : ''}!
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                      {results.map((result, index) => (
                        <div
                          key={index}
                          className={`border rounded-lg p-3 ${
                            result.success
                              ? 'bg-zinc-800/50 border-zinc-700'
                              : 'bg-red-950/20 border-red-800'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {result.success ? (
                                <CheckCircle2 className="h-4 w-4 text-green-400" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-red-400" />
                              )}
                              <span className="text-white font-medium">{result.folderName}</span>
                            </div>
                            {result.success && (
                              <span className="text-sm text-zinc-400">
                                {result.photosAdded} photo{result.photosAdded !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                          {result.error && (
                            <p className="text-sm text-red-400 mt-1 ml-6">{result.error}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
              {results.length > 0 ? 'Close' : 'Cancel'}
            </Button>
            {isConnected && results.length === 0 && (
              <Button
                onClick={handleSyncAll}
                disabled={syncing}
                className="bg-white text-black hover:bg-zinc-200"
              >
                {syncing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <FolderSync className="h-4 w-4 mr-2" />
                    Sync All Subfolders
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
