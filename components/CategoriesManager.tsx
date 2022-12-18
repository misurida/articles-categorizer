import { Box, Button, Modal, Stack, Switch, Title, Tooltip } from "@mantine/core";
import { IconPlus } from "@tabler/icons";
import { useMemo, useState } from "react";
import { useDatabase } from "../hooks/useDatabase";
import { Category } from "../utils/types";
import { useAuth } from "../hooks/useAuth";
import { NodeModel } from "@minoru/react-dnd-treeview";
import CategoriesTree from "./CategoriesTree";
import CategoryForm from "./CategoryForm";


export default function CategoriesManager(props: {
  selection: string[]
  onSelect: (item?: Category) => void
}) {

  const { dataset, addCategory, updateCategory, deleteCategory, updateCategories, setCategories, andMode: orMode, setAndMode: setOrMode, selectedCategories } = useDatabase()
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
    setShowEdit(false)
  }

  const onSelect = (item: NodeModel) => {
    props.onSelect(categories.find(c => c.id === item.id))
  }

  const onDelete = (item: NodeModel) => {
    deleteCategory(categories.find(c => c.id === item.id), user?.uid)
  }

  return (
    <Box sx={{ display: "inline-block", margin: "0 auto" }}>
      <Title order={2} mb="md" sx={{ textAlign: "left" }}>Categories</Title>
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
            {selectedCategories.length > 0 && (
              <Tooltip withArrow label="AND / OR selection mode">
                <Stack align="flex-start">
                  <Switch size="md" onLabel="AND" offLabel="OR" checked={orMode} onChange={(event) => setOrMode(event.currentTarget.checked)} />
                </Stack>
              </Tooltip>
            )}
          </>
        )}
      />

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
        />
      </Modal>
    </Box>
  )
}
