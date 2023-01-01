import { ActionIcon, Badge, Box, Checkbox, Group, Indicator, Menu, createStyles } from "@mantine/core";
import { useDatabase } from "../hooks/useDatabase";
import { getObjectValue } from "../utils/helpers";
import { useEffect, useState } from "react";
import { DatePicker, DateRangePicker } from "@mantine/dates";
import { Article, WordFrequency } from "../utils/types";
import { isSameDay } from "date-fns";
import { IconClick } from "@tabler/icons";
import SelectableList from "./SelectableList";
import { getWordFrequencies } from "../utils/keywords_handler";

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
  },
  popoverFooter: {
    borderTop: `thin solid ${theme.colorScheme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
    paddingTop: 10,
    marginTop: "1em"
  }
}));

export function FilterList(props: {
  label: string
  path: string
  basedOnFiltered: boolean
}) {

  const { articles, setFilterBy, filterBy, filteredArticles } = useDatabase()
  const [items, setItems] = useState<WordFrequency[]>([])

  useEffect(() => {
    setItems(getWordFrequencies(articles.map(a => getObjectValue(a, props.path))))
  }, [props.path, articles])

  useEffect(() => {
    if (props.basedOnFiltered) {
      setItems(getWordFrequencies(filteredArticles.map(a => getObjectValue(a, props.path))))
    }
  }, [props.path, filteredArticles, props.basedOnFiltered])

  const onChange = (value: string[]) => {
    console.log(value)
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
      items={items}
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
  const [basedOnFiltered, setBasedOnFiltered] = useState(false)

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
      <Checkbox mb="xs" label="Dynamic filters" checked={basedOnFiltered} onChange={(event) => setBasedOnFiltered(event.currentTarget.checked)} />
      <div className={classes.filtersPanel}>
        <div className={classes.filterListWrapper}><FilterList basedOnFiltered={basedOnFiltered} label="Language" path="out.infer_language" /></div>
        <div className={classes.filterListWrapper}><FilterList basedOnFiltered={basedOnFiltered} label="Publisher name" path="non_std.publisher_name" /></div>
        <div className={classes.filterListWrapper}><FilterList basedOnFiltered={basedOnFiltered} label="Source name" path="non_std.source_name" /></div>
      </div>
    </Box>
  )
}
