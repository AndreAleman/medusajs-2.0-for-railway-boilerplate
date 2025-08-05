///Users/andresreality/Documents/cowbird_ecommerce/medusajs-2.0-for-railway-boilerplate/storefront/src/sanity/schemaTypes/documents/productTab.ts

import { defineType, defineField, defineArrayMember } from "sanity"
import { table } from '@sanity/table';

export const productTab = defineType({
  name: "productTab",
  type: "object",
  title: "Product Tab",
  fields: [
      defineField({ name: 'title', type: 'string', title: 'Tab Title' }),
      defineField({ name: 'content', type: 'array', of: [
        { type: 'block' },
        { type: 'youtube' }, // allow YouTube embeds inside tab content
        // add other custom types here
      ]}),
    ]
})