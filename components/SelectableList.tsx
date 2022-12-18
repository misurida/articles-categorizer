import React, { useMemo, memo, useState, useEffect } from 'react';
import { FixedSizeList as List, areEqual } from 'react-window';
import memoize from 'memoize-one';
import { ActionIcon, Badge, Group, Stack, TextInput, Tooltip, Text, Checkbox, createStyles } from '@mantine/core';
import { IconSearch, IconX } from '@tabler/icons';
import { query } from 'firebase/firestore';
import Fuse from 'fuse.js';

const useStyles = createStyles((theme) => ({
  row: {
    cursor: "pointer",
    userSelect: "none",
    display: "flex"
  },
  checkbox: {
    display: "flex",
    alignItems: "center"
  },
  label: {
    flex: 1,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    textAlign: "left"
  }
}));


const Row = memo(({ data, index, style }: any) => {

  const { items, selection, counts, onClick } = data;
  const item = items[index];
  const { classes } = useStyles()

  const handleClick = (e: any) => {
    e.stopPropagation()
    if (onClick) {
      onClick(index, item)
    }
  }

  Row.displayName = "SelectableListRow"

  return (
    <div
      onClick={handleClick}
      style={style}
    >
      <Group align="center" spacing="xs" className={classes.row}>
        <Checkbox className={classes.checkbox} checked={selection.includes(item)} onChange={handleClick} />
        <Text className={classes.label}>{item}</Text>
        {counts.length > index && counts[index] && (
          <Badge sx={{ background: "transparent" }} size="sm">{counts[index]}</Badge>
        )}
      </Group>
    </div>
  );
}, areEqual);



const createItemData = memoize((items, selection, counts, onClick) => ({
  items,
  selection,
  counts,
  onClick,
}));






export default function SelectableList<T>(props: {
  items: T[]
  counts?: (string | number)[]
  height?: number | string
  width?: number | string
  placeholder?: string
  label?: string
  onChange?: (items: string[]) => void
  selection?: string[]
}) {

  const [query, setQuery] = useState("")
  const [selection, setSelection] = useState<string[]>([])

  useEffect(() => {
    if (props.selection) {
      setSelection(props.selection)
    }
  }, [props.selection])


  const articlesIndex = useMemo(() => {
    const options = {
      includeMatches: false
    };
    return new Fuse(props.items, options);
  }, [props.items])


  const filteredItems = useMemo(() => {
    if (articlesIndex && query) {
      return articlesIndex.search(query).map(e => e.item)
    }
    return props.items
  }, [props.items, query, articlesIndex])


  const onClick = (i: number, e: string) => {
    let sel = []
    if (selection.includes(e)) {
      sel = selection.filter(a => a !== e)
    }
    else {
      sel = [...selection, e]
    }
    setSelection(sel)
    if (props.onChange) {
      props.onChange(sel)
    }
  }

  return (
    <Stack spacing="xs">
      <TextInput
        icon={<IconSearch size={16} />}
        label={props.label}
        placeholder={props.placeholder || (props.label ? `${props.label}...` : "Search...")}
        value={query}
        onChange={e => setQuery(e.target.value)}
        rightSectionWidth={!query ? 70 : 85}
        rightSection={(
          <Group spacing={4}>
            {!!query && (
              <ActionIcon variant="subtle" size="xs" onClick={() => setQuery("")}>
                <IconX size={18} />
              </ActionIcon>
            )}
            <Tooltip withArrow label={`Number of items (${props.items.length})`}>
              <Badge variant="outline">{props.items.length}</Badge>
            </Tooltip>
          </Group>
        )}
      />
      <List
        height={props.height || 200}
        itemCount={filteredItems.length}
        itemData={createItemData(filteredItems, selection, props.counts || [], onClick)}
        itemSize={30}
        width={props.width || "100%"}
      >
        {Row}
      </List>
    </Stack>
  );
}
