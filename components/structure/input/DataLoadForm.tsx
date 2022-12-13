import { Box, Button, FileInput, Group, Modal, Stack } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { IconCheck, IconX } from "@tabler/icons";
import { Data, useData } from "../../../hooks/useData";
import { processFile } from "../../../utils/helpers";
import { isValidData } from "../../../utils/validation";
import { useState } from "react";

/**
 * Components used as a button and modal to load data from a JSON file.
 * To be used with the *useData()* hook.
 * 
 * @returns 
 */
export default function DataLoadForm() {

  const { loadData } = useData()
  const [opened, setOpened] = useState(false);
  const [loading, setLoading] = useState(false)
  const [combinedFile, setCombinedFile] = useState<File | null>(null)

  const load = async () => {
    if (combinedFile) {
      const data = await processFile<Data>(combinedFile);
      try {
        isValidData(data)
        setLoading(true)
        await loadData(data)
        setLoading(false)
        showNotification({ message: "Collection imported", color: "green", icon: <IconCheck size={18} /> })
        setOpened(false)
      }
      catch (e: any) {
        showNotification({ message: e, color: "red", icon: <IconX size={18} /> })
      }
    }
    return [] as any
  }

  return (
    <Box>
      <Stack>
        <Button fullWidth onClick={() => setOpened(true)}>Upload data</Button>
      </Stack>
      <Modal
        opened={opened}
        onClose={() => { if (!loading) setOpened(false) }}
        title="Upload data"
      >
        <FileInput
          placeholder="Upload a data json file..."
          label="Data"
          value={combinedFile}
          onChange={setCombinedFile}
        />
        <Group mt="md" position="right">
          <Button onClick={load} loading={loading} disabled={!combinedFile}>Load</Button>
        </Group>
      </Modal>
    </Box>
  )
}
