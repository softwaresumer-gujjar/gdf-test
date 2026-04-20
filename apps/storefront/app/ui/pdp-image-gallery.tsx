'use client';

import { useState } from 'react';
import { X, ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';

interface Props {
  images: string[];   // all image URLs, at least one
  productName: string;
}

export function PDPImageGallery({ images, productName }: Props) {
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);

  const hasMultiple = images.length > 1;

  function openLightbox(idx: number) {
    setLightboxIdx(idx);
    setLightboxOpen(true);
  }

  function lightboxPrev() {
    setLightboxIdx((i) => (i - 1 + images.length) % images.length);
  }

  function lightboxNext() {
    setLightboxIdx((i) => (i + 1) % images.length);
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {/* Main image */}
        <div
          className="relative bg-card border border-border rounded-lg overflow-hidden aspect-square flex items-center justify-center cursor-zoom-in group"
          onClick={() => openLightbox(active)}
        >
          {images[active]
            ? <img src={images[active]} alt={productName} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" />
            : <span className="text-8xl select-none">🥛</span>
          }
          <div className="absolute bottom-3 right-3 bg-black/50 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <ZoomIn size={16} />
          </div>
          {/* Prev/next arrows for main image when multiple */}
          {hasMultiple && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setActive((a) => (a - 1 + images.length) % images.length); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Previous image"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setActive((a) => (a + 1) % images.length); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Next image"
              >
                <ChevronRight size={18} />
              </button>
            </>
          )}
        </div>

        {/* Thumbnail strip */}
        {hasMultiple && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {images.map((url, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActive(i)}
                className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  i === active ? 'border-primary shadow-sm' : 'border-border hover:border-primary/50'
                }`}
                aria-label={`View image ${i + 1}`}
              >
                {url
                  ? <img src={url} alt={`${productName} view ${i + 1}`} className="w-full h-full object-cover" />
                  : <span className="flex items-center justify-center w-full h-full text-2xl">🥛</span>
                }
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <Dialog.Root open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center" onClick={() => setLightboxOpen(false)}>
            <div className="relative max-w-4xl w-full px-4" onClick={(e) => e.stopPropagation()}>
              {/* Close */}
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="absolute -top-10 right-4 text-white/80 hover:text-white transition-colors"
                  aria-label="Close zoom"
                >
                  <X size={28} />
                </button>
              </Dialog.Close>

              {/* Image counter */}
              {hasMultiple && (
                <p className="absolute -top-10 left-4 text-white/70 text-sm">
                  {lightboxIdx + 1} / {images.length}
                </p>
              )}

              {/* Main lightbox image */}
              <div className="bg-card rounded-lg overflow-hidden max-h-[80vh] flex items-center justify-center">
                {images[lightboxIdx]
                  ? <img src={images[lightboxIdx]} alt={productName} className="max-w-full max-h-[80vh] object-contain" />
                  : <span className="text-8xl py-20">🥛</span>
                }
              </div>

              {/* Prev/Next in lightbox */}
              {hasMultiple && (
                <>
                  <button
                    type="button"
                    onClick={lightboxPrev}
                    className="absolute left-8 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-colors"
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    type="button"
                    onClick={lightboxNext}
                    className="absolute right-8 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-colors"
                    aria-label="Next image"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}

              {/* Thumbnail strip in lightbox */}
              {hasMultiple && (
                <div className="flex justify-center gap-2 mt-4 overflow-x-auto pb-1 scrollbar-hide">
                  {images.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setLightboxIdx(i)}
                      className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                        i === lightboxIdx ? 'border-white' : 'border-white/30 hover:border-white/70'
                      }`}
                      aria-label={`View image ${i + 1}`}
                    >
                      {url ? <img src={url} alt="" className="w-full h-full object-cover" /> : <span className="text-xl">🥛</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Dialog.Overlay>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
