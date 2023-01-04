import { Box, Stack, Switch, createStyles, Text, SegmentedControl, Input, Radio } from "@mantine/core";
import { useDatabase } from "../hooks/useDatabase";
import { Category } from "../utils/types";

const useStyles = createStyles((theme) => ({
  optionsPanel: {
    textAlign: "left",
  },
  twoCol: {

    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gridGap: "0.5em 1.5em",
    [`@media (max-width: ${theme.breakpoints.sm}px)`]: {
      gridTemplateColumns: "1fr",
    },
  },
  seg: {
    display: "flex",
    flexDirection: "column"
  }
}));


export type CalendarMode = "range" | "after" | "before"

export default function DisplayOptionsPanel() {

  const { classes } = useStyles()
  const {
    articleRowDetails,
    setArticleRowDetails,
    scoreDisplaySource,
    setScoreDisplaySource,
    scoreDisplayMode,
    setScoreDisplayMode,
    categories,
    displayedCategories,
    setDisplayedCategories
  } = useDatabase()

  const handleChange = (target: string, value: boolean) => {
    setArticleRowDetails({ ...articleRowDetails, [target]: value })
  }

  const handleSetDisplaySource = (e: string) => {
    setScoreDisplaySource((e as any) || undefined)
  }

  const handleSetScoreDisplayMode = (e: string) => {
    setScoreDisplayMode(e as any)
  }

  const toggleDisplayCategory = (category: Category, value: boolean) => {
    if (displayedCategories.includes(category.id)) {
      setDisplayedCategories(displayedCategories.filter(c => c !== category.id))
    }
    else {
      setDisplayedCategories([...displayedCategories, category.id])
    }
  }

  return (
    <Box className={classes.optionsPanel}>
      <Text mb="md">Information to be displayed in the rows</Text>
      <div className={classes.twoCol}>
        <Switch label="Title" checked={!!articleRowDetails.title} onChange={(event) => handleChange('title', event.currentTarget.checked)} />
        <Switch label="Source name" checked={!!articleRowDetails.source_name} onChange={(event) => handleChange('source_name', event.currentTarget.checked)} />
        <Switch label="Publisher name" checked={!!articleRowDetails.publisher_name} onChange={(event) => handleChange('publisher_name', event.currentTarget.checked)} />
        <Switch label="Language" checked={!!articleRowDetails.lang} onChange={(event) => handleChange('lang', event.currentTarget.checked)} />
        <Switch label="Sections length" checked={!!articleRowDetails.sections_length} onChange={(event) => handleChange('sections_length', event.currentTarget.checked)} />
        <Switch label="Publication date" checked={!!articleRowDetails.publication_datetime} onChange={(event) => handleChange('publication_datetime', event.currentTarget.checked)} />
      </div>
      <Stack my="md">
        <Radio.Group
          value={scoreDisplaySource || ""}
          onChange={handleSetDisplaySource}
          label="Scores source"
        >
          <Radio value="legacy" label="Legacy" />
          <Radio value="computed" label="Computed" />
          <Radio value="delta" label="Delta" />
          <Radio value="" label={<Text sx={{opacity: 0.5}} italic>Combined</Text>} />
        </Radio.Group>
        <Input.Wrapper label="Scores mode" className={classes.seg}>
          <SegmentedControl
            value={scoreDisplayMode}
            onChange={handleSetScoreDisplayMode}
            data={[
              { label: 'Flex', value: 'flex' },
              { label: 'Grid', value: 'grid' }
            ]}
          />
        </Input.Wrapper>
      </Stack>
      <div className={classes.twoCol}>
        {categories.map(c => (
          <Switch
          key={c.id}
            id={c.id}
            label={c.name + " "}
            checked={!displayedCategories.length || displayedCategories.includes(c.id)}
            onChange={(event) => toggleDisplayCategory(c, event.currentTarget.checked)}
            color={c.color}
            styles={!displayedCategories.length || displayedCategories.includes(c.id) ? {
              "track": {
                borderColor: `${c.color}!important`,
                backgroundColor: `${c.color}!important`
              }
            } : {
              "thumb": {
                backgroundColor: `${c.color}!important`
              }
            }}
          />
        ))}
      </div>
    </Box>
  )
}
