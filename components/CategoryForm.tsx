import React, { useEffect, useState } from "react";
import { TextInput, Group, Button, Input, Stack, ActionIcon, Box, Collapse, Tooltip, MultiSelect, Switch, NumberInput, Paper, Modal, JsonInput, ColorInput, Slider } from "@mantine/core";
import { useForm } from "@mantine/form";
import { Category, KeywordRule, SectionName } from "../utils/types";
import { stringToKey } from "../utils/helpers";
import { IconEdit, IconMinus, IconPlus } from "@tabler/icons";




export function RuleInput(props: {
  rule: KeywordRule
  onChange: (rule: KeywordRule) => void
  onDelete: () => void
}) {

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
}) {

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

  return (
    <Box>
      <form onSubmit={form.onSubmit(props.onSubmit)}>
        <Stack>
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
          />
          <ColorInput
            label="Category color"
            placeholder="A color to help identify the category..."
            {...form.getInputProps('color')}
          />
          <Input.Wrapper label="Score threshold">
            <Slider
              mb="md"
              label={(value) => `${value.toFixed(1)}`}
              {...form.getInputProps('threshold')}
              min={0}
              max={10}
              step={0.1}
              marks={Array.from({ length: 11 }, (_, i) => i + 0).map(i => ({ value: i, label: String(i) }))}
            />
          </Input.Wrapper>

          <Input.Wrapper label="Rules">
            <Stack spacing={5}>
              <Group spacing="xs">
                <Button onClick={addRule} variant="default" leftIcon={<IconPlus size={14} />} compact>Add new rule</Button>
                <Button onClick={() => setShowAddMultiple(true)} variant="subtle" color="gray" leftIcon={<IconPlus size={14} />} compact>Add multiple</Button>
              </Group>
              <ol style={{ padding: 0, margin: 0, paddingLeft: "1.25em" }}>
                {(form.values.rules || []).map((r, i) => (
                  <li key={i}>
                    <RuleInput rule={r} onChange={e => onRuleChange(e, i)} onDelete={() => onRuleDelete(i)}></RuleInput>
                  </li>
                ))}
              </ol>
            </Stack>
          </Input.Wrapper>
          <Group position="right">
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
