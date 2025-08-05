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

type SanityTab = {
  _key: string
  title: string
  content: any[] 
}

const components = {
  types: {
    youTube: ({ value }: { value: { url: string } }) => {  // Capital T to match "_type": "youTube"
      console.log('YouTube block found! Value:', value)
      if (!value?.url) {
        return <div>No YouTube URL provided</div>
      }
      return (
        <div className="my-4">
          <ReactPlayer 
            src={value.url} 
            controls 
            width="100%" 
            height="400px"
          />
        </div>
      )
    }
  }
}



export default function SanityTabs({ tabs }: { tabs: SanityTab[] }) {
  const [activeIdx, setActiveIdx] = useState(0)

  if (!tabs?.length) return null

  // This is the most important debug log!
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