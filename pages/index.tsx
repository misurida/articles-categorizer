import { InternationalizationStaticProps } from '../types/shell'
import { serverSideTranslations } from "next-i18next/serverSideTranslations"
import { useTranslation } from 'next-i18next'
import { Title, Box, Loader } from '@mantine/core'
import { NextPage } from 'next'
import { useData } from '../hooks/useData'
import { useEffect, useState } from 'react'
import { useCosmos } from '../hooks/useCosmos'
import MantineList from '../components/MantineList'

export async function getStaticProps({ locale }: InternationalizationStaticProps) {
  return { props: { ...(await serverSideTranslations(locale, ["common"])) } }
}

const Home: NextPage = () => {
  const { t } = useTranslation()
  const { articles, init } = useCosmos()

  useEffect(() => {
    init()
  }, [])

  return (
    <Box>
      <Title order={2} mb="md">{t('dashboard')}</Title>
      {articles.length > 0 ? (
        <Box sx={{border: "thin solid #ccc", height: 600}}>
          <MantineList
            height={400}
            items={articles}
          />
        </Box>
      ) : (
        <Loader variant='bars' />
      )}

    </Box>
  )
}

export default Home