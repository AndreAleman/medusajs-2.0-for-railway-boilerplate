"use client"

import React from "react"
import { PortableText } from "@portabletext/react"

type SanityTab = {
  _key: string
  title: string
  content: any[]
}

export default function SanityTabs({ tabs }: { tabs: SanityTab[] }) {
  const [activeIdx, setActiveIdx] = React.useState(0)

  if (!tabs?.length) return null

  return (
    <div>
      {/* Tab headers */}
      <div className="flex border-b gap-2 mb-4">
        {tabs.map((tab, idx) => (
          <button
            key={tab._key}
            onClick={() => setActiveIdx(idx)}
            className={`px-4 py-2 transition border-b-2 ${
              activeIdx === idx ? "border-blue-600 font-bold" : "border-transparent"
            }`}
            type="button"
          >
            {tab.title}
          </button>
        ))}
      </div>
      {/* Tab content */}
      <div className="mt-2">
        <PortableText
          value={tabs[activeIdx]?.content}
          components={{
            types: {
              image: 'image',
              table: TableBlock, // TableBlock should be a React component
              youTube: YouTubeBlock,
              // add custom serializers (table, image, video) here when needed
            },
          }}
        />
      </div>
    </div>
  )
}
