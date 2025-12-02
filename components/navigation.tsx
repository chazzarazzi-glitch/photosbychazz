'use client';

import Link from 'next/link';
import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Navigation() {
  return (
    <nav className="border-b border-zinc-800 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2 text-white hover:text-zinc-300 transition-colors">
            <Camera className="h-6 w-6" />
            <span className="font-semibold text-lg">Event Photography</span>
          </Link>

          <Button
            asChild
            variant="outline"
            className="bg-white text-black border-white hover:bg-zinc-200 hover:text-black"
          >
            <a href="https://chazzgold.art" target="_blank" rel="noopener noreferrer">
              Back to Main Portfolio
            </a>
          </Button>
        </div>
      </div>
    </nav>
  );
}
