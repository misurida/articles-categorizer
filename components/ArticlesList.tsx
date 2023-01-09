import React, { useCallback, useRef } from 'react';
import { memo, useEffect, useMemo, useState } from 'react';
import memoize from 'memoize-one';
import { FixedSizeList as List, areEqual } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { ActionIcon, Badge, Group, Stack, TextInput, Tooltip, createStyles, Text, Paper, Button, Popover, MediaQuery, Menu, Indicator, Anchor, Slider, CloseButton, ColorSwatch, useMantineTheme, HoverCard, ScrollArea, Checkbox, Box } from '@mantine/core';
import { format } from 'date-fns';
import { Article, ArticleListAction, Category, DisplaySources, ScoreThresholds, ScoresThresholds, TextPart } from '../utils/types';
import { IconChevronDown, IconSearch, IconSortAscending, IconSortDescending, IconViewfinder, IconX, IconZoomCancel } from '@tabler/icons';
import { getScore, passScoreTest, useDatabase } from '../hooks/useDatabase';
import { capitalize, getContrastColor, maxDecimal } from '../utils/helpers';
import FiltersPanel from './FilterPanel';
import { useDebouncedValue } from '@mantine/hooks';
import DisplayOptionsPanel from './DisplayOptionsPanel';

const useStyles = createStyles((theme) => ({
  row: {
    padding: "0 0.5em",
    background: theme.colorScheme === "dark" ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.5)",
    borderBottom: `thin solid ${theme.colorScheme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
    display: "flex",
    alignItems: "center",
    gap: 5,
  },
  title: {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    marginRight: "auto",
    paddingRight: "1em",
    flex: 10,
    textDecoration: "underline",
    textDecorationColor: theme.colorScheme === "dark" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.3)"
  },
  date: {

  },
  main: {
    display: "flex",
    height: "100%",
    gap: 10,
    flexDirection: "column"
  },
  searchInput: {
    flex: 1,
    [`@media (max-width: ${theme.breakpoints.sm}px)`]: {
      // Type safe child reference in nested selectors via ref
      marginBottom: 5
    },
  },
  header: {
    display: "flex",
    gap: 5,
    flexWrap: "wrap",
    [`@media (max-width: ${theme.breakpoints.sm}px)`]: {
      // Type safe child reference in nested selectors via ref
      display: "inline-block",
      textAlign: "right"
    },
  },
  scoreFilterWrapper: {
    display: "grid",
    gridTemplateColumns: "repeat( auto-fit, minmax(400px, 1fr) )",
    gridGap: 5,
    [`@media (max-width: ${theme.breakpoints.sm}px)`]: {
      // Type safe child reference in nested selectors via ref
      maxWidth: "90vw",
    },
  },
  scoreFilter: {
    background: theme.colorScheme === "dark" ? "rgba(0,0,0,0)" : "rgba(255,255,255,1)",
    border: `thin solid ${theme.colorScheme === "dark" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"}`,
    padding: "0.25em 0.5em",
    display: "flex",
    alignItems: "center",
    gap: "0 10px",
    flex: 1,
    flexWrap: "wrap",
    borderRadius: 3,
    flexShrink: 2,
    flexBasis: 200,
    maxWidth: "92vw"
  },
  filterName: {

  },
  filterContent: {
    display: "flex",
    flex: 1,
    width: "100%",
    gap: 10,
    alignItems: "center",
  },
  scoresWrapper: {
    //backgroundColor: theme.colorScheme === "dark" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.05)",
    border: `thin solid ${theme.colorScheme === "dark" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"}`,
    padding: 2,
    borderRadius: 15,
  },
  tagsWrapper: {
    border: `thin solid ${theme.colorScheme === "dark" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"}`,
    padding: 2,
    display: "flex",
    gap: 2
  },
  scoresWrapperGrid: {
    display: "grid",
    "& > *": {
      minWidth: 20
    }
  },
  noPad: {
    padding: "0 2px",
    opacity: 0
  },
  score: {

  },
  customTooltip: {
    display: "flex",
    flexDirection: "column",
    "& > span": {
      fontSize: "1em",
      opacity: 0.8
    },
    "& > span:first-of-type": {
      borderBottom: "thin solid rgba(255,255,255,0.5)",
      fontSize: "1.2em",
      opacity: 1
    }
  },
  noScore: {
    opacity: 0.25
  },
  multiple: {
    position: "relative"
  },
  previewed: {
    position: "relative",
    "&::before": {
      content: "''",
      position: "absolute",
      top: 0,
      left: 0,
      bottom: 0,
      width: 2,
      opacity: 0.75,
      background: theme.colors.blue[8]
    },
  },
  checkbox: {
    display: "flex",
    alignItems: "center",
    cursor: "pointer!important",
  },
  clickSelect: {
    display: "inline-block",
    cursor: "pointer",
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: 8
  },
  tag: {

  },
  extractsCounter: {
    position: "relative",
    overflow: "visible",
    cursor: "pointer",
    marginLeft: 3,
    "&::after": {
      content: "''",
      position: "absolute",
      top: -3,
      left: -3,
      right: -3,
      bottom: -3,
      background: "transparent",
      border: `thin solid ${theme.colorScheme === "dark" ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"}`,
      borderRadius: 3,
    }
  }
}));



