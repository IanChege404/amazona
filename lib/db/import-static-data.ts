import { cwd } from 'process'
import path from 'path'
import { promises as fs } from 'fs'
import { loadEnvConfig } from '@next/env'

import { connectToDatabase } from '.'
import User from './models/user.model'
import Product from './models/product.model'
import Review from './models/review.model'
import WebPage from './models/web-page.model'
import Setting from './models/setting.model'
import fallbackData from '../data'

loadEnvConfig(cwd())

type HeaderMenu = {
  name: string
  href: string
}

type FooterLink = {
  name: string
  href: string
}

type FooterSection = {
  title: string
  links: FooterLink[]
}

type StaticDataPayload = {
  users: Record<string, unknown>[]
  products: Record<string, unknown>[]
  reviews: Record<string, unknown>[]
  webPages: Record<string, unknown>[]
  headerMenus?: HeaderMenu[]
  settings: (Record<string, unknown> & {
    headerMenus?: HeaderMenu[]
    footerSections?: FooterSection[]
  })[]
}

const fallbackFooterSections =
  (fallbackData.footerSections as FooterSection[] | undefined) ?? []

const readJsonIfExists = async <T>(filePath: string): Promise<T | null> => {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(content) as T
  } catch {
    return null
  }
}

const readStaticData = async (): Promise<StaticDataPayload> => {
  const staticDataPath = path.join(cwd(), 'static-data', 'all-data.json')
  const fileContent = await fs.readFile(staticDataPath, 'utf-8')
  return JSON.parse(fileContent) as StaticDataPayload
}

const main = async () => {
  const shouldDrop = process.argv.includes('--drop')

  try {
    const staticData = await readStaticData()
    const pagesPath = path.join(cwd(), 'static-data', 'pages.json')
    const pagesFromFile = await readJsonIfExists<Record<string, unknown>[]>(
      pagesPath
    )
    const webPagesToInsert =
      pagesFromFile && pagesFromFile.length > 0
        ? pagesFromFile
        : staticData.webPages

    await connectToDatabase(process.env.MONGODB_URI)

    if (shouldDrop) {
      await Promise.all([
        User.deleteMany({}),
        Product.deleteMany({}),
        Review.deleteMany({}),
        WebPage.deleteMany({}),
        Setting.deleteMany({}),
      ])
    }

    const settingsToInsert = staticData.settings.map((setting) => ({
      ...setting,
      headerMenus: setting.headerMenus ?? staticData.headerMenus ?? [],
      footerSections: setting.footerSections ?? fallbackFooterSections,
    }))

    const [users, products, reviews, webPages, settings] = await Promise.all([
      User.insertMany(staticData.users),
      Product.insertMany(staticData.products),
      Review.insertMany(staticData.reviews),
      WebPage.insertMany(webPagesToInsert),
      Setting.insertMany(settingsToInsert),
    ])

    console.log({
      success: true,
      droppedFirst: shouldDrop,
      counts: {
        users: users.length,
        products: products.length,
        reviews: reviews.length,
        webPages: webPages.length,
        settings: settings.length,
      },
      message: 'Imported static-data/all-data.json successfully',
    })
    process.exit(0)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

main()
