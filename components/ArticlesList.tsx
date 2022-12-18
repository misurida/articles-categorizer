import React from 'react';
import { memo, useEffect, useMemo, useState } from 'react';
import memoize from 'memoize-one';
import { FixedSizeList as List, areEqual } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { ActionIcon, Badge, Group, Stack, TextInput, Tooltip, createStyles, Text, Paper, Button, Popover, MediaQuery, Menu, Indicator, Anchor, Slider, CloseButton, ColorSwatch, useMantineTheme, HoverCard } from '@mantine/core';
import { format } from 'date-fns';
import { Article, Category } from '../utils/types';
import { IconChevronDown, IconHeart, IconSearch, IconSortAscending, IconSortDescending, IconViewfinder, IconX, IconZoomCancel } from '@tabler/icons';
import { getScore, passScoreTest, useDatabase } from '../hooks/useDatabase';
import { useAuth } from '../hooks/useAuth';
import { getContrastColor } from '../utils/helpers';
import FiltersPanel from './FilterPanel';
import { useDebouncedValue } from '@mantine/hooks';

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
    [`@media (max-width: ${theme.breakpoints.xs}px)`]: {
      // Type safe child reference in nested selectors via ref
      marginBottom: 5
    },
  },
  header: {
    display: "flex",
    gap: 5,
    flexWrap: "wrap",
    [`@media (max-width: ${theme.breakpoints.xs}px)`]: {
      // Type safe child reference in nested selectors via ref
      display: "inline-block",
      textAlign: "right"
    },
  },
  scoreFilterWrapper: {
    display: "grid",
    gridTemplateColumns: "repeat( auto-fit, minmax(400px, 1fr) )",
    gridGap: 5,
    [`@media (max-width: ${theme.breakpoints.xs}px)`]: {
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
  score: {

  }
}));



export function ScoreFilter(props: {
  category: Category
  onChange: (value: number) => void
  onRemove: () => void
}) {

  const { classes } = useStyles()
  const [localValue, setLocalValue] = useState(props.category.threshold || 0)
  const { sortByScore, setSortByScore, sortAsc, setSortAsc } = useDatabase()

  useEffect(() => {
    setLocalValue(props.category.threshold || 0)
  }, [props.category.threshold])

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

  return (
    <div className={classes.scoreFilter}>
      <Text className={classes.filterName}>{props.category.name}</Text>
      <div className={classes.filterContent}>
        <Slider
          sx={{ flex: 1 }}
          min={0}
          max={10}
          label={e => e.toFixed(1)}
          step={0.1}
          value={localValue}
          onChange={setLocalValue}
          onChangeEnd={props.onChange}
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
        <CloseButton onClick={props.onRemove} size="sm" />
      </div>
    </div>
  )
}



const Row = memo(({ data, index, style }: any) => {

  // Data passed to List as "itemData" is available as props.data
  const { items, onAction, isSelected, scoreDisplayMode, categories } = data;
  const item: Article = items[index];
  const { classes } = useStyles()
  const theme = useMantineTheme();

  return item?.id ? (
    <div
      className={classes.row}
      onClick={() => onAction("click", item)}
      style={style}
    >
      {(categories as Category[]).filter(c => passScoreTest(item, c, scoreDisplayMode)).length > 0 && (
        <Group spacing={1} className={classes.scoresWrapper} mr="xs">
          {(categories as Category[]).filter(c => passScoreTest(item, c, scoreDisplayMode)).map(c => (
            <Tooltip key={c.id} withArrow label={`${c.name}: ${getScore(item, c)}`}>
              <ColorSwatch size={20} className={classes.score} color={c.color || (theme.colorScheme === "dark" ? "#111" : "white")}>
                <Text weight="bold" size={10} sx={{ color: c.color ? getContrastColor(c.color) : theme.colorScheme === "dark" ? "#AAA" : "#000" }} >{getScore(item, c)}</Text>
              </ColorSwatch>
            </Tooltip>
          ))}
        </Group>
      )}
      <Anchor href={item.std.url} target="_blank" className={classes.title} title={item.std.title}>{item.std.title}</Anchor>
      {item.non_std.source_name && <Tooltip withArrow label="Source name"><Badge sx={{ textTransform: "capitalize" }} color="orange">{item.non_std.source_name}</Badge></Tooltip>}
      {item.non_std.publisher_name && <Tooltip withArrow label="Publisher name"><Badge sx={{ textTransform: "capitalize" }} >{item.non_std.publisher_name}</Badge></Tooltip>}
      {item.std.lang_code ?
        (<Tooltip withArrow label="Language"><Badge variant='outline' sx={{ borderColor: "transparent" }} size='sm'>{item.std.lang_code}</Badge></Tooltip>) :
        (<Tooltip withArrow label="Language (inferred)"><Badge color="orange" variant='outline' sx={{ borderColor: "transparent" }} size='sm'>{item.out.infer_language}</Badge></Tooltip>)
      }
      <Tooltip label={format(new Date(item.std.publication_datetime), "PPPP pppp")}>
        <Text size="xs" className={classes.date}>{format(new Date(item.std.publication_datetime), "dd.LL.y")}</Text>
      </Tooltip>
      <ActionIcon onClick={() => onAction("details", item)}>
        <IconViewfinder size={16} />
      </ActionIcon>
    </div>
  ) : null;

}, areEqual);