export function ScoreFilter(props: {
  category: Category
  value?: number
  onUpdateScore: (value: number) => void
}) {

  const { classes } = useStyles()
  const { toggleCategory, setScoresThresholds } = useDatabase()
  const [localValue, setLocalValue] = useState(0)
  const { sortByScore, setSortByScore, sortAsc, setSortAsc } = useDatabase()

  useEffect(() => {
    setLocalValue(props.value || 0)
  }, [props.value])

  const handlesSort = (asc: boolean) => {
    // remove the filter
    if (props.category.id === sortByScore?.id && asc === sortAsc) {
      setSortByScore(undefined)
      setSortAsc(false)
    }
    // add the filter
    else {
      setSortByScore(props.category)
      setSortAsc(asc)
    }
  }

  const unselectCategory = () => {
    toggleCategory(props.category)
  }

  return (
    <div className={classes.scoreFilter}>
      <Text className={classes.filterName}>{props.category.name}</Text>
      <div className={classes.filterContent}>
        <Slider
          sx={{ flex: 1, minWidth: 100 }}
          min={0}
          max={10}
          label={e => e.toFixed(1)}
          step={0.1}
          styles={props.category.color ? ({
            thumb: {
              borderColor: props.category.color
            },
            bar: {
              background: props.category.color
            }
          }) : undefined}
          value={localValue}
          onChange={setLocalValue}
          onChangeEnd={props.onUpdateScore}
        />
        <Text>{localValue.toFixed(1)}</Text>
        <Tooltip withArrow label="Sort ascending">
          <ActionIcon onClick={() => handlesSort(true)} size="sm" variant={sortByScore?.id == props.category.id && sortAsc ? 'filled' : undefined}>
            <IconSortAscending size={16} />
          </ActionIcon>
        </Tooltip>
        <Tooltip withArrow label="Sort descending">
          <ActionIcon onClick={() => handlesSort(false)} size="sm" variant={sortByScore?.id == props.category.id && !sortAsc ? 'filled' : undefined}>
            <IconSortDescending size={16} />
          </ActionIcon>
        </Tooltip>
        <CloseButton onClick={unselectCategory} size="sm" />
      </div>
    </div>
  )
}



