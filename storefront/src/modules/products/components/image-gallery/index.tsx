"use client"

import { useState } from "react"
import { HttpTypes } from "@medusajs/types"
import Image from "next/image"
import clsx from "clsx"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
}

const ImageGallery = ({ images }: ImageGalleryProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const main = images[selectedIndex]

  return (
    <div className="flex flex-col items-center w-full max-w-[420px] mx-auto" id="pdp-image-gallery">
    {/* Main image (centered, larger) */}
      <div className="w-[400px] h-[440px] rounded bg-ui-bg-subtle mb-4 relative overflow-hidden flex items-center justify-center">
        {main?.url && (
          <Image
            src={main.url}
            alt={`Product Image ${selectedIndex + 1}`}
            fill
            priority
            sizes="400px"
            className="object-cover rounded"
            style={{ objectFit: "cover" }}
          />
        )}
      </div>

      {/* Gallery thumbnail strip */}
      {images.length > 1 && (
        <div className="flex flex-row gap-2 mt-2">
          {images.map((image, idx) => (
            <button
              key={image.id}
              className={clsx(
                "w-12 h-12 rounded overflow-hidden border-2 bg-ui-bg-subtle transition-all duration-100 flex-shrink-0 focus:outline-none",
                idx === selectedIndex
                  ? "border-blue-600 ring-2 ring-blue-300"
                  : "border-gray-200 opacity-80 hover:border-blue-400"
              )}
              aria-label={`Select image ${idx + 1}`}
              type="button"
              onClick={() => setSelectedIndex(idx)}
            >
              <Image
                src={image.url}
                alt={`Thumbnail ${idx + 1}`}
                width={48}
                height={48}
                className="object-cover w-full h-full"
                draggable={false}
              />
            </button>
          ))}
        </div>
      )}
    </div>

  )
}

export default ImageGallery
