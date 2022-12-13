import { InternationalizationStaticProps } from '../types/shell'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { Box, Text, Title } from '@mantine/core'
import { useTranslation } from 'next-i18next'
import { NextPage } from 'next'

export async function getStaticProps({ locale }: InternationalizationStaticProps) {
  return { props: { ...(await serverSideTranslations(locale, ["common"])) } }
}

const Page404: NextPage = () => {
  const { t } = useTranslation()

  return (
    <Box>
      <Title>404</Title>
      <Text>{t('page_not_found')}</Text>
    </Box>
  )
}

export default Page404