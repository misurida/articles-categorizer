import '../styles/globals.css'
import { ColorScheme, ColorSchemeProvider, MantineProvider, MantineThemeOverride } from '@mantine/core';
import { useHotkeys, useLocalStorage } from '@mantine/hooks';
import { DatabaseContextProvider } from '../hooks/useDatabase';
import { NotificationsProvider } from '@mantine/notifications';
import { AuthContextProvider } from '../hooks/useAuth';
import { DataContextProvider } from '../hooks/useData';
import { appWithTranslation } from 'next-i18next';
import { AppProps } from 'next/app';
import packageJson from '../package.json'
import PageLayout from '../components/structure/PageLayout';
import Head from 'next/head'
import { FirestoreContextProvider } from '../hooks/useFirestore';


function MyApp({ Component, pageProps }: AppProps) {

  const [colorScheme, setColorScheme] = useLocalStorage<ColorScheme>({
    key: 'mantine-color-scheme',
    defaultValue: 'light',
    getInitialValueInEffect: true,
  });

  const toggleColorScheme = (value?: ColorScheme) => setColorScheme(value || (colorScheme === 'dark' ? 'light' : 'dark'));
  useHotkeys([['mod+J', () => toggleColorScheme()]]);

  const providerTheme: MantineThemeOverride = {
    colorScheme,
    components: {
      Text: {
        styles: (theme) => ({
          root: {
            color: theme.colorScheme === 'dark' ? theme.colors.gray[6] : theme.colors.dark[7]
          },
        })
      },
      Title: {
        styles: (theme) => ({
          root: {
            color: theme.colorScheme === 'dark' ? theme.colors.gray[5] : theme.colors.dark[4]
          },
        })
      }
    }
  }

  return (
    <>
      <Head>
        <title>{packageJson.title}</title>
        <meta name="description" content={packageJson.description} />
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <AuthContextProvider>
        <ColorSchemeProvider colorScheme={colorScheme} toggleColorScheme={toggleColorScheme}>
          <MantineProvider theme={providerTheme}>
            <NotificationsProvider>
              <DatabaseContextProvider>
                <PageLayout>
                  <Component {...pageProps} />
                </PageLayout>
              </DatabaseContextProvider>
            </NotificationsProvider>
          </MantineProvider>
        </ColorSchemeProvider>
      </AuthContextProvider>
    </>
  )
}

export default appWithTranslation(MyApp)