import DataTable, { DataForm, DataTableColumnHeader, DataTableHeader, DataTableNavigation, DataTableProps, DataTableSearch, filterItems, FiltersObject, getDataTableTranslations, removeDuplicates } from "./DataTable"
import { ActionIcon, createStyles, MantineTheme, Text, Menu, Group, Button, Box, Popover, ThemeIcon, Paper, Chip, Modal, Tooltip, Input } from "@mantine/core"
import { IconCheck, IconChevronDown, IconDotsVertical, IconEdit, IconEye, IconLink, IconPlus, IconTable, IconTrash, IconX } from "@tabler/icons"
import { deleteObject, getDownloadURL, ref, uploadBytes, uploadBytesResumable } from "firebase/storage"
import { useCallback, useEffect, useRef, useState } from "react"
import { showNotification, updateNotification } from "@mantine/notifications"
import { getStringPart, humanFileSize, randId, uuidv4 } from "../../../utils/helpers"
import { TFunction, useTranslation } from "next-i18next"
import { FirebaseError } from "firebase/app"
import { useFirestore } from "../../../hooks/useFirestore"
import { useAuth } from "../../../hooks/useAuth"
import { storage } from "../../../utils/firebase"
import { Upload } from "../../../types/shell"
import { format } from "date-fns"

/**
 * Spacing between the tiles.
 */
const spacing = 5
const noInfoUpload = false

/**
 * Upload placeholder value
 */
export const defaultUpload: Upload = {
  name: "",
  size: 0,
  contentType: "",
  timeCreated: new Date().toString(),
  url: "",
  isPublic: false
}

/**
 * The firebase messages (short and full messages) in an object containing the error codes as keys.
 */
export const uploadErrorMessages = {
  "storage/unknown": {
    short: "Unknown error",
    i18n: 'unknown_error',
    full: "An unknown error occurred.",
  },
  "storage/object-not-found": {
    short: "Not found",
    i18n: 'file_not_found',
    full: "File not found.",
  },
  "storage/quota-exceeded": {
    short: "Quota exceeded",
    i18n: 'quota_exceeded',
    full: "Quota on the Cloud Storage bucket has been exceeded.",
  },
  "storage/unauthenticated": {
    short: "Unauthenticated",
    i18n: 'unauthenticated_user',
    full: "User is unauthenticated, please authenticate and try again.",
  },
  "storage/unauthorized": {
    short: "Unauthorized",
    i18n: '',
    full: "User is not authorized to perform the desired action.",
  },
  "storage/server-file-wrong-size": {
    short: "Wrong size",
    i18n: 'wrong_size',
    full: "File on the client does not match the size of the file received by the server. Try uploading again.",
  },
  "storage/invalid-url": {
    short: "Invalid url",
    i18n: 'invalid_url',
    full: "Invalid URL provided.",
  },
} as const

/**
 * Build an error message to be use for a notification from a firebase error.
 * 
 * @param e The firebase error
 * @returns A translated error message string
 */
export const buildUploadErrorMessage = (e: FirebaseError, t?: TFunction): string => {
  const defaultMessage = `Upload error (${e.code})`
  const msg = uploadErrorMessages[e.code as keyof typeof uploadErrorMessages] || ""
  return t ? t(`${msg.i18n}`) : msg.full || defaultMessage
}


/**
 * The style for all the MediaManager related components.
 */
const mediaManagerStyle = createStyles((theme: MantineTheme) => ({
  manager: {
    position: "relative"
  },
  grid: {
    position: "relative",
    display: "flex",
    flexWrap: "wrap",
    gap: spacing,

  },
  mask: {
    position: "absolute",
    width: "inherit",
    height: "inherit",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: -1,
    border: "3px dashed transparent",
    transition: "border .5s, background .5s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  drag: {
    borderColor: theme.colors.blue[7],
    zIndex: 3,
    backgroundColor: theme.colorScheme === 'dark' ? "rgba(0,0,0,0.8)" : "rgba(255,255,255,.8)",
  },
  tile: {
    border: theme.colorScheme === 'dark' ? "thin solid rgba(255,255,255,0.15)" : "thin solid rgba(0,0,0,0.15)",
    overflow: "hidden",
    padding: spacing * 1.5,
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
    backgroundPosition: "center",
    cursor: "pointer",
    transition: "border 1s",
    "&:hover": {
      boxShadow: "0px 0px 15px 0px rgba(0,0,0,0.5)"
    }
  },
  tileSelected: {
    transition: "border 1s",
    boxShadow: `0px 0px 15px 2px ${theme.colors.blue[7]}`,
    border: "1px solid " + theme.colors.blue[7],
    "&:hover": {
      boxShadow: `0px 0px 10px 4px ${theme.colors.blue[7]}`
    }
  },
  addTileWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: 8
  },
  addTileContent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: theme.colorScheme === 'dark' ? "thin solid rgba(255,255,255,0.15)" : "thin solid rgba(0,0,0,0.15)",
    flexDirection: "column",
    padding: spacing * 2,
    background: "transparent",
    cursor: "pointer",
    zIndex: 1,
    userSelect: "none",
    height: "100%",
    flex: 1
  },
  addTilePlus: {
    background: "transparent",
    marginTop: 10,
    ".icon": {
      transform: "scale(2)"
    }
  },
  filtersGroup: {
    padding: "0",
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "1em",
    minHeight: "38px"
  },
  fileInput: {
    display: "inline-block"
  }
}))


