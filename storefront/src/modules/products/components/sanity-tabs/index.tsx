// "use client"

// import React from "react"
// import { PortableText } from "@portabletext/react"
// import { YouTubePreview } from "sanity/schemaTypes/youTubeType/YouTubePreview"
// import ReactPlayer from "react-player"
// import { serializers } from "./serializers"



// type SanityTab = {
//   _key: string
//   title: string
//   content: any[]
// }
// const components = {
//   types: {
//     youtube: ({value}) => {
//       const { url } = value
//       return <ReactPlayer url={url} />
//     }
//     // Add other custom types here
//   }
// }

// export default function SanityTabs({ tabs }: { tabs: SanityTab[] }) {
//   const [activeIdx, setActiveIdx] = React.useState(0)

//   if (!tabs?.length) return null

//   return (
//     <div>
//       {/* Tab headers */}
//       <div className="flex border-b gap-2 mb-4">
//         {tabs.map((tab, idx) => (
//           <button
//             key={tab._key}
//             onClick={() => setActiveIdx(idx)}
//             className={`px-4 py-2 transition border-b-2 ${
//               activeIdx === idx ? "border-blue-600 font-bold" : "border-transparent"
//             }`}
//             type="button"
//           >
//             {tab.title}
//           </button>
//         ))}
//       </div>
//       {/* Tab content */}
//       <div className="mt-2">
//          <PortableText value={tabs} types={serializers} />
//         {/* <PortableText
//           value={tabs[activeIdx]?.content}
//           // components={{
//           //   types: {
//           //    // image: 'image',
//           //  //   table: TableBlock, // TableBlock should be a React component
//           //     youtube: YouTubePreview,
//           //     // add custom serializers (table, image, video) here when needed
//           //   },
//           // }}
//         /> */}
//       </div>
//     </div>
//   )
// }
"use client"

import React, { useState } from "react"
import { PortableText } from "@portabletext/react"
import ReactPlayer from "react-player"
import { urlFor } from '../../../../sanity/lib/image' // Make sure this path is correct for your structure

type SanityTab = {
  _key: string
  title: string
  content: any[]
}

const components = {
  types: {
    youtube: ({ value }: { value: { url: string } }) => {
      console.log('YouTube block found! Value:', value)
      if (!value?.url) {
        return <div>No YouTube URL provided</div>
      }
      return (
        <div className="my-4">
          <ReactPlayer
            src={value.url} // must use 'url' for ReactPlayer!
            controls
            width="100%"
            height="400px"
          />
        </div>
      )
    },
    image: ({ value }: { value: any }) => {
      if (!value?.asset) return <div>No image</div>
      const imgUrl = urlFor(value).width(800).auto('format').url()
      return (
        <div className="my-4">
          <img
            src={imgUrl}
            alt={value.alt || ''}
            className="max-w-full h-auto rounded shadow"
            loading="lazy"
          />
        </div>
      )
    },
    table: ({ value }: { value: any }) => {
      if (!value?.rows) return <div>No rows</div>
      return (
        <div className="my-6 overflow-auto">
          <table className="min-w-full border-collapse border border-gray-300 rounded-lg">
            <tbody>
              {value.rows.map((row: any, rowIndex: number) => (
                <tr key={row._key || rowIndex} className={rowIndex === 0 ? "bg-gray-50" : ""}>
                  {row.cells.map((cell: string, cellIndex: number) => (
                    <td
                      key={cellIndex}
                      className="border border-gray-300 px-4 py-2 text-sm min-h-[40px]"
                    >
                      {cell || '\u00A0'} {/* Non-breaking space for empty cells */}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }
  }
}

export default function SanityTabs({ tabs }: { tabs: SanityTab[] }) {
  const [activeIdx, setActiveIdx] = useState(0)

  if (!tabs?.length) return null

  console.log('Active tab content:', tabs[activeIdx]?.content)

  return (
    <div>
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
      <div className="mt-2">
        <PortableText value={tabs[activeIdx]?.content} components={components} />
      </div>
    </div>
  )
}
