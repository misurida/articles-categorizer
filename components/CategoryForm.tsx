import React, { useEffect, useState } from "react";
import { TextInput, Group, Button, Stack, ActionIcon, Box, Collapse, Tooltip, MultiSelect, Switch, NumberInput, Paper, Modal, JsonInput, ColorInput, Text, createStyles, Popover, Tabs, Badge, Menu } from "@mantine/core";
import { useForm } from "@mantine/form";
import { Category, KeywordRule, SectionName } from "../utils/types";
import { stringToKey } from "../utils/helpers";
import { IconCalculator, IconCheck, IconDotsVertical, IconEdit, IconMinus, IconPlus } from "@tabler/icons";
import { defaultWeights, getLemmatized } from "../utils/keywords_handler";
import { useDebouncedValue } from "@mantine/hooks";


const useStyles = createStyles((theme) => ({
  keywordsList: {
    display: "inline-block",
    paddingLeft: "0.5em",
    width: "100%",
    fontSize: 12
  },
  keywordsRow: {
    display: "flex",
    alignItems: "start",
    "& > *:first-of-type": {
      minWidth: 20,
      marginTop: 5
    },
    "& > *:last-child": {
      flex: 1,
      width: "100%"
    }
  },
  hookInput: {
    "input": {
      height: 28,
    }
  },
  paddedInput: {
    "input": {
      paddingRight: "30px"
    }
  },
  disabledSection: {
    opacity: 0.5
  }
}))


export function RuleInputForm(props: {
  rule?: KeywordRule
  onChange: (rule: KeywordRule) => void
  label?: string
  weightPlaceholder?: string
  showInactive?: boolean
}) {

  const [localValue, setLocalValue] = useState<KeywordRule | undefined>()
  //const [debounced] = useDebouncedValue<KeywordRule | undefined>(localValue, 100)

  useEffect(() => {
    setLocalValue(props.rule)
  }, [props.rule])

  /* useEffect(() => {
    if (debounced) {
      props.onChange(debounced)
    }
  }, [debounced]) */

  const onArrayUpdate = (target: keyof KeywordRule, value: string[]) => {
    let v = { ...(props.rule || {}), [target]: value }
    if (!(v[target] as string[])?.length) delete v[target]
    props.onChange(v as KeywordRule)
  }

  const onNumberUpdate = (target: keyof KeywordRule, value?: number) => {
    let v = { ...(props.rule || {}), [target]: value }
    if (v[target] === undefined || v[target] === null) delete v[target]
    props.onChange(v as KeywordRule)
  }

  const onBooleanUpdate = (target: keyof KeywordRule, value?: boolean) => {
    let v = { ...(props.rule || {}), [target]: value }
    if (!v[target]) delete v[target]
    props.onChange(v as KeywordRule)
  }

  return (
    <Stack spacing={5}>
      {props.showInactive && (
        <Switch
          mt={5}
          size="xs"
          label={`Search in ${props.label || "section"}`}
          checked={!localValue?.inactive}
          onChange={(event) => onBooleanUpdate('inactive', !event.currentTarget.checked)}
        />
      )}
      <MultiSelect
        aria-label="Must contain any (value)"
        title="Must contain any"
        placeholder="Must contain any..."
        data={(localValue?.must_contain_any || []) as string[]}
        value={(localValue?.must_contain_any || []) as string[]}
        searchable
        creatable
        getCreateLabel={(query) => `+ Add « ${query} »`}
        onCreate={query => query.toLowerCase()}
        onChange={e => onArrayUpdate('must_contain_any', e)}
        disabled={props.showInactive && localValue?.inactive}
      />
      <MultiSelect
        aria-label="Must contain all (value)"
        title="Must contain all"
        placeholder="Must contain all..."
        data={(localValue?.must_contain_all || []) as string[]}
        value={(localValue?.must_contain_all || []) as string[]}
        searchable
        creatable
        getCreateLabel={(query) => `+ Add « ${query} »`}
        onCreate={query => query.toLowerCase()}
        onChange={e => onArrayUpdate('must_contain_all', e)}
        disabled={props.showInactive && localValue?.inactive}
      />
      <MultiSelect
        aria-label="Must not contain (value)"
        title="Must not contain"
        placeholder="Must not contain..."
        data={(localValue?.must_not_contain || []) as string[]}
        value={(localValue?.must_not_contain || []) as string[]}
        searchable
        creatable
        getCreateLabel={(query) => `+ Add « ${query} »`}
        onCreate={query => query.toLowerCase()}
        onChange={e => onArrayUpdate('must_not_contain', e)}
        disabled={props.showInactive && localValue?.inactive}
      />
      {!props.showInactive && (
        <NumberInput
          aria-label="Weight (value)"
          min={0}
          type="number"
          value={localValue?.weight || undefined}
          placeholder={props.weightPlaceholder || "Weight..."}
          onChange={e => onNumberUpdate('weight', e)}
          precision={2}
          step={0.1}
          disabled={props.showInactive && localValue?.inactive}
        />
      )}
      {props.showInactive && (
        <NumberInput
          aria-label="Boost (value)"
          value={localValue?.boost || undefined}
          placeholder="Boost..."
          onChange={e => onNumberUpdate('boost', e)}
          precision={1}
          disabled={props.showInactive && localValue?.inactive}
        />
      )}
    </Stack>
  )
}