export function ScorePill(props: {
  item: Article
  c: Category
  scoreDisplaySource: DisplaySources
}) {

  const theme = useMantineTheme();
  const { classes, cx } = useStyles()

  const buildScoreLabel = (c: Category) => {
    const legacy = maxDecimal(getScore(props.item, c, 'legacy'), 3)
    const computed = maxDecimal(getScore(props.item, c, 'computed'), 3)
    const delta = maxDecimal(getScore(props.item, c, 'delta'), 3)

    return (
      <div className={classes.customTooltip}>
        <span>{c.name}</span>
        {!computed ? (
          <span>Score: {legacy}</span>
        ) : (
          <span>Legacy: {legacy}</span>
        )}
        {!!computed && (
          <>
            <span>Computed: {computed}</span>
            <span>Delta: {delta}</span>
          </>
        )}
      </div>
    )
  }

  return (
    <Tooltip withArrow label={buildScoreLabel(props.c)}>
      <ColorSwatch size={20} className={cx(classes.score, { [classes.noScore]: getScore(props.item, props.c, props.scoreDisplaySource) === null })} color={props.c.color || (theme.colorScheme === "dark" ? "#111" : "white")}>
        <Text
          weight="bold"
          size={9}
          sx={{ color: props.c.color ? getContrastColor(props.c.color) : theme.colorScheme === "dark" ? "#AAA" : "#000" }}
        >
          {maxDecimal(getScore(props.item, props.c, props.scoreDisplaySource))}
        </Text>
      </ColorSwatch>
    </Tooltip>
  )
}

export function TagPill(props: {
  item: string
}) {

  const { classes } = useStyles()
  const { categories } = useDatabase()
  const theme = useMantineTheme();

  const category = useMemo(() => categories.find(c => c.key === props.item), [categories, props.item])

  return (
    <Tooltip withArrow label={category?.name}>
      <ColorSwatch size={14} className={classes.tag} radius={0} color={category?.color || (theme.colorScheme === "dark" ? "#111" : "white")} />
    </Tooltip>
  )
}

export function ExtractsCounter(props: {
  extracts?: TextPart[]
}) {

  const theme = useMantineTheme();
  const { classes } = useStyles()
  const { categories } = useDatabase()
  const [showPopover, setShowPopover] = useState(false)

  const category = useMemo(() => {
    if (props.extracts && props.extracts.length > 0) {
      const extract = props.extracts[props.extracts.length - 1]
      return categories.find(c => c.key === extract.categoryKey)
    }
    return undefined
  }, [categories, props.extracts])

  if (!props.extracts) {
    return null;
  }

  return (
    <Popover opened={showPopover} onChange={setShowPopover}>
      <Popover.Target>
        <ColorSwatch
          size={20}
          className={classes.extractsCounter}
          color={category?.color || (theme.colorScheme === "dark" ? "#111" : "white")}
          radius={4}
          onClick={() => setShowPopover(v => !v)}
        >
          <Text size="xs" sx={{ color: getContrastColor(category?.color) }}>{props.extracts.length}</Text>
        </ColorSwatch>
      </Popover.Target>
      <Popover.Dropdown>
        {props.extracts.map(e => (
          <Text>{e.text}</Text>
        ))}
      </Popover.Dropdown>
    </Popover>
  )
}



