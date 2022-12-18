import { InternationalizationStaticProps } from '../types/shell'
import { serverSideTranslations } from "next-i18next/serverSideTranslations"
import { Title, Stack, Grid, Modal, createStyles, Text, Group, Button, Tabs, Popover, ScrollArea, Box, ActionIcon, Menu } from '@mantine/core'
import { NextPage } from 'next'
import { useMemo, useState } from 'react'
import { Article, Category } from '../utils/types'
import { useAuth } from '../hooks/useAuth'
import { useDatabase } from '../hooks/useDatabase'
import { format } from 'date-fns'
import { computeScores, fuzeOptions } from '../utils/keywords_handler'
import { countFrequencies, extractStringsList, getObjectValue, getWordsFrequency } from '../utils/helpers'
import ArticlesList from '../components/ArticlesList'
import CategoriesManager from '../components/CategoriesManager'
import Fuse from 'fuse.js'
import { IconCalculator, IconCloudComputing, IconEye } from '@tabler/icons'
import SimpleList from '../components/SimpleList'
import SelectableList from '../components/SelectableList'

export async function getStaticProps({ locale }: InternationalizationStaticProps) {
  return { props: { ...(await serverSideTranslations(locale, ["common"])) } }
}

const useStyles = createStyles((theme) => ({
  table: {
    borderCollapse: "collapse",
    maxWidth: 800,
    margin: "0 auto",
    "td": {
      minWidth: 50
    },
    "td, th": {
      textAlign: "left",
      padding: 5,
      verticalAlign: "top"
    },
    "th": {
      textAlign: "right",
      whiteSpace: "nowrap",
      fontWeight: "normal",
      "&>*": {
        color: theme.colorScheme === "dark" ? "#c3c3c3" : "#000"
      }
    },
    "a": {
      textDecoration: "underline"
    }
  },
  lightTable: {
    marginTop: "0.5em",
    "th": {
      fontWeight: "normal"
    },
    "th, td": {
      padding: "1px 5px"
    },
    "thead th": {
      fontWeight: "bold",
      opacity: 1
    }
  },
  minimalTable: {
    borderCollapse: "collapse",
    textAlign: "left",
    "th, th *": {
      textAlign: "left"
    },
    "td": {
      padding: "0 5px",
      minWidth: 0,
      "&:not(:first-of-type)": {
        borderLeft: `thin solid ${theme.colorScheme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`
      }
    },
    "tr:not(:last-child)": {
      borderBottom: `thin solid ${theme.colorScheme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`
    }
  },
  bb: {
    borderBottom: `thin solid ${theme.colorScheme === "dark" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"}`
  },
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
    paddingBottom: "2em"
  },
  articlesWrapper: {
    flexGrow: 6,
    flexShrink: 0,
    minHeight: 500
  }
}));


