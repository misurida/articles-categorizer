import { Group, ActionIcon, Box, useMantineColorScheme, useMantineTheme, Button, Menu, Modal, TextInput, Text, FileInput, Radio, Stack, NumberInput } from "@mantine/core";
import { IconSun, IconMoonStars, IconChevronDown, IconPlus, IconEdit, IconDownload, IconUpload, IconAlertTriangle, IconCloudDownload } from "@tabler/icons";
import AuthForm from "../user/AuthForm";
import router from "next/router";
import { useDatabase } from "../../../hooks/useDatabase";
import { useAuth } from "../../../hooks/useAuth";
import { Dataset } from "../../../utils/types";
import React, { useEffect, useState } from "react";
import { useForm } from "@mantine/form";
import { download, processFile, removeDuplicates, removeDuplicatesBy } from "../../../utils/helpers";

/**
 * Page layout actions, generally on the top right.
 * 
 * @returns 
 */
export default function HeaderActions() {

  const { toggleColorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const { datasets, updateData, dataset, deleteDataset, setDataset, addItem, fetchArticles, loading, setCategories, categories, articles, loadArticlesFromFile } = useDatabase()
  const { user } = useAuth()
  const [showEditDataset, setShowEditDataset] = useState(false)
  const [showNewDataset, setShowNewDataset] = useState(false)
  const [showImportDataset, setShowImportDataset] = useState(false)
  const [showImportArticles, setShowImportArticles] = useState(false)
  const [datasetFile, setDatasetFile] = useState<File | null>(null)
  const [articlesFile, setArticlesFile] = useState<File | null>(null)
  const [overwriteCategories, setOverwriteCategories] = useState(true)
  const [dbLimit, setDbLimit] = useState<number | undefined>(100)
  const [dbOffset, setDbOffset] = useState<number | undefined>()
  const [load, setLoad] = useState(false)

  const datasetForm = useForm<Dataset>()
  const newDatasetForm = useForm<Dataset>({
    initialValues: {
      name: "",
      userId: "",
      createdAt: new Date(),
      categories: []
    }
  })

  useEffect(() => {
    if (dataset && user?.uid) {
      datasetForm.setValues(dataset)
      datasetForm.setFieldValue("userId", user.uid)
    }
    else {
      datasetForm.reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataset, user?.uid])

  const datasetClick = (item: Dataset) => {
    setDataset(item)
  }

  const cancelForm = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowEditDataset(false)
  }

  const updateDataset = (item: Dataset) => {
    if (user?.uid && item.id && dataset?.id) {
      updateData(`datasets/${user.uid}/${dataset.id}`, item)
      setShowEditDataset(false)
    }
  }

  const createDataset = (item: Dataset) => {
    if (user?.uid) {
      const ds = { ...item, userId: user.uid }
      addItem(`datasets/${user.uid}`, ds)
      setShowNewDataset(false)
    }
  }

  const onDatasetDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    deleteDataset(dataset?.id, user?.uid)
    setShowEditDataset(false)
  }

  const exportDataset = () => {
    download(JSON.stringify(dataset), `${dataset?.name}.json`, "application/json")
  }


  const importDataset = async () => {
    if (datasetFile) {
      const data: any = await processFile(datasetFile)
      const cats = Array.isArray(data) ? data : data.categories || []
      if (overwriteCategories) {
        setCategories(cats, user?.uid)
      }
      else {
        const newCategories = removeDuplicatesBy([...categories, ...cats])
        setCategories(newCategories, user?.uid)
      }
      setShowImportDataset(false)
    }
  }

  const exportArticles = () => {
    download(JSON.stringify(articles), `${dataset?.name}_articles.json`, "application/json")
  }

  const importArticles = async () => {
    if (articlesFile) {
      setLoad(true)
      setShowImportArticles(false)
      await loadArticlesFromFile(articlesFile)
      setLoad(false)
    }
  }

  return (
    <Group spacing={5}>
      {/* <LanguageSelector /> */}
      {user?.uid && (
        <>
          <Menu shadow="md" width={220}>
            <Menu.Target>
              <Button variant="default" rightIcon={<IconChevronDown size={16} />}>{dataset?.name || "Datasets"}</Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>Dataset</Menu.Label>
              {datasets.length > 0 ? datasets.map((e, i) => (
                <Menu.Item key={e.name || i} onClick={() => datasetClick(e)}>{e.name}</Menu.Item>
              )) : (
                <Menu.Item disabled={true}>No Dataset yet...</Menu.Item>
              )}
              <Menu.Divider />
              <Menu.Label>Actions</Menu.Label>
              <Menu.Item disabled={!dataset} icon={<IconUpload size={14} />} onClick={() => setShowImportDataset(true)}>Import Dataset</Menu.Item>
              <Menu.Item disabled={!dataset} icon={<IconDownload size={14} />} onClick={exportDataset}>Export Dataset</Menu.Item>
              <Menu.Item icon={<IconPlus size={14} />} onClick={() => setShowNewDataset(true)}>Create a new Dataset</Menu.Item>
              <Menu.Item disabled={!dataset} icon={<IconEdit size={14} />} onClick={() => setShowEditDataset(true)}>Edit Dataset</Menu.Item>
            </Menu.Dropdown>
          </Menu>
          <Menu shadow="md" width={240}>
            <Menu.Target>
              <Button loading={loading || load} disabled={loading || load} variant="default" rightIcon={<IconChevronDown size={16} />}>Load articles</Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>Files</Menu.Label>
              <Menu.Item icon={<IconUpload size={14} />} onClick={() => setShowImportArticles(true)}>Import articles</Menu.Item>
              <Menu.Item disabled={!articles.length} icon={<IconDownload size={14} />} onClick={exportArticles}>Export articles</Menu.Item>
              <Menu.Divider />
              <Menu.Label>DB</Menu.Label>
              <Group spacing={5} p={5}>
                <NumberInput
                  sx={{ flex: 1 }}
                  size="xs"
                  placeholder="DB offset..."
                  value={dbOffset}
                  onChange={setDbOffset}
                />
                <NumberInput
                  sx={{ flex: 1 }}
                  size="xs"
                  placeholder="DB limit..."
                  value={dbLimit}
                  onChange={setDbLimit}
                />
              </Group>
              <Menu.Item icon={<IconCloudDownload size={14} />} onClick={() => fetchArticles(dbOffset, dbLimit)}>Load {dbLimit || "all"} articles from DB</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </>
      )}
      <ActionIcon variant="subtle" onClick={() => toggleColorScheme()} size="xl">
        {theme.colorScheme === 'dark' ? <IconSun size={16} /> : <IconMoonStars size={16} />}
      </ActionIcon>
      {router.route !== "/login" && (
        <Box ml={5}>
          <AuthForm asMenu />
        </Box>
      )}

      <Modal
        opened={showEditDataset}
        onClose={() => setShowEditDataset(false)}
        title="Update Dataset"
      >
        {datasetForm.values && (
          <form onSubmit={datasetForm.onSubmit(updateDataset)}>
            <TextInput
              withAsterisk
              label="Name"
              placeholder="Enter the Dataset name..."
              {...datasetForm.getInputProps('name')}
            />
            <Group position="right" mt="md">
              <Button onClick={onDatasetDelete} color="red" mr="auto">Delete</Button>
              <Button variant="default" onClick={cancelForm}>Cancel</Button>
              <Button type="submit">Save</Button>
            </Group>
          </form>
        )}
      </Modal>

      <Modal
        opened={showNewDataset}
        onClose={() => setShowNewDataset(false)}
        title="Create Dataset"
      >
        {datasetForm.values && (
          <form onSubmit={newDatasetForm.onSubmit(createDataset)}>
            <TextInput
              withAsterisk
              label="Name"
              placeholder="Enter the Dataset name..."
              {...newDatasetForm.getInputProps('name')}
            />
            <Group position="right" mt="md">
              <Button variant="default" onClick={cancelForm}>Cancel</Button>
              <Button type="submit">Save</Button>
            </Group>
          </form>
        )}
      </Modal>

      <Modal
        opened={showImportDataset}
        onClose={() => setShowImportDataset(false)}
        title="Import Dataset"
      >
        <FileInput
          label="JSON Dataset file"
          placeholder="Select a file containing the dataset to import..."
          withAsterisk
          value={datasetFile}
          onChange={setDatasetFile}
        />
        <Stack spacing={5} mt="md">
          <Radio label="Overwrite the categories" checked={overwriteCategories} onChange={(event) => setOverwriteCategories(true)} />
          <Radio label="Add to the categories" checked={!overwriteCategories} onChange={(event) => setOverwriteCategories(false)} />
        </Stack>
        <Group position="right" mt="md">
          <Button variant="default" onClick={() => setShowImportDataset(false)}>Cancel</Button>
          <Button disabled={!datasetFile} onClick={importDataset}>Import</Button>
        </Group>
      </Modal>

      <Modal
        opened={showImportArticles}
        onClose={() => setShowImportArticles(false)}
        title="Import Articles"
      >
        <FileInput
          label="JSON Articles file"
          placeholder="Select a file containing an array of articles to import..."
          withAsterisk
          value={articlesFile}
          onChange={setArticlesFile}
        />
        <Group position="right" mt="md">
          <Button variant="default" onClick={() => setShowImportArticles(false)}>Cancel</Button>
          <Button disabled={!articlesFile} onClick={importArticles}>Import</Button>
        </Group>
      </Modal>

    </Group>
  )
}