/**
 * A tile representing a file in the grid, displaying the image (if the file is an image) as background.
 * 
 * @param props 
 * @returns React.
 */
export function FileTile(props: {
  /**
   * The file represented by the tile.
   */
  item?: Upload
  /**
   * The path where the files are stored in the firebase database (default: '/uploads').
   */
  path?: string
  /**
   * Triggered when the tile is clicked.
   */
  onClick?: (e: React.MouseEvent) => void
  /**
   * If the tile is selected. Changes the style to represent the selection (blue border and outline).
   */
  selected?: boolean
  /**
   * THe tile height in px.
   */
  height: number
  /**
   * The tile width in px.
   */
  width: number
  /**
   * Triggered when the edit action is click from the tile actions menu.
   */
  onEdit?: () => void
}) {

  const { classes, cx } = mediaManagerStyle()
  const { deleteItem } = useFirestore()
  const { t } = useTranslation()
  const height = props.height
  const width = props.width
  const [showMenu, setShowMenu] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const path = props.path || "uploads"

  /**
   * Closes the menu and reset the delete confirmation.
   * @param show Value to force the menu state.
   */
  const cancel = (show?: any) => {
    setShowMenu(!!show)
    setConfirmDelete(false)
  }

  /**
   * Triggered when the action preview file is clicked in the tile menu.
   */
  const openFile = () => {
    setShowMenu(false);
    if (props.item) {
      window.open(props.item.url, "_blank");
    }
  }

  /**
   * Triggered when the delete file action is clicked in the tile menu.
   * Show a confirm prompt to validate the action, or delete right away if the ctrl key is pressed when clicked.
   * @param e The click event.
   */
  const clickDelete = (e: React.MouseEvent) => {
    if (e.ctrlKey) {
      deleteFile()
    }
    else {
      setConfirmDelete(true)
    }
  }

  /**
   * Handle the file deletion locally (at the tile level).
   * Delete the tile file (firebase) and the stored file (storage), then confirm the action with a notification.
   * Show an error message if the action throws an error.
   */
  const deleteFile = async () => {
    const item = props.item
    if (item) {
      cancel()
      try {
        showNotification({
          id: `delete-file-${item.id}`,
          message: t('deleting_item', { item: item.name }),
          loading: true,
        });
        const url = item.url
        await deleteItem(path, item.id)
        if (url) {
          await deleteObject(ref(storage, url))
        }
        updateNotification({
          id: `delete-file-${item.id}`,
          message: t('file_deleted'),
          color: "green",
          icon: <IconCheck size={18} />,
          loading: false
        })
      }
      catch (e: any) {
        updateNotification({
          id: `delete-file-${item.id}`,
          message: buildUploadErrorMessage(e, t),
          color: "red",
          icon: <IconX size={18} />,
          loading: false
        })
      }
    }
  }

  /**
   * Triggered when a tile is clicked.
   * Pass the click event to the parent if onClick is defined.
   * 
   * @param e The click event.
   */
  const handleClick = (e: React.MouseEvent) => {
    if (props.onClick) {
      props.onClick(e)
    }
  }

  /**
   * Triggered when the edit action is clicked from the tile menu.
   * Pass the click event to the parent if onEdit is defined.
   * 
   * @param e The click event. 
   */
  const onEdit = (e: React.MouseEvent) => {
    if (props.onEdit) {
      e.stopPropagation()
      props.onEdit()
      setShowMenu(false)
    }
  }

  return (
    <div
      tabIndex={0}
      className={cx(classes.tile, { [classes.tileSelected]: props.selected })}
      style={{ height, width, backgroundImage: `url(${props.item?.url})` }}
      title={props.item?.name}
      onClick={handleClick}
    >
      <Menu shadow="sm" width={160} opened={showMenu} onChange={cancel} closeOnItemClick={false}>
        <Menu.Target>
          <ActionIcon
            style={{ float: "right", zIndex: 1 }}
            variant="subtle"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation()
              setShowMenu((o) => !o)
            }}
          >
            <IconDotsVertical size={16} />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown onClick={e => e.stopPropagation()}>
          {props.item?.id && (
            <Menu.Item icon={<IconEdit size={14} />} onClick={onEdit}>{t('edit_file_details')}</Menu.Item>
          )}
          <Menu.Item icon={<IconEye size={14} />} onClick={openFile}>{t('show_file')}</Menu.Item>
          {confirmDelete ? (
            <Box m="sm">
              <Text size="sm" mb={5}>{t('are_you_sure')}</Text>
              <Group spacing={5}>
                <Button compact variant="default" onClick={cancel}>{t('cancel')}</Button>
                <Button compact color="red" onClick={deleteFile}>{t('delete')}</Button>
              </Group>
            </Box>
          ) : props.item?.id && (
            <Menu.Item color="red" icon={<IconTrash size={14} />} onClick={clickDelete}>{t('delete_file')}</Menu.Item>
          )}
        </Menu.Dropdown>
      </Menu>
    </div>
  )

}


