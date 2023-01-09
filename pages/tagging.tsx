
import { ActionIcon, Box, Group, Paper, ScrollArea, Stack, Tooltip, createStyles, Text, Tabs, Button, SystemProp, SpacingValue, Checkbox, Collapse, Popover, Switch, Input, SegmentedControl } from '@mantine/core'
import { NextPage } from 'next'
import { useAuth } from '../hooks/useAuth'
import { useDatabase } from '../hooks/useDatabase'
import { Article, ArticleListAction, ArticleSection, TagsParameters, TextPart } from '../utils/types'
import { IconCheck, IconChevronDown, IconChevronLeft, IconChevronRight, IconCross, IconLayoutSidebarRightCollapse, IconLayoutSidebarRightExpand, IconX } from '@tabler/icons'
import { useEffect, useMemo, useState } from 'react'
import ArticlesList from '../components/ArticlesList'
import HighlightableText from '../components/HighlightableText'
import TagsSelector from '../components/TagsSelector'
import { uuidv4 } from '../utils/helpers'
import { showNotification } from '@mantine/notifications'

const useStyles = createStyles((theme) => ({
  span: {
    display: "inline",
    position: "relative"
  },
  mainGrid: {
    height: "100%",
    display: "flex",
    flexWrap: "wrap",
    gap: "1em",
    [`@media (max-width: ${theme.breakpoints.lg}px)`]: {
      // Type safe child reference in nested selectors via ref
      flexDirection: "column"
    },
  },
  categoriesWrapper: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
  },
  articlesWrapper: {
    flex: 1,
    minHeight: 500,
    display: "flex",
    flexDirection: "column",
    transition: "width 1s"
  },
  table: {
    "th": {
      paddingRight: 10
    },
    "th, td": {
      verticalAlign: "top"
    }
  },
  checkbox: {
    display: "flex",
    alignItems: "center"
  },
  clickableCell: {
    cursor: "pointer",
    userSelect: "none"
  },
  noSel: {
    userSelect: "none"
  },
  collapsed: {

  }
}));



