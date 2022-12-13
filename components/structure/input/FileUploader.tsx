import { Group, Text, useMantineTheme, MantineTheme, createStyles, Card, Image, Button, ActionIcon, Popover } from '@mantine/core';
import { FullMetadata, getDownloadURL, getMetadata, ref, StorageReference, deleteObject, uploadBytes } from 'firebase/storage';
import { IconUpload, IconPhoto, IconX, IconCheck, IconEye, IconFileUnknown } from '@tabler/icons';
import { TFunction, useTranslation } from 'next-i18next';
import { useEffect, useState } from 'react';
import { showNotification } from '@mantine/notifications';
import { FirebaseError } from 'firebase/app';
import { useFirestore } from '../../../hooks/useFirestore';
import { Dropzone } from '@mantine/dropzone';
import { storage } from '../../../utils/firebase';
import { where } from '@firebase/firestore';
import { uuidv4 } from '../../../utils/helpers';
import { buildUploadErrorMessage } from './MediaManager';



export interface FileError {
  message: string;
  code: string;
}

interface FileRejection {
  file: File;
  errors: FileError[];
}


const useItemStyle = createStyles((theme: MantineTheme, _params: void, getRef: (refName: string) => string) => ({
  item: {
    position: "relative",
    overflow: "hidden",
    "&:hover > *": {
      opacity: 1,
      transform: "translateY(0)",
    }
  },
  fileName: {
    transform: "translateY(0.5em)",
    position: "absolute",
    bottom: 0,
    right: 0,
    left: 0,
    zIndex: 0,
    fontSize: "0.75em",
    padding: 5,
    color: theme.white,
    transition: "opacity .2s, transform .2s",
    opacity: 0,
    backgroundColor: "rgba(0,0,0,0.5)"
  },
  itemActions: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    display: "flex",
    zIndex: 1,
    justifyContent: "flex-end",
    padding: 5,
    gap: 5,
    opacity: 0,
    transition: "opacity .4s",
  },
  notFoundIcon: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.2
  }
}))


interface FileItemProps {
  /**
   * The item value.
   */
  value: FileShell
  /**
   * The grid card width (140px by default).
   */
  width: number
  /**
   * The grid card height (140px by default).
   */
  height: number
  /**
   * Triggered when the delete action has been confirmed.
   * The file is deleted from the storage by the FileUploader.
   */
  onDelete: () => void
}


export function FileItem(props: FileItemProps) {

  const { t } = useTranslation()
  const file = props.value
  const { classes } = useItemStyle()

  /**
   * Preview file action.
   */
  const openFile = () => {
    window.open(file.url, "_blank");
  }

  /**
   * Delete file action.
   */
  const onDelete = () => {
    props.onDelete();
  }


  const clickDelete = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (e.ctrlKey) {
      onDelete();
    }
  }

  return (
    <>
      <div className={classes.item}>
        <div className={classes.itemActions}>
          {!file.notFound && (
            <ActionIcon color="primary" onClick={openFile}>
              <IconEye />
            </ActionIcon>
          )}
          <Popover
            position="bottom-end"
            transition="pop-top-right"
          >
            <Popover.Target>
              <ActionIcon color="red" onClick={clickDelete}>
                <IconX />
              </ActionIcon>
            </Popover.Target>
            <Popover.Dropdown sx={{ zIndex: 2 }}>
              <Text size="sm">{t('delete_file')}</Text>
              <Group position="right" mt="xs" spacing="xs">
                <Button size="xs" compact color="red" onClick={onDelete}>{t('yes')}</Button>
              </Group>
            </Popover.Dropdown>
          </Popover>
        </div>
        <Card shadow="sm">
          <Card.Section>
            <Image
              src={file.url}
              width={props.width}
              height={props.height || props.width}
              alt={file.name}
              withPlaceholder
              placeholder={<IconFileUnknown size={props.width / 2} />}
            />
          </Card.Section>
        </Card>
        {file.name && (
          <div className={classes.fileName} title={file.name}>
            {file.name}
          </div>
        )}
      </div>

    </>
  )
}

/**
 * An object containing the files attributes and meta data.
 * The property `url` contains the url to the file resource.
 * Also contains `storageRef` for deletion purpose.
 */
type FileShell = FullMetadata & {
  /**
   * The link to the file.
   */
  url: string
  /**
   * The firebase storage reference to do actions on the file resource.
   */
  storageRef?: StorageReference
  /**
   * If the file has not been found in the firebase storage.
   */
  notFound?: boolean
}


type FileValue<F> = F | F[]

const useStyle = createStyles((theme: MantineTheme) => ({
  gridZone: {
    display: "flex",
    gap: "1rem",
    flexWrap: "wrap"
  },
}))

/**
 * F can be a string or an object
 */
