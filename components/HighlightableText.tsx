import { Box, CloseButton, Group, Popover, Stack, Tooltip, createStyles, Text, ColorSwatch, useMantineTheme, Select, Button, ActionIcon, Sx, MantineNumberSize } from "@mantine/core";
import { useEffect, useMemo, useState } from "react";
import { getContrastColor, uuidv4 } from "../utils/helpers";
import { Category, TagsParameters, TextPart, TextPartPooled, TextPartPooledGroup, TextPartPos, TextPartType, TextPos, textPartTypes } from "../utils/types";
import { useDatabase } from "../hooks/useDatabase";
import { IconPlus } from "@tabler/icons";
import { useAuth } from "../hooks/useAuth";



const useStyles = createStyles((theme) => ({
  span: {
    display: "inline",
    position: "relative"
  },
  highlighted: {
    cursor: "pointer",
    "&:hover": {
      opacity: 0.8
    }
  },
  background: {
    background: theme.colorScheme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"
  },
  text: {
    maxWidth: "30vw",
  },
  inlayerPill: {
    border: `thin solid ${theme.colorScheme === "dark" ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.25)"}`,
    borderRadius: 5
  },
  inlayerHeader: {
    padding: "0 5px",
    width: "100%"
  },
  inlayerButtons: {
    display: "flex",
    "& > button:first-of-type": {
      borderRadius: "3px 0 0 3px"
    },
    "& > button:last-child": {
      borderRadius: "0 3px 3px 0",
      borderLeft: "none",
    }
  },
  inlayerButton: {
    border: "thin solid transparent",
    background: "transparent",
    flex: 1,
    cursor: "pointer",
    fontSize: "0.7em",
    padding: "2px 5px",
    fontWeight: "lighter",
    "&:hover": {
      opacity: 0.75
    }
  },
  btnDisabled: {
    pointerEvents: "none"
  },
  highBtn: {
    border: "thin solid #ccc"
  },
  underlined: {
    textDecorationLine: "underline",
    textDecorationThickness: 3,
    textDecorationColor: theme.colorScheme === "dark" ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.25)"
  }
}));


export function PopoverCategoryItem(props: {
  part: TextPartPooled
  onRemove: () => void
  onButtonClick: (item: TextPart, action?: TextPartType) => void
  usedCategories: string[]
  onSwapCategories: (newKey: string | null, text: string, oldKey?: string) => void
  onRemoveCategory: (text: string, value?: string) => void
}) {

  const { classes, cx } = useStyles()
  const theme = useMantineTheme();
  const { categories } = useDatabase()

  const category = useMemo(() => categories.find(c => c.key === props.part.categoryKey), [categories, props.part])

  const onButtonClick = (action?: TextPartType) => {
    let p: TextPartPooled = JSON.parse(JSON.stringify(props.part))
    if (p.typesPool) delete p.typesPool
    if (action) p.type = action
    props.onButtonClick(p, action)
  }

  return (
    <Stack spacing={0} className={classes.inlayerPill} sx={{ borderColor: (props.part.typesPool?.length || 0) > 0 ? category?.color : "transparent" }}>
      <Group spacing={5} className={classes.inlayerHeader}>
        <ColorSwatch size={14} color={category?.color || (theme.colorScheme === "dark" ? "#111" : "white")} />
        <Select
          size="xs"
          sx={{ flex: 4 }}
          data={categories.map(c => ({ label: c.name, value: c.key, disabled: props.usedCategories.includes(c.key) }))}
          onChange={v => props.onSwapCategories(v, props.part.text, category?.key)}
          value={category?.key || ""}
          placeholder="Select a category to link..."
          searchable
          variant="unstyled"
          rightSection={<span></span>}
        />
        {category?.key && (
          <Tooltip withArrow label="Remove category" openDelay={500}>
            <CloseButton onClick={() => props.onRemoveCategory(props.part.text, category?.key)} size="sm" aria-label="Remove category" />
          </Tooltip>
        )}
      </Group>
      <div className={classes.inlayerButtons}>
        {!!category && textPartTypes.map(t => (
          <button
            style={props.part.typesPool?.includes(t) ? { background: category?.color, color: getContrastColor(category?.color) } : undefined}
            className={cx(classes.inlayerButton, { [classes.btnDisabled]: !category, [classes.highBtn]: !props.part.typesPool?.length })}
            onClick={() => onButtonClick(t)}
            disabled={!category}
          >
            <Text sx={props.part.typesPool?.includes(t) ? { color: "currentcolor" } : undefined}>{t}</Text>
          </button>
        ))}
      </div>
    </Stack>
  )
}


