import { Badge, Text, createStyles, TextInput, Box, Group, ActionIcon, Tooltip } from '@mantine/core'
import { useCallback, useEffect, useRef, useState } from 'react'
import { IconSearch, IconX } from '@tabler/icons'
import { norm } from '../../../utils/helpers'

const useStyle = createStyles(theme => ({
  list: {
    margin: 0,
    padding: 0,
    listStyleType: "none"
  },
  item: {
    transition: "border .2s",
    border: `thin solid ${theme.colorScheme === "light" ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)"}`,
    color: theme.colorScheme === "light" ? "rgba(0,0,0,0.8)" : "rgba(255,255,255,0.6)",
    backgroundColor: theme.colorScheme === 'dark' ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,1)",
    padding: "1rem",
    marginBottom: 5,

  },
  selected: {
    backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[3] : theme.colors.gray[2]
  },
  clickable: {
    cursor: "pointer",
    "&:hover": {
      borderColor: theme.colorScheme === 'dark' ? theme.colors.dark[3] : theme.colors.gray[5]
    }
  }
}))

/**
 * A list of item with search and selection.
 * 
 * @param props 
 * @returns 
 */
export default function DataList<T>(props: {
  /**
   * Array of items (objects) to display.
   */
  items: T[]
  /**
   * Unique attribute of item used for selection.
   */
  idKey?: keyof T
  /**
   * Compute the displayed value based on the item object.
   * 
   * @param item The item to display.
   * @returns A ReactNode to display.
   */
  value: (item: T) => React.ReactNode
  /**
   * Similar to *value* but return a string used for comparisons.
   * 
   * @param item The item to display.
   * @returns A string to display or use for comparisons.
   */
  asString?: (item: T) => string
  /**
   * Triggered when an item is clicked.
   * 
   * @param item The clicked item.
   * @param e The click event.
   * @returns
   */
  onClick?: (item: T, e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
  /**
   * Determine if an item is selected or not from the parent.
   * 
   * @param item The current item.
   * @returns True if selected.
   */
  isSelected?: (item: T) => boolean
  /**
   * ReactNode to display below the search bar.
   */
  afterSearchChildren?: React.ReactNode
  /**
   * If the search input must receive the focus when mounted.
   */
  autoFocus?: boolean
  /**
   * The labels to display.
   */
  labels?: {
    noItemsMessage?: string
    search?: string
  }
  /**
   * Callback triggered when the search value changes.
   * 
   * @param query The current search query.
   * @returns 
   */
  onQueryChange?: (query: string) => void
  /**
   * If the list must be displayed in compact mode.
   */
  compact?: boolean
}) {

  const { asString, value } = props;

  const { classes, cx } = useStyle()
  const [query, setQuery] = useState("")
  const searchInputRef = useRef(null)

  useEffect(() => {
    if (searchInputRef?.current && props.autoFocus) {
      setTimeout(() => {
        if (!!searchInputRef.current) {
          (searchInputRef.current as any).focus()
        }
      }, 300)
    }
  }, [props.autoFocus]);

  const filterByQuery = useCallback((data: T[], query: string) => {
    const qTab = norm(query).split(" ").filter(e => !!e)
    return data.filter(d => {
      let val = (asString ? asString(d) : value(d))?.toString() || "";
      const vTab = norm(val).split(" ").filter(e => !!e);
      let test = true;
      for (const qt of qTab) {
        let found = false;
        for (const vt of vTab) {
          if (vt.includes(qt)) {
            found = true;
          }
        }
        if (!found) {
          test = false;
        }
      }
      return test;
    })
  },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [asString, value]
  )

  const onClick = (item: T, e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (props.onClick) {
      props.onClick(item, e)
    }
  }

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    if (props.onQueryChange) {
      props.onQueryChange(e.target.value)
    }
  }

  const items = filterByQuery(props.items, query)

  return (
    <Box>
      {!props.compact && (
        <TextInput
          mb="md"
          icon={<IconSearch size={16} />}
          placeholder={props.labels?.search || "Search..."}
          value={query}
          onChange={onChange}
          ref={searchInputRef}
          rightSectionWidth={!query ? 50 : 65}
          rightSection={(
            <Group spacing={4}>
              {!!query && (
                <ActionIcon variant="subtle" size="xs" onClick={() => onChange({ target: { value: "" } } as any)}>
                  <IconX size={18} />
                </ActionIcon>
              )}
              <Tooltip label={`Number of items (${items.length})`}>
                <Badge variant="outline">{items.length}</Badge>
              </Tooltip>
            </Group>
          )}
        />
      )}
      {props.afterSearchChildren}
      {items.length > 0 ? (
        <ul className={classes.list}>
          {items.map((item, i) => (
            <li key={String(props.idKey ? item[props.idKey] : i)}>
              <Box
                className={cx(classes.item, { [classes.selected]: props.isSelected && props.isSelected(item), [classes.clickable]: props.onClick })}
                onClick={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => { onClick(item, e) }}
              >
                {props.value(item)}
              </Box>
            </li>
          ))}
        </ul>
      ) : (
        <Text mb="md">{props.labels?.noItemsMessage || "No items..."}</Text>
      )}
    </Box>
  )
}