export function RuleInput(props: {
  rule: KeywordRule
  onChange: (rule: KeywordRule) => void
  onDelete: () => void
  onAdd?: () => void
}) {

  const { classes, cx } = useStyles()
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [activeTab, setActiveTab] = useState<string | null>('all');
  const [showLemmatize, setShowLemmatize] = useState(false)
  const [lemmatizedValues, setLemmatizedValues] = useState<string[]>([])

  const [localValue, setLocalValue] = useState<string | undefined>()

  useEffect(() => {
    setLocalValue(props.rule.hook)
  }, [props.rule])

  const onSaveHook = () => {
    props.onChange({ ...props.rule, hook: localValue })
  }

  const onCheckClick = (e: React.MouseEvent) => {
    onSaveHook()
    if ((e.shiftKey || e.ctrlKey) && props.onAdd) {
      props.onAdd()
    }
  }
  const onHookKeyup = (e: React.KeyboardEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.key === "Enter") {
      onSaveHook()
    }
    return false
  }

  const handleChange = (value: KeywordRule, target?: string) => {
    if (target !== undefined) {
      let v = JSON.parse(JSON.stringify(props.rule))
      if (!Object.keys(value).length && v[target]) {
        delete v[target]
      }
      else {
        v[target] = value
      }
      props.onChange(v)
    }
    else {
      props.onChange(value)
    }
  }

  const computeLemmatize = () => {
    if (props.rule?.hook) {
      const base = props.rule.hook.split("|")
      const lemmat = base.map(h => getLemmatized(h)).filter(e => !!e && !base.includes(e))
      setLemmatizedValues(lemmat)
      setShowLemmatize(v => !v)
    }
  }

  const addLemmatized = () => {
    const t = localValue?.split("|") || []
    const tab = [...t, ...lemmatizedValues]
    props.onChange({ ...props.rule, hook: tab.join("|") })
    setShowLemmatize(false)
  }

  const toggleOptions = () => {
    setShowAdvanced(v => !v)
    setShowLemmatize(false)
  }

  return (
    <Box>
      <Stack spacing={5}>
        <Group spacing={5}>
          <TextInput
            autoFocus={!props.rule.hook}
            className={cx(classes.hookInput, { [classes.paddedInput]: (!!props.rule.hook && !!localValue) && localValue !== props.rule.hook })}
            sx={{ flex: 1 }}
            value={localValue || ""}
            variant="unstyled"
            onChange={e => setLocalValue(e.target.value)}
            onKeyUp={onHookKeyup}
            onBlur={onSaveHook}
            rightSection={localValue !== props.rule.hook && !!localValue && (
              <Tooltip withArrow label="Save">
                <ActionIcon size="xs" onClick={onCheckClick}>
                  <IconCheck size={16} />
                </ActionIcon>
              </Tooltip>
            )}
          />
          <Tooltip withArrow label="Rule options">
            <ActionIcon onClick={toggleOptions}>
              <IconEdit size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip withArrow label="Delete the rule">
            <ActionIcon onClick={props.onDelete}>
              <IconMinus size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
        {showAdvanced && (
          <Collapse in={showAdvanced}>
            <Paper p={5} withBorder mb="md">
              <Tabs value={activeTab} onTabChange={setActiveTab}>
                <Tabs.List>
                  <Tabs.Tab p={5} value="all"><Text size="xs">All sections</Text></Tabs.Tab>
                  <Tabs.Tab p={5} value="title"><Text size="xs" className={cx({ [classes.disabledSection]: props.rule?.title?.inactive })}>Title</Text></Tabs.Tab>
                  <Tabs.Tab p={5} value="body"><Text size="xs" className={cx({ [classes.disabledSection]: props.rule?.body?.inactive })}>Body</Text></Tabs.Tab>
                  <Popover opened={showLemmatize} onChange={setShowLemmatize}>
                    <Popover.Target>
                      <Tooltip label="Lemmatization" withArrow>
                        <ActionIcon ml="auto">
                          <IconCalculator onClick={computeLemmatize} size={14} />
                        </ActionIcon>
                      </Tooltip>
                    </Popover.Target>
                    <Popover.Dropdown>
                      {lemmatizedValues.length > 0 ? (
                        <Box>
                          <Text mb={5}>Lemmatized values:</Text>
                          <Group align="center">
                            {lemmatizedValues.map(l => (
                              <Badge sx={{ textTransform: "none" }} key={l}>{l}</Badge>
                            ))}
                          </Group>
                          <Group position="right">
                            <Button compact size="xs" mt="xs" onClick={addLemmatized}>Add lemmatized</Button>
                          </Group>
                        </Box>
                      ) : (
                        <Text>No lemmatize...</Text>
                      )}
                    </Popover.Dropdown>
                  </Popover>
                </Tabs.List>
                <Tabs.Panel value="all" mt={5}>
                  <RuleInputForm
                    rule={props.rule}
                    onChange={v => handleChange(v)}
                  />
                </Tabs.Panel>
                <Tabs.Panel value="title" mt={5}>
                  <RuleInputForm
                    rule={props.rule.title}
                    onChange={v => handleChange(v, 'title')}
                    weightPlaceholder={`Default weight: ${defaultWeights.title}`}
                    showInactive
                    label="Title"
                  />
                </Tabs.Panel>
                <Tabs.Panel value="body" mt={5}>
                  <RuleInputForm
                    rule={props.rule.body}
                    onChange={v => handleChange(v, 'body')}
                    weightPlaceholder={`Default weight: ${defaultWeights.body}`}
                    showInactive
                    label="Body"
                  />
                </Tabs.Panel>
              </Tabs>
            </Paper>
          </Collapse>
        )}
      </Stack>
    </Box>
  )
}



