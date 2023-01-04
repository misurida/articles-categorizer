import { Box, Button, Modal, Paper, Popover, Stack, Switch, Title, Tooltip, Text, Input, Tabs, Collapse } from "@mantine/core";
import { IconCheck, IconChevronDown, IconPlus } from "@tabler/icons";
import { useMemo, useState } from "react";
import { useDatabase } from "../hooks/useDatabase";
import { Category } from "../utils/types";
import { useAuth } from "../hooks/useAuth";
import { NodeModel } from "@minoru/react-dnd-treeview";
import CategoriesTree from "./CategoriesTree";
import CategoryForm from "./CategoryForm";
import { showNotification } from "@mantine/notifications";
import { TabsValue } from "@mantine/core/lib/Tabs";
import CategoriesStatistics from "./CategoriesStatistics";
import { buildColor } from "../utils/helpers";


export default function CategoriesManager(props: {
  selection: string[]
}) {

  const { dataset, addCategory, updateCategory, deleteCategory, updateCategories, andMode, setAndMode, selectedCategories, categoryRowDetails, setCategoryRowDetails, toggleCategory, setSelectedCategories } = useDatabase()
  const [showNew, setShowNew] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>()
  const { user } = useAuth()
  const [showStats, setShowStats] = useState(false)
  const [showPopover, setShowPopover] = useState(false)
  const [quickRules, setQuickRules] = useState(true)

  const categories = useMemo(() => {
    return dataset?.categories || []
  }, [dataset])

  const onTreeChange = (newTree: Category[]) => {
    updateCategories(newTree, user?.uid)
  }

  const handleCreate = (values: Category) => {
    addCategory(values, user?.uid)
    setShowNew(false)
  }

  const onEdit = (node: NodeModel) => {
    setSelectedCategory(categories.find(e => e.id === node.id))
    setShowEdit(true)
  }

  const handleUpdate = (values: Category, silent?: boolean) => {
    updateCategory(values, user?.uid)
    if(!silent) {
      showNotification({ message: "Category updated!", color: "green", icon: <IconCheck size={18} /> })
    }
    else {
      console.log("Category silently updated", values)
    }
    setShowEdit(false)
  }

  const onSelect = (item: NodeModel) => {
    toggleCategory(item as any) // only the id is used
    // selecting the category for quick keywords edition
    if (selectedCategories.includes(item.id.toString())) {
      if (selectedCategories.length > 0) {
        setSelectedCategory(categories.find(e => selectedCategories[0] === e.id))
      }
      else {
        setSelectedCategory(undefined)
      }
    }
    else {
      setSelectedCategory(categories.find(c => c.id === item.id))
    }
  }

  const onDelete = (item: NodeModel) => {
    deleteCategory(categories.find(c => c.id === item.id), user?.uid)
    showNotification({ message: "Category deleted!", color: "green", icon: <IconCheck size={18} /> })
    setShowEdit(false)
  }

  const handleChangeDisplay = (target: string, value: boolean) => {
    setCategoryRowDetails({ ...categoryRowDetails, [target]: value })
  }

  const setActiveTab = (value: TabsValue) => {
    setSelectedCategory(categories.find(c => c.id === value))
  }

  const unselectAll = () => {
    setSelectedCategories([])
    setShowPopover(false)
  }

  const randomizeColors = () => {
    updateCategories(categories.map(c => ({...c, color: buildColor()})), user?.uid)
    showNotification({ message: "Categories updated!", color: "green", icon: <IconCheck size={18} /> })
  }

  return (
    <Box sx={{ display: "inline-block", margin: "0 auto", padding: 0 }}>
      <Title order={2} mb="md" sx={{ textAlign: "left", margin: "5px 0" }} size="xl">Categories</Title>
      <CategoriesTree
        data={categories || []}
        onChange={onTreeChange}
        onEdit={onEdit}
        onSelect={onSelect}
        onDelete={onDelete}
        selection={props.selection}
        buttonChildren={(
          <>
            <Button compact leftIcon={<IconPlus size={16} />} onClick={() => setShowNew(true)}>Add new</Button>
            <Popover position="bottom" withArrow shadow="lg" opened={showPopover} onChange={setShowPopover}>
              <Popover.Target>
                <Button compact variant='default' onClick={() => setShowPopover(v => !v)} rightIcon={<IconChevronDown size={16} />}>
                  <Text weight="normal">Options</Text>
                </Button>
              </Popover.Target>
              <Popover.Dropdown sx={{ maxWidth: "90vw" }}>
                <Button mb="xs" fullWidth variant="default" onClick={unselectAll}>Unselect all</Button>
                <Button
                  mb="xs"
                  fullWidth
                  variant="default"
                  onClick={() => {
                    setShowStats(true)
                    setShowPopover(false)
                  }}>
                  Statistics
                </Button>
                <Input.Wrapper mb="md" label="Quick rules">
                  <Stack align="flex-start">
                    <Switch size="md" onLabel="ON" offLabel="OFF" checked={quickRules} onChange={(event) => setQuickRules(event.currentTarget.checked)} />
                  </Stack>
                </Input.Wrapper>
                {selectedCategories.length > 0 && (
                  <Input.Wrapper mb="md" label="AND / OR">
                    <Stack align="flex-start">
                      <Switch size="md" onLabel="AND" offLabel="OR" checked={andMode} onChange={(event) => setAndMode(event.currentTarget.checked)} />
                    </Stack>
                  </Input.Wrapper>
                )}
                <Text mb="xs" size="sm">Displayed info:</Text>
                <Stack spacing="xs">
                  <Switch label="Color" checked={!!categoryRowDetails.color} onChange={(event) => handleChangeDisplay('color', event.currentTarget.checked)} />
                  <Switch label="Display button" checked={!!categoryRowDetails.display_button} onChange={(event) => handleChangeDisplay('display_button', event.currentTarget.checked)} />
                  <Switch label="Edit button" checked={!!categoryRowDetails.edit_button} onChange={(event) => handleChangeDisplay('edit_button', event.currentTarget.checked)} />
                  <Switch label="Count" checked={!!categoryRowDetails.count} onChange={(event) => handleChangeDisplay('count', event.currentTarget.checked)} />
                </Stack>
                <Button mt="xs" fullWidth variant="default" onClick={randomizeColors}>Randomize colors</Button>
              </Popover.Dropdown>
            </Popover>
          </>
        )}
      />

      {quickRules && selectedCategories.length > 0 && (
        <Paper withBorder p="sm">
          <Tabs mb="xs" value={selectedCategory?.id} onTabChange={setActiveTab} sx={{ maxWidth: "max(400px, 35vw)" }}>
            <Tabs.List>
              {categories.filter(c => selectedCategories.includes(c.id)).map(e => (
                <Tabs.Tab key={e.id} value={e.id}>{e.name}</Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs>
          <CategoryForm
            minimal
            onSubmit={handleUpdate}
            onSilentSubmit={values => handleUpdate(values, true)}
            category={selectedCategory}
          />
        </Paper>
      )}

      <Modal
        opened={showNew}
        onClose={() => setShowNew(false)}
        title="Create category"
        size="lg"
      >
        <CategoryForm
          onSubmit={handleCreate}
        />
      </Modal>

      <Modal
        opened={showEdit}
        onClose={() => setShowEdit(false)}
        title="Edit category"
        size="lg"
      >
        <CategoryForm
          onSubmit={handleUpdate}
          category={selectedCategory}
          onDelete={val => onDelete(val as any)}
        />
      </Modal>

      <Modal
        opened={showStats}
        onClose={() => setShowStats(false)}
        title="Categories statistics"
        size="xl"
      >
        <CategoriesStatistics />
      </Modal>
    </Box>
  )
}
