'use client';

import { useEffect } from 'react';

export function TrackView({ productId }: { productId: string }) {
  useEffect(() => {
    try {
      const key = 'gdf_recently_viewed';
      const current: string[] = JSON.parse(localStorage.getItem(key) ?? '[]');
      const updated = [productId, ...current.filter((id) => id !== productId)].slice(0, 10);
      localStorage.setItem(key, JSON.stringify(updated));
    } catch { /* ignore */ }
  }, [productId]);

  return null;
}