interface FileUploader<F> {
  /**
   * The path to store the files in the firebase storage.
   */
  path: string,
  /**
   * Array of string containing the accepted MIME types.
   */
  accept?: string[]
  /**
   * The Dropzone component name attribute.
   */
  name?: string
  /**
   * IF the Dropzone accepts multiple file upload.
   */
  multiple?: boolean
  /**
   * The maximum size of an uploaded file.
   */
  maxSize?: number
  /**
   * A custom value F (mostly strings) in an array (or not) containing the field values.
   * To be used in interaction with a form.
   */
  value?: FileValue<F>
  /**
   * Trigger when the values are changed.
   * To be used in interaction with a form.
   */
  onChange?: (value: FileValue<F>) => void
  /**
   * Second callback to add custom action on top of the onChange used by a form.
   */
  afterChange?: (value: FileValue<F>) => void
  /**
   * The width of a grid card.
   */
  width?: number
  /**
   * The height of a grid card.
   */
  height?: number
  /**
   * Disable the upload success notification.
   */
  noUploadNotification?: boolean
  /**
   * If true,the file name is replaced by a random uuid. Otherwise, it is conserved.
   */
  randomFileName?: boolean
  /**
   * If the file name must be converted, but under a random uuid named folder to avoid conflicts.
   */
  subFolder?: boolean
  /**
   * Main text to display in the dropzone.
   */
  label?: string
  /**
   * Secondary text to display in the dropzone.
   */
  message?: string
  /**
   * Function triggered when files are deleted.
   */
  onDelete?: () => void
  /**
   * The name of the firestore collection used to keep track of the uploaded files.
   * Defaults to "uploads"
   */
  firestoreCollection?: string
}

