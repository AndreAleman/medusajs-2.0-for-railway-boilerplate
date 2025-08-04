import { defineType, defineField, defineArrayMember } from "sanity"
import { table } from '@sanity/table';

export const productTab = defineType({
  name: "productTab",
  type: "object",
  title: "Product Tab",
  fields: [
    defineField({
      name: "title",
      type: "string",
      title: "Tab Title",
    }),
    defineField({
      name: "content",
      type: "array",
      title: "Tab Content",
      of: [
        defineArrayMember({ type: "block" }),
        defineArrayMember({ type: "image" }),
        defineArrayMember({ type: "youTube" }),  // <-- Make sure name matches!
       defineArrayMember({ type: "table" }),    // Table type defined or installed as plugin
      ],
    }),
  ],
})
