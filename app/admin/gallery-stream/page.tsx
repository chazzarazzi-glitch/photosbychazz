'use client'

import { useState, useEffect } from 'react'
import { GOOGLE_DRIVE_API_KEY, TARGET_FOLDER_ID, type DrivePhoto } from '@/lib/google-drive-actions'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LiveDriveGallery() {
  const [photos, setPhotos] = useState<DrivePhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadPhotos = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const params = new URLSearchParams({
        key: GOOGLE_DRIVE_API_KEY,
        q: `'${TARGET_FOLDER_ID}' in parents and mimeType contains 'image/'`,
        fields: 'files(id,name,createdTime)',
        orderBy: 'createdTime desc',
        pageSize: '100'
      })

      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?${params.toString()}`
      )

      if (!response.ok) {
        throw new Error(`Google Drive API error: ${response.status}`)
      }

      const data = await response.json()

      const fetchedPhotos = (data.files || []).map((file: any) => ({
        id: file.id,
        name: file.name,
        createdTime: file.createdTime,
        thumbnailUrl: `https://lh3.googleusercontent.com/d/${file.id}`
      }))

      setPhotos(fetchedPhotos)
    } catch (error) {
      console.error('Error loading photos:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadPhotos()

    const interval = setInterval(() => {
      loadPhotos(true)
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading photos...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            Live Photo Stream: Miami Events
          </h1>
          <Button
            onClick={() => loadPhotos(true)}
            disabled={refreshing}
            variant="outline"
            className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {photos.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <p className="text-xl">No photos found in the drive folder</p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="break-inside-avoid relative group overflow-hidden rounded-lg bg-gray-800 shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                <img
                  src={photo.thumbnailUrl}
                  alt={photo.name}
                  className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-white text-sm font-medium truncate">
                      {photo.name}
                    </p>
                    <p className="text-gray-300 text-xs">
                      {new Date(photo.createdTime).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            Auto-refreshes every 30 seconds • {photos.length} photos
          </p>
        </div>
      </div>
    </div>
  )
}