export default function FileUploader<F>(props: FileUploader<F>) {

  const { t } = useTranslation()
  const theme = useMantineTheme();
  const [progress, setProgress] = useState(0)
  const [localValue, setLocalValue] = useState<FileShell[]>([])
  const { classes } = useStyle()
  const { addItems, deleteItemsBy } = useFirestore()

  const width = props.width || 140
  const height = props.height || props.width || 140
  const firestoreCollection = props.firestoreCollection || "uploads"

  /**
   * Takes a array of strings expected to be file urls and convert the to FileShell objects.
   * Store the FileShell array to localValue and fetch the reference only if needed.
   * 
   * @param files 
   * @returns 
   */
  const buildLocalValue = async (files: FileValue<F>) => {
    let o: FileShell[] = []
    const theFiles = Array.isArray(files) ? files : (files ? [files] : [])
    for (const file of theFiles) {
      // first we check if the file reference has already been fetched
      const storedFile = localValue.find(v => v.url === (file as unknown as string)) || null;
      if (storedFile) {
        // we use the already fetch file with its metadata and reference.
        o.push(storedFile);
      }
      // otherwise we create a new reference
      else if (file) {
        try {
          const r = ref(storage, file as unknown as string)
          const metadata = await getMetadata(r)
          o.push({
            ...metadata,
            url: file as unknown as string,
            storageRef: r
          })
        }
        catch (e: unknown) {
          showNotification({ message: buildUploadErrorMessage(e as FirebaseError, t), color: "red", icon: <IconX size={18} /> })
          o.push({
            url: file as unknown as string,
            notFound: true,
            name: t('file_not_found')
          } as FileShell)
        }
      }
    }
    setLocalValue(o);
  }

  /**
   * Update the localValue state if props.values changes
   */
  // @ts-ignore
  useEffect(() => {
    if (props.value) {
      buildLocalValue(props.value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.value])

  /**
   * Triggered when the value changes.
   * Either update the parent value and is will be passed down and FileShelled again,
   * or the new references are directly FileShelled.
   * 
   * @param data The new data, in props.value format.
   */
  const onChange = (data: FileValue<F>) => {
    // if the FileUploader is hooked with a form, upload the values.
    if (props.onChange) {
      props.onChange(data);
      // if the data is empty (as an array or not -> null value), 
      // we reset the localValue array as well (deletion situation)
      if (!data || (Array.isArray(data) && !data?.length)) {
        setLocalValue([]);
      }
    }
    // otherwise, build the local value.
    else {
      data ? buildLocalValue(data) : setLocalValue([]);
    }
    // we also trigger the afterChange function is needed.
    if (props.afterChange) {
      props.afterChange(data);
    }
  }

  /**
   * Remove an item from the value array based on the item index in the array.
   * Call onChange to update the value after the removal.
   * 
   * @param index The item index.
   */
  const removeItemFromValue = (index: number) => {
    if (Array.isArray(props.value)) {
      const newValue = JSON.parse(JSON.stringify(props.value));
      newValue.splice(index, 1);
      onChange(newValue);
    }
    else {
      const newValue = props.multiple ? [] : "" as unknown as FileValue<F>
      onChange(newValue);
    }
  }

  /**
   * Triggered when the delete action is confirmed fo an item.
   * Delete the file in the storage using the storageRef.
   * Call removeItemFromValue to update and emit the new value.
   * 
   * @param file 
   * @param index 
   */
  const onDelete = async (file: FileShell, index: number) => {
    if (file.storageRef) {
      setProgress(1)
      try {
        await deleteObject(file.storageRef)
        showNotification({ message: t('file_deleted'), color: "green", icon: <IconCheck size={18} /> })
        removeItemFromValue(index)
        if (props.onDelete) {
          props.onDelete
        }
        else {
          deleteItemsBy(firestoreCollection, where("name", "==", file.name))
        }
        setProgress(0)
      }
      catch (e: unknown) {
        showNotification({ message: buildUploadErrorMessage(e as FirebaseError, t), color: "red", icon: <IconX size={18} /> })
        setProgress(0)
      }
    }
    else {
      removeItemFromValue(index)
    }
  }

  /**
   * Triggered when files are uploaded.
   * 
   * @param files 
   */
  const onDrop = async (files: File[]) => {

    const filesData: FileShell[] = [];
    setProgress(1);

    // uploading the files
    for (const file of files) {
      // building the file ref based on the props flags
      const fileName = props.randomFileName ? uuidv4() : file.name || uuidv4()
      const path = props.subFolder ? `${props.path}/${uuidv4()}/${file.name}` : `${props.path}/${fileName}`
      const fileRef = ref(storage, path);
      // trying the upload
      try {
        const fileData = await uploadBytes(fileRef, file);
        // success
        if (!props.noUploadNotification) {
          showNotification({ title: fileData.metadata.name, message: t('file_uploaded'), color: "green", icon: <IconCheck size={18} /> })
        }
        // getting the url for the FileShell
        const url = await getDownloadURL(fileData.ref)
        // pushing the FileShell
        filesData.push({
          ...fileData.metadata,
          storageRef: fileData.ref,
          url
        });
        // creating a firestore entry in the "upload" storage folder.
        addItems(firestoreCollection, [{
          name: fileData.metadata.name,
          size: fileData.metadata.size,
          contentType: fileData.metadata.contentType,
          timeCreated: fileData.metadata.timeCreated,
          url
        }])

        // if the image can only contain one image, the previous one is delete
        // if the current one's upload has been successful.
        if (!props.multiple) {
          if (localValue.length > 0) {
            await onDelete(localValue[0], 0);
          }
          break;
        }

      }
      // upload failed
      catch (e: unknown) {
        showNotification({ message: buildUploadErrorMessage(e as FirebaseError, t), color: "red", icon: <IconX size={18} /> })
      }
    }

    setProgress(0);
    const newUrls = filesData.map(f => f.url);
    setLocalValue([...localValue, ...filesData])
    // if the value must be an array
    if (props.multiple) {
      // invalid array
      if (!props.value || !Array.isArray(props.value) || (Array.isArray(props.value) && !props.value?.length)) {
        onChange(newUrls as unknown[] as F[]);
      }
      // valid array -> we append to the array
      else {
        onChange([...props.value, ...newUrls] as F[]);
      }
    }
    // if the value must be a string
    else {
      onChange(newUrls[0] as unknown as F);
    }
  }

  /**
   * Triggered when files are rejected.
   * 
   * @param files 
   */
  const onReject = (files: FileRejection[]) => {
    for (const f of files) {
      const message = f.errors.length > 1 ?
        <ul style={{ margin: 0, padding: "0 0 0 1.2rem" }}>{f.errors.map((e: FileError) => <li key={e.message}>{e.message}</li>)}</ul> :
        f.errors[0].message;
      showNotification({
        title: f.file.name,
        message: message,
        color: "red",
        icon: <IconX size={18} />,
        autoClose: 8000
      })
    }
  }


  return (
    <>
      <div className={classes.gridZone}>
        {!!localValue && localValue?.length > 0 && localValue.map((v, i) => (
          <FileItem
            key={JSON.stringify(v)}
            value={v}
            height={height}
            width={width}
            onDelete={() => onDelete(v, i)}
          />
        ))}
        <Card shadow="sm" style={{ width: "200px", padding: 0 }}>
          <Dropzone
            style={{
              height: "100%",
              alignItems: "center",
              justifyContent: "center",
              display: "flex"
            }}
            name={props.name}
            onDrop={onDrop}
            onReject={onReject}
            maxSize={props.maxSize || 3 * 1024 ** 2}
            accept={['image/*']}
            multiple={props.multiple}
            loading={progress > 0}
          >
            <Dropzone.Accept>
              <IconUpload
                size={50}
                stroke={1.5}
                color={theme.colors[theme.primaryColor][theme.colorScheme === 'dark' ? 4 : 6]}
              />
            </Dropzone.Accept>
            <Dropzone.Reject>
              <IconX
                size={50}
                stroke={1.5}
                color={theme.colors.red[theme.colorScheme === 'dark' ? 4 : 6]}
              />
            </Dropzone.Reject>
            <Dropzone.Idle>
              <IconPhoto size={50} stroke={1.5} />
            </Dropzone.Idle>
          </Dropzone>
        </Card>
      </div>
    </>
  );
}