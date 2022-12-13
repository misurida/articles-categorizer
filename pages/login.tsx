import { InternationalizationStaticProps } from '../types/shell'
import { Paper, Group, Box, Title } from '@mantine/core'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import AuthForm, { UserInfo } from '../components/structure/user/AuthForm'
import { useTranslation } from 'next-i18next'
import { NextPage } from 'next'
import { useAuth } from '../hooks/useAuth'
import UserForm from '../components/structure/user/UserForm'

export async function getStaticProps({ locale }: InternationalizationStaticProps) {
  return { props: { ...(await serverSideTranslations(locale, ["common"])) } }
}

const LoginPage: NextPage = () => {
  const { t } = useTranslation()
  const { user } = useAuth()

  return (
    <Group position="center">
      <Paper p="md" sx={{ width: "max(200px, 30vw)" }} withBorder>
        {user ? (
          <Box>
            <Title mb="md" order={2}>{t('user_profile')}</Title>
            <UserInfo user={user} />
            <UserForm />
          </Box>
        ) : (
          <Box>
            <Title mb="md" order={2}>{t('authentication')}</Title>
            <AuthForm />
          </Box>
        )}
      </Paper>
    </Group>
  )
}

export default LoginPage