export function PopoverTextGroup(props: {
  group: TextPartPooledGroup
  onRemove: (p: TextPartPooled) => void
  onButtonClick: (item: TextPart, action?: TextPartType) => void
  onSwapCategories: (newKey: string | null, text: string, oldKey?: string) => void
  onRemoveCategory: (text: string, value?: string) => void
  onAddNewCat: (value: string, text: string) => void
  onRemoveSelection: (text: string) => void
}) {

  const { classes } = useStyles()
  const { categories } = useDatabase()
  const [showAddCat, setShowAddCat] = useState(false)
  const [showConfirmRemove, setShowConfirmRemove] = useState(false)

  const usedCategories = useMemo(() => {
    return Array.from(new Set(props.group.parts.map(p => p.categoryKey).filter(e => !!e))) as string[]
  }, [props.group])

  const addNewCat = (value: string) => {
    setShowAddCat(false)
    props.onAddNewCat(value, props.group.text)
  }

  const removeSelection = () => {
    if (props.group.parts.some(p => p.categoryKey && (p.typesPool?.length || 0) > 0)) {
      setShowConfirmRemove(v => !v)
    }
    else {
      props.onRemoveSelection(props.group.text)
    }
  }

  const confirmRemove = () => {
    props.onRemoveSelection(props.group.text)
    setShowConfirmRemove(false)
  }

  return (
    <Box>
      <Group spacing={5}>
        <Text className={classes.text}>{props.group.text}</Text>
        {!props.group.parts.every(e => !e.categoryKey) && (
          <Popover opened={showAddCat} onChange={setShowAddCat} withArrow>
            <Popover.Target>
              <Tooltip withArrow label="Link new category" openDelay={500}>
                <ActionIcon color="primary" variant="subtle" size="sm" onClick={() => setShowAddCat(v => !v)}>
                  <IconPlus size={12} />
                </ActionIcon>
              </Tooltip>
            </Popover.Target>
            <Popover.Dropdown>
              <Select
                size="xs"
                sx={{ flex: 4 }}
                data={categories.map(c => ({ label: c.name, value: c.key, disabled: usedCategories.includes(c.key) }))}
                onChange={addNewCat}
                value={""}
                placeholder="Select a category..."
                searchable
                rightSection={''}
              />
            </Popover.Dropdown>
          </Popover>
        )}
        <Popover opened={showConfirmRemove} onChange={setShowConfirmRemove} withArrow>
          <Popover.Target>
            <Tooltip withArrow label="Remove selection" openDelay={500}>
              <CloseButton color="red" size="sm" ml="auto" mr={6} aria-label="Remove selection" onClick={removeSelection} />
            </Tooltip>
          </Popover.Target>
          <Popover.Dropdown>
            <Text size="sm">Are your sure?</Text>
            <Group spacing={5} mt={5}>
              <Button size="xs" compact variant="default" onClick={() => setShowConfirmRemove(false)}>Back</Button>
              <Button size="xs" compact color="red" onClick={confirmRemove}>Confirm</Button>
            </Group>
          </Popover.Dropdown>
        </Popover>
      </Group>
      <Stack spacing={5}>
        {props.group.parts.map(p => (
          <PopoverCategoryItem
            key={p.id}
            part={p}
            onRemove={() => props.onRemove(p)}
            onButtonClick={(item, action) => props.onButtonClick(item, action)}
            usedCategories={usedCategories}
            onSwapCategories={props.onSwapCategories}
            onRemoveCategory={(text, value) => props.onRemoveCategory(text, value)}
          />
        ))}
      </Stack>
    </Box>
  )
}



