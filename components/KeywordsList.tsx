import React from 'react';
import { memo, useEffect, useState } from 'react';
import memoize from 'memoize-one';
import { FixedSizeList as List, areEqual } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { ActionIcon, Badge, Group, TextInput, Tooltip, createStyles, Text, Paper, Button, Popover, MediaQuery, Menu, Indicator } from '@mantine/core';
import { WordFrequency } from '../utils/types';
import { IconChevronDown, IconSearch, IconSortAscending, IconSortDescending, IconX, IconZoomCancel } from '@tabler/icons';
import { useDatabase } from '../hooks/useDatabase';
import { capitalize } from '../utils/helpers';
import { useDebouncedValue } from '@mantine/hooks';
import KeywordsFilterPanel from './KeywordsFilterPanel';

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
  rowNum: {
    display: "inline-block",
    minWidth: 30,
    marginRight: 10,
    opacity: 0.5,
    fontSize: "0.8em"
  },
  rowText: {
    flex: 1
  },
  rowCount: {

  },
}));




const Row = memo(({ data, index, style }: any) => {

  // Data passed to List as "itemData" is available as props.data
  const {
    items,
  } = data;

  const item: WordFrequency = items[index];
  const { classes } = useStyles()

  return (
    <div
      className={classes.row}
      style={style}
    >
      <Tooltip withArrow label="Rank">
        <span className={classes.rowNum}>{item.index + 1}.</span>
      </Tooltip>
      <span className={classes.title}>{item.word}</span>
      <Tooltip withArrow label="Frequency">
        <Badge mr="xs" className={classes.rowCount}>{item.count}</Badge>
      </Tooltip>
    </div>
  );

}, areEqual);

Row.displayName = "ArticleListRow"

const createItemData = memoize((items) => ({
  items
}));

/**
 * @see https://react-window.vercel.app/#/examples/list/variable-size
 * @param param0 
 * @returns 
 */
export default function KeywordsList<T>(props: {

}) {

  const { classes } = useStyles()
  const [localQuery, setLocalQuery] = useState("")
  const [debouncedQuery] = useDebouncedValue(localQuery, 300)
  const {
    filteredWordFrequencies,
    setFrequenciesQuery,
    freqSortBy,
    setFreqSortBy,
    freqSortAsc,
    setFreqSortAsc
  } = useDatabase()

  useEffect(() => {
    setFrequenciesQuery(debouncedQuery)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery])

  const getSortByLabel = (val: string) => {
    return capitalize(val)
  }

  const onSort = (path: keyof WordFrequency, asc: boolean) => {
    setFreqSortBy(path)
    setFreqSortAsc(asc)
  }

  const onCancelSort = () => {
    setFreqSortBy(undefined)
    setFreqSortAsc(false)
  }

  return (
    <div className={classes.main}>
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
                <Tooltip withArrow label={`Number of articles (${filteredWordFrequencies.length})`}>
                  <Badge variant="outline">{filteredWordFrequencies.length}</Badge>
                </Tooltip>
              </Group>
            )}
          />
        </MediaQuery>
        <Menu shadow="md" width={200} >
          <Menu.Target>
            <Indicator disabled>
              <Button variant='default' rightIcon={<IconChevronDown size={16} />}>
                {!freqSortBy && (<Text weight="normal">Sort by</Text>)}
                {freqSortBy && (
                  <Text ml={5}>{getSortByLabel(freqSortBy)} ({freqSortAsc ? "asc" : "desc"})</Text>
                )}
              </Button>
            </Indicator>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item color={freqSortBy === 'word' && freqSortAsc ? 'blue' : undefined} onClick={() => onSort('word', true)} icon={<IconSortAscending size={14} />} rightSection={<Text size="xs" color="dimmed">asc</Text>}>Word</Menu.Item>
            <Menu.Item color={freqSortBy === 'word' && !freqSortAsc ? 'blue' : undefined} onClick={() => onSort('word', false)} icon={<IconSortDescending size={14} />} rightSection={<Text size="xs" color="dimmed">desc</Text>}>Word</Menu.Item>
            <Menu.Divider />
            <Menu.Item color={freqSortBy === 'count' && freqSortAsc ? 'blue' : undefined} onClick={() => onSort('count', true)} icon={<IconSortAscending size={14} />} rightSection={<Text size="xs" color="dimmed">asc</Text>}>Count</Menu.Item>
            <Menu.Item color={freqSortBy === 'count' && !freqSortAsc ? 'blue' : undefined} onClick={() => onSort('count', false)} icon={<IconSortDescending size={14} />} rightSection={<Text size="xs" color="dimmed">desc</Text>}>Count</Menu.Item>
            <Menu.Divider />
            <Menu.Item onClick={onCancelSort} icon={<IconZoomCancel size={14} />}>Cancel</Menu.Item>
          </Menu.Dropdown>
        </Menu>
        <Popover position="bottom" withArrow shadow="lg">
          <Popover.Target>
            <Indicator offset={2} disabled={true}>
              <Button variant='default' rightIcon={<IconChevronDown size={16} />}>
                <Text weight="normal">Filter</Text>
              </Button>
            </Indicator>
          </Popover.Target>
          <Popover.Dropdown sx={{ maxWidth: "90vw" }}>
            <KeywordsFilterPanel />
          </Popover.Dropdown>
        </Popover>
      </div>
      <Paper sx={{ flex: 1 }} withBorder>
        <AutoSizer>
          {({ height, width }) => (
            <List
              height={height}
              itemCount={filteredWordFrequencies.length}
              itemData={createItemData(filteredWordFrequencies)}
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