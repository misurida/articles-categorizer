import { Box, Button, Modal, Paper, Popover, Stack, Switch, Title, Tooltip, Text, Input, Tabs } from "@mantine/core";
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


export default function CategoriesManager(props: {
  selection: string[]
}) {

  const { dataset, addCategory, updateCategory, deleteCategory, updateCategories, andMode, setAndMode, selectedCategories, categoryRowDetails, setCategoryRowDetails, toggleCategory, setSelectedCategories } = useDatabase()
  const [showNew, setShowNew] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>()
  const { user } = useAuth()

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

  const handleUpdate = (values: Category) => {
    updateCategory(values, user?.uid)
    showNotification({ message: "Category updated!", color: "green", icon: <IconCheck size={18} /> })
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
            <Popover position="bottom" withArrow shadow="lg">
              <Popover.Target>
                <Button compact variant='default' rightIcon={<IconChevronDown size={16} />}>
                  <Text weight="normal">Options</Text>
                </Button>
              </Popover.Target>
              <Popover.Dropdown sx={{ maxWidth: "90vw" }}>
                <Button mb="xs" fullWidth variant="default" onClick={unselectAll}>Unselect all</Button>
                {selectedCategories.length > 0 && (
                  <Input.Wrapper mb="md" label="Category selection mode" description="Affect the articles filtering">
                    <Stack align="flex-start">
                      <Switch size="md" onLabel="AND" offLabel="OR" checked={andMode} onChange={(event) => setAndMode(event.currentTarget.checked)} />
                    </Stack>
                  </Input.Wrapper>
                )}
                <Text mb="md">Category displayed info</Text>
                <Stack spacing="xs">
                  <Switch label="Color" checked={!!categoryRowDetails.color} onChange={(event) => handleChangeDisplay('color', event.currentTarget.checked)} />
                  <Switch label="Display button" checked={!!categoryRowDetails.display_button} onChange={(event) => handleChangeDisplay('display_button', event.currentTarget.checked)} />
                  <Switch label="Edit button" checked={!!categoryRowDetails.edit_button} onChange={(event) => handleChangeDisplay('edit_button', event.currentTarget.checked)} />
                  <Switch label="Count" checked={!!categoryRowDetails.count} onChange={(event) => handleChangeDisplay('count', event.currentTarget.checked)} />
                </Stack>
              </Popover.Dropdown>
            </Popover>
          </>
        )}
      />

      {selectedCategories.length > 0 && (
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
    </Box>
  )
}