export function TextSpan(props: {
  id?: string
  part: TextPartPos
  onRemove: (part: TextPart) => void
  open?: boolean
  onClick: (e: React.MouseEvent) => void
  onSave: (newItem: TextPartPos, oldItem: TextPartPos) => void
  onRemoveHighlight: (text: string) => void
  parameters: TagsParameters
  textSize?: MantineNumberSize
}) {

  const { classes, cx } = useStyles()
  const [showPopover, setShowPopover] = useState(!!props.open);
  const { categories } = useDatabase()

  const [localValue, setLocalValue] = useState<TextPartPos | undefined>()

  useEffect(() => {
    setLocalValue(props.part)
  }, [props.part])

  const category = useMemo(() => {
    if (localValue?.payload && (localValue?.payload?.length || 0) > 0) {
      const p1 = localValue?.payload[localValue?.payload.length - 1]
      return categories.find(c => c.key === p1?.categoryKey && !!p1.type)
    }
    return undefined
  }, [localValue])

  const color = useMemo(() => {
    if (!localValue?.payload) {
      return undefined
    }
    const p1 = localValue?.payload[localValue?.payload.length - 1]
    if (p1?.color) {
      return p1.color
    }
    if (category?.color) {
      return category.color
    }
    return undefined
  }, [localValue])

  const categoryMergedPayload = useMemo(() => {
    // we group the types into typePool attributes
    const pooledItems: TextPartPooled[] = []
    if (localValue?.payload) {
      for (let i = 0; i < (localValue?.payload.length || 0); i++) {
        const p = localValue?.payload[i]
        const index = pooledItems.findIndex(e => e.categoryKey === p.categoryKey && e.text === p.text)
        if (index < 0) {
          let p2 = JSON.parse(JSON.stringify(p))
          if (p2.type) delete p2.type
          pooledItems.push({
            ...p2,
            typesPool: p.type ? [p.type] : []
          })
        }
        else {
          const o = pooledItems[index]
          pooledItems.splice(index, 1, {
            ...o,
            typesPool: p.type ? [...(o.typesPool || []), p.type] : o.typesPool
          })
        }
      }
    }
    // we group the pooled items
    const groupedItems: TextPartPooledGroup[] = []
    for (let i = 0; i < pooledItems.length; i++) {
      const p = pooledItems[i]
      const index = groupedItems.map(e => e.text).indexOf(p.text)
      if (index >= 0) {
        const group = groupedItems[index]
        groupedItems.splice(index, 1, {
          ...group,
          parts: [...group.parts, p]
        })
      }
      else {
        groupedItems.push({
          text: p.text,
          parts: [p]
        })
      }
    }
    return groupedItems
  }, [localValue, props.parameters])

  const textInlineStyle = useMemo(() => {
    let style: Sx = {}
    if (color && props.parameters.color) {
      if (props.parameters.background) {
        style.background = color
        style.color = getContrastColor(color)
      }
      style.textDecorationColor = color
    }
    return Object.keys(style).length > 0 ? style : undefined
  }, [color, props.parameters])


  const onRemove = (part: TextPart) => {
    props.onRemove(part)
    setShowPopover(false)
  }

  const handleSelClick = (e: React.MouseEvent) => {
    setShowPopover((o) => !o)
    props.onClick(e)
  }


  const onButtonClick = (item: TextPart, action?: TextPartType) => {
    if (localValue && item.categoryKey) {
      if (localValue.payload?.some(e => e.type === action && e.categoryKey === item.categoryKey && e.text === item.text)) {
        const index = localValue.payload?.findIndex(e => e.text === item.text && e.type === action && e.categoryKey === item.categoryKey) || -1
        let newPayload = localValue.payload?.filter(e => !(e.text === item.text && e.type === action && e.categoryKey === item.categoryKey)) || []
        if (!(newPayload.filter(e => e.text === item.text && e.categoryKey === item.categoryKey).length)) {
          let newItem = JSON.parse(JSON.stringify(item))
          if (item.type) delete newItem.type
          if (index > 0) {
            newPayload.splice(index, 0, newItem)
          }
          else {
            newPayload.push(newItem)
          }
        }
        setLocalValue({ ...localValue, payload: newPayload })
      }
      else {
        const newPayload = [...(localValue.payload || []), {
          ...item,
          type: action
        }]
        setLocalValue({
          ...localValue, payload: newPayload
        })
      }
    }
  }

  const onSwapCategories = (newKey: string | null, text: string, oldKey?: string) => {
    if (newKey && localValue) {
      const payload = (localValue?.payload || []).map(e => ({
        ...e,
        categoryKey: (e.categoryKey === oldKey && e.text === text) ? newKey : e.categoryKey,
        id: ((e.categoryKey === oldKey && e.text === text) || !e.id) ? uuidv4() : e.id
      }))
      setLocalValue({ ...localValue, payload })
    }
  }

  const onAddNewCat = (value: string, text: string) => {
    if (localValue) {
      const payload: TextPart[] = JSON.parse(JSON.stringify(localValue?.payload || []))
      payload.push({
        text: text,
        id: uuidv4(),
        categoryKey: value
      })
      setLocalValue({ ...localValue, payload })
    }
  }

  const onRemoveCategory = (text: string, value?: string, lastOfGroup?: boolean) => {
    if (value && localValue) {
      const payload = (localValue?.payload || []).filter(e => e.categoryKey !== value)
      if (lastOfGroup) {
        payload.push({
          text: text,
          id: localValue.id || uuidv4()
        })
      }
      setLocalValue({ ...localValue, payload })
    }
  }

  const onRemoveSelection = (text: string) => {
    if (text && localValue) {
      const payload = (localValue?.payload || []).filter(e => e.text !== text)
      if (payload.length === 0) {
        setShowPopover(false)
        props.onRemoveHighlight(text)
      }
      setLocalValue({ ...localValue, payload })
    }
  }

  const onSave = () => {
    if (localValue) {
      props.onSave(localValue, props.part)
      setShowPopover(false)
    }
  }

  const onCancel = () => {
    if (localValue) {
      setLocalValue(props.part)
    }
    setShowPopover(v => !v)
  }

  if ((props.part?.payload?.length || 0) > 0) {
    return (
      <Popover
        opened={showPopover}
        onChange={onCancel}
        position="top"
        middlewares={{ flip: true, shift: true, inline: true }}
        withArrow
        arrowSize={12}
        shadow="lg"
      >
        <Popover.Target>
          <Text
            id={props.id}
            onClick={handleSelClick}
            className={cx(classes.span, classes.highlighted, { [classes.underlined]: props.parameters.underline, [classes.background]: props.parameters.background })}
            sx={textInlineStyle}
            size={props.textSize}
          >
            {localValue?.text}
          </Text>
        </Popover.Target>

        <Popover.Dropdown>
          <Stack spacing={5}>
            <Stack spacing="sm">
              {categoryMergedPayload.map(group => (
                <PopoverTextGroup
                  key={group.text}
                  group={group}
                  onRemove={onRemove}
                  onButtonClick={onButtonClick}
                  onSwapCategories={onSwapCategories}
                  onRemoveCategory={(text, value) => onRemoveCategory(text, value, group.parts.length <= 1)}
                  onAddNewCat={onAddNewCat}
                  onRemoveSelection={onRemoveSelection}
                />
              ))}
            </Stack>
            <Group position="right" spacing={5}>
              <Button size="xs" compact variant="default" onClick={onCancel}>Cancel</Button>
              <Button size="xs" compact onClick={onSave}>Save</Button>
            </Group>
          </Stack>
        </Popover.Dropdown>
      </Popover>
    )
  }

  return (
    <Text
      id={props.id}
      className={classes.span}
      onClick={props.onClick}
      size={props.textSize}
    >
      {localValue?.text}
    </Text>
  )
}



