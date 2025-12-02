import Link from 'next/link';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

interface EventCardProps {
  slug: string;
  displayName: string | null;
  coverImageUrl: string | null;
  createdAt: string;
  photoCount: number;
}

export function EventCard({ slug, displayName, coverImageUrl, createdAt, photoCount }: EventCardProps) {
  const title = displayName || format(new Date(createdAt), 'MMM dd, yyyy');

  return (
    <Link href={`/gallery/${slug}`}>
      <Card className="overflow-hidden bg-zinc-900 border-zinc-800 hover:border-zinc-600 transition-all duration-300 hover:scale-[1.02] group">
        <div className="aspect-[4/3] relative bg-zinc-800 overflow-hidden">
          {coverImageUrl ? (
            <img
              src={coverImageUrl}
              alt={title}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full">
              <Calendar className="h-12 w-12 text-zinc-600" />
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
          <p className="text-sm text-zinc-400">
            {photoCount} {photoCount === 1 ? 'photo' : 'photos'}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