export function CategoryPreview(props: {
  category?: Category
  article?: Article
}) {

  const { classes } = useStyles()

  const titleIndex = useMemo(() => props.article ? new Fuse(props.article.out.process_sections.title.split(" "), fuzeOptions) : null, [props.article])
  const bodyIndex = useMemo(() => props.article ? new Fuse(props.article.out.process_sections.body.split(" "), fuzeOptions) : null, [props.article])

  const countTitleFrequency = (hook: string, returnRes = false, fuzzy = false) => {
    if (props.article && titleIndex) {
      if (!fuzzy) {
        return countFrequencies(hook.split("|"), props.article.out.process_sections.title.split(" "))
      }
      const res = titleIndex.search(hook.split("|").map(e => `"${e}"`).join("|"))
      return returnRes ? res : res.length
    }
    return null
  }

  const countBodyFrequency = (hook: string, returnRes = false, fuzzy = false) => {
    if (props.article && bodyIndex) {
      if (!fuzzy) {
        return countFrequencies(hook.split("|"), props.article.out.process_sections.body.split(" "))
      }
      const res = bodyIndex.search(hook.split("|").map(e => `"${e}"`).join("|"))
      return returnRes ? res : res.length
    }
    return null
  }

  const fuzzy = false

  return (
    <Stack spacing="xs" sx={{ textAlign: "left" }}>
      <Title order={5}>{props.category?.name}</Title>
      <table className={classes.minimalTable}>
        <thead>
          <tr>
            <th><Text size="xs">N°</Text></th>
            <th><Text size="xs">Hook</Text></th>
            <th><Text size="xs"><abbr title="Title frequencies">T</abbr></Text></th>
            <th><Text size="xs"><abbr title="Body frequencies">B</abbr></Text></th>
          </tr>
        </thead>
        <tbody>
          {props.category?.rules?.map((r, i) => (
            <tr key={r.hook}>
              <td><Text size="xs">{i + 1}.</Text></td>
              <td><Text size="xs">{r.hook}</Text></td>
              <td>
                {fuzzy ? (
                  <Popover position="bottom" withArrow shadow="md">
                    <Popover.Target>
                      <Text size="xs">{countTitleFrequency(r.hook, false, fuzzy) as any || null}</Text>
                    </Popover.Target>
                    <Popover.Dropdown>
                      <Text size="sm"><pre>{JSON.stringify((countTitleFrequency(r.hook, true, fuzzy) as any[])?.map(e => e.item), null, 2)}</pre></Text>
                    </Popover.Dropdown>
                  </Popover>
                ) : (
                  <Text size="xs">{countTitleFrequency(r.hook, false, fuzzy) as any || null}</Text>
                )}
              </td>
              <td>
                {fuzzy ? (
                  <Popover position="bottom" withArrow shadow="md">
                    <Popover.Target>
                      <Text size="xs">{countBodyFrequency(r.hook) as any || null}</Text>
                    </Popover.Target>
                    <Popover.Dropdown>
                      <Text size="sm"><pre>{JSON.stringify((countBodyFrequency(r.hook, true) as any[])?.map(e => e.item), null, 2)}</pre></Text>
                    </Popover.Dropdown>
                  </Popover>
                ) : (
                  <Text size="xs">{countBodyFrequency(r.hook) as any || null}</Text>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Stack>
  )
}




export function ScoresTable(props: {
  scores: Record<string, number>
  categories: Category[]
  article?: Article
}) {

  const { classes, cx } = useStyles()

  return (
    <table className={cx(classes.table, classes.lightTable)}>
      <tbody>
        {props.scores && Object.keys(props.scores).map((e, i) => (
          <tr key={e}>
            <th scope="row">
              {props.categories.find(c => c.key === e) ? (
                <Popover position="bottom" withArrow shadow="md">
                  <Popover.Target>
                    <Text sx={{ cursor: "pointer", display: "inline-block" }}>{e}</Text>
                  </Popover.Target>
                  <Popover.Dropdown>
                    <CategoryPreview
                      category={props.categories.find(c => c.key === e)}
                      article={props.article}
                    />
                  </Popover.Dropdown>
                </Popover>
              ) : (
                <Text>{e}</Text>
              )}
            </th>
            <td style={{ paddingLeft: "1em" }}>
              <Text>{Object.values(props.scores)[i]}</Text>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}



const Home: NextPage = () => {

  const { dataset, articles, selectedCategories, toggleCategory, computeArticles, scoreDisplayMode, setScoreDisplayMode } = useDatabase()
  const { user } = useAuth()
  const { classes } = useStyles()
  const [localArticle, setLocalArticle] = useState<Article | undefined>()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<string | null>('original');
  const [computedScore, setComputedScore] = useState<Record<string, number>>({})
  const [load, setLoad] = useState(false)

  const titleStats = useMemo<any>(() => {
    if (localArticle) {
      return getWordsFrequency(localArticle?.out.process_sections.title.split(" "))
    }
    return {}
  }, [localArticle])

  const bodyStats = useMemo<any>(() => {
    if (localArticle) {
      return getWordsFrequency(localArticle?.out.process_sections.body.split(" "))
    }
    return {}
  }, [localArticle])

  const onSelectCategory = (item?: Category) => {
    if (item) {
      toggleCategory(item)
    }
  }

  const onArticleAction = (action: string, item: Article) => {
    if (action === "details") {
      setLocalArticle(item)
      console.log(item)
    }
  }

  const runComputation = () => {
    if (localArticle?.id) {
      setComputedScore(computeScores(localArticle, dataset?.categories || [], true))
    }
  }

  const onComputeAll = async () => {
    setLoad(true)
    await computeArticles()
    setLoad(false)
  }

  return (
    <Stack sx={{ height: "100%" }}>
      {user?.uid && (
        <div className={classes.mainGrid}>
          {!!dataset && (
            <div className={classes.categoriesWrapper}>
              <CategoriesManager
                selection={selectedCategories}
                onSelect={onSelectCategory}
              />
            </div>
          )}
          {articles.length > 0 && (
            <div className={classes.articlesWrapper}>
              <ArticlesList
                title={(
                  <Group>
                    <Title order={2}>Articles</Title>
                    <Group ml="auto">
                      <Menu shadow="md" width={200}>
                        <Menu.Target>
                          <ActionIcon>
                            <IconEye size={16} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Label>Scores display mode</Menu.Label>
                          <Menu.Item color={scoreDisplayMode === undefined ? 'blue' : undefined} onClick={() => setScoreDisplayMode(undefined)} >Auto</Menu.Item>
                          <Menu.Item color={scoreDisplayMode === "legacy" ? 'blue' : undefined} onClick={() => setScoreDisplayMode('legacy')} >Legacy</Menu.Item>
                          <Menu.Item color={scoreDisplayMode === "computed" ? 'blue' : undefined} onClick={() => setScoreDisplayMode('computed')} >Computed</Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                      <Button loading={load} onClick={onComputeAll} leftIcon={<IconCalculator size={16} />} variant='default'>Compute all scores</Button>
                    </Group>
                  </Group>
                )}
                onAction={onArticleAction}
                items={articles.map(a => ({ ...a, _isActive: false }))}
              />
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
        <table className={classes.table}>
          <tbody>
            <tr><th scope="row"><Text>Title</Text></th><td><Text>{localArticle?.std?.title}</Text></td></tr>
            {localArticle?.std?.publication_datetime && <tr><th scope="row"><Text>Publication</Text></th><td><Text>{format(new Date(localArticle?.std?.publication_datetime), "PPpp")}</Text></td></tr>}
            <tr><th scope="row"><Text>Lang code</Text></th><td><Text>{localArticle?.std?.lang_code}</Text></td></tr>
            <tr><th scope="row"><Text>Url</Text></th><td><Text><a href={localArticle?.std?.url}>{localArticle?.std?.url}</a></Text></td></tr>
            <tr><th scope="row"><Text>Publisher name</Text></th><td><Text>{localArticle?.non_std?.publisher_name}</Text></td></tr>
            <tr><th className={classes.bb} scope="row"><Text>Source name</Text></th><td className={classes.bb} ><Text>{localArticle?.non_std?.source_name}</Text></td></tr>
            <tr>
              <th scope="row">
                <Popover position="bottom" width={200} withArrow shadow="md">
                  <Popover.Target>
                    <Text>Title stats</Text>
                  </Popover.Target>
                  <Popover.Dropdown sx={{ textAlign: "left" }}>
                    <Text size="sm"><pre>{JSON.stringify(titleStats.map, null, 4)}</pre></Text>
                  </Popover.Dropdown>
                </Popover>
              </th>
              <td>
                <Group>
                  <Text>Avg freq: {titleStats?.avgFreq?.toFixed(3)}</Text>
                  <Text>Max freq: {titleStats?.maxFreq} {titleStats.maxFreqName && `(${titleStats.maxFreqName})`}</Text>
                  {titleStats?.map && (<Text>Unique words: {Object.keys(titleStats?.map).length}</Text>)}
                </Group>
              </td>
            </tr>
            <tr><th className={classes.bb} scope="row"><Text>Sanitized title</Text></th><td className={classes.bb}><Text>{localArticle?.out.process_sections.title}</Text></td></tr>
            <tr>
              <th scope="row">
                <Popover position="bottom" withArrow shadow="md">
                  <Popover.Target>
                    <Text>Body stats</Text>
                  </Popover.Target>
                  <Popover.Dropdown sx={{ textAlign: "left" }}>
                    <ScrollArea style={{ height: "40vh" }}>
                      <Text size="sm"><pre>{JSON.stringify(bodyStats.map, null, 4)}</pre></Text>
                    </ScrollArea>
                  </Popover.Dropdown>
                </Popover>
              </th>
              <td>
                <Group>
                  <Text>Avg freq: {bodyStats?.avgFreq?.toFixed(3)}</Text>
                  <Text>Max freq: {bodyStats?.maxFreq} {bodyStats.maxFreqName && `(${bodyStats.maxFreqName})`}</Text>
                  {bodyStats?.map && (<Text>Unique words: {Object.keys(bodyStats?.map).length}</Text>)}
                </Group>
              </td>
            </tr>
            <tr>
              <th scope="row"><Text>Sanitized body</Text></th>
              <td>
                <ScrollArea style={{ height: (localArticle?.out?.process_sections?.body?.length || 0) > 500 ? 250 : 80 }}>
                  <Text>{localArticle?.out.process_sections.body}</Text>
                </ScrollArea>
              </td>
            </tr>
          </tbody>
        </table>
        <Group mt="lg" align="center">
          <Text py={6}>Relevance scores</Text>
          {activeTab === "computed" && (
            <Button loading={loading} ml="auto" variant="light" leftIcon={<IconCalculator size={16} />} onClick={runComputation}>Compute scores</Button>
          )}
        </Group>

        <Tabs value={activeTab} onTabChange={setActiveTab} mt="md">

          <Tabs.List>
            <Tabs.Tab value="original">Original scores</Tabs.Tab>
            <Tabs.Tab value="computed">Computed scores</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="original">
            <ScoresTable
              scores={localArticle?.out.classify_categories.relevance_scores || {}}
              categories={dataset?.categories || []}
              article={localArticle}
            />
          </Tabs.Panel>

          <Tabs.Panel value="computed">
            <Group align="flex-start">
              <ScoresTable
                scores={localArticle?.out.classify_categories.relevance_scores || {}}
                categories={dataset?.categories || []}
                article={localArticle}
              />
              <ScoresTable
                scores={computedScore}
                categories={dataset?.categories || []}
                article={localArticle}
              />
            </Group>

          </Tabs.Panel>
        </Tabs>

      </Modal>
    </Stack>
  )
}

export default Home