Row.displayName = "ArticleListRow"

const createItemData = memoize((items, onAction, isSelected, scoreDisplayMode, categories) => ({
  items,
  onAction,
  isSelected,
  scoreDisplayMode,
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
  onAction: (action: string, item: T) => void
  isSelected?: (item: T) => void
}) {

  const { classes } = useStyles()
  const { user } = useAuth()
  const [localQuery, setLocalQuery] = useState("")
  const [debouncedQuery] = useDebouncedValue(localQuery, 300)

  useEffect(() => {
    setQuery(debouncedQuery)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery])

  const {
    filteredArticles,
    setQuery,
    sortBy,
    setSortBy,
    sortByScore,
    setSortByScore,
    sortAsc,
    setSortAsc,
    categories,
    selectedCategories,
    updateCategory,
    toggleCategory,
    filterBy,
    filterByDate,
    scoreDisplayMode
  } = useDatabase()


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

  const updateScore = (val: number, c: Category) => {
    updateCategory({ ...c, threshold: val }, user?.uid)
  }

  const unselectCategory = (c: Category) => {
    toggleCategory(c)
  }

  const onSortByScore = (c: Category, asc: boolean) => {
    setSortByScore(c)
    setSortAsc(asc)
  }

  return (
    <div className={classes.main}>
      {props.title}
      <div className={classes.header}>
        <MediaQuery query="(max-width: 530px)" styles={{ display: "block" }} >
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
                <Tooltip withArrow label={`Number of articles (${filteredArticles.length})`}>
                  <Badge variant="outline">{filteredArticles.length}</Badge>
                </Tooltip>
              </Group>
            )}
          />
        </MediaQuery>
        <Group spacing={5} position="right">
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <Indicator disabled>
                <Button variant='default' rightIcon={<IconChevronDown size={16} />}>
                  <Text weight="normal">Sort by</Text>
                  {sortBy && (
                    <Text ml={5}>: {getSortByLabel(sortBy)} ({sortAsc ? "asc" : "desc"})</Text>
                  )}
                  {!!sortByScore && (
                    <Text ml={5}>: <abbr title={sortByScore.name}>Score</abbr> ({sortAsc ? "asc" : "desc"})</Text>
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
                <HoverCard.Dropdown p={5}>
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
                <HoverCard.Dropdown p={5}>
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
              <Indicator disabled={!(Object.keys(filterBy).length > 0 || (!!filterByDate[0] || !!filterByDate[1]))}>
                <Button variant='default' rightIcon={<IconChevronDown size={16} />}>
                  <Text weight="normal">Filter</Text>
                </Button>
              </Indicator>
            </Popover.Target>
            <Popover.Dropdown sx={{ maxWidth: "90vw" }}>
              <FiltersPanel />
            </Popover.Dropdown>
          </Popover>
        </Group>
      </div>
      {selectedCategories.length > 0 && (
        <Stack spacing={5}>
          <Text size="xs">Restrict the articles based on scores greater than:</Text>
          <div className={classes.scoreFilterWrapper}>
            {categories.filter(c => selectedCategories.includes(c.id)).map(c => (
              <ScoreFilter
                category={c}
                key={c.id}
                onChange={val => updateScore(val, c)}
                onRemove={() => unselectCategory(c)}
              />
            ))}
          </div>
        </Stack>
      )}
      <Paper sx={{ flex: 1 }} withBorder>
        <AutoSizer>
          {({ height, width }) => (
            <List
              height={height}
              itemCount={filteredArticles.length}
              itemData={createItemData(filteredArticles, props.onAction, props.isSelected, scoreDisplayMode, categories)}
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