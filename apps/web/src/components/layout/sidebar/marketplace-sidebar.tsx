'use client';

import { Store, TrendingUp, Star, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function MarketplaceSidebar() {
  return (
    <div className="flex h-full flex-col">
      <div className="p-4">
        <h2 className="font-semibold text-lg">Marketplace</h2>
        <p className="text-sm text-muted-foreground">Browse agents & tools</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        <div className="space-y-4">
          <div>
            <h3 className="mb-2 text-sm font-medium">Categories</h3>
            <div className="space-y-1">
              <div className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-muted cursor-pointer">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">Trending</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-muted cursor-pointer">
                <Star className="h-4 w-4" />
                <span className="text-sm">Featured</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-muted cursor-pointer">
                <Package className="h-4 w-4" />
                <span className="text-sm">All Products</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-medium">Popular Tags</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-xs">Trading</Badge>
              <Badge variant="secondary" className="text-xs">DeFi</Badge>
              <Badge variant="secondary" className="text-xs">NFT</Badge>
              <Badge variant="secondary" className="text-xs">Analytics</Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}