/**
 * Plus button with a tile format used to open the MediaManager or upload a new file.
 * 
 * @param props 
 * @returns React.ReactNode
 */
export function AddFileButton(props: {
  /**
   * THe tile height in px.
   */
  height: number
  /**
   * The tile width in px.
   */
  width: number
  /**
   * Triggered when the button is clicked.
   */
  onClick: (e: React.MouseEvent) => void
  /**
   * If onLibraryClick is used, the click will trigger this event instead of the onClick event.
   * Used to show the MediaManager from a FileInput.
   */
  onLibraryClick?: (e: React.MouseEvent) => void
  /**
   * If false, hide the plus icon from the button.
   */
  showPlusIcon?: boolean
  /**
   * Custom text labels.
   */
  textLabels?: {
    selectAFile?: string
    clickOrDrop?: string
    toAddANewFile?: string
  }
}) {

  const { classes, cx } = mediaManagerStyle()
  const { t } = useTranslation()

  /**
   * Triggered when the button is clicked.
   * 
   * @param e The click event.
   */
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    props.onLibraryClick ? props.onLibraryClick(e) : props.onClick(e)
  }

  return (
    <Box className={classes.addTileWrapper} style={{ height: props.height, width: props.width }}>
      <button className={cx(classes.addTileContent, classes.tile)} onClick={handleClick}>
        {props.showPlusIcon !== false && (
          <ThemeIcon className={classes.addTilePlus} variant="light" color="gray">
            <IconPlus />
          </ThemeIcon>
        )}
        <Text size="xs" mt="md" align="center">
          {props.onLibraryClick ? (
            <span>
              <span>{props.textLabels?.selectAFile || t('select_a_file')}</span>
            </span>
          ) : (
            <span>
              <span>{props.textLabels?.clickOrDrop || t('click_or_drop')}</span>
              <br />
              <span>{props.textLabels?.toAddANewFile || t('to_add_a_new_file')}</span>
              <span></span>
            </span>
          )}
        </Text>
      </button>
    </Box>
  )
}


/**
 * The possible 3 values for the *valueType* attribute.
 */
type ValueType = "string" | "upload" | {
  /**
   * The url of the file.
   */
  url: string
  [key: string]: any
}

/**
 * A media manager grid with 3 modes:
 * - Default: grid of data items, clicking open the edition form.
 * - selectMode: grid of data items, clicking add the tile to the selection and select buttons are displayed.
 * - inputMode: displays only the provided value item(s), building an Upload objects list based on the provided value to display the tiles. 
 * 
 * @param props 
 * @returns React.ReactNode.
 */
