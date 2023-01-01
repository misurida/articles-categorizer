import { Box, Button, Group, Paper, Popover, ScrollArea, Tabs, Title, Text, createStyles, Stack, Radio, Tooltip } from "@mantine/core";
import { IconCalculator } from "@tabler/icons";
import { format } from "date-fns";
import { Article, Category } from "../utils/types";
import { useState, useMemo } from "react";
import { computeScores, computeSectionScore, countFrequencies, fuzeOptions, getSectionSummary } from "../utils/keywords_handler";
import { useDatabase } from "../hooks/useDatabase";
import Fuse from "fuse.js";
import { maxDecimal } from "../utils/helpers";


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
      fontWeight: "normal",
      textDecoration: "underline",
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
  computedTable: {
    "td": {
      minWidth: 10,
      paddingLeft: 10
    },
    "tr": {
      "&:hover": {
        background: theme.colorScheme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"
      }
    }
  },
  bb: {
    borderBottom: `thin solid ${theme.colorScheme === "dark" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"}`
  },
  freqCols: {
    display: "grid",
    gridTemplateColumns: "repeat( auto-fit, minmax(200px, 1fr) )",
  },
  comparativePanel: {
    display: "flex",
    flexWrap: "wrap",
    gap: "2em",
    marginBottom: "2em",
    "& > *:first-of-type": {
      flex: 5,
    }
  },
  comparativeCounts: {
    "td": {
      minWidth: 20
    }
  },
  centeredCheckbox: {
    "& > *": {
      display: "block",
      marginTop: 3
    }
  },
  sepStat: {
    borderRight: `thin solid ${theme.colorScheme === "dark" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"}`,
    paddingRight: 10
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
  focusOn?: Category
  onFocus?: (category?: Category) => void
}) {

  const { classes, cx } = useStyles()

  const onCheck = (key: string) => {
    if (props.onFocus) {
      const cat = props.categories.find(c => c.key === key)
      props.onFocus(cat)
    }
  }

  return (
    <table className={cx(classes.table, classes.lightTable)}>
      <thead>
        <tr>
          <th>Category</th>
          <th>Score</th>
        </tr>
      </thead>
      <tbody>
        {props.scores && Object.keys(props.scores).map((e, i) => (
          <tr key={e}>
            {props.onFocus && (
              <td className={classes.centeredCheckbox}>
                <Radio size="sm" checked={props.focusOn?.key === e} onChange={(event) => onCheck(e)} />
              </td>
            )}
            <th scope="row" onClick={() => onCheck(e)}>
              <Text>{e}</Text>
            </th>
            <td style={{ paddingLeft: "1em" }}>
              <Text>{maxDecimal(Object.values(props.scores)[i])}</Text>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function ComputedScoresRow(props: {
  scores?: Record<string, number>
  category: Category
  article?: Article
  onFocus: (category?: Category) => void
  focusOn?: Category
  onCheck: (category?: Category) => void
}) {

  const { classes } = useStyles()

  const titleSummary = useMemo(() => {
    return computeSectionScore(props.article?.out?.process_sections?.title?.split(" ") || [], props.category.rules)
  }, [props.article, props.category])

  const bodySummary = useMemo(() => {
    return computeSectionScore(props.article?.out?.process_sections?.body?.split(" ") || [], props.category.rules)
  }, [props.article, props.category])

  return (
    <tr onClick={() => props.onCheck(props.category)} >
      <td className={classes.centeredCheckbox}>
        <Radio
          size="xs"
          checked={props.focusOn?.key === props.category.key}
          onChange={(event) => props.onCheck(props.category)}
        />
      </td>
      <th scope="row" style={{ cursor: "pointer" }}>
        <Text>{props.category.key}</Text>
      </th>
      <td style={{ paddingLeft: "1em" }}>
        <Text>{maxDecimal(props.scores?.[props.category.key] || 0)}</Text>
      </td>
      <td style={{ padding: "0 1em" }} className={classes.sepStat}>
        <Text>{maxDecimal(titleSummary.l)}</Text>
      </td>
      <td><Tooltip label="Z" withArrow><Text>{maxDecimal(titleSummary.z)}</Text></Tooltip></td>
      <td><Tooltip label="F total" withArrow><Text>{maxDecimal(titleSummary.f_total)}</Text></Tooltip></td>
      <td><Tooltip label="F unique" withArrow><Text>{maxDecimal(titleSummary.f_unique)}</Text></Tooltip></td>
      <td className={classes.sepStat}><Tooltip label="F agg" withArrow><Text>{maxDecimal(titleSummary.f_agg)}</Text></Tooltip></td>
      <td><Tooltip label="Z" withArrow><Text>{maxDecimal(bodySummary.z)}</Text></Tooltip></td>
      <td><Tooltip label="F total" withArrow><Text>{maxDecimal(bodySummary.f_total)}</Text></Tooltip></td>
      <td><Tooltip label="F unique" withArrow><Text>{maxDecimal(bodySummary.f_unique)}</Text></Tooltip></td>
      <td><Tooltip label="F agg" withArrow><Text>{maxDecimal(bodySummary.f_agg)}</Text></Tooltip></td>
    </tr>
  )
}

export function ComputedScoresTable(props: {
  scores?: Record<string, number>
  categories: Category[]
  article?: Article
  focusOn?: Category
  onFocus: (category?: Category) => void
}) {

  const { classes, cx } = useStyles()

  const onCheck = (key: string) => {
    if (props.onFocus) {
      const cat = props.categories.find(c => c.key === key)
      props.onFocus(cat)
    }
  }

  return (
    <table className={cx(classes.table, classes.lightTable, classes.computedTable)}>
      <thead>
        <tr>
          <th></th>
          <th>Category</th>
          <th style={{ textAlign: "center" }}>Score</th>
          <th style={{ textAlign: "center" }}>L</th>
          <th colSpan={4} style={{ textAlign: "center" }}>Title</th>
          <th colSpan={4} style={{ textAlign: "center" }}>Body</th>
        </tr>
      </thead>
      <tbody>
        {props.categories.map((e, i) => (
          <ComputedScoresRow
            scores={props.scores}
            article={props.article}
            onCheck={c => onCheck(c?.key || "")}
            category={e}
            focusOn={props.focusOn}
            key={e.id}
            onFocus={props.onFocus}
          />
        ))}
      </tbody>
    </table>
  )
}


export default function ArticleDetails(props: {
  article?: Article
}) {

  const { dataset } = useDatabase()
  const { classes } = useStyles()
  const [loading, setLoading] = useState(false)
  const [computedScore, setComputedScore] = useState<Record<string, number>>({})
  const [localCategory, setLocalCategory] = useState<Category | undefined>()

  const titleStats = useMemo<any>(() => {
    if (props.article) {
      return getSectionSummary(props.article?.out.process_sections.title.split(" "))
    }
    return {}
  }, [props.article])

  const bodyStats = useMemo<any>(() => {
    if (props.article) {
      return getSectionSummary(props.article?.out.process_sections.body.split(" "))
    }
    return {}
  }, [props.article])

  const runComputation = () => {
    if (props.article?.id) {
      const scoresComputed = computeScores(props.article, dataset?.categories || [])
      setComputedScore(scoresComputed)
    }
  }

  const toggleLocalCategory = (category?: Category) => {
    if (localCategory && category && localCategory?.id === category?.id) {
      setLocalCategory(undefined)
    }
    else {
      setLocalCategory(category)
    }
  }

  return (
    <Box>
      <Paper>
        <Tabs defaultValue="details">
          <Tabs.List>
            <Tabs.Tab value="details">Details</Tabs.Tab>
            <Tabs.Tab value="content">Title & Body</Tabs.Tab>
            <Tabs.Tab value="wfreq">Words frequencies</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="details" pt="xs">
            <table className={classes.table}>
              <tbody>
                <tr><th scope="row"><Text>Title</Text></th><td><Text>{props.article?.std?.title}</Text></td></tr>
                {props.article?.std?.publication_datetime && <tr><th scope="row"><Text>Publication</Text></th><td><Text>{format(new Date(props.article?.std?.publication_datetime), "PPpp")}</Text></td></tr>}
                <tr><th scope="row"><Text>Lang code</Text></th><td><Text>{props.article?.std?.lang_code}</Text></td></tr>
                <tr><th scope="row"><Text>Url</Text></th><td><Text><a href={props.article?.std?.url}>{props.article?.std?.url}</a></Text></td></tr>
                <tr><th scope="row"><Text>Publisher name</Text></th><td><Text>{props.article?.non_std?.publisher_name}</Text></td></tr>
                <tr><th scope="row"><Text>Source name</Text></th><td><Text>{props.article?.non_std?.source_name}</Text></td></tr>
              </tbody>
            </table>
          </Tabs.Panel>
          <Tabs.Panel value="content" pt="xs">
            <table className={classes.table}>
              <tbody>
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
                <tr><th className={classes.bb} scope="row"><Text>Processed title</Text></th><td className={classes.bb}><Text>{props.article?.out.process_sections.title}</Text></td></tr>
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
                  <th scope="row"><Text>Processed body</Text></th>
                  <td>
                    <Text>{props.article?.out.process_sections.body}</Text>
                  </td>
                </tr>
              </tbody>
            </table>
          </Tabs.Panel>
          <Tabs.Panel value="wfreq" pt="xs">
            <div className={classes.freqCols}>
              <div>
                <Text>Title</Text>
                <Text size="sm"><pre>{JSON.stringify(titleStats.map, null, 4)}</pre></Text>
              </div>
              <div>
                <Text>Body</Text>
                <Text size="sm"><pre>{JSON.stringify(bodyStats.map, null, 4)}</pre></Text>
              </div>
            </div>
          </Tabs.Panel>
        </Tabs>
      </Paper>

      <Group my="md" align="center">
        <Title order={4}>Relevance scores</Title>
        <Button loading={loading} ml="auto" compact variant="light" leftIcon={<IconCalculator size={16} />} onClick={runComputation}>Compute scores</Button>
      </Group>

      <Tabs defaultValue="classic">
        <Tabs.List>
          <Tabs.Tab value="classic">Classic</Tabs.Tab>
          <Tabs.Tab value="advanced">Advanced</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="classic" pt="xs">
          <Group align="flex-start">
            <ScoresTable
              scores={props.article?.out.classify_categories.relevance_scores || {}}
              categories={dataset?.categories || []}
              article={props.article}
            />
            {Object.keys(computedScore).length > 0 && (
              <ScoresTable
                scores={computedScore}
                categories={dataset?.categories || []}
                article={props.article}
              />
            )}
          </Group>
        </Tabs.Panel>

        <Tabs.Panel value="advanced" pt="xs">
          <Paper withBorder p={5}>
            {!!localCategory && (
              <div className={classes.comparativePanel}>
                <Stack>
                  <Text size="sm">{props.article?.out.process_sections.title}</Text>
                  <Text size="sm">{props.article?.out.process_sections.body}</Text>
                </Stack>
                <Box className={classes.comparativeCounts}>
                  <CategoryPreview
                    category={localCategory}
                    article={props.article}
                  />
                </Box>
              </div>
            )}
            <Group align="flex-start">
              <ComputedScoresTable
                categories={dataset?.categories || []}
                article={props.article}
                focusOn={localCategory}
                onFocus={toggleLocalCategory}
                scores={computedScore}
              />
            </Group>
          </Paper>
        </Tabs.Panel>

      </Tabs>


    </Box>
  )
}

