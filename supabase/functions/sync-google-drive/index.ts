import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface SyncRequest {
  googleDriveFolderId: string;
  accessToken: string;
  eventId?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { googleDriveFolderId, accessToken, eventId }: SyncRequest = await req.json();

    if (!googleDriveFolderId || !accessToken) {
      throw new Error('Missing required parameters');
    }

    const syncLogId = crypto.randomUUID();
    let currentEventId = eventId;
    let photosAdded = 0;

    await supabase.from('sync_logs').insert({
      id: syncLogId,
      event_id: currentEventId,
      status: 'running',
      photos_added: 0,
    });

    const folderMetadata = await fetchGoogleDriveFolder(googleDriveFolderId, accessToken);
    
    if (!currentEventId) {
      const { data: newEvent } = await supabase
        .from('events')
        .insert({
          display_name: folderMetadata.name,
          slug: generateSlug(folderMetadata.name),
          google_drive_folder_id: googleDriveFolderId,
          auto_sync_enabled: true,
        })
        .select()
        .single();
      
      currentEventId = newEvent?.id;
      
      await supabase
        .from('sync_logs')
        .update({ event_id: currentEventId })
        .eq('id', syncLogId);
    }

    const files = await fetchGoogleDriveFiles(googleDriveFolderId, accessToken);
    
    const imageFiles = files.filter((file: any) => 
      file.mimeType?.startsWith('image/') && 
      !file.mimeType?.includes('video')
    );

    const { data: existingPhotos } = await supabase
      .from('photos')
      .select('google_drive_file_id')
      .eq('event_id', currentEventId);
    
    const existingFileIds = new Set(
      existingPhotos?.map((p: any) => p.google_drive_file_id) || []
    );

    for (const file of imageFiles) {
      if (existingFileIds.has(file.id)) {
        continue;
      }

      try {
        const imageBlob = await downloadGoogleDriveFile(file.id, accessToken);
        const fileName = `${currentEventId}/${crypto.randomUUID()}-${file.name}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('event-photos')
          .upload(fileName, imageBlob, {
            contentType: file.mimeType,
            upsert: false,
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('event-photos')
          .getPublicUrl(fileName);

        await supabase.from('photos').insert({
          event_id: currentEventId,
          image_url: publicUrl,
          source: 'google_drive',
          google_drive_file_id: file.id,
          taken_at: file.createdTime || new Date().toISOString(),
          is_visible: false,
        });

        photosAdded++;
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
      }
    }

    await supabase
      .from('sync_logs')
      .update({
        status: 'success',
        completed_at: new Date().toISOString(),
        photos_added: photosAdded,
      })
      .eq('id', syncLogId);

    await supabase
      .from('events')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', currentEventId);

    return new Response(
      JSON.stringify({
        success: true,
        eventId: currentEventId,
        photosAdded,
        totalFiles: imageFiles.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Sync error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function fetchGoogleDriveFolder(folderId: string, accessToken: string) {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name,createdTime`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  
  if (!response.ok) {
    throw new Error(`Failed to fetch folder: ${response.statusText}`);
  }
  
  return await response.json();
}

async function fetchGoogleDriveFiles(folderId: string, accessToken: string) {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents&fields=files(id,name,mimeType,createdTime)&pageSize=1000`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  
  if (!response.ok) {
    throw new Error(`Failed to fetch files: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.files || [];
}

async function downloadGoogleDriveFile(fileId: string, accessToken: string) {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`);
  }
  
  return await response.blob();
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 50) + '-' + Date.now().toString(36);
}