export default function MediaManager<T>(props: {
  /**
   * The items to display.
   */
  data?: Upload[]
  /**
   * The firebase collection path to store the file references.
   */
  path?: string
  /**
   * Number of items to display per page.
   */
  perPage?: number
  /**
   * The input (selection) value.
   */
  value?: T | T[]
  /**
   * Triggered when the value changes.
   */
  onChange?: (data: T | T[]) => void
  /**
   * The type of value expected in value (T): "string", "upload" or a custom object containing the attribute url.
   */
  valueType?: ValueType
  /**
   * The value used for comparison (default: "url") and returned if `valueType` is "string".
   */
  valueProp?: keyof Upload
  /**
   * Triggered when the external AddFileButton is clicked.
   */
  onLibraryClick?: (e: React.MouseEvent) => void
  /**
   * Flag to use the MediaManager's inputMode.
   */
  inputMode?: boolean
  /**
   * Flag to use the MediaManager's selectMode.
   */
  selectMode?: boolean
  /**
   * Triggered when the select button is clicked (selectMode)
   */
  onSelect?: (items: Upload[]) => void
  /**
   * Triggered when the unselect button is clicked (selectMode)
   */
  onUnselect?: () => void
  /**
   * Triggered when the back button is clicked (selectMode)
   */
  onBack?: () => void
  /**
   * Triggered when a file is uploaded.
   */
  onUpload?: (item: Upload) => void
  /**
   * Custom text labels.
   */
  textLabels?: {
    selectAFile?: string
    clickOrDrop?: string
    toAddANewFile?: string
  }
  /**
   * If truthy (except Number(1)), multiple elements can be selected and an array will be returned.
   * If a number is specified, define the maximum number of elements that can be selected.
   */
  multiple?: number | true
  /**
   * The grid title
   */
  title?: React.ReactNode
}) {

  const { t } = useTranslation()
  const { classes, cx } = mediaManagerStyle()
  const { uploads, addItems, updateItem, deleteItem } = useFirestore()
  const { user } = useAuth()
  const [drag, setDrag] = useState(false) // if something is currently dragged (used for style).
  const [selectedItems, setSelectedItems] = useState<Upload[]>([]) // selection list.
  const maskRef = useRef<HTMLDivElement>(null) // dropping zone (mask) ref. 
  const mainRef = useRef<HTMLDivElement>(null) // MediaManager ref.
  const inputRef = useRef<HTMLInputElement>(null) // input file ref.
  const path = props.path || "uploads"
  const width = 130
  const height = width
  const isMultiple = (props.multiple && (props.multiple === true || props.multiple > 1)) || props.value && Array.isArray(props.value) // multiple mode: the value must be an array.
  const hasValue = !!props.value
  const valueType = props.valueType ? (typeof props.valueType === "string" ? props.valueType : "composite_object") : "string"
  const valueProp = props.valueProp || "url"

  const [localRows, setLocalRows] = useState<Upload[]>([]) // the displayed items.
  const [showSelectionMenu, setShowSelectionMenu] = useState(false) // show the selection menu (visible only if one or more items are selected).
  const [showFilters, setShowFilters] = useState(false) // display the filters in the actions top.
  const [confirmDeleteSelection, setConfirmDeleteSelection] = useState(false)
  const [showDataTable, setShowDataTable] = useState(false)
  const [selectedFile, setSelectedFile] = useState<Upload | undefined>() // file selected for the form.
  const [showFormModal, setShowFormModal] = useState(false)
  // datatable filters.
  const [query, setQuery] = useState("")
  const [tableFilters, setTableFilters] = useState<FiltersObject<Upload>>({})
  const [perPage, setPerPage] = useState(props.perPage)
  const [activePage, setPage] = useState(1)
  const [sortBy, setSortBy] = useState<DataTableProps<Upload>["useSort"]>("timeCreated")
  const [sortDesc, setSortDesc] = useState(true)
  const [restrictedTypes, setRestrictedTypes] = useState<string[]>([]) // list of selected types (for restriction).

  const uploadHeaders: DataTableHeader<Upload>[] = [{
    label: t('name'),
    prop: "name"
  }, {
    label: t('type'),
    prop: "contentType",
    disabled: true
  }, {
    label: t('size'),
    prop: "size",
    value: v => humanFileSize(v.size),
    disabled: true,
    useFilters: false
  }, {
    label: t('upload_date'),
    prop: "timeCreated",
    type: "date",
    value: v => format(new Date(v.timeCreated), "dd.MM.yyyy"),
    disabled: true,
    useFilters: false
  }, {
    label: t('url'),
    prop: "url",
    asString: v => v.url,
    value: v => <ActionIcon size="xs" onClick={() => window.open(v.url, "_blank")}><IconLink size={14} /></ActionIcon>,
    disabled: true,
    useFilters: false,
    useSort: false
  }]

  /**
   * Build a list of Upload items base on the provided value(s).
   * The value can be an array of T or a T item.
   * A T item can be:
   * - A. "https://" (url string)
   * - B. Upload (full upload object)
   * - C. { label: string, url: string, ... } (composite object)
   * 
   * @param value 
   * @returns 
   */
  const getItemsFromValue = useCallback((value?: T | T[]): Upload[] => {
    if (value) {
      // Array transformations
      if (Array.isArray(value)) {
        const output: Upload[] = []
        // Type A: string
        if (valueType === "string") {
          for (let i = 0; i < value.length; i++) {
            const item = uploads?.find((u: any) => u[valueProp] === value[i])
            output.push(item ? item : {
              ...defaultUpload,
              [valueProp]: value[i]
            })
          }
        }
        // Type B: upload
        else if (valueType === "upload") {
          return value as unknown as Upload[];
        }
        // Type C: composite
        else if (valueType === "composite_object") {

          for (let i = 0; i < value?.length || 0; i++) {
            const item = uploads?.find((u: any) => u[valueProp] === (value[i] as any)[valueProp])
            output.push(item ? item : {
              ...defaultUpload,
              ...value
            })
          }
        }
        return output;
      }
      // Simple item transformations
      else {
        // Type A: string
        if (valueType === "string" && typeof value === "string") {
          const sel = uploads?.find(u => u[valueProp] === value);
          return [sel ? sel : {
            ...defaultUpload,
            [valueProp]: value
          }]
        }
        // Type B: upload
        else if (valueType === "upload" && typeof value === "object") {
          return [value as unknown as Upload];
        }
        // Type C: composite
        else if (valueType === "composite_object" && typeof value === "object") {
          const sel = uploads?.find(u => u[valueProp] === (value as any)[valueProp]);
          return [sel ? { ...sel, ...value } : {
            ...defaultUpload,
            [valueProp]: (value as any)[valueProp]
          }]
        }
      }
    }
    return []
  }, [uploads, valueProp, valueType])

  /**
   * Update the displayed rows.
   */
  useEffect(() => {
    // setting the local rows and ending.
    if (props.inputMode) {
      setLocalRows(getItemsFromValue(props.value))
    }
    else {
      if (props.selectMode) {
        setSelectedItems(getItemsFromValue(props.value))
      }
      setLocalRows(filterItems(props.data || [], uploadHeaders, query, tableFilters, sortBy, sortDesc, activePage, perPage))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    props.data,
    props.value,
    props.inputMode,
    props.selectMode,
    query,
    perPage,
    activePage,
    sortBy,
    sortDesc,
    tableFilters,
    getItemsFromValue
  ])

  /**
   * Convert the restrictedTypes into table filters.
   */
  useEffect(() => {
    setTableFilters({ contentType: restrictedTypes.map(v => ([{ operator: "==", value: v }])) } as FiltersObject<Upload>)
  }, [restrictedTypes])


  // Event listeners
  const dragenter = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDrag(true)
  }
  const dragleave = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDrag(false)
  }
  const dragover = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }
  const drop = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDrag(false)
    let dt = e.dataTransfer
    if (dt) {
      let files = dt.files
      handleFiles(files)
    }
  }

  /**
   * Setup the drag/drop events.
   */
  useEffect(() => {
    const ref = maskRef.current
    const main = mainRef.current
    if (main) {
      main.addEventListener('dragenter', dragenter, false)
    }
    if (ref) {
      ref.addEventListener('dragenter', dragenter, false)
      ref.addEventListener('dragleave', dragleave, false)
      ref.addEventListener('dragover', dragover, false)
      ref.addEventListener('drop', drop, false)
    }
    return () => {
      if (ref) {
        ref.removeEventListener('dragenter', dragenter, false)
        ref.removeEventListener('dragleave', dragleave, false)
        ref.removeEventListener('dragover', dragover, false)
        ref.removeEventListener('drop', drop, false)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maskRef, mainRef])


  /**
   * Upload the provided files to the storage and create a file reference (Upload) in collection of the provided `path`.
   * 
   * 
   * @param files
   */
  const handleFiles = (files: FileList) => {
    // @ts-ignore
    for (const file of files) {
      // building the file ref based on the props flags
      const filePath = `${path}/${uuidv4()}/${file.name}`
      const fileRef = ref(storage, filePath);
      const uid = uuidv4()
      const item: Upload = {
        ...defaultUpload,
        uid: uid,
        name: file.name,
        size: file.size,
        contentType: file.type,
        userId: user?.uid
      }

      if (noInfoUpload) {
        uploadBytes(fileRef, file).then((snapshot) => {
          console.log('Uploaded a blob or file!');
        }).catch(e => console.log(e));
      }
      else {
        const task = uploadBytesResumable(fileRef, file)
        showNotification({
          id: `upload-file-${item.uid}`,
          title: item.name,
          message: t('uploading'),
          loading: true,
          disallowClose: true
        });
        // Register three observers:
        // 1. 'state_changed' observer, called any time the state changes
        // 2. Error observer, called on failure
        // 3. Completion observer, called on successful completion
        task.on('state_changed',
          (details) => {
            // Observe state change events such as progress, pause, and resume
            // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
            const progress = (details.bytesTransferred / details.totalBytes) * 100;
            showNotification({
              id: `upload-file-${item.uid}`,
              title: item.name,
              message: t('uploading_at', { percentage: progress.toFixed(0) }),
              loading: true,
            });
          },
          (e) => {
            debugger;
            updateNotification({
              id: `upload-file-${item.uid}`,
              title: item.name,
              message: buildUploadErrorMessage(e, t),
              color: "red",
              icon: <IconX size={18} />,
              loading: false,
              disallowClose: true
            })
          },
          async () => {
            // success
            updateNotification({
              id: `upload-file-${item.uid}`,
              title: item.name,
              message: t('file_uploaded'),
              color: "green",
              icon: <IconCheck size={18} />,
              loading: false,
              disallowClose: true
            })
            // getting the url for the FileShell
            getDownloadURL(task.snapshot.ref).then(async (url) => {
              // creating a firestore entry in the "upload" storage folder.
              const output: Upload = { ...item, url }
              addItems(path, [output])
              if (props.onUpload) {
                props.onUpload(output)
              }
            });
          }
        )
      }
    }
  }

  /**
   * Add or remove an upload from the selection.
   * 
   * @param item The upload to add or remove (if already in the selection).
   */
  const toggleItem = (item: Upload) => {
    const i = selectedItems.findIndex(it => it.id === item.id)
    if (i < 0) {
      // add to the selection
      const m = props.multiple;
      if (!(m && m > 1) || (m > selectedItems.length)) {
        setSelectedItems(isMultiple ? [...selectedItems, item] : [item])
      }
      else {
        showNotification({ message: t('you_can_select_n_items_maximum', { n: m }) })
      }
    }
    else {
      // remove from the selection
      setSelectedItems(isMultiple ? selectedItems.filter(it => it.id !== item.id) : [])
    }
  }

  /**
   * Triggered when a tile is clicked.
   * Does an action based on the mode:
   * - default and no value: open the edition form.
   * - inputMode: either open the MediaManager modal or select an item.
   * If the ctrl key is pressed when clicking, the item (if isMultiple is *true*) is added/removed from the selection,
   * event in default mode.
   * 
   * @param e The click event.
   * @param item The clicked file.
   */
  const handleClick = (e: React.MouseEvent, item: Upload) => {
    // adding to the selection
    if (props.inputMode && props.onLibraryClick) {
      props.onLibraryClick(e)
    }
    else {
      if (e.ctrlKey) {
        toggleItem(item)
      }
      else {
        if (hasValue || props.selectMode) {
          toggleItem(item)
        }
        else {
          openFileForm(item)
        }
      }
    }
  }

  /**
   * Triggered when a tile edit action is clicked.
   * Store the clicked file in *selectedFile* and open the form.
   * 
   * @param item The clicked file.
   */
  const openFileForm = (item: Upload) => {
    setSelectedFile(item)
    setShowFormModal(true)
  }

  /**
   * Close the selection menu and reset the delete confirmation.
   * 
   * @param value Option value, can be true to maintain the menu open.
   */
  const cancelSelectionMenu = (value?: any) => {
    setShowSelectionMenu(!!value)
    setConfirmDeleteSelection(false)
  }

  /**
   * Empty the selection array and closes the selection menu.
   */
  const cancelSelection = () => {
    cancelSelectionMenu()
    setSelectedItems([])
  }

  /**
   * Delete the provided files in the storage and the firestore.
   * Bulk delete from the table, but each tile has a single item delete function as well.
   * 
   * @param items The items to delete.
   */
  const deleteFiles = async (items: Upload[]) => {
    cancelSelectionMenu()
    for (const item of items) {
      try {
        showNotification({
          id: `delete-file-${item.id}`,
          message: t('deleting_item', { item: item.name }),
          loading: true,
        });
        const url = item.url
        await deleteItem(path, item.id)
        if (url) {
          await deleteObject(ref(storage, url))
        }
        updateNotification({
          id: `delete-file-${item.id}`,
          message: t('file_deleted'),
          color: "green",
          icon: <IconCheck size={18} />,
          loading: false
        })
      }
      catch (e: any) {
        updateNotification({
          id: `delete-file-${item.id}`,
          message: buildUploadErrorMessage(e, t),
          color: "red",
          icon: <IconX size={18} />,
          loading: false
        })
      }
    }
    cancelSelection()
  }

  /**
   * Triggered when the "add button" is clicked.
   * Open the file input native selection prompt.
   */
  const onAddButtonClick = () => {
    const input = inputRef.current
    if (input) {
      input.click()
    }
  }

  /**
   * Triggered when the input file is updated, aka when the use has selected files.
   * 
   * @param e The input change event (containing the files).
   */
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e?.target?.files
    if (files && files.length > 0) {
      handleFiles(files)
    }
  }

  /**
   * Close the edition form and reset the selected file.
   */
  const closeForm = () => {
    setSelectedFile(undefined)
    setShowFormModal(false)
  }

  /**
   * Update the firebase file entry base on the edition form values.
   * 
   * @param item The item to update.
   */
  const updateSelectedFile = (item: Partial<Upload>) => {
    updateItem(path, item.id, item)
    showNotification({
      message: t('file_details_updated'),
      color: "green",
      icon: <IconCheck size={18} />
    })
    closeForm()
  }

  /**
   * Bulk delete for the selection menu.
   */
  const deleteSelectedFile = () => {
    if (selectedFile) {
      deleteFiles([selectedFile])
      closeForm()
    }
  }

  /**
   * Triggered when the "add button" library click event is fired.
   * Pass the event to the parent if onLibraryClick is defined.
   * 
   * @param e The click event.
   */
  const onLibraryClick = (e: React.MouseEvent) => {
    if (props.onLibraryClick) {
      props.onLibraryClick(e)
    }
  }

  return (
    <div className={cx(classes.manager)} ref={mainRef}>
      {showDataTable && !props.inputMode ? (
        <DataTable<Upload>
          itemId="id"
          title={props.title}
          data={props.data || []}
          useSelectButton
          useSort
          useFilters
          useSearch
          labels={getDataTableTranslations(t)}
          headers={uploadHeaders}
          topRightIcons={(
            <Tooltip label={t('show_files_as_a_grid')}>
              <ActionIcon onClick={() => setShowDataTable(v => !v)}><IconTable size={18} /></ActionIcon>
            </Tooltip>
          )}
        />
      ) : (
        <>
          {!props.inputMode && (
            <div>
              {props.title}
              <Group>
                {(props.data?.length || 0) > 0 && (
                  <Group>
                    {selectedItems.length > 0 && (
                      <Group spacing={5}>
                        <Menu shadow="sm" opened={showSelectionMenu} onChange={cancelSelectionMenu} closeOnItemClick={false}>
                          <Menu.Target>
                            <Button
                              size="xs"
                              onClick={() => setShowSelectionMenu((o) => !o)}
                              rightIcon={<IconChevronDown size={16} />}
                            >
                              {t('n_selected', { n: selectedItems.length })}
                            </Button>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item onClick={cancelSelection}>{t('cancel_selection')}</Menu.Item>
                            {confirmDeleteSelection ? (
                              <Box m="sm">
                                <Text size="sm" mb={5}>{t('are_you_sure')}</Text>
                                <Group spacing={5}>
                                  <Button compact variant="default" onClick={cancelSelectionMenu}>{t('cancel')}</Button>
                                  <Button compact color="red" onClick={() => deleteFiles(selectedItems)}>{t('delete_n_files', { n: selectedItems.length })}</Button>
                                </Group>
                              </Box>
                            ) : (
                              <Menu.Item color="red" icon={<IconTrash size={14} />} onClick={() => { setConfirmDeleteSelection(true) }}>{t('delete_files')}</Menu.Item>
                            )}
                          </Menu.Dropdown>
                        </Menu>
                      </Group>
                    )}
                    <Paper className={classes.filtersGroup}>
                      <Button variant="default" size="xs" onClick={() => setShowFilters(v => !v)}>{showFilters ? t('hide_filters') : t('show_filters')}</Button>
                      {showFilters && (
                        <>
                          <DataTableColumnHeader
                            sortBy={sortBy}
                            setSortBy={setSortBy}
                            sortDesc={sortDesc}
                            setSortDesc={setSortDesc}
                            header={uploadHeaders.find(h => h.prop === "timeCreated")}
                          />
                          <DataTableColumnHeader
                            sortBy={sortBy}
                            setSortBy={setSortBy}
                            sortDesc={sortDesc}
                            setSortDesc={setSortDesc}
                            header={uploadHeaders.find(h => h.prop === "size")}
                          />
                          <DataTableColumnHeader
                            sortBy={sortBy}
                            setSortBy={setSortBy}
                            sortDesc={sortDesc}
                            setSortDesc={setSortDesc}
                            header={uploadHeaders.find(h => h.prop === "contentType")}
                          >
                            <Popover position="bottom" withArrow shadow="md">
                              <Popover.Target>
                                <ActionIcon>
                                  <IconChevronDown size={16} />
                                </ActionIcon>
                              </Popover.Target>
                              <Popover.Dropdown>
                                <Text size="xs" mb="xs">{t('see_only_the_categories')}</Text>
                                <Chip.Group multiple value={restrictedTypes} onChange={setRestrictedTypes} mb="lg">
                                  {removeDuplicates((props.data || []).map(e => getStringPart(e.contentType, 0))).map(e => (
                                    <Chip key={e} value={e}>{e}</Chip>
                                  ))}
                                </Chip.Group>
                                <Text size="xs" mb="xs">{t('see_only_the_file_types')}</Text>
                                <Chip.Group multiple value={restrictedTypes} onChange={setRestrictedTypes}>
                                  {removeDuplicates((props.data || []).map(e => getStringPart(e.contentType))).map(e => (
                                    <Chip key={e} value={e}>{e}</Chip>
                                  ))}
                                </Chip.Group>
                              </Popover.Dropdown>
                            </Popover>
                          </DataTableColumnHeader>
                        </>
                      )}
                      <DataTableSearch
                        value={query}
                        onChange={setQuery}
                        labels={{
                          searchPlaceholder: t('searchPlaceholder'),
                          searchTooltip: t('searchTooltip'),
                          cancelSearchTooltip: t('cancelSearchTooltip'),
                        }}
                      />
                    </Paper>
                    <Tooltip label={t('show_files_as_a_table')}>
                      <ActionIcon onClick={() => setShowDataTable(v => !v)}><IconTable size={18} /></ActionIcon>
                    </Tooltip>
                  </Group>
                )}
                {props.data && (
                  <Text size="sm" py="xs">{
                    props.data.length > 0 ?
                      props.data.length > 1 ? t('n_files', { n: props.data?.length }) : t('n_file', { n: props.data?.length }) :
                      t('no_files_available')
                  }</Text>
                )}
              </Group>
            </div>
          )}
          <div className={classes.grid}>
            {localRows.map(item => (
              <FileTile
                key={item.id || randId()}
                item={item}
                onClick={e => handleClick(e, item)}
                selected={!!selectedItems.find(e => e.id === item.id)}
                onEdit={() => openFileForm(item)}
                height={height}
                width={width}
              />
            ))}
            <input type="file" ref={inputRef} style={{ display: "none" }} multiple={isMultiple} onChange={onInputChange} />
            {!(props.inputMode && props.value && (!Array.isArray(props.value) || props.value.length > 0)) && (
              <AddFileButton
                width={width}
                height={height}
                onClick={onAddButtonClick}
                onLibraryClick={props.inputMode ? onLibraryClick : undefined}
                textLabels={props.textLabels}
              />
            )}
          </div>
          <Group position="right">
            {!props.inputMode && props.perPage && (
              <DataTableNavigation
                length={(props.data || []).length}
                perPage={perPage || 20}
                activePage={activePage}
                setPage={setPage}
                setPerPage={setPerPage}
              />
            )}
            {props.selectMode && (
              <Group spacing="xs" mt="md">
                {props.onBack && (
                  <Button variant="default" onClick={() => {
                    if (props.onBack) props.onBack()
                  }}>{t('back')}</Button>
                )}
                {props.onUnselect && props.value && (
                  <Button disabled={(Array.isArray(props.value) ? props.value : [props.value]).length <= 0} variant="outline" onClick={() => {
                    if (props.onUnselect) props.onUnselect()
                  }}>{t('unselect')}</Button>
                )}
                {props.onSelect && (
                  <Button disabled={selectedItems.length <= 0} onClick={() => {
                    if (props.onSelect) props.onSelect(selectedItems)
                  }}>{t('select')}</Button>
                )}
              </Group>
            )}
          </Group>
        </>
      )}
      <Modal
        opened={showFormModal}
        onClose={() => setShowFormModal(false)}
        title={t('file_details')}
      >
        <DataForm<Upload>
          headers={uploadHeaders}
          onChange={updateSelectedFile}
          closeForm={closeForm}
          value={selectedFile}
          onDelete={deleteSelectedFile}
          useReset={false}
          itemId="id"
          labels={{
            nothingFound: t('nothingFound'),
            cancel: t('cancel'),
            save: t('save'),
            create: t('create'),
            delete: t('delete'),
            sure: t('sure'),
            addItem: t('addItem')
          }}
        />
      </Modal>
      <div ref={maskRef} className={cx(classes.mask, { [classes.drag]: drag })}></div>
    </div >
  )
}