export default function CategoryForm(props: {
  category?: Category
  onSubmit: (values: Category) => void
  onSilentSubmit?: (values: Category) => void
  minimal?: boolean
  onDelete?: (values: Category) => void
}) {

  const { classes } = useStyles()
  const [showAddMultiple, setShowAddMultiple] = useState(false)
  const [multipleValue, setMultipleValue] = useState("")

  const form = useForm<Category>({
    initialValues: {
      name: '',
      key: '',
      id: '',
      rules: []
    }
  });

  useEffect(() => {
    if (props.category) {
      form.setValues(props.category)
    }
    else {
      form.reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.category])

  const submitSilently = (values: Category) => {
    if (props.onSilentSubmit) {
      props.onSilentSubmit(values)
    }
  }

  const addRule = () => {
    form.insertListItem("rules", { hook: "" })
  }

  const onRuleChange = (rule: KeywordRule, i: number) => {
    form.setFieldValue(`rules.${i}`, rule)
    let v = JSON.parse(JSON.stringify(form.values))
    v.rules.splice(i, 1, rule)
    submitSilently(v)
  }

  const onRuleDelete = (i: number) => {
    form.removeListItem("rules", i)
    let v = JSON.parse(JSON.stringify(form.values))
    v.rules.splice(i, 1)
    submitSilently(v)
  }

  const onNameChange = (value: string) => {
    form.setFieldValue("name", value)
    form.setFieldValue("key", stringToKey(value))
  }

  const cancelMultiple = () => {
    setMultipleValue("")
    setShowAddMultiple(false)
  }

  const createMultipleHooks = (hooks: string[]) => {
    for (const h of hooks) {
      if (typeof h === "string") {
        form.insertListItem("rules", { hook: h })
      }
    }
  }

  const importMultiple = () => {
    const v = JSON.parse(multipleValue)
    if (typeof v === "object") {
      const keys = Object.keys(v)
      if (keys.length > 0) {
        const k = keys[0]
        if (k) {
          onNameChange(k)
          createMultipleHooks(v[k])
          cancelMultiple()
        }
      }
    }
    else if (Array.isArray(v) && !!v.length) {
      createMultipleHooks(v)
      cancelMultiple()
    }
  }

  const onDelete = () => {
    if (props.onDelete && props.category) {
      props.onDelete(props.category)
    }
  }

  const submitForm = () => {
    props.onSubmit(form.values)
  }

  const onSectionsWeightChange = (target: SectionName, v?: number) => {
    let values: Category = JSON.parse(JSON.stringify(form.values))
    if (!values.sections_weights) {
      values.sections_weights = {}
    }
    if (v === undefined && values.sections_weights[target]) {
      delete values.sections_weights[target]
    }
    else {
      values.sections_weights[target] = v
    }
    form.setValues(values)
  }

  return (
    <Box>
      <Stack>
        {!props.minimal && (
          <>
            <TextInput
              withAsterisk
              label="Name"
              placeholder="Category name..."
              value={form.values.name}
              onChange={e => onNameChange(e.target.value)}
            />
            <TextInput
              withAsterisk
              label="Key"
              placeholder="Category key..."
              {...form.getInputProps('key')}
            />
            <TextInput
              label="Legacy key"
              placeholder="Category key..."
              {...form.getInputProps('legacy_key')}
              value={form.values.legacy_key || ""}
            />
            <ColorInput
              label="Category color"
              placeholder="A color to help identify the category..."
              {...form.getInputProps('color')}
              value={form.values.color || ""}
            />
            <Stack spacing={0}>
              <Text size="sm" italic mb="xs">Section weights</Text>
              <Group>
                <NumberInput
                  label="Title weight"
                  min={1}
                  placeholder={`Default value: ${defaultWeights.title}`}
                  value={form.values?.sections_weights?.title}
                  onChange={v => onSectionsWeightChange('title', v)}
                />
                <NumberInput
                  label="Body weight"
                  min={1}
                  placeholder={`Default value: ${defaultWeights.body}`}
                  value={form.values?.sections_weights?.body}
                  onChange={v => onSectionsWeightChange('body', v)}
                />
              </Group>
            </Stack>
            <Text size="sm" italic>Rules</Text>
          </>
        )}
        <Stack spacing={5}>
          <Group spacing="xs">
            <Button onClick={addRule} variant="default" leftIcon={<IconPlus size={14} />} compact>Add new rule</Button>
            <Menu shadow="md">
              <Menu.Target>
                <ActionIcon>
                  <IconDotsVertical size={16} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item onClick={() => setShowAddMultiple(true)}>Add multiple</Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
          <div className={classes.keywordsList}>
            {(form.values.rules || []).map((r, i) => (
              <div className={classes.keywordsRow} key={i}>
                <Text sx={{ fontSize: "inherit" }}>{i + 1}.</Text>
                <RuleInput
                  rule={r}
                  onChange={e => onRuleChange(e, i)}
                  onDelete={() => onRuleDelete(i)}
                  onAdd={addRule}
                />
              </div>
            ))}
          </div>
        </Stack>
        <Group position="right">
          {props.onDelete && (
            <Popover>
              <Popover.Target>
                <Button color="red" mr="auto">Delete</Button>
              </Popover.Target>
              <Popover.Dropdown>
                <Text>You&apos;re about to delete the category:</Text>
                <Text weight="bold" my={5}>&laquo; {props.category?.name} &raquo;</Text>
                <Text>Are you sure?</Text>
                <Group mt="md" position="right">
                  <Button compact variant="default">Cancel</Button>
                  <Button compact color="red" onClick={onDelete}>Confirm</Button>
                </Group>
              </Popover.Dropdown>
            </Popover>
          )}
          <Button type="submit" onClick={submitForm}>{props.category?.id ? "Save" : "Create"}</Button>
        </Group>
      </Stack>
      <Modal
        opened={showAddMultiple}
        onClose={() => setShowAddMultiple(false)}
        title="Import multiple rules"
      >
        <JsonInput
          label="Enter a JSON string array"
          placeholder={`{
  "Rule name": [
    "hook1",
    "hook3",
    ...
  ]
}`}
          validationError="Invalid json"
          formatOnBlur
          autosize
          minRows={4}
          value={multipleValue}
          onChange={setMultipleValue}
        />
        <Group position="right" mt="md">
          <Button variant="default" onClick={cancelMultiple}>Cancel</Button>
          <Button onClick={importMultiple}>Import</Button>
        </Group>
      </Modal>
    </Box>
  )
}