export function ArticlesNavbar(props: {
  mb?: SystemProp<SpacingValue>
  mt?: SystemProp<SpacingValue>
  onCollapse: () => void
  collapsed?: boolean
}) {

  const { classes } = useStyles()
  const { articles, selectedArticles, setSelectedArticles, filteredArticles, selectedArticle, setSelectedArticle } = useDatabase()

  const indexInList = useMemo(() => filteredArticles.findIndex(a => a.id === selectedArticle?.id), [filteredArticles, selectedArticle])
  const indexInSelection = useMemo(() => selectedArticles.findIndex(a => a === selectedArticle?.id), [selectedArticles, selectedArticle])

  const handlePreviousInList = () => {
    const index = filteredArticles.findIndex(a => a.id === selectedArticle?.id)
    if (index > 0) {
      const selArt = filteredArticles[index - 1]
      setSelectedArticle(selArt)
      if (selectedArticles.length <= 1) {
        setSelectedArticles([selArt.id])
      }
    }
    else if (filteredArticles.length > 0) {
      setSelectedArticles([filteredArticles[0].id])
    }
  }

  const handleNextInList = () => {
    const index = filteredArticles.findIndex(a => a.id === selectedArticle?.id)
    if (index >= 0) {
      const selArt = filteredArticles[index + 1]
      setSelectedArticle(selArt)
      if (selectedArticles.length <= 1) {
        setSelectedArticles([selArt.id])
      }
    }
    else if (filteredArticles.length > 0) {
      setSelectedArticles([filteredArticles[0].id])
    }
  }

  const handlePreviousInSelection = () => {
    if (indexInSelection < 0 && selectedArticles.length > 0) {
      setSelectedArticle(articles.find(a => a.id === selectedArticles[selectedArticles.length - 1]))
    }
    else if (indexInSelection > 0) {
      setSelectedArticle(articles.find(a => a.id === selectedArticles[indexInSelection - 1]))
    }
  }

  const handleNextInSelection = () => {
    if (indexInSelection < 0 && selectedArticles.length > 0) {
      setSelectedArticle(articles.find(a => a.id === selectedArticles[0]))
    }
    else if (indexInSelection < selectedArticles.length - 1) {
      setSelectedArticle(articles.find(a => a.id === selectedArticles[indexInSelection + 1]))
    }
  }

  const cancelSelection = () => {
    setSelectedArticles([])
  }



  if (!articles.length || !selectedArticle) {
    return null
  }

  return (
    <Paper py={6} px="xs" withBorder mb={props.mb} mt={props.mt}>
      <Group position="right" spacing={5}>
        {selectedArticles.length > 1 && (
          <Group spacing={5}>
            <ActionIcon size="sm" variant="light" color="primary" onClick={handlePreviousInSelection}>
              <IconChevronLeft size={16} />
            </ActionIcon>
            <Tooltip withArrow label="Selection" openDelay={500}>
              <Text size="xs" className={classes.noSel}>{indexInSelection + 1} / {selectedArticles.length}</Text>
            </Tooltip>
            <ActionIcon size="sm" variant="light" color="primary" onClick={handleNextInSelection}>
              <IconChevronRight size={16} />
            </ActionIcon>
            <Tooltip withArrow label="Cancel selection" openDelay={500}>
              <ActionIcon size="sm" variant="subtle" color="primary" onClick={cancelSelection}>
                <IconX size={12} />
              </ActionIcon>
            </Tooltip>
          </Group>
        )}
        <Group spacing={5}>
          <ActionIcon size="sm" variant="light" onClick={handlePreviousInList} disabled={indexInList === 0}>
            <IconChevronLeft size={16} />
          </ActionIcon>
          <Tooltip withArrow label="Articles list" openDelay={500}>
            <Text size="xs" className={classes.noSel}>{indexInList + 1} / {filteredArticles.length}</Text>
          </Tooltip>
          <ActionIcon size="sm" variant="light" onClick={handleNextInList} disabled={indexInList >= filteredArticles.length - 1}>
            <IconChevronRight size={16} />
          </ActionIcon>
        </Group>
        <ActionIcon size="sm" variant="outline" onClick={props.onCollapse} disabled={indexInList >= filteredArticles.length - 1}>
          {props.collapsed ? <IconLayoutSidebarRightExpand size={16} /> : <IconLayoutSidebarRightCollapse size={16} />}
        </ActionIcon>
      </Group>
    </Paper>
  )
}



