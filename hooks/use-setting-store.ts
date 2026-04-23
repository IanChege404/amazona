/* eslint-disable no-unused-vars */

import { ClientSetting, SiteCurrency } from '@/types'
import { create } from 'zustand'

interface SettingState {
  setting: ClientSetting
  setSetting: (newSetting: ClientSetting) => void
  getCurrency: () => SiteCurrency
  setCurrency: (currency: string) => void
}

const useSettingStore = create<SettingState>((set, get) => ({
  setting: {
    common: {} as ClientSetting['common'],
    site: {} as ClientSetting['site'],
    availableLanguages: [],
    headerMenus: [],
    footerSections: [],
    carousels: [],
    defaultLanguage: '',
    availableCurrencies: [],
    defaultCurrency: '',
    availablePaymentMethods: [],
    defaultPaymentMethod: '',
    availableDeliveryDates: [],
    defaultDeliveryDate: '',
    currency: '',
  } as ClientSetting,
  setSetting: (newSetting: ClientSetting) => {
    set({
      setting: {
        ...newSetting,
        currency: newSetting.currency || get().setting.currency,
      },
    })
  },
  getCurrency: () => {
    return (
      get().setting.availableCurrencies.find(
        (c) => c.code === get().setting.currency
      ) || get().setting.availableCurrencies[0]
    )
  },
  setCurrency: (currency: string) => {
    set({ setting: { ...get().setting, currency } })
  },
}))

export default useSettingStore
