import { AppShell, Group, Header, Navbar, Title, Burger, MediaQuery, useMantineTheme, Box, Stack, Text } from '@mantine/core';
import { IconHome, IconUpload } from '@tabler/icons';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router'
import { useAuth } from '../../hooks/useAuth';
import { MenuLink } from '../../types/shell';
import NavigationMenu from './parts/MenuNested';
import HeaderActions from './parts/HeaderActions';

/**
 * Lateral menu items
 */
export const lateralMenu: MenuLink[] = [
  { icon: <IconHome size={16} />, to: "/", label: 'dashboard' },
  { auth: true, icon: <IconUpload size={16} />, to: "/uploads", label: 'uploads' },
];

/**
 * Header menu items
 */
export const headerMenu: MenuLink[] = [];

/**
 * Page layout representing the page structure: header, navbar, etc.
 * 
 * @param props 
 * @returns 
 */
export default function PageLayout(props: {
  children?: React.ReactNode
  auth?: boolean
  footer?: React.ReactElement<any, string | React.JSXElementConstructor<any>>
  noBoxWidth?: boolean
}) {

  const theme = useMantineTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [opened, setOpened] = useState(false);

  // auth route guard
  useEffect(() => {
    const routeDefinition = lateralMenu.find(l => l.to === router.route)
    if (!user && (routeDefinition?.auth || props.auth)) {
      router.push('/login')
    }
  }, [router.push, user, router.route, router, props.auth]);


  return (
    <AppShell
      styles={{
        main: {
          background: theme.colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[0],
        },
      }}
      navbarOffsetBreakpoint="sm"
      asideOffsetBreakpoint="sm"
      header={
        <Header height={70} p="md" >
          <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <MediaQuery largerThan="sm" styles={{ display: 'none' }}>
              <Burger
                opened={opened}
                onClick={() => setOpened((o) => !o)}
                size="sm"
                color={theme.colors.gray[6]}
                mr="md"
              />
            </MediaQuery>
            <Group sx={{ width: "100%" }}>
              <Stack mr="lg" spacing={0} onClick={() => router.push('/')} sx={{ cursor: "pointer", transition: "opacity .2s", userSelect: "none", "&:hover": { opacity: 0.5 } }}>
                <Title size="md" order={1}>Effixis</Title>
                <Text size="xs">Articles Categorizer</Text>
              </Stack>
              <MediaQuery smallerThan="sm" styles={{ display: 'none' }}>
                <Box>
                  <NavigationMenu links={headerMenu} horizontal />
                </Box>
              </MediaQuery>
              <MediaQuery smallerThan="sm" styles={{ display: 'none' }}>
                <Box ml="auto">
                  <HeaderActions />
                </Box>
              </MediaQuery>
            </Group>
          </div>
        </Header>
      }
    >
      {props.children}
    </AppShell>
  )
}