const Row = memo(({ data, index, style }: any) => {

  // Data passed to List as "itemData" is available as props.data
  const {
    items,
    onAction,
    actionIcon,
    isSelected,
    isPreviewed,
    scoreDisplaySource,
    scoreDisplayMode,
    articleRowDetails,
    categories,
  } = data;

  const item: Article = items[index];
  const { classes, cx } = useStyles()

  return item?.id ? (
    <div
      key={item.id}
      className={cx(classes.row, { [classes.previewed]: !!isPreviewed && isPreviewed(item) })}
      onClick={onAction ? e => onAction("click", item, e) : undefined}
      style={style}
    >
      {!!isPreviewed && (
        <Tooltip withArrow label="Preview" openDelay={2000} position="right">
          <span className={classes.clickSelect} onClick={onAction ? e => onAction("select", item, e) : undefined}></span>
        </Tooltip>
      )}
      {articleRowDetails.checkbox && (
        <Checkbox className={classes.checkbox} mr={5} onChange={onAction ? e => onAction("check", item, e.nativeEvent) : undefined} checked={isSelected(item)} />
      )}
      {scoreDisplayMode === "grid" ? (
        <Group
          spacing={1}
          className={cx(
            classes.scoresWrapper,
            classes.scoresWrapperGrid,
            { [classes.noPad]: (categories as Category[]).every(c => !passScoreTest(item, c)) }
          )}
          style={{ gridTemplateColumns: `repeat(${categories.length}, 1fr)` }}
          mr="xs"
        >
          {(categories as Category[]).map(c => passScoreTest(item, c) ? (
            <ScorePill key={c.id} item={item} c={c} scoreDisplaySource={scoreDisplaySource} />
          ) : (
            <span key={c.id}></span>
          ))}
        </Group>
      ) : (
        <>
          {(categories as Category[]).filter(c => passScoreTest(item, c)).length > 0 && (
            <Group spacing={1} className={classes.scoresWrapper} mr="xs">
              {(categories as Category[]).filter(c => passScoreTest(item, c)).map(c => (
                <ScorePill key={c.id} item={item} c={c} scoreDisplaySource={scoreDisplaySource} />
              ))}
            </Group>
          )}
        </>
      )}
      {articleRowDetails.title && (<Anchor href={item.std.url} target="_blank" className={classes.title} title={item.std.title}>{item.std.title}</Anchor>)}
      {articleRowDetails.source_name && item.non_std.source_name && <Tooltip withArrow label="Source name"><Badge sx={{ textTransform: "capitalize" }} color="orange">{item.non_std.source_name}</Badge></Tooltip>}
      {articleRowDetails.publisher_name && item.non_std.publisher_name && <Tooltip withArrow label="Publisher name"><Badge sx={{ textTransform: "capitalize" }} >{item.non_std.publisher_name}</Badge></Tooltip>}
      {item.tags && item.tags.length > 0 && (
        <Group spacing={1} className={classes.tagsWrapper}>
          {item.tags.map(c => (
            <TagPill key={c} item={c} />
          ))}
        </Group>
      )}
      {item.extracts?.length && (
        <Tooltip label={JSON.stringify(item.extracts)}>
          <ExtractsCounter extracts={item.extracts} />
        </Tooltip>
      )}
      {articleRowDetails.sections_length && (
        <Badge sx={{ textTransform: "none", fontWeight: "normal" }}>
          <Group>
            <Tooltip withArrow label="Title length">
              <span>{item.out.process_sections.title.split(" ").length}</span>
            </Tooltip>
            <Tooltip withArrow label="Body length">
              <span>{item.out.process_sections.body.split(" ").length}</span>
            </Tooltip>
          </Group>
        </Badge>
      )}
      {articleRowDetails.lang && (
        <>
          {item.std.lang_code ?
            (<Tooltip withArrow label="Language"><Badge variant='outline' sx={{ borderColor: "transparent" }} size='sm'>{item.std.lang_code}</Badge></Tooltip>) :
            (<Tooltip withArrow label="Language (inferred)"><Badge color="orange" variant='outline' sx={{ borderColor: "transparent" }} size='sm'>{item.out.infer_language}</Badge></Tooltip>)
          }
        </>
      )}
      {articleRowDetails.publication_datetime && (
        <Tooltip withArrow label={format(new Date(item.std.publication_datetime), "PPPP pppp")}>
          <Text size="xs" className={classes.date}>{format(new Date(item.std.publication_datetime), "dd.LL.y")}</Text>
        </Tooltip>
      )}
      {!!onAction && actionIcon !== null && (
        <ActionIcon onClick={onAction ? e => onAction("details", item, e) : onAction}>
          {actionIcon || (<IconViewfinder size={16} />)}
        </ActionIcon>
      )}
    </div>
  ) : null;

}, areEqual);

Row.displayName = "ArticleListRow"