export default function HighlightableText(props: {
  text: string
  selectedCategories: string[]
  parts: TextPart[]
  section?: string
  parameters: TagsParameters
  textSize?: MantineNumberSize
}) {

  const { classes, cx } = useStyles()

  const { user } = useAuth()
  const { categories, setCategories, selectedArticle, updateArticle, setSelectedArticle } = useDatabase()
  const [textChain, setTextChain] = useState<TextPartPos[]>([]) // text to be displayed
  const [localSelectedParts, setLocalSelectedParts] = useState<TextPart[]>([]) // selected pieces of text
  const [useRecurrence, setUseRecurrence] = useState(true)
  const [lastMouseIndex, setLastMouseIndex] = useState(0)

  useEffect(() => {
    setLocalSelectedParts(props.parts)
  }, [props.parts])

  const buildTextParts = (text: string, parts: TextPart[]): TextPartPos[] => {
    if (!parts.length) {
      return [{ text }]
    }

    // we compute the positions of all the targets
    const positions: TextPos[] = []
    for (let I = 0; I < parts.length; I++) {
      const part = parts[I]
      const l = part.text.length
      let from = 0;
      while (from >= 0) {
        const index = text.indexOf(part.text, from === 0 ? 0 : from + 1);
        if (index >= 0) {
          positions.push({
            id: part.id || uuidv4(),
            start: index,
            end: index + l - 1
          })
        }
        from = index
      }
    }

    // we sort the position based on the 'start' value
    positions.sort((a, b) => a.start - b.start)

    // we create the split block
    const splitParts: TextPartPos[] = []
    if (positions.length > 0) {
      let n0 = 0
      let lastSecIndex = 0
      for (let i = 0; i < text.length; i++) {
        let n = positions.filter(p => i >= p.start && i <= p.end).length
        // more part in parallel
        if (n > n0) {
          if (n0 === 0) {
            // we store simple text
            splitParts.push({
              text: text.slice(lastSecIndex, i),
              start: lastSecIndex,
              end: i - 1
            })
          }
          else {
            // we store the parts that have already started
            positions.filter(p => i - 1 >= p.start && i - 1 <= p.end).forEach(p => splitParts.push({
              text: text.slice(lastSecIndex, i),
              start: lastSecIndex,
              end: i - 1,
              id: p.id
            }))
          }
          lastSecIndex = i
        }
        // less parts in parallel
        else if (n < n0) {
          // we store the parts that where active one step before
          positions.filter(p => i - 1 >= p.start && i - 1 <= p.end).forEach(p => splitParts.push({
            text: text.slice(lastSecIndex, i),
            start: lastSecIndex,
            end: i - 1,
            id: p.id,
          }))
          lastSecIndex = i
        }
        // we update the stacks number
        n0 = n

        // ending with text
        if (i === text.length - 1) {
          if (n0 === 0) {
            splitParts.push({
              text: text.slice(lastSecIndex, i + 1),
              start: lastSecIndex,
              end: i
            })
          }
          else {
            positions.filter(p => i >= p.start && i <= p.end).forEach(p => splitParts.push({
              text: text.slice(lastSecIndex, i + 1),
              start: lastSecIndex,
              end: i,
              id: p.id,
            }))
          }
        }
      }
    }

    if (splitParts.length === 0) {
      splitParts.push({ text })
    }

    // we stack the parts
    const stackedParts: TextPartPos[] = []
    for (let i = 0; i < splitParts.length; i++) {
      const part = splitParts[i]
      const fullPart = parts.find(p => p.id === part.id)
      const index = stackedParts.findIndex(p => p.start === part.start && p.end === part.end)
      // similar has already been added
      if (index >= 0 && fullPart) {
        stackedParts[index].payload?.push(fullPart)
      }
      // add as new entry
      else {
        stackedParts.push({
          text: part.text,
          start: part.start,
          end: part.end,
          payload: fullPart ? [fullPart] : []
        })
      }
    }

    // we open up the last added part
    /* if (parts.length > 0) {
      let found = false
      const targetId = parts[parts.length - 1].id
      for (let i = 0; i < stackedParts.length && !found; i++) {
        const sp = stackedParts[i]
        if (sp.payload) {
          for (let j = 0; j < sp.payload.length && !found; j++) {
            const tp = sp.payload[j]
            // opening test
            if (tp.id === targetId && sp.start === lastMouseIndex) {
              found = true
              stackedParts[i].open = true
            }
          }
        }
      }
    } */

    return stackedParts
  }

  useEffect(() => {
    setTextChain(buildTextParts(props.text, localSelectedParts))
  }, [props.text, localSelectedParts, props.parameters])


  function handleHighlight() {
    const selObj = window?.getSelection()
    const sel = selObj?.toString() || "";
    if (selObj && sel) {
      const siblings = Array.from(selObj.anchorNode?.parentElement?.parentElement?.children || new HTMLCollection())
      const targetId = selObj.anchorNode?.parentElement?.id
      let total = 0
      let found = false
      for (let i = 0; (i < siblings.length) && !found; i++) {
        const s = siblings[i]
        const id = s.id
        if (id === targetId) {
          found = true
        }
        else if (!found) {
          total += s.textContent?.length || 0
        }
      }
      setLastMouseIndex(selObj.anchorOffset + total)
      const s = props.selectedCategories
      //debugger; 
      setLocalSelectedParts([...localSelectedParts, {
        text: sel.trim(),
        id: uuidv4(),
        start: selObj.anchorOffset,
        //color: buildColor()
      }])
    }
  }

  const onRemove = (part: TextPart) => {
    setLocalSelectedParts(localSelectedParts.filter(p => p.id !== part.id))
  }

  const onSave = (newItem: TextPartPos, oldItem: TextPartPos) => {
    const pool = newItem.payload?.filter(e => !!e.type) || []
    let categoriesList: Category[] = JSON.parse(JSON.stringify(categories))
    // keywords to add
    const keywordsToAdd = pool.filter(e => e.type === "keyword")
    if (keywordsToAdd.length > 0) {
      for (let i = 0; i < keywordsToAdd.length; i++) {
        let k = keywordsToAdd[i]
        const index = categoriesList.findIndex(c => c.key === k.categoryKey)
        if (index >= 0) {
          let cat = categoriesList[index]
          cat.quick_keywords = [...Array.from(new Set([...(cat.quick_keywords || []), k.text]))]
          categoriesList.splice(index, 1, cat)
        }
      }
    }

    // keywords to remove
    const keywordToAddIds = keywordsToAdd.map(e => e.id).filter(e => !!e)
    const keywordsToRemove = oldItem.payload?.filter(e => e.type === "keyword" && (!keywordToAddIds.includes(e.id))) || []
    if (keywordsToRemove.length > 0) {
      for (let i = 0; i < keywordsToRemove.length; i++) {
        let k = keywordsToRemove[i]
        const index = categoriesList.findIndex(c => c.key === k.categoryKey)
        if (index >= 0) {
          let cat = categoriesList[index]
          const keywordsPool = cat.quick_keywords?.filter(e => e !== k.text) || []
          cat.quick_keywords = keywordsPool
          if (!keywordsPool.length && cat.quick_keywords) {
            delete cat.quick_keywords
          }
          else {
            cat.quick_keywords = keywordsPool
          }
          categoriesList.splice(index, 1, cat)
        }
      }
    }

    setCategories(categoriesList, user?.uid)

    // extracts to add
    let articleExtracts = selectedArticle?.extracts || []
    const extractsToAdd = pool.filter(e => e.type === "extract")
    if (extractsToAdd.length > 0) {
      for (let i = 0; i < extractsToAdd.length; i++) {
        let k = extractsToAdd[i]
        if (k.type) delete k.type
        if (k.id) delete k.id
        if (props.section) k.section = props.section
        articleExtracts.push(k)
      }
    }

    // extracts to remove
    const extractToAddIds = extractsToAdd.map(e => e.id).filter(e => !!e)
    const extractsToRemove = oldItem.payload?.filter(e => e.type === "extract" && (!extractToAddIds.includes(e.id))) || []
    if (extractsToRemove.length > 0) {
      const removeTexts = extractsToRemove.map(e => e.text)
      articleExtracts = articleExtracts.filter(e => !removeTexts.includes(e.text))
    }

    if (extractsToAdd.length > 0 || extractsToRemove.length > 0) {
      let article = JSON.parse(JSON.stringify(selectedArticle))
      if (articleExtracts.length === 0 && article.extracts) {
        delete article.extracts
      }
      else {
        article.extracts = articleExtracts
      }
      updateArticle(article)
      setSelectedArticle(article)
    }
  }

  const onRemoveHighlight = (text: string) => {
    const toDelete = localSelectedParts.filter(p => p.text === text && !!p.categoryKey)
    if (toDelete.length > 0) {
      let categoriesList: Category[] = JSON.parse(JSON.stringify(categories))
      for (let i = 0; i < toDelete.length; i++) {
        let k = toDelete[i]
        const index = categoriesList.findIndex(c => c.key === k.categoryKey)
        if (index >= 0) {
          let cat = categoriesList[index]
          cat.quick_keywords = cat.quick_keywords?.filter(e => e !== text) || []
          categoriesList.splice(index, 1, cat)
        }
      }
      setCategories(categoriesList, user?.uid)
    }
    setLocalSelectedParts(localSelectedParts.filter(p => p.text !== text))
  }

  return (
    <Box>
      <div>
        {textChain.map(p => (
          <TextSpan
            id={p.id || uuidv4()}
            onClick={handleHighlight}
            key={p.text + (p.id || "") + p.start}
            part={p}
            open={p.open}
            onRemove={onRemove}
            onSave={onSave}
            onRemoveHighlight={onRemoveHighlight}
            parameters={props.parameters}
            textSize={props.textSize}
          />
        ))}
      </div>
    </Box>
  )
}
