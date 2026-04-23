import fs from 'fs'
import path from 'path'
import data from './lib/data'

const OUTPUT_DIR = './static-data'
const PUBLIC_DIR = './public'

function collectAssetPaths(value: unknown, assets = new Set<string>()) {
  if (typeof value === 'string') {
    if (/^\/(images|icons)\/[^?#]+$/.test(value)) {
      assets.add(value)
    }
    return assets
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectAssetPaths(item, assets)
    }
    return assets
  }

  if (value && typeof value === 'object') {
    for (const item of Object.values(value as Record<string, unknown>)) {
      collectAssetPaths(item, assets)
    }
  }

  return assets
}

function copyAsset(assetPath: string) {
  const sourcePath = path.join(PUBLIC_DIR, assetPath)
  const destinationPath = path.join(OUTPUT_DIR, assetPath)
  const destinationDir = path.dirname(destinationPath)

  if (!fs.existsSync(sourcePath)) {
    console.warn(`⚠️ Missing asset: ${assetPath}`)
    return false
  }

  fs.mkdirSync(destinationDir, { recursive: true })
  fs.copyFileSync(sourcePath, destinationPath)
  return true
}

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  console.log(`📁 Created ${OUTPUT_DIR}`)
}

// Debug: Check what we're actually getting
console.log('\n🔍 Data Debug:')
console.log(`  Users: ${data.users?.length}`)
console.log(`  Products: ${data.products?.length}`)
console.log(`  Reviews: ${data.reviews?.length}`)
console.log(`  Pages: ${data.webPages?.length}`)
console.log(`  Carousels: ${data.carousels?.length}`)
console.log(`  Menus: ${data.headerMenus?.length}`)
console.log(`  Settings: ${data.settings?.length}`)

const assetPaths = [...collectAssetPaths(data)].sort()
console.log(`  Assets: ${assetPaths.length}`)

const collections = {
  users: data.users,
  products: data.products,
  reviews: data.reviews,
  pages: data.webPages,
  carousels: data.carousels,
  menus: data.headerMenus,
  settings: data.settings,
}

let totalRecords = 0
let totalAssets = 0

for (const [name, items] of Object.entries(collections)) {
  if (items && (Array.isArray(items) || typeof items === 'object')) {
    const filePath = path.join(OUTPUT_DIR, `${name}.json`)
    fs.writeFileSync(filePath, JSON.stringify(items, null, 2))
    const count = Array.isArray(items) ? items.length : 1
    totalRecords += count
    console.log(`✅ ${name}.json (${count} records)`)
  } else {
    console.warn(`⚠️ ${name} not found or empty`)
  }
}

for (const assetPath of assetPaths) {
  if (copyAsset(assetPath)) {
    totalAssets += 1
    console.log(`🖼️ ${assetPath}`)
  }
}

const completePath = path.join(OUTPUT_DIR, 'all-data.json')
fs.writeFileSync(completePath, JSON.stringify(data, null, 2))
console.log(`✅ all-data.json (complete export)`)

const summary = {
  exportDate: new Date().toISOString(),
  totalRecords,
  totalAssets,
  collections: {
    users: data.users?.length || 0,
    products: data.products?.length || 0,
    reviews: data.reviews?.length || 0,
    pages: data.webPages?.length || 0,
    carousels: data.carousels?.length || 0,
    menus: data.headerMenus?.length || 0,
    settings: data.settings?.length || 0,
  },
  location: OUTPUT_DIR,
  files: Object.keys(collections).map((name) => `${name}.json`),
  assets: assetPaths,
}

fs.writeFileSync(
  path.join(OUTPUT_DIR, 'summary.json'),
  JSON.stringify(summary, null, 2)
)

console.log(`\n✨ Done! All data saved to: ${OUTPUT_DIR}`)
console.log(JSON.stringify(summary, null, 2))
