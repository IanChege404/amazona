import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale

  // Ensure that the incoming locale is valid
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale
  }

  let messages

  try {
    messages = (await import(`../messages/${locale}.json`)).default
  } catch {
    messages = (await import('../messages/en-US.json')).default
  }

  return {
    locale,
    messages,
  }
})
