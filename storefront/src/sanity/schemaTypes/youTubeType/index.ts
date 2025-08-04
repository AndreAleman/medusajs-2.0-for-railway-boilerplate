import { defineType, defineField } from 'sanity'
import { PlayIcon } from '@sanity/icons'
import { YouTubePreview } from './YouTubePreview'

export const youTubeType = defineType({
  name: 'youTube',                     // NOTE: use this exact name elsewhere!
  type: 'object',
  title: 'YouTube Embed',
  icon: PlayIcon,
  fields: [
    defineField({
      name: 'url',
      type: 'url',
      title: 'YouTube video URL',
    }),
  ],
  preview: {
    select: { url: 'url' },
  },
  components: {
    preview: YouTubePreview,            // Shows a live preview in Studio
  },
})
