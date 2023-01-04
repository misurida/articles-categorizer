import { InternationalizationStaticProps } from '../types/shell'
import { Stack, Modal, createStyles, Group, Button, Tabs } from '@mantine/core'
import { NextPage } from 'next'
import { useState } from 'react'
import { Article } from '../utils/types'
import { useAuth } from '../hooks/useAuth'
import { useDatabase } from '../hooks/useDatabase'
import ArticlesList from '../components/ArticlesList'
import CategoriesManager from '../components/CategoriesManager'
import { IconCalculator, IconCheck } from '@tabler/icons'
import ArticleDetails from '../components/ArticleDetails'
import KeywordsList from '../components/KeywordsList'
import { showNotification, updateNotification } from '@mantine/notifications'
import { differenceInSeconds, intervalToDuration } from 'date-fns'

const useStyles = createStyles((theme) => ({
  mainGrid: {
    height: "100%",
    display: "flex",
    flexWrap: "wrap",
  },
  categoriesWrapper: {
    flexGrow: 2,
    flexShrink: 2,
    display: "flex",
    justifyContent: "center",
  },
  articlesWrapper: {
    flexGrow: 6,
    flexShrink: 0,
    minHeight: 500,
    display: "flex",
    flexDirection: "column"
  },
  tabsWrapper: {
    flex: 1,
    display: "flex",
    flexDirection: "column"
  },
  tabFlex: {
    flex: 1
  }
}));



const Home: NextPage = () => {

  const { dataset, articles, selectedCategories, computeArticles, computeWordsFrequencies, filterBy, setScoreDisplaySource, scoresThresholds, scoreDisplaySource } = useDatabase()
  const { user } = useAuth()
  const { classes } = useStyles()
  const [localArticle, setLocalArticle] = useState<Article | undefined>()
  const [activeTab, setActiveTab] = useState<string | null>('articles');
  const [frequencyLoad, setFrequencyLoad] = useState(false)
  const [articlesLoad, setArticlesLoad] = useState(false)

  const onArticleAction = (action: string, item: Article) => {
    if (action === "details") {
      setLocalArticle(item)
      console.log(item)
    }
  }

  const onComputeAll = async () => {
    setArticlesLoad(true)
    showNotification({
      id: "compute-scores",
      loading: true,
      message: "Processing scores...",
      autoClose: false,
      disallowClose: true,
    })
    const start = new Date()
    const interval = setInterval(() => {
      updateNotification({
        id: "compute-scores",
        loading: true,
        message: `Processing scores... ${computeElapsedTime(start)}`,
        autoClose: false,
        disallowClose: true,
      })
    }, 1000)
    await computeArticles()
    clearInterval(interval)
    setArticlesLoad(false)
    updateNotification({
      id: "compute-scores",
      loading: false,
      message: `Scores processed! ${computeElapsedTime(start)}`,
      color: "green",
      icon: <IconCheck size={18} />,
      autoClose: computeElapsedSeconds(start) < 10,
    })
    setScoreDisplaySource("computed")
  }

  const computeElapsedTime = (base?: Date) => {
    if (!base) {
      return "..."
    }
    const diff = intervalToDuration({
      start: base,
      end: new Date()
    })
    if ((diff.hours || 0) > 0) {
      return `${diff.hours}:${diff.minutes?.toString().padStart(2, "0")}:${diff.seconds?.toString().padStart(2, "0")}`
    }
    return `${diff.minutes?.toString().padStart(2, "0")}:${diff.seconds?.toString().padStart(2, "0")}`
  }

  const computeElapsedSeconds = (base?: Date) => {
    if (!base) {
      return 0
    }
    return differenceInSeconds(base, new Date())
  }

  const onComputeFrequencies = async () => {
    setFrequencyLoad(true)
    showNotification({
      id: "compute-freq",
      loading: true,
      message: "Processing frequencies...",
      autoClose: false,
      disallowClose: true
    })
    const start = new Date()
    const interval = setInterval(() => {
      updateNotification({
        id: "compute-freq",
        loading: true,
        message: `Processing frequencies... ${computeElapsedTime(start)}`,
        autoClose: false,
        disallowClose: true
      })
    }, 1000)
    await computeWordsFrequencies()
    clearInterval(interval)
    setFrequencyLoad(false)
    updateNotification({
      id: "compute-freq",
      loading: false,
      message: `Frequencies processed! ${computeElapsedTime(start)}`,
      color: "green",
      icon: <IconCheck size={18} />,
      autoClose: computeElapsedSeconds(start) < 10,
    })
  }

  return (
    <Stack sx={{ height: "100%" }}>
      {user?.uid && (
        <div className={classes.mainGrid}>
          {!!dataset && (
            <div className={classes.categoriesWrapper}>
              <CategoriesManager
                selection={selectedCategories}
              />
            </div>
          )}
          {articles.length > 0 && (
            <div className={classes.articlesWrapper}>

              <Tabs value={activeTab} onTabChange={setActiveTab} className={classes.tabsWrapper}>
                <Tabs.List sx={{ flexWrap: "wrap", maxWidth: "90vw" }}>
                  <Tabs.Tab value="articles">Articles</Tabs.Tab>
                  <Tabs.Tab value="words">Word frequencies</Tabs.Tab>
                  <Group ml="auto">
                    {activeTab === "articles" && (
                      <Button loading={articlesLoad} onClick={onComputeAll} leftIcon={<IconCalculator size={16} />} variant='subtle'>Compute all scores</Button>
                    )}
                    {activeTab === "words" && (
                      <Button loading={frequencyLoad} onClick={onComputeFrequencies} leftIcon={<IconCalculator size={16} />} variant='subtle'>Compute frequencies</Button>
                    )}
                  </Group>
                </Tabs.List>

                <Tabs.Panel value="articles" pt="xs" className={classes.tabFlex}>
                  <ArticlesList
                    onAction={onArticleAction}
                    items={articles}
                  />
                </Tabs.Panel>

                <Tabs.Panel value="words" pt="xs" className={classes.tabFlex}>
                  <KeywordsList />
                </Tabs.Panel>

              </Tabs>
            </div>
          )}
        </div>
      )}
      <Modal
        opened={!!localArticle?.id}
        onClose={() => setLocalArticle(undefined)}
        title="Article details"
        size="auto"
      >
        <ArticleDetails article={localArticle} />
      </Modal>
    </Stack>
  )
}

export default Home