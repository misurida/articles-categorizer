import { Popover, ActionIcon, NavLink, Image, Box } from '@mantine/core'
import { useTranslation } from 'next-i18next'
import { IconLanguage } from '@tabler/icons'
import router from 'next/router'
import React from 'react'
import Link from 'next/link'

/**
 * Select used to change the current app language.
 * 
 * @returns 
 */
export default function LanguageSelector() {

  const { t } = useTranslation()

  const getCountryImage = (locale?: string) => {
    if (locale === "fr") return <Image alt="" width={20} src="https://www.worldometers.info/img/flags/fr-flag.gif" />
    if (locale === "en") return <Image alt="" width={20} src="https://www.worldometers.info/img/flags/us-flag.gif" />
    return <IconLanguage size={16} />;
  }

  return (
    <Popover withArrow shadow="md">
      <Popover.Target>
        <ActionIcon size="xl">
          {getCountryImage(router.locale)}
        </ActionIcon>
      </Popover.Target>
      <Popover.Dropdown p={5}>
        <Box>
          <Link href="#" locale="fr" passHref>
            <NavLink icon={getCountryImage("fr")} component="a" href='#' label={t('french')} active={router.locale === 'fr'} />
          </Link>
          <Link href="#" locale="en" passHref>
            <NavLink icon={getCountryImage("en")} component="a" label={t('english')} active={router.locale === 'en'} />
          </Link>
        </Box>
      </Popover.Dropdown>
    </Popover>
  )
}
