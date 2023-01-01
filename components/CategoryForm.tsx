import { useEffect, useState } from "react";
import { TextInput, Group, Button, Stack, ActionIcon, Box, Collapse, Tooltip, MultiSelect, Switch, NumberInput, Paper, Modal, JsonInput, ColorInput, Text, createStyles, Popover } from "@mantine/core";
import { useForm } from "@mantine/form";
import { Category, KeywordRule, SectionName } from "../utils/types";
import { stringToKey } from "../utils/helpers";
import { IconEdit, IconMinus, IconPlus } from "@tabler/icons";


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
      height: 28
    }
  }
}))


export function RuleInput(props: {
  rule: KeywordRule
  onChange: (rule: KeywordRule) => void
  onDelete: () => void
}) {

  const { classes } = useStyles()
  const [showAdvanced, setShowAdvanced] = useState(false)

  const onMustContainAnyChange = (value: string[]) => {
    props.onChange({ ...props.rule, must_contain_any: value })
  }

  const onMustContainAllChange = (value: string[]) => {
    props.onChange({ ...props.rule, must_contain_all: value })
  }

  const onMustNotContainChange = (value: string[]) => {
    props.onChange({ ...props.rule, must_not_contain: value })
  }

  const onRestrictSectionsChange = (value: SectionName[]) => {
    props.onChange({ ...props.rule, restrict_sections: value })
  }

  const onEnforceMaximumChange = (value: boolean) => {
    props.onChange({ ...props.rule, enforce_maximum: value })
  }

  const onWeightChange = (value: number) => {
    props.onChange({ ...props.rule, weight: value })
  }

  return (
    <Box>
      <Stack spacing={5}>
        <Group spacing={5}>
          <TextInput
            className={classes.hookInput}
            sx={{ flex: 1 }}
            withAsterisk
            placeholder="Enter rule hook..."
            value={props.rule.hook}
            variant="unstyled"
            px="xs"
            onChange={e => props.onChange({ ...props.rule, hook: e.target.value.toLowerCase() })}
          />
          <Tooltip withArrow label="Rule options">
            <ActionIcon onClick={() => setShowAdvanced(v => !v)}>
              <IconEdit size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip withArrow label="Delete the rule">
            <ActionIcon onClick={props.onDelete}>
              <IconMinus size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
        <Collapse in={showAdvanced}>
          <Paper p={5} withBorder mb="md">
            <Stack spacing={5}>
              <MultiSelect
                title="Sections"
                data={["title", "snippet", "body"]}
                value={(props.rule.restrict_sections || []) as string[]}
                placeholder="Sections..."
                onChange={onRestrictSectionsChange}
              />
              <MultiSelect
                title="Must contain any"
                placeholder="Must contain any..."
                data={(props.rule.must_contain_any || []) as string[]}
                value={(props.rule.must_contain_any || []) as string[]}
                searchable
                creatable
                getCreateLabel={(query) => `+ Add ${query}`}
                onCreate={query => query.toLowerCase()}
                onChange={onMustContainAnyChange}
              />
              <MultiSelect
                title="Must contain all"
                placeholder="Must contain all..."
                data={(props.rule.must_contain_all || []) as string[]}
                value={(props.rule.must_contain_all || []) as string[]}
                searchable
                creatable
                getCreateLabel={(query) => `+ Add ${query}`}
                onCreate={query => query.toLowerCase()}
                onChange={onMustContainAllChange}
              />
              <MultiSelect
                title="Must not contain"
                placeholder="Must not contain..."
                data={(props.rule.must_not_contain || []) as string[]}
                value={(props.rule.must_not_contain || []) as string[]}
                searchable
                creatable
                getCreateLabel={(query) => `+ Add ${query}`}
                onCreate={query => query.toLowerCase()}
                onChange={onMustNotContainChange}
              />
              <Switch
                sx={{ display: "flex", alignItems: "center" }}
                label="Enforce maximum"
                checked={!!props.rule.enforce_maximum}
                onChange={e => onEnforceMaximumChange(e.currentTarget.checked)}
              />
              <NumberInput
                value={props.rule.weight || undefined}
                placeholder="Weight..."
                onChange={onWeightChange}
              />
            </Stack>
          </Paper>
        </Collapse>
      </Stack>
    </Box>
  )
}




export default function CategoryForm(props: {
  category?: Category
  onSubmit: (values: Category) => void
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

  const onRuleChange = (rule: KeywordRule, i: number) => {
    form.setFieldValue(`rules.${i}`, rule)
  }

  const addRule = () => {
    form.insertListItem("rules", { hook: "" })
  }

  const onRuleDelete = (i: number) => {
    form.removeListItem("rules", i)
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

  return (
    <Box>
      <form onSubmit={form.onSubmit(props.onSubmit)}>
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
              <Text size="sm">Rules</Text>
            </>
          )}
          <Stack spacing={5}>
            <Group spacing="xs">
              <Button onClick={addRule} variant="default" leftIcon={<IconPlus size={14} />} compact>Add new rule</Button>
              <Button onClick={() => setShowAddMultiple(true)} variant="subtle" color="gray" leftIcon={<IconPlus size={14} />} compact>Add multiple</Button>
            </Group>
            <div className={classes.keywordsList}>
              {(form.values.rules || []).map((r, i) => (
                <div className={classes.keywordsRow} key={i}>
                  <Text sx={{ fontSize: "inherit" }}>{i + 1}.</Text>
                  <RuleInput rule={r} onChange={e => onRuleChange(e, i)} onDelete={() => onRuleDelete(i)}></RuleInput>
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
            <Button type="submit">{props.category?.id ? "Save" : "Create"}</Button>
          </Group>
        </Stack>
      </form>
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
