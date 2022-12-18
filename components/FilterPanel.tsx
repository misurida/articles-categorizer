import { ActionIcon, Badge, Box, Checkbox, Group, Indicator, Menu, TextInput, createStyles } from "@mantine/core";
import { useDatabase } from "../hooks/useDatabase";
import { extractStringsList, getObjectValue, getWordsFrequency } from "../utils/helpers";
import SelectableList from "./SelectableList";
import { useMemo, useState } from "react";
import { DatePicker, DateRangePicker } from "@mantine/dates";
import { Article } from "../utils/types";
import { isAfter, isBefore, isSameDay } from "date-fns";
import { IconBoxModel, IconClick } from "@tabler/icons";

const useStyles = createStyles((theme) => ({
  filtersPanel: {
    display: "flex",
    flexWrap: "wrap",
    gap: "1em"
  },
  filterListWrapper: {
    flex: 1,
    minWidth: 200
  },
  calendarDay: {
    position: "relative"
  },
  calendarCount: {
    position: "absolute",
    top: -5,
    right: -5,
    zIndex: 1,
    padding: "0 0.5em"
  }
}));

export function FilterList(props: {
  label: string
  path: string
}) {

  const { articles, setFilterBy, filterBy } = useDatabase()

  /* const items = useMemo(() => {
    return extractStringsList(articles, props.path)
  }, [props.path, articles]) */

  const items = useMemo(() => {
    return getWordsFrequency(articles.map(a => getObjectValue(a, props.path)).filter(e => !!e)).map || {}
  }, [props.path, articles])

  const onChange = (value: string[]) => {
    if (!value.length) {
      let fb = JSON.parse(JSON.stringify(filterBy))
      if (fb[props.path]) delete fb[props.path]
      setFilterBy(fb)
    }
    else {
      setFilterBy({ ...filterBy, [props.path]: value })
    }
  }

  return (
    <SelectableList
      label={props.label}
      items={Object.keys(items)}
      counts={Object.values(items)}
      onChange={onChange}
      selection={filterBy[props.path]}
    />
  )
}


export const getArticlesPerDate = (articles: Article[], date: Date) => {
  return articles.filter(a => {
    const d = getObjectValue(a, "std.publication_datetime")
    if (d) {
      return isSameDay(new Date(d), date)
    }
    return false
  }).length
}

export type CalendarMode = "range" | "after" | "before"

export default function FiltersPanel() {

  const { classes } = useStyles()
  const { filterByDate, setFilterByDate, articles } = useDatabase()
  const [calendarMode, setCalendarMode] = useState<CalendarMode>("range")
  const [useCalendarAnnotations, setUseCalendarAnnotations] = useState(false)

  const setStartingDate = (date: Date | null) => {
    const data = JSON.parse(JSON.stringify(filterByDate))
    data[0] = date
    setFilterByDate(data)
  }

  const setEndingDate = (date: Date | null) => {
    const data = JSON.parse(JSON.stringify(filterByDate))
    data[1] = date
    setFilterByDate(data)
  }

  const rangePickerLabel = (
    <Group spacing={5}>
      {calendarMode === "range" && <span>Dates range</span>}
      {calendarMode === "after" && <span>After date</span>}
      {calendarMode === "before" && <span>Before date</span>}
      <Menu shadow="md" width={200}>
        <Menu.Target>
          <ActionIcon size="xs">
            <IconClick size={14} />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Label>Calendar mode</Menu.Label>
          <Menu.Divider />
          <Menu.Item color={calendarMode === "range" ? 'blue' : undefined} onClick={() => setCalendarMode("range")}>Range</Menu.Item>
          <Indicator disabled={!filterByDate[0]} offset={15} position="middle-end">
            <Menu.Item color={calendarMode === "after" ? 'blue' : undefined} onClick={() => setCalendarMode("after")}>After date</Menu.Item>
          </Indicator>
          <Indicator disabled={!filterByDate[1]} offset={15} position="middle-end">
            <Menu.Item color={calendarMode === "before" ? 'blue' : undefined} onClick={() => setCalendarMode("before")}>Before date</Menu.Item>
          </Indicator>
          <Menu.Divider />
          <Box px={10} pt={5}>
            <Checkbox
              sx={{ fontWeight: "normal" }}
              label="Calendar annotations"
              checked={useCalendarAnnotations}
              onChange={(event) => setUseCalendarAnnotations(event.currentTarget.checked)}
            />
          </Box>
        </Menu.Dropdown>
      </Menu>
    </Group>
  )

  const renderDay = (date: Date) => {
    const day = date.getDate()
    const nArt = getArticlesPerDate(articles, date)
    return (
      <div className={classes.calendarDay}>
        {nArt > 0 && (
          <Badge variant="filled" size="xs" className={classes.calendarCount}>{nArt}</Badge>
        )}
        {day}
      </div>
    );
  }

  return (
    <Box>
      <Box className={classes.filtersPanel} mb="md">
        <div className={classes.filterListWrapper}>
          {calendarMode === "range" && (
            <DateRangePicker
              label={rangePickerLabel}
              placeholder="Pick dates range"
              value={filterByDate}
              onChange={setFilterByDate}
              renderDay={useCalendarAnnotations ? renderDay : undefined}
            />
          )}
          {calendarMode === "after" && (
            <DatePicker
              label={rangePickerLabel}
              placeholder="Pick starting date..."
              value={filterByDate[0]}
              onChange={setStartingDate}
              renderDay={useCalendarAnnotations ? renderDay : undefined}
            />
          )}
          {calendarMode === "before" && (
            <DatePicker
              label={rangePickerLabel}
              placeholder="Pick ending date..."
              value={filterByDate[1]}
              onChange={setEndingDate}
              renderDay={useCalendarAnnotations ? renderDay : undefined}
            />
          )}
        </div>
      </Box>
      <div className={classes.filtersPanel}>
        <div className={classes.filterListWrapper}><FilterList label="Publisher name" path="non_std.publisher_name" /></div>
        <div className={classes.filterListWrapper}><FilterList label="Source name" path="non_std.source_name" /></div>
      </div>
    </Box>
  )
}
