import { InternationalizationStaticProps } from '../types/shell'
import { Paper, Group, Box, Title } from '@mantine/core'
import AuthForm, { UserInfo } from '../components/structure/user/AuthForm'
import { NextPage } from 'next'
import { useAuth } from '../hooks/useAuth'

const LoginPage: NextPage = () => {
  const { user } = useAuth()

  return (
    <Group position="center">
      <Paper p="md" sx={{ width: "max(200px, 30vw)" }} withBorder>
        {user ? (
          <Box>
            <Title mb="md" order={2}>User profile</Title>
            <UserInfo user={user} />
          </Box>
        ) : (
          <Box>
            <Title mb="md" order={2}>Authentication</Title>
            <AuthForm />
          </Box>
        )}
      </Paper>
    </Group>
  )
}

export default LoginPage