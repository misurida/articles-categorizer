import { useEffect, useMemo, useState } from "react";
import { useDatabase } from "../hooks/useDatabase"
import { Box, Checkbox, Group, Text, Table, createStyles, Tooltip, ColorSwatch, useMantineTheme, Button, Stack } from "@mantine/core"
import { Article, ArticleSection, Category } from "../utils/types";
import { getContrastColor } from "../utils/helpers";
import { IconChevronDown, IconChevronRight } from "@tabler/icons";
import { countKeywords } from "../utils/advanced_search";

const useStyles = createStyles((theme) => ({
  table: {
    "td": {
      verticalAlign: "top"
    },
    "th, td": {
      position: "relative",
      "&:not(:last-child)::after": {
        content: "''",
        position: "absolute",
        right: 0,
        top: 6,
        bottom: 6,
        width: 1,
        background: theme.colorScheme === "dark" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"
      }
    }
  },
  checkbox: {
    display: "flex",
    alignItems: "center"
  },
  clickableCell: {
    cursor: "pointer",
    userSelect: "none"
  }
}));

export default function TagsSelector(props: {
  value: string[]
  onChange: (value: string[]) => void
  onSave: (value: string[], articles?: Article[]) => void
  articleSection?: ArticleSection | null
}) {

  const { classes } = useStyles()
  const theme = useMantineTheme();
  const { articles, categories, displayedCategories, selectedArticle, setSelectedArticle, selectedArticles, filteredArticles, setSelectedArticles } = useDatabase()
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  useEffect(() => {
    setSelectedTags(props.value || [])
  }, [props.value])

  const toggleTag = (c: Category) => {
    let sel = [...selectedTags, c.key]
    if (selectedTags.includes(c.key)) {
      sel = selectedTags.filter(t => t !== c.key)
    }
    setSelectedTags(sel)
    props.onChange(sel)
  }

  const cancel = () => {
    props.onChange(selectedArticle?.tags || [])
  }

  const onNext = () => {
    props.onSave(selectedTags, selectedArticle ? [selectedArticle] : [])
    // handleNextInList() copy
    const index = filteredArticles.findIndex(a => a.id === selectedArticle?.id)
    if (index >= 0) {
      const selArt = filteredArticles[index + 1]
      setSelectedArticle(selArt)
      if (selectedArticles.length <= 1) {
        setSelectedArticles([selArt.id])
      }
    }
    else if (filteredArticles.length > 0 && selectedArticles.length === 1) {
      setSelectedArticles([filteredArticles[0].id])
    }
  }


  return (
    <Stack>
      <Group position="center">
        <Box my="md">
          <Table className={classes.table}>
            <thead>
              <tr>
                <th colSpan={3}><Text size="xs">Tags</Text></th>
                <th colSpan={2}><Text size="xs">Keywords</Text></th>
              </tr>
            </thead>
            <tbody>
              {(displayedCategories.length > 0 ? categories.filter(c => displayedCategories.includes(c.id)) : categories).map(c => (
                <tr key={c.id}>
                  <td>
                    <Checkbox className={classes.checkbox} checked={selectedTags.includes(c.key)} onChange={() => toggleTag(c)}></Checkbox>
                  </td>
                  <td className={classes.clickableCell} onClick={() => toggleTag(c)}>
                    <ColorSwatch size={20} color={c.color || (theme.colorScheme === "dark" ? "#111" : "white")} />
                  </td>
                  <td className={classes.clickableCell} onClick={() => toggleTag(c)}>
                    <Tooltip withArrow openDelay={1000} label={`tag: ${c.key}`} arrowOffset={15} position="top-start">
                      <Text>{c.name}</Text>
                    </Tooltip>
                  </td>
                  <td>
                    <Stack spacing={0} align="flex-start">
                      {!!countKeywords(c, props.articleSection, selectedArticle) && (
                        <Button size="xs" variant="subtle" compact>{countKeywords(c, props.articleSection, selectedArticle)} Keywords</Button>
                      )}
                      {!!countKeywords(c, props.articleSection, selectedArticle) && (
                        <Button size="xs" variant="subtle" compact>{countKeywords(c, props.articleSection, selectedArticle)} Extracts</Button>
                      )}
                    </Stack>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Box>
      </Group>
      <Group position="center" spacing="xs">
        <Button variant="default" disabled={JSON.stringify(selectedArticle?.tags || []) === JSON.stringify(selectedTags)} onClick={cancel}>Cancel</Button>
        <Button variant="outline" onClick={() => props.onSave(selectedTags, selectedArticle ? [selectedArticle] : [])}>Save for previewed</Button>
        {selectedArticles.length > 1 && (
          <Button onClick={() => props.onSave(selectedTags, articles.filter(e => selectedArticles.includes(e.id)))}>Save for selection ({selectedArticles.length})</Button>
        )}
        <Button onClick={onNext} variant="subtle" rightIcon={<IconChevronRight size={16} />}>Next</Button>
      </Group>
    </Stack>
  )
}
