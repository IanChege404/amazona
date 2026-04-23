'use server'
import { ISettingInput } from '@/types'
import Setting from '../db/models/setting.model'
import { connectToDatabase } from '../db'
import { formatError } from '../utils'
import { cookies } from 'next/headers'

const globalForSettings = global as unknown as {
  cachedSettings: ISettingInput | null
}

export const getNoCachedSetting = async (): Promise<ISettingInput> => {
  await connectToDatabase()
  const setting = await Setting.findOne()
  if (!setting) {
    throw new Error('Missing site settings document')
  }
  return JSON.parse(JSON.stringify(setting)) as ISettingInput
}

export const getSetting = async (): Promise<ISettingInput> => {
  if (!globalForSettings.cachedSettings) {
    console.log('hit db')
    await connectToDatabase()
    const setting = await Setting.findOne().lean()
    if (!setting) {
      throw new Error('Missing site settings document')
    }
    globalForSettings.cachedSettings = JSON.parse(JSON.stringify(setting))
  }
  return globalForSettings.cachedSettings as ISettingInput
}

export const getHeaderMenus = async () => {
  const setting = await getSetting()
  return setting.headerMenus ?? []
}

export const updateSetting = async (newSetting: ISettingInput) => {
  try {
    await connectToDatabase()
    const existingSetting = await Setting.findOne().lean()
    const mergedSetting = {
      ...(existingSetting ? JSON.parse(JSON.stringify(existingSetting)) : {}),
      ...newSetting,
    }
    const updatedSetting = await Setting.findOneAndUpdate({}, mergedSetting, {
      upsert: true,
      new: true,
    }).lean()
    globalForSettings.cachedSettings = JSON.parse(
      JSON.stringify(updatedSetting)
    ) // Update the cache
    return {
      success: true,
      message: 'Setting updated successfully',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// Server action to update the currency cookie
export const setCurrencyOnServer = async (newCurrency: string) => {
  'use server'
  const cookiesStore = await cookies()
  cookiesStore.set('currency', newCurrency)

  return {
    success: true,
    message: 'Currency updated successfully',
  }
}