const TaggingPage: NextPage = () => {

  const {
    dataset,
    articles,
    selectedArticles,
    selectedArticle,
    setSelectedArticle,
    categories,
    updateArticles,
    tagsParameters,
    setTagsParameters
  } = useDatabase()
  const { user } = useAuth()
  const { classes, cx } = useStyles()
  const [tagsValue, setTagsValue] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<ArticleSection | null>('processed');
  const [collapseArticleList, setCollapseArticleList] = useState(false)
  const [showHighlightPopover, setShowHighlightPopover] = useState(false)
  const [showOptions, setShowOptions] = useState(false)

  useEffect(() => {
    setTagsValue(selectedArticle?.tags || [])
  }, [selectedArticle])

  const parts = useMemo<TextPart[]>(() => {
    const keywords: TextPart[] = []
    for (let i = 0; i < categories.length; i++) {
      const c = categories[i]
      if (c.quick_keywords && c.quick_keywords.length > 0) {
        c.quick_keywords.forEach(k => {
          if (k) {
            keywords.push({
              text: k,
              id: uuidv4(),
              categoryKey: c.key,
              type: "keyword"
            })
          }
        })
      }
    }
    const extracts: TextPart[] = (selectedArticle?.extracts || []).map(e => ({ ...e, id: uuidv4(), type: "extract" }))
    return [...keywords, ...extracts]
  }, [categories, selectedArticle])

  const onAction = (action: ArticleListAction, item: Article, e: React.MouseEvent) => {
    if (action === "click" && e.altKey || action === "details") {
      setSelectedArticle(item)
    }
    else if (action === "check" && !selectedArticles.length && !e.ctrlKey) {
      setSelectedArticle(item)
    }
    else if (action === "select") {
      if (selectedArticle?.id === item.id) {
        setSelectedArticle(undefined)
      }
      else {
        setSelectedArticle(item)
      }
    }
  }

  const isPreviewed = (item: Article) => {
    return selectedArticle?.id === item.id
  }

  const onSaveTags = (value: string[], articles?: Article[]) => {
    if (articles && (articles?.length || 0) > 0) {
      const newArticles = articles.map(a => ({ ...a, tags: value }))
      updateArticles(newArticles)
      for (let i = 0; i < newArticles.length; i++) {
        const article = newArticles[i]
        if (article) {
          if (article.id === selectedArticle?.id) {
            setSelectedArticle(article)
          }
        }
      }
      if (articles.length === 1 && !!articles[0]) {
        showNotification({ message: "Article tags updated", color: "green", icon: <IconCheck size={18} /> })
      }
      else if (articles.length > 1) {
        showNotification({ message: `Articles tags updated (${articles.length})`, color: "green", icon: <IconCheck size={18} /> })
      }
    }
  }

  const setParameter = (target: keyof TagsParameters, value: boolean | string) => {
    const p = JSON.parse(JSON.stringify(tagsParameters))
    if (typeof value === "boolean") {
      if (value) p[target] = value
      else if (p[target]) delete p[target]
      else p[target] = value
    }
    else if (typeof value === "string") {
      p[target] = value
    }
    setTagsParameters(p)
  }

  return (
    <Stack sx={{ height: "100%" }}>
      {user?.uid && (
        <div className={classes.mainGrid}>
          {!!dataset && (
            <div className={classes.categoriesWrapper}>
              <Box sx={{ width: "100%" }}>
                <ArticlesNavbar
                  mb={6}
                  onCollapse={() => setCollapseArticleList(v => !v)}
                  collapsed={collapseArticleList}
                />
                {selectedArticle ? (
                  <Paper p="xs" withBorder>
                    <Tabs value={activeTab} onTabChange={v => setActiveTab(v as ArticleSection)}>
                      <Tabs.List>
                        <Tabs.Tab value="processed">Processed</Tabs.Tab>
                        <Tabs.Tab value="default">Original</Tabs.Tab>
                        <Group ml="auto" spacing={5} align="center">
                          <Tooltip label={tagsParameters.highlight ? "Disable highlighting" : "Enable highlighting"} withArrow openDelay={500}>
                            <Box sx={{ cursor: "pointer" }}>
                              <Switch className={classes.checkbox} checked={!!tagsParameters.highlight} onChange={e => setParameter('highlight', e.currentTarget.checked)} />
                            </Box>
                          </Tooltip>
                          <Popover opened={showHighlightPopover} onChange={setShowHighlightPopover} withArrow>
                            <Popover.Target>
                              <Button
                                onClick={() => setShowHighlightPopover(v => !v)}
                                size="sm"
                                color="gray"
                                compact
                                variant="subtle"
                                rightIcon={<IconChevronDown size={14} />}
                              >
                                Highlight
                              </Button>
                            </Popover.Target>
                            <Popover.Dropdown>
                              <Stack spacing={5}>
                                <Switch label="Color" checked={!!tagsParameters.color} onChange={e => setParameter('color', e.currentTarget.checked)} />
                                <Switch label="Background" checked={!!tagsParameters.background} onChange={e => setParameter('background', e.currentTarget.checked)} />
                                <Switch label="Underline" checked={!!tagsParameters.underline} onChange={e => setParameter('underline', e.currentTarget.checked)} />
                              </Stack>
                            </Popover.Dropdown>
                          </Popover>
                          <Popover opened={showOptions} onChange={setShowOptions} withArrow>
                            <Popover.Target>
                              <Button onClick={() => setShowOptions(v => !v)} size="sm" color="gray" compact variant="subtle" rightIcon={<IconChevronDown size={14} />}>Options</Button>
                            </Popover.Target>
                            <Popover.Dropdown>
                              <Stack spacing={5}>
                                <Input.Wrapper label="Text size">
                                  <Stack>
                                    <SegmentedControl
                                      value={tagsParameters.textSize as string || "md"}
                                      onChange={v => setParameter('textSize', v)}
                                      data={[
                                        { label: 'XS', value: 'xs' },
                                        { label: 'SM', value: 'sm' },
                                        { label: 'MD', value: 'md' },
                                        { label: 'LG', value: 'lg' },
                                        { label: 'XL', value: 'xl' },
                                      ]}
                                    />
                                  </Stack>
                                </Input.Wrapper>
                              </Stack>
                            </Popover.Dropdown>
                          </Popover>

                        </Group>
                      </Tabs.List>
                      <Tabs.Panel value="default" mt="xs">
                        <Text weight="bold" mt="md" size="xs" mb={5}>Title</Text>
                        {tagsParameters.highlight ? (
                          <HighlightableText
                            text={selectedArticle.std.title}
                            selectedCategories={tagsValue}
                            parts={parts}
                            parameters={tagsParameters}
                            textSize={tagsParameters.textSize}
                          />
                        ) : (
                          <Text className={classes.span} size={tagsParameters.textSize}>{selectedArticle.std.title}</Text>
                        )}
                        <Text weight="bold" mt="md" size="xs" mb={5}>Body</Text>
                        {tagsParameters.highlight ? (
                          <HighlightableText
                            text={selectedArticle.std.body || ""}
                            selectedCategories={tagsValue}
                            parts={parts}
                            parameters={tagsParameters}
                            textSize={tagsParameters.textSize}
                          />
                        ) : (
                          <Text className={classes.span} size={tagsParameters.textSize}>{selectedArticle.std.body}</Text>
                        )}
                      </Tabs.Panel>
                      <Tabs.Panel value="processed" mt="xs">
                        <Text weight="bold" mt="md" size="xs" mb={5}>Title</Text>
                        {tagsParameters.highlight ? (
                          <HighlightableText
                            text={selectedArticle.out.process_sections.title}
                            selectedCategories={tagsValue}
                            parts={parts}
                            parameters={tagsParameters}
                            textSize={tagsParameters.textSize}
                          />
                        ) : (
                          <Text className={classes.span} size={tagsParameters.textSize}>{selectedArticle.out.process_sections.title}</Text>
                        )}
                        <Text weight="bold" mt="md" size="xs" mb={5}>Body</Text>
                        {tagsParameters.highlight ? (
                          <HighlightableText
                            text={selectedArticle.out.process_sections.body || ""}
                            selectedCategories={tagsValue}
                            parts={parts}
                            parameters={tagsParameters}
                            textSize={tagsParameters.textSize}
                          />
                        ) : (
                          <Text className={classes.span} size={tagsParameters.textSize}>{selectedArticle.out.process_sections.body}</Text>
                        )}
                      </Tabs.Panel>
                    </Tabs>
                    {selectedArticle && (
                      <TagsSelector
                        value={tagsValue}
                        onChange={setTagsValue}
                        onSave={onSaveTags}
                        articleSection={activeTab}
                      />
                    )}
                  </Paper>
                ) : (
                  <Paper p="md" withBorder>
                    <Text>Please select an article...</Text>
                  </Paper>
                )}
                <ArticlesNavbar
                  mt={6}
                  onCollapse={() => setCollapseArticleList(v => !v)}
                  collapsed={collapseArticleList}
                />
              </Box>
            </div>
          )}
          {articles.length > 0 && !collapseArticleList && (
            <div className={cx(classes.articlesWrapper, { [classes.collapsed]: collapseArticleList })}>
              <ArticlesList
                items={articles}
                onAction={onAction}
                actionIcon={null}
                isPreviewed={isPreviewed}
              />
            </div>
          )}
        </div>
      )}
    </Stack>
  )
}

export default TaggingPage