const createItemData = memoize((items, onAction, actionIcon, isSelected, isPreviewed, scoreDisplaySource, scoreDisplayMode, articleRowDetails, categories) => ({
  items,
  onAction,
  actionIcon,
  isSelected,
  isPreviewed,
  scoreDisplaySource,
  scoreDisplayMode,
  articleRowDetails,
  categories
}));

/**
 * @see https://react-window.vercel.app/#/examples/list/variable-size
 * @param param0 
 * @returns 
 */
export default function MantineList<T>(props: {
  title?: React.ReactNode
  items: T[]
  onAction?: (action: ArticleListAction, item: T, e: React.MouseEvent) => void
  isSelected?: (item: T) => void
  isPreviewed?: (item: T) => void
  actionIcon?: React.ReactNode
}) {

  const listRef = useRef(null)
  const { classes } = useStyles()
  const [localQuery, setLocalQuery] = useState("")
  const [debouncedQuery] = useDebouncedValue(localQuery, 300)

  useEffect(() => {
    setArticlesQuery(debouncedQuery)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery])

  const {
    filteredArticles,
    setArticlesQuery,
    sortBy,
    setSortBy,
    sortByScore,
    setSortByScore,
    sortAsc,
    setSortAsc,
    categories,
    selectedCategories,
    filterBy,
    filterByDate,
    scoreDisplaySource,
    scoresThresholds,
    setScoresThresholds,
    scoreDisplayMode,
    articleRowDetails,
    displayedCategories,
    selectedArticles,
    setSelectedArticles,
    selectedArticle
  } = useDatabase()

  useEffect(() => {
    if (selectedArticle && listRef.current) {
      const index = filteredArticles.findIndex(a => a.id === selectedArticle.id)
      if (index >= 0) {
        //@ts-ignore
        listRef.current.scrollToItem(index, "center");
      }
    }
  }, [selectedArticle])

  const filteredCategories = useMemo(() => {
    if (!displayedCategories.length) {
      return categories
    }
    return categories.filter(c => displayedCategories.includes(c.id))
  }, [categories, displayedCategories])

  const onSort = (path: string, asc: boolean) => {
    setSortBy(path)
    setSortAsc(asc)
  }

  const onCancelSort = () => {
    setSortBy('')
    setSortByScore(undefined)
    setSortAsc(false)
  }

  const getSortByLabel = (key: string) => {
    if (key === "id") {
      return "ID"
    }
    else if (key === "std.title") {
      return "Title"
    }
    else if (key === "std.publication_datetime") {
      return "Publi."
    }
    return key
  }

  const onSortByScore = (c: Category, asc: boolean) => {
    setSortByScore(c)
    setSortAsc(asc)
  }

  const onUpdateScore = (val: number, key: string, p: keyof ScoresThresholds) => {
    let t = JSON.parse(JSON.stringify(scoresThresholds[p]))
    t = { ...t, [key]: val }
    const tPool = { ...scoresThresholds, [p]: t }
    setScoresThresholds(tPool)
  }

  const isSelected = (item: Article) => {
    return props.isSelected || selectedArticles.includes(item.id)
  }

  const onAction = (action: ArticleListAction, item: Article, e: React.MouseEvent) => {
    if (props.onAction) {
      props.onAction(action, item as T, e)
    }

    if (action === "check") {
      if (e.altKey) {
        if (selectedArticles.length === filteredArticles.length) {
          setSelectedArticles([])
        }
        else {
          setSelectedArticles(filteredArticles.map(a => a.id))
        }
      }
      else {
        const id = item.id
        if (selectedArticles.includes(id)) {
          setSelectedArticles(selectedArticles.filter(a => a !== id))
        }
        else {
          setSelectedArticles([...selectedArticles, id])
        }
      }

    }
  }

  return (
    <div className={classes.main}>
      {props.title}
      <div className={classes.header}>
        <MediaQuery query="(max-width: 730px)" styles={{ display: "block" }} >
          <TextInput
            icon={<IconSearch size={16} />}
            placeholder={"Search..."}
            className={classes.searchInput}
            value={localQuery}
            onChange={e => setLocalQuery(e.target.value)}
            rightSectionWidth={!localQuery ? 70 : 85}
            rightSection={(
              <Group spacing={4}>
                {!!localQuery && (
                  <ActionIcon variant="subtle" size="xs" onClick={() => setLocalQuery("")}>
                    <IconX size={18} />
                  </ActionIcon>
                )}
                {selectedArticles.length > 0 ? (
                  <Tooltip withArrow label={(
                    <Stack spacing={0}>
                      <span>Selected: {selectedArticles.length}</span>
                      <span>Total: {filteredArticles.length}</span>
                    </Stack>
                  )}>
                    <Badge variant='filled'>{selectedArticles.length}</Badge>
                  </Tooltip>
                ) : (
                  <Tooltip withArrow label={`Number of articles (${filteredArticles.length})`}>
                    <Badge variant="outline">{filteredArticles.length}</Badge>
                  </Tooltip>
                )}
              </Group>
            )}
          />
        </MediaQuery>
        <Group spacing={5} position="right">
          <Menu shadow="md" width={200} >
            <Menu.Target>
              <Indicator disabled>
                <Button variant='default' rightIcon={<IconChevronDown size={16} />}>
                  {!sortBy && !sortByScore && (<Text weight="normal">Sort by</Text>)}
                  {sortBy && (
                    <Text ml={5}>{getSortByLabel(sortBy)} ({sortAsc ? "asc" : "desc"})</Text>
                  )}
                  {!!sortByScore && (
                    <Text ml={5}><abbr title={sortByScore.name}>Score</abbr> ({sortAsc ? "asc" : "desc"})</Text>
                  )}
                </Button>
              </Indicator>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item color={sortBy === 'id' && sortAsc ? 'blue' : undefined} onClick={() => onSort('id', true)} icon={<IconSortAscending size={14} />} rightSection={<Text size="xs" color="dimmed">asc</Text>}>ID</Menu.Item>
              <Menu.Item color={sortBy === 'id' && !sortAsc ? 'blue' : undefined} onClick={() => onSort('id', false)} icon={<IconSortDescending size={14} />} rightSection={<Text size="xs" color="dimmed">desc</Text>}>ID</Menu.Item>
              <Menu.Divider />
              <Menu.Item color={sortBy === 'std.title' && sortAsc ? 'blue' : undefined} onClick={() => onSort('std.title', true)} icon={<IconSortAscending size={14} />} rightSection={<Text size="xs" color="dimmed">asc</Text>}>Title</Menu.Item>
              <Menu.Item color={sortBy === 'std.title' && !sortAsc ? 'blue' : undefined} onClick={() => onSort('std.title', false)} icon={<IconSortDescending size={14} />} rightSection={<Text size="xs" color="dimmed">desc</Text>}>Title</Menu.Item>
              <Menu.Divider />
              <Menu.Item color={sortBy === 'std.publication_datetime' && sortAsc ? 'blue' : undefined} onClick={() => onSort('std.publication_datetime', true)} icon={<IconSortAscending size={14} />} rightSection={<Text size="xs" color="dimmed">asc</Text>}>Publication</Menu.Item>
              <Menu.Item color={sortBy === 'std.publication_datetime' && !sortAsc ? 'blue' : undefined} onClick={() => onSort('std.publication_datetime', false)} icon={<IconSortDescending size={14} />} rightSection={<Text size="xs" color="dimmed">desc</Text>}>Publication</Menu.Item>
              <Menu.Divider />
              <HoverCard shadow="md" position='left'>
                <HoverCard.Target>
                  <Menu.Item color={!!sortByScore && sortAsc ? 'blue' : undefined} icon={<IconSortAscending size={14} />} rightSection={<Text size="xs" color="dimmed">asc</Text>}>Score</Menu.Item>
                </HoverCard.Target>
                <HoverCard.Dropdown>
                  <Menu.Label>Sort by score (ascending)</Menu.Label>
                  <Menu.Divider />
                  {categories.map(c => (
                    <Menu.Item key={c.id} color={sortByScore?.id === c.id && sortAsc ? 'blue' : undefined} onClick={() => onSortByScore(c, true)} icon={<IconSortAscending size={14} />}>{c.name}</Menu.Item>
                  ))}
                </HoverCard.Dropdown>
              </HoverCard>
              <HoverCard shadow="md" position='left'>
                <HoverCard.Target>
                  <Menu.Item color={!!sortByScore && !sortAsc ? 'blue' : undefined} icon={<IconSortDescending size={14} />} rightSection={<Text size="xs" color="dimmed">desc</Text>}>Score</Menu.Item>
                </HoverCard.Target>
                <HoverCard.Dropdown>
                  <Menu.Label>Sort by score (descending)</Menu.Label>
                  <Menu.Divider />
                  {categories.map(c => (
                    <Menu.Item key={c.id} color={sortByScore?.id === c.id && !sortAsc ? 'blue' : undefined} onClick={() => onSortByScore(c, false)} icon={<IconSortDescending size={14} />}>{c.name}</Menu.Item>
                  ))}
                </HoverCard.Dropdown>
              </HoverCard>
              <Menu.Divider />
              <Menu.Item onClick={onCancelSort} icon={<IconZoomCancel size={14} />}>Cancel</Menu.Item>
            </Menu.Dropdown>
          </Menu>
          <Popover position="bottom" withArrow shadow="lg">
            <Popover.Target>
              <Indicator offset={2} disabled={!(Object.keys(filterBy).length > 0 || (!!filterByDate[0] || !!filterByDate[1]))}>
                <Button variant='default' rightIcon={<IconChevronDown size={16} />}>
                  <Text weight="normal">Filter</Text>
                </Button>
              </Indicator>
            </Popover.Target>
            <Popover.Dropdown sx={{ maxWidth: "90vw" }}>
              <FiltersPanel />
            </Popover.Dropdown>
          </Popover>
          <Popover position="bottom" withArrow shadow="lg">
            <Popover.Target>
              <Indicator offset={2} disabled={!displayedCategories.length}>
                <Button variant='default' rightIcon={<IconChevronDown size={16} />}>
                  <Text weight="normal">{capitalize(scoreDisplaySource || "display")}</Text>
                </Button>
              </Indicator>
            </Popover.Target>
            <Popover.Dropdown sx={{ maxWidth: "90vw" }}>
              <DisplayOptionsPanel />
            </Popover.Dropdown>
          </Popover>
        </Group>
      </div>
      {selectedCategories.length > 0 && (
        <ScrollArea style={{ maxHeight: 180 }}>
          <Stack spacing={5}>
            <Text size="xs">Restrict the articles based on scores greater than:</Text>
            <div className={classes.scoreFilterWrapper}>
              {categories.filter(c => selectedCategories.includes(c.id)).map(c => (
                <ScoreFilter
                  key={c.id}
                  category={c}
                  value={scoresThresholds?.[scoreDisplaySource || "auto"]?.[c.key]}
                  onUpdateScore={v => onUpdateScore(v, c.key, scoreDisplaySource || "auto")}
                />
              ))}
            </div>
          </Stack>
        </ScrollArea>
      )}
      <Paper sx={{ flex: 1 }} withBorder>
        <AutoSizer>
          {({ height, width }) => (
            <List
              ref={listRef}
              height={height}
              itemCount={filteredArticles.length}
              itemData={createItemData(
                filteredArticles,
                onAction,
                props.actionIcon,
                props.isSelected || isSelected,
                props.isPreviewed,
                scoreDisplaySource,
                scoreDisplayMode,
                articleRowDetails,
                filteredCategories
              )}
              itemSize={35}
              width={width}
            >
              {Row}
            </List>
          )}
        </AutoSizer>
      </Paper>
    </div>
  );
}