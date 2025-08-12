import { DynamicProductTransformer } from './transformer'

const transformer = new DynamicProductTransformer()

console.log('=== Testing Step 9: Multi-Variant Product Creation ===\n')

// Test data
const testSalesChannelId = 'sc_test_channel_123'
const testInventoryLocationId = 'loc_test_location_456'

// Test 1: Parent with Size variations (common Sanitube pattern)
console.log('Test 1: Parent with Size variations (Union Nut)')
const unionNutFamily = [
  {
    id: 1,
    name: 'Union Nut',
    type: 'variable',
    sku: '13H',
    price: '45.00',
    slug: 'union-nut',
    description: 'High-quality stainless steel union nut fitting',
    attributes: [
      {
        id: 10,
        name: 'Size',
        slug: 'pa_size',
        variation: true,
        options: ['1"', '1.5"', '2"']
      }
    ],
    images: [{ src: 'https://example.com/union-nut.jpg' }]
  },
  {
    id: 2,
    name: 'Union Nut 1"',
    type: 'variation',
    sku: '13H-100',
    parent: 1,
    price: '42.00',
    stock_quantity: 25,
    attributes: [
      {
        name: 'Size',
        slug: 'pa_size',
        options: ['1"']
      }
    ]
  },
  {
    id: 3,
    name: 'Union Nut 1.5"',
    type: 'variation',
    sku: '13H-150',
    parent: 1,
    price: '45.00',
    stock_quantity: 15,
    attributes: [
      {
        name: 'Size',
        slug: 'pa_size',
        options: ['1-1/2"']
      }
    ]
  },
  {
    id: 4,
    name: 'Union Nut 2"',
    type: 'variation',
    sku: '13H-200',
    parent: 1,
    price: '48.00',
    stock_quantity: 10,
    attributes: [
      {
        name: 'Size',
        slug: 'pa_size',
        options: ['2"']
      }
    ]
  }
] as any

try {
  const result = transformer.transformProductFamily(unionNutFamily, testSalesChannelId, testInventoryLocationId)
  console.log('✅ Result count:', result.length)
  console.log('✅ Product title:', result[0].title)
  console.log('✅ Options:', result[0].options)
  console.log('✅ Variants count:', result[0].variants.length)
  console.log('✅ First variant:', result[0].variants[0])
  console.log('✅ Should show: 1 product with Size option and 3 variants\n')
} catch (error) {
  console.log('❌ Error:', (error as Error).message)
}

// Test 2: Parent with multiple attributes (Size + Alloy)
console.log('Test 2: Parent with multiple attributes (Size + Alloy)')
const elbowFamily = [
  {
    id: 5,
    name: 'Elbow Fitting',
    type: 'variable',
    sku: '14A',
    price: '65.00',
    attributes: [
      {
        id: 10,
        name: 'Size',
        slug: 'pa_size',
        variation: true,
        options: ['1"', '2"']
      },
      {
        id: 11,
        name: 'Alloy',
        slug: 'pa_alloy',
        variation: true,
        options: ['T304', 'T316']
      }
    ]
  },
  {
    id: 6,
    name: 'Elbow Fitting 1" T304',
    type: 'variation',
    sku: '14A-100-T304',
    parent: 5,
    price: '62.00',
    stock_quantity: 20,
    attributes: [
      { name: 'Size', slug: 'pa_size', options: ['1"'] },
      { name: 'Alloy', slug: 'pa_alloy', options: ['T304'] }
    ]
  },
  {
    id: 7,
    name: 'Elbow Fitting 2" T316',
    type: 'variation',
    sku: '14A-200-T316',
    parent: 5,
    price: '75.00',
    stock_quantity: 8,
    attributes: [
      { name: 'Size', slug: 'pa_size', options: ['2"'] },
      { name: 'Alloy', slug: 'pa_alloy', options: ['T316'] }
    ]
  }
] as any

try {
  const result = transformer.transformProductFamily(elbowFamily, testSalesChannelId, testInventoryLocationId)
  console.log('✅ Result count:', result.length)
  console.log('✅ Options count:', result[0].options.length)
  console.log('✅ Option names:', result[0].options.map(o => o.title))
  console.log('✅ Variants count:', result[0].variants.length)
  console.log('✅ Should show: 1 product with Size & Alloy options and 2 variants\n')
} catch (error) {
  console.log('❌ Error:', (error as Error).message)
}

// Test 3: Parent with no variation attributes (should handle gracefully)
console.log('Test 3: Parent with no variation attributes')
const noVariationAttributes = [
  {
    id: 8,
    name: 'Tee Fitting',
    type: 'variable',
    sku: '15B',
    attributes: [
      {
        name: 'Material',
        slug: 'pa_material',
        variation: false, // NOT a variation attribute
        options: ['Stainless Steel']
      }
    ]
  },
  {
    id: 9,
    name: 'Tee Fitting 1"',
    type: 'variation',
    sku: '15B-100',
    parent: 8,
    price: '55.00'
  }
] as any

try {
  const result = transformer.transformProductFamily(noVariationAttributes, testSalesChannelId, testInventoryLocationId)
  console.log('✅ Result count:', result.length)
  console.log('✅ Should show: Error or fallback handling for no variation attributes\n')
} catch (error) {
  console.log('✅ Expected error:', (error as Error).message)
}