/**
 * A file input base on the MediaManager.
 * 
 * @param props 
 * @returns React.ReactNode.
 */
export function FileInput<T>(props: {
  label?: React.ReactNode
  value: T | T[]
  onChange: (data: T | T[]) => void
  valueProp?: keyof Upload
  valueType?: ValueType
  path?: string
  description?: React.ReactNode
  required?: boolean
  error?: React.ReactNode
  perPage?: number
  multiple?: number | true
  textLabels?: {
    selectAFile?: string
    clickOrDrop?: string
    toAddANewFile?: string
  }
}) {

  const { classes } = mediaManagerStyle()
  const { t } = useTranslation()
  const { uploads } = useFirestore()
  const [showModal, setShowModal] = useState(false)
  const isMultiple = (props.multiple && (props.multiple === true || props.multiple > 1)) || (props.value && Array.isArray(props.value))
  const valueType = props.valueType ? (typeof props.valueType === "string" ? props.valueType : "composite_object") : "string"

  const getModalSize = () => {
    const l = uploads?.length || 0
    if (l > 15) {
      return "xl"
    }
    if (l > 8) {
      return "lg"
    }
    return "md"
  }


  const buildCompositeItem = (item: Upload) => {
    if (typeof props.valueType === "object") {
      let o: any = {}
      for (const p in props.valueType) {
        if (item[(p as keyof Upload)]) o[p] = item[(p as keyof Upload)]
      }
      return o;
    }
    return item;
  }

  const onSelect = (items: Upload[]) => {
    const valueProp = props.valueProp || "url"
    setShowModal(false)
    if (isMultiple) {
      if (valueType === "string") {
        items.length > 0 ? props.onChange(items.map((e: any) => e[valueProp]) as unknown as T[]) : props.onChange([] as unknown as T[])
      }
      // B.
      else if (valueType === "upload") {
        props.onChange(items as unknown as T[])
      }
      // C.
      else if (valueType === "composite_object") {
        props.onChange(items.map(buildCompositeItem) as unknown as T[])
      }
    }
    else {
      if (valueType === "string") {
        items.length > 0 ? props.onChange(items[0][valueProp] as unknown as T) : props.onChange(null as unknown as T)
      }
      // B.
      else if (valueType === "upload") {
        props.onChange(items[0] as unknown as T)
      }
      // C.
      else if (valueType === "composite_object") {
        props.onChange(items.map(buildCompositeItem)[0] as unknown as T)
      }
    }
  }

  const onUnselect = () => {
    onSelect([])
  }

  return (
    <>
      <Input.Wrapper
        className={classes.fileInput}
        label={props.label}
        description={props.description}
        required={props.required}
        error={props.error}
      >
        <MediaManager
          inputMode
          data={uploads}
          value={props.value}
          onChange={props.onChange}
          path={props.path}
          perPage={props.perPage}
          onLibraryClick={() => setShowModal(v => !v)}
          valueType={props.valueType}
          valueProp={props.valueProp}
          textLabels={props.textLabels}
          multiple={props.multiple}
        ></MediaManager>
      </Input.Wrapper>
      <Modal
        opened={showModal}
        onClose={() => setShowModal(false)}
        title={t('my_files')}
        size={getModalSize()}
      >
        <MediaManager
          selectMode
          data={uploads}
          value={props.value}
          onChange={props.onChange}
          path={props.path}
          perPage={props.perPage}
          onBack={() => setShowModal(false)}
          onSelect={onSelect}
          onUnselect={onUnselect}
          valueType={props.valueType}
          valueProp={props.valueProp}
          textLabels={props.textLabels}
          multiple={props.multiple}
        ></MediaManager>
      </Modal>
    </>
  )
}
