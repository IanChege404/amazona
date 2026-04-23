'use client'
import { ChevronUp } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

import { Button } from '@/components/ui/button'
import useSettingStore from '@/hooks/use-setting-store'
import { Select, SelectContent, SelectItem, SelectTrigger } from '../ui/select'

import { SelectValue } from '@radix-ui/react-select'
import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/routing'
import { i18n } from '@/i18n-config'

export default function Footer() {
  const router = useRouter()
  const pathname = usePathname()
  const {
    setting: {
      site,
      availableCurrencies,
      availableLanguages,
      currency,
      footerSections,
    },
    setCurrency,
  } = useSettingStore()
  const sections = footerSections ?? []
  const languageOptions = (availableLanguages ?? []).map((lang) => ({
    ...lang,
    icon: i18n.locales.find((locale) => locale.code === lang.code)?.icon || '🌐',
  }))

  const locale = useLocale()
  const t = useTranslations()
  return (
    <footer className='bg-black  text-white underline-link'>
      <div className='w-full'>
        <Button
          variant='ghost'
          className='bg-gray-800 w-full  rounded-none '
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <ChevronUp className='mr-2 h-4 w-4' />
          {t('Footer.Back to top')}
        </Button>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 p-6 max-w-7xl mx-auto'>
          {sections.map((section) => (
            <div key={section.title}>
              <h3 className='font-bold mb-2'>{section.title}</h3>
              <ul className='space-y-2'>
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}>{link.name}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className='border-t border-gray-800'>
          <div className='max-w-7xl mx-auto py-8 px-4 flex flex-col items-center space-y-4'>
            <div className='flex items-center space-x-4 flex-wrap md:flex-nowrap'>
              <Image
                src={site.logo}
                alt={`${site.name} logo`}
                width={48}
                height={48}
                className='w-14'
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                }}
              />{' '}
              <Select
                value={locale}
                onValueChange={(value) => {
                  router.push(pathname, { locale: value })
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('Footer.Select a language')} />
                </SelectTrigger>
                <SelectContent>
                  {languageOptions.map((lang, index) => (
                    <SelectItem key={index} value={lang.code}>
                      <Link
                        className='w-full flex items-center gap-1'
                        href={pathname}
                        locale={lang.code}
                      >
                        <span className='text-lg'>{lang.icon}</span> {lang.name}
                      </Link>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={currency}
                onValueChange={(value) => {
                  setCurrency(value)
                  window.scrollTo(0, 0)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('Footer.Select a currency')} />
                </SelectTrigger>
                <SelectContent>
                  {availableCurrencies
                    .filter((x) => x.code)
                    .map((currency, index) => (
                      <SelectItem key={index} value={currency.code}>
                        {currency.name} ({currency.code})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
      <div className='p-4'>
        <div className='flex justify-center  gap-3 text-sm'>
          <Link href='/page/conditions-of-use'>
            {t('Footer.Conditions of Use')}
          </Link>
          <Link href='/page/privacy-policy'>{t('Footer.Privacy Notice')}</Link>
          <Link href='/page/help'>{t('Footer.Help')}</Link>
        </div>
        <div className='flex justify-center text-sm'>
          <p> © {site.copyright}</p>
        </div>
        <div className='mt-8 flex justify-center text-sm text-gray-400 text-center px-4'>
          {site.address} | {site.phone} | {site.email}
        </div>
      </div>
    </footer>
  )
}
