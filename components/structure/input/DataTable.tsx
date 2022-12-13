import { ActionIcon, Button, createStyles, Group, Modal, Table, TextInput, Box, Autocomplete, Text, Chip, Select, MultiSelect, Card, NumberInput, Switch, Textarea, Slider, Tabs, Input, Grid, Divider, Menu, Notification, Indicator, Checkbox, Badge, Pagination, Tooltip, SegmentedControl, SegmentedControlItem, Paper, JsonInput, Accordion, Popover } from '@mantine/core'
import { IconMinus, IconPlus, IconChevronDown, IconX, IconApps, IconTrash, IconSearch, IconDotsVertical, IconPencil, IconCopy, IconFileExport, IconTableImport, IconUpload, IconCheckbox } from '@tabler/icons';
import { CSSProperties, useCallback, useEffect, useRef, useState } from 'react'
import { useForm, FormErrors } from '@mantine/form';
import { randomId } from '@mantine/hooks';
import { randId } from '../../../utils/helpers';
import dynamic from 'next/dynamic'

interface InputPropsPayload<T> {
  value: T,
  onChange: (value: T) => void
  error?: string
}

// importing the RichTextEditor component only client-side
const RichTextEditor = dynamic(() => import('@mantine/rte'), {
  ssr: false,
  loading: () => null,
})

export const getDataTableTranslations = (t: any) => {
  return {
    select: t('select'),
    cancelSelection: t('cancelSelection'),
    editSelection: t('editSelection'),
    duplicateSelection: t('duplicateSelection'),
    deleteSelection: t('deleteSelection'),
    selectRows: t('selectRows'),
    addNewItemTooltip: t('addNewItemTooltip'),
    showImportWindow: t('showImportWindow'),
    searchPlaceholder: t('searchPlaceholder'),
    searchTooltip: t('searchTooltip'),
    cancelSearchTooltip: t('cancelSearchTooltip'),
    showCheckboxesTooltip: t('showCheckboxesTooltip'),
    hideCheckboxesTooltip: t('hideCheckboxesTooltip'),
    editRow: t('editRow'),
    duplicateRow: t('duplicateRow'),
    deleteRow: t('deleteRow'),
    copyRowToClipboard: t('copyRowToClipboard'),
    pasteRowFromClipboard: t('pasteRowFromClipboard'),
    modalEditMultiple: t('modalEditMultiple'),
    modalEditItem: t('modalEditItem'),
    modalCreateItem: t('modalCreateItem'),
    modalConfirmDelete: t('modalConfirmDelete'),
    modalImport: t('modalImport'),
    modalConfirmDeleteMultiple: t('modalConfirmDeleteMultiple'),
    areYouSure: t('areYouSure'),
    no: t('no'),
    yes: t('yes'),
    warningMultipleDelete: t('warningMultipleDelete'),
    importMessage: t('importMessage'),
    invalidJSON: t('invalidJSON'),
    importPlaceholder: t('importPlaceholder'),
    import: t('import'),
    cancel: t('cancel'),
    operatorInputPlaceholder: t('operatorInputPlaceholder'),
    equal: t('equal'),
    notEqual: t('notEqual'),
    filterValuePlaceholder: t('filterValuePlaceholder'),
    add: t('add'),
    addOrFilter: t('addOrFilter'),
    filterMenuTitle: t('filterMenuTitle'),
    basicInputPlaceholder: t('basicInputPlaceholder'),
    or: t('or'),
    and: t('and'),
    addAndFilter: t('addAndFilter'),
    typeEnterToAdd: t('typeEnterToAdd'),
    cancelFilters: t('cancelFilters'),
    simpleFilters: t('simpleFilters'),
    advancedFilters: t('advancedFilters'),
    nothingFound: t('nothingFound'),
    save: t('save'),
    create: t('create'),
    delete: t('delete'),
    sure: t('sure'),
    addItem: t('addItem'),
    clickToSort: t('clickToSort'),
  }
}

export const getDataFormTranslations = (t: any) => {
  return {
    nothingFound: t('nothingFound'),
    cancel: t('cancel'),
    save: t('save'),
    create: t('create'),
    delete: t('delete'),
    sure: t('sure'),
    addItem: t('addItem'),
  }
}

/**
 * Return the minimal number between a and b
 * 
 * @param a First number.
 * @param b Seconda number.
 * @returns The minimal number.
 */
export const min = function (a: number, b: number) {
  return b < a ? b : a;
}

/**
 * Function used as Array.filter() argument.
 * The array is expected to contain string values. 
 * @see https://stackoverflow.com/questions/1960473/get-all-unique-values-in-a-javascript-array-remove-duplicates
 * 
 * @param value The current value.
 * @param index The current index.
 * @param self The self object.
 * @returns A list of unique string values.
 */
export function onlyUnique(value: any, index: any, self: string | any[]) {
  return self.indexOf(value) === index;
}

/**
 * Return a string with the accents/diacritics converted to simple letters.
 * @see https://stackoverflow.com/questions/990904/remove-accents-diacritics-in-a-string-in-javascript
 * 
 * @param str The string to format.
 * @returns The formatted string.
 */
function norm(str: string) {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Check if a string is valid JSON.
 * 
 * @param str The string to check.
 * @returns True of the string is valid JSON.
 */
export const IsJsonString = (str: string) => {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

/**
 * Second method to copy a string to the clipboard.
 * Legacy method used as fallback.
 * 
 * @param text The text to copy to the clipboard.
 */
export const fallbackCopyTextToClipboard = (text: string) => {
  var textArea = document.createElement("textarea");
  textArea.value = text;

  // Avoid scrolling to bottom
  textArea.style.top = "0";
  textArea.style.left = "0";
  textArea.style.position = "fixed";

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    var successful = document.execCommand('copy');
    var msg = successful ? 'successful' : 'unsuccessful';
    console.log('Fallback: Copying text command was ' + msg);
  } catch (err) {
    console.error('Fallback: Oops, unable to copy', err);
  }

  document.body.removeChild(textArea);
}

/**
 * First method to copy a string to the clipboard.
 * Uses navigator.clipboard, or fallbackCopyTextToClipboard() as a fallback.
 * 
 * @param text The text to copy to the clipboard.
 */
export const copyTextToClipboard = (text: string) => {
  if (!navigator.clipboard) {
    fallbackCopyTextToClipboard(text);
    return;
  }
  navigator.clipboard.writeText(text).then(function () {
    console.log('Async: Copying to clipboard was successful!');
  }, function (err) {
    console.error('Async: Could not copy text: ', err);
  });
}

/**
 * Paste the clipboard copied value into a variable.
 * 
 * @returns The curently clipboard string.
 */
export const getTextFromClipboard = async () => {
  if (navigator.clipboard) {
    return await navigator.clipboard.readText()
  }
  return null;
}

/**
 * Takes an array and remove the duplicates.
 * 
 * @see https://stackoverflow.com/questions/9229645/remove-duplicate-values-from-js-array
 * @param {*} data An array of strings.
 * @returns The array with only distinct values.
 */
export const removeDuplicates = function (data: any[]) {
  return data.filter(function (item, pos, self) {
    return item && self.indexOf(item) == pos;
  });
}

/**
 * Build the options array, based on the header and the values.
 * 
 * @param header The header to build the options for.
 * @param values The values to compute the options from.
 * @param allowItemsAsObjects If the options can be a object containing: label, value and group.
 * @returns Return an array of options (string or label-value-group objects).
 */
export function buildOptions<T>(header: DataTableHeader<T>, values: any, allowItemsAsObjects?: boolean) {
  let options: any[] = header.options || [];
  // if the function getOptions() is provided, we use it to pre-filter the options
  if (header.getOptions) {
    options = header.getOptions(options, values)
  }
  // options formatting:
  if (options.length > 0 && typeof options[0] === "object") {
    options = options.map((o: any) => {
      let val = ""
      // we have a custom label and/or value
      if (header.oOption) {
        if (header.oLabel && header.oGroup) {
          return {
            label: o[header.oLabel] || "",
            value: o[header.oOption] || "",
            group: o[header.oGroup] || "",
          }
        }
        else if (header.oLabel) {
          return {
            label: o[header.oLabel] || "",
            value: o[header.oOption] || ""
          }
        }
        // the item is a single string to be used a value and label.
        else {
          val = o[header.oOption] ? String(o[header.oOption]) : "";
        }
      }
      // we have an object with no more info: we take the first value as label and value.
      else if (o && typeof o === "object" && !allowItemsAsObjects) {
        const v = Object.values(o);
        if (v.length > 0) val = v[0] ? String(v[0]) : "";
      }
      // we return the full object if already preformatted.
      else if (allowItemsAsObjects) {
        return o
      }
      return val;
    }).filter(v => !!v)
  }
  // option as string:
  if (!allowItemsAsObjects) {
    return options.filter(onlyUnique) as string[];
  }
  return options;
}

/**
 * Get a cell's value based on the header value() function or prop attribute.
 * 
 * @param header The header to build the value for.
 * @param item The item compute the value from.
 * @returns The value to display.
 */
export function getValue<T>(header: DataTableHeader<T>, item: any, toString = false) {
  if (!!header.value) {
    const v1 = header.value(item);
    if ((toString && typeof v1 === "string") || !toString) {
      return v1 as string
    }
    if (!toString) {
      return v1 as React.ReactNode
    }
  }
  if (!!header.asString) {
    const v2 = header.asString(item)
    if ((toString && typeof v2 === "string" && v2 !== "[object Object]")) {
      return v2 as string
    }
    if (!toString) {
      return v2 as React.ReactNode
    }
  }
  if (!!header.prop) {
    const v3 = item[header.prop]
    if ((toString && typeof v3 === "string")) {
      return v3 as string
    }
    if (!toString) {
      return v3 as React.ReactNode
    }
  }
  return "";
}

export function getFilterable<T>(header: DataTableHeader<T>, item: any): string[] {
  if (!!header.asStringArray) {
    return header.asStringArray(item)
  }
  if (!!header.asString) {
    const v2 = header.asString(item)
    return [v2]
  }
  if (!!header.prop) {
    const v3 = item[header.prop];
    if (typeof v3 === "string") {
      return [v3]
    }
    else if (!!v3 && Array.isArray(v3) && v3.length > 0 && v3.every(v => typeof v === "string")) {
      return v3
    }
  }
  if (!!header.value) {
    const v1 = header.value(item);
    if (typeof v1 === "string") {
      return [v1]
    }
    else if (!!v1 && Array.isArray(v1) && v1.length > 0 && v1.every(v => typeof v === "string")) {
      return v1
    }
    else if (!!v1 && Array.isArray(v1) && v1.length > 0 && !!header.oOption && v1.every(v => typeof v === "object")) {
      const oo = header.oOption as any;
      return v1.filter((v: any) => typeof v[oo] === "string").map((v: any) => v[oo])
    }
  }
  return [""];
}

const useInputListItemStyle = createStyles(theme => ({
  inputBloc: {
    flex: "1",
    display: "flex",
    alignItems: "center",
    gap: "0.5em",
    width: "100%"
  },
  valuesWrapper: {
    marginTop: 5,
    display: "flex",
    flexDirection: "column",
    gap: "0.25em"
  }
}))

interface ListInputProps<T> {
  /**
   * The header containing the field parameters.
   */
  header: DataTableHeader<T>
  /**
   * The input value (part of controlled behaviour).
   */
  value: string[]
  /**
   * The input onChange handler (part of controlled behaviour).
   * @param event The new input value.
   */
  onChange(value: string[]): void
  /**
   * The error message (part of controlled behaviour).
   */
  error?: React.ReactNode
  /**
   * All the current values of the item (from the `form` object).
   */
  values: any
  /**
   * Object defining the different text messages displayed to edit or change them for translation. 
   */
  labels?: {
    addItem?: string
  }
}

/**
 * Custom input used to manage an array of string as value.
 * The string values are displayed as inputs list and can be edited directly.
 * Mainly used by the buildFormItem() function.
 * 
 * @param props The input properties.
 * @returns The InputList component
 */
export function StringsListInput<T>(props: ListInputProps<T>) {

  const t = {
    addItem: "Add item",
    ...(props.labels || {})
  }

  const { classes } = useInputListItemStyle()
  const [localValue, setlocalValue] = useState<string[]>(props.value)

  const listRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => { setlocalValue(props.value) }, [props.value])

  /**
   * Add an empty item to the list.
   */
  const addItem = () => {
    if (!localValue) {
      setlocalValue([""])
      props.onChange([""]);
    }
    else {
      setlocalValue([...localValue, ""])
      props.onChange([...localValue, ""]);
    }

    // focus on the last input
    setTimeout(() => {
      if (listRef.current) {
        const inputs = listRef.current.querySelectorAll('input');
        if (inputs.length > 0) {
          inputs[inputs.length - 1].focus();
        }
      }
    }, 50)
  }

  /**
   * Remove an item from the list, based on it's index.
   * 
   * @param index The index of the item to remove.
   */
  const removeItem = (index: number) => {
    const lv = JSON.parse(JSON.stringify(localValue));
    lv.splice(index, 1);
    setlocalValue(lv);
    props.onChange(lv);
    // focus on the previous input
    setTimeout(() => {
      if (listRef.current) {
        const inputs = listRef.current.querySelectorAll('input');
        if (inputs.length > 0) {
          inputs[((index - 1) < 0 ? 0 : (index - 1))].focus();
        }
      }
    }, 50)
  }

  /**
   * Triggered when an input changes. Edit the indexed value.
   * 
   * @param value The new value.
   * @param index The item index.
   */
  const onChange = (value: React.FormEvent<HTMLInputElement>, index: number) => {
    const lv = JSON.parse(JSON.stringify(localValue));
    lv.splice(index, 1, value);
    props.onChange(lv);
  }

  /**
   * Key up handler for shortcuts:
   * - Enter: submit and add a new item,
   * - Escape: remove the item,
   * - Backspace: if the value is empty, remove the item.
   * 
   * @param event The keyup event.
   * @param i The item index.
   */
  const handleKeyUp = (event: React.KeyboardEvent<HTMLInputElement>, i: number) => {
    event.stopPropagation();
    if (event.key === "Escape") {
      removeItem(i);
    }
    if (event.key === "Enter") {
      event.preventDefault()
      addItem();
    }
    if (event.key === "Backspace" && !event.currentTarget.value) {
      removeItem(i);
    }
  }

  /**
   * Return the choosen input. If the header type is *autocomplete*, 
   * uses an Autocomplete input component instead of a TextInput.
   * 
   * @param header The field header.
   * @param value The field value.
   * @param i The field index.
   * @returns The field ReactNode.
   */
  const buildInput = (header: DataTableHeader<T>, value: string, i: number) => {
    if (header.type === "autocomplete") {
      return (
        <Autocomplete
          style={{ flex: 1 }}
          placeholder={header.placeholderMultiple && header.placeholderMultiple(i)}
          onKeyUp={e => handleKeyUp(e, i)}
          onInput={(e: any) => onChange(e.target.value, i)}
          value={value}
          data={buildOptions(header, props.values)}
        />
      )
    }
    return (
      <TextInput
        style={{ flex: 1 }}
        placeholder={header.placeholderMultiple && header.placeholderMultiple(i)}
        onKeyUp={e => handleKeyUp(e, i)}
        onInput={(e: any) => onChange(e.target.value, i)}
        value={value}
      />
    )
  }

  return (
    <Box>
      <Input.Wrapper
        label={props.header.label}
        description={props.header.description}
        required={props.header.required}
        error={props.error}
      >
        {!!localValue && (
          <div ref={listRef} className={classes.valuesWrapper}>
            {localValue.map((value: any, i: number) => (
              <div className={classes.inputBloc} key={i}>
                <>
                  {buildInput(props.header, value, i)}
                  <ActionIcon tabIndex={1} color="red" onClick={() => removeItem(i)}>
                    <IconMinus size={16} />
                  </ActionIcon>
                </>
              </div>
            ))}
          </div>
        )}
      </Input.Wrapper>
      <Button
        mt={5}
        variant='subtle'
        size="xs"
        onClick={addItem}
        leftIcon={<IconPlus size={16} />}
      >
        {t.addItem} ({props.header.label})
      </Button>
    </Box>
  )
}

const useColumnMenuStyle = createStyles(theme => ({
  menuCaret: {
    opacity: 0.5,
    transition: "opacity .2s",
    "&:hover": {
      opacity: 1
    }
  },
  select: {
    "& .mantine-MultiSelect-value": {
      display: "none!important"
    }
  },
  andBox: {
    display: "flex",
    padding: "5px!important",
    gap: 5,
    alignItems: "baseline",
    paddingLeft: 5,
    transition: "border .2s",
    border: "thin solid transparent",
    "&:hover": {
      borderColor: theme.colorScheme === "light" ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.2)"
    }
  },
  badgeBox: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 5,
  },
  tooltipLabel: {
    "& em": {
      display: "inline-block",
      margin: "0 10px"
    }
  }
}))


interface AdvancedFilterProps {
  /**
   * The available options (for a quick select).
   */
  options: any[]
  onChange: (item: FilterValue) => void
  smallBtn?: boolean
  /**
   * Object defining the different text messages displayed to edit or change them for translation. 
   */
  textLabels?: {
    operatorInputPlaceholder?: string
    equal?: string
    notEqual?: string
    filterValuePlaceholder?: string
    cancel?: string
    add?: string
  }
}

/**
 * Small form to add a new custom filter.
 * 
 * @param props
 * @returns 
 */
export function AdvancedFilter(props: AdvancedFilterProps) {
  const t = {
    operatorInputPlaceholder: "Operator...",
    equal: "Is equal to",
    notEqual: "Is not equal to",
    filterValuePlaceholder: "Set a value...",
    cancel: "Cancel",
    add: "Add",
    addOrFilter: "Add OR filter",
    ...(props.textLabels || {})
  }
  const defaultLocalValue: FilterValue = {
    operator: "==",
    value: ""
  }
  const [opened, setOpened] = useState(false);
  const [localValue, setlocalValue] = useState<FilterValue>(defaultLocalValue)
  const autocompleteRef = useRef<HTMLInputElement>(null);

  /**
   * Triggered when the filter operator value changes.
   * Update the localValue operator value.
   * 
   * @param value The new operator value.
   */
  const onChangeOperator = (value: FilterValue["operator"]) => {
    setlocalValue({ ...localValue, operator: value })
  }

  /**
   * Triggered when the filter value changes.
   * Update the localValue *value* value.
   * 
   * @param value The new value.
   */
  const onChangeValue = (value: string) => {
    setlocalValue({ ...localValue, value: value })
  }

  /**
   * Triggered when the form is ready to submit.
   * Only submittable if the value is *truthy*.
   */
  const onSubmit = () => {
    if (localValue.value) {
      props.onChange(localValue)
      setlocalValue(defaultLocalValue)
      setOpened(false)
    }
  }

  /**
   * Key up listener for shortcuts:
   * - Enter: submit the filter.
   * 
   * @param e 
   */
  const onKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSubmit();
    }
  }

  const openAdvanced = () => {
    setOpened(true)
    setTimeout(() => {
      if (autocompleteRef.current) {
        autocompleteRef.current.focus()
      }
    }, 200)
  }

  return opened ? (
    <Box style={{ width: "100%", display: "flex", flexDirection: "column", gap: 3 }}>
      <Select
        placeholder={t.operatorInputPlaceholder}
        data={[
          { value: '==', label: t.equal },
          { value: '!=', label: t.notEqual }
        ]}
        value={localValue.operator}
        onChange={onChangeOperator}
      />
      <Autocomplete
        ref={autocompleteRef}
        placeholder={t.filterValuePlaceholder}
        data={props.options}
        value={localValue.value}
        onChange={onChangeValue}
        onKeyUp={onKeyUp}
      />
      <Group spacing={3} position="right">
        <Button size="xs" variant='default' onClick={() => { setOpened(false) }}>{t.cancel}</Button>
        <Button color="primary" size="xs" disabled={!localValue.value} onClick={onSubmit}>{t.add}</Button>
      </Group>
    </Box>
  ) :
    <>
      <Tooltip
        withArrow
        openDelay={650}
        label={t.addOrFilter}
      >
        {props.smallBtn ? (
          <ActionIcon color="primary" onClick={openAdvanced}>
            <IconPlus size={14} />
          </ActionIcon>
        ) : (
          <Button
            variant='light'
            size='xs'
            fullWidth
            leftIcon={<IconPlus size={14} />}
            style={{ marginBottom: 6 }}
            onClick={openAdvanced}
          >
            {t.add}
          </Button>
        )}
      </Tooltip>
    </>;
}


export type FilterValue = {
  /**
   * The operator value ('=', '!=')
   */
  operator: "==" | "!="
  /**
   * The value to base the filtering on.
   */
  value: string
};

export type FiltersObject<T> = {
  /**
   * Each prop attribute can have a OR-AND filter array.
   */
  [key in keyof T]?: FilterValue[][];
};

interface ColumnMenuProps<T> {
  /**
   * The column header.
   */
  header: DataTableHeader<T>
  /**
   * The options available for quick filtering.
   */
  options: any[]
  /**
   * Triggered when the filters value changes.
   */
  onChange: (filters: FilterValue[][]) => void
  /**
   * Object defining the different text messages displayed to edit or change them for translation. 
   */
  textLabels?: {
    equal?: string
    notEqual?: string
    filterMenuTitle?: string
    basicInputPlaceholder?: string
    or?: string
    and?: string
    add?: string
    addAndFilter?: string
    addOrFilter?: string
    typeEnterToAdd?: string
    cancelFilters?: string
    simpleFilters?: string
    advancedFilters?: string
  }
}

/**
 * Contextual menu displayed for each header, to apply filtering on the column.
 * 
 * @param props 
 * @returns 
 */
export function ColumnMenu<T>({ header, options, onChange, textLabels }: ColumnMenuProps<T>) {

  const t = {
    equal: "Is equal to",
    notEqual: "Is not equal to",
    filterMenuTitle: "Filters",
    basicInputPlaceholder: "Add a filter...",
    or: "or",
    and: "and",
    add: "Add",
    addAndFilter: "Add AND filter",
    typeEnterToAdd: "Type Enter to add",
    cancelFilters: "Cancel filters",
    simpleFilters: "Simple filters",
    advancedFilters: "Advanced filters",
    ...(textLabels || {})
  }

  const { classes } = useColumnMenuStyle()
  // the advanced filters.
  const [localFilters, setLocalFilters] = useState<FilterValue[][]>([])
  // the filters linked to the MultiSelect input.
  const [localInputFilters, setLocalInputFilters] = useState<FilterValue[][]>([])
  // the advanced form input value.
  const [inputValue, setInputValue] = useState<string[]>([])
  // advanced mode boolean flip.
  const [advancedMode, setAdvancedMode] = useState(false)

  // emit the filter values when they change.
  const emitChanges = (data: FilterValue[][]) => {
    if (header.prop) {
      onChange(data)
    }
  }

  /**
   * Triggered when a select in the basic MultiSelect input.
   * Update the inputValue and the localInputFilters accordingly.
   * 
   * @param items The filters.
   */
  const onBasicSelectChange = (items: string[]) => {
    setInputValue(items)
    const lif: FilterValue[][] = items.map(item => ([{
      operator: "==",
      value: item
    }]));
    setLocalInputFilters(lif)
    emitChanges([...lif, ...localFilters]);
  }


  /**
   * Triggered by the basic filter badge cross click action.
   * Remove the clicked item from the localValue and localInputFilters.
   * 
   * @param i The index of the item to remove.
   */
  const removeInputOrFilter = (i: number) => {
    const f = JSON.parse(JSON.stringify(localInputFilters))
    f.splice(i, 1)
    setLocalInputFilters(f)
    const v = JSON.parse(JSON.stringify(inputValue))
    v.splice(i, 1)
    setInputValue(v)
    emitChanges([...f, ...localFilters]);
  }

  /**
   * Triggered by the advanced filter badge cross click action.
   * Remove the clicked item from the localFilters.
   * 
   * @param i The index of the item to remove.
   */
  const removeOrFilter = (i: number) => {
    const f = JSON.parse(JSON.stringify(localFilters))
    f.splice(i, 1)
    setLocalFilters(f)
    emitChanges([...localInputFilters, ...f]);
  }

  /**
   * Remove all the filters.
   */
  const resetFilters = () => {
    setLocalInputFilters([])
    setLocalFilters([])
    setInputValue([])
    emitChanges([]);
  }

  /**
   * Triggered by the AdvancedFilter "add" button click.
   * Add the new filter to the localFilters.
   * 
   * @param item The new filter.
   */
  const addOrFilter = (item: FilterValue) => {
    const lif = [...localFilters, [item]]
    setLocalFilters(lif)
    emitChanges([...localInputFilters, ...lif]);
  }

  /**
   * Triggered by the plus icon button without the advanced "or" filter blocks. 
   * Add an "and" filter within an "or" filters array.
   * 
   * @param item The new filter.
   * @param index The index of the "or" array filter.
   */
  const addAndFilter = (item: FilterValue, index: number) => {
    const newFilters = JSON.parse(JSON.stringify(localFilters))
    const newValue = newFilters[index]
    newValue.push(item)
    newFilters.splice(index, 1, newValue)
    setLocalFilters(newFilters)
    emitChanges([...localInputFilters, ...newFilters]);
  }

  /**
   * Build the tooltip label for a filter badge tooltip.
   * 
   * @param item The item to build the label from.
   * @returns The tooltip label.
   */
  const getTooltipLabel = (item: FilterValue) => {
    return (
      <span className={classes.tooltipLabel}>
        <span>{header.label}</span>
        <Text color="dimmed" size='sm'>{item.operator === "!=" ? ` ${t.notEqual} ` : ` ${t.equal} `}</Text>
        <span>`{item.value}`</span>
      </span>
    )
  }

  return (
    <Menu width="lg" shadow="sm" closeOnItemClick={false}>
      <Menu.Target>
        <ActionIcon className={classes.menuCaret}><IconChevronDown size={16} /></ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>{t.filterMenuTitle}</Menu.Label>
        <Menu.Divider />
        <div style={{ background: "transparent", padding: 5, cursor: "default", fontWeight: "normal" }}>
          <Box mb={5}>
            {advancedMode && localInputFilters.map((orItem, i) => (
              <Box key={JSON.stringify(orItem)} className={classes.andBox}>
                {i !== 0 && (
                  <Box>
                    <Text size="xs">{t.or}</Text>
                  </Box>
                )}
                <Box className={classes.badgeBox}>
                  {orItem.map(andItem => (
                    <Tooltip
                      openDelay={650}
                      withArrow
                      key={andItem.value}
                      label={getTooltipLabel(andItem)}
                    >
                      <Badge
                        color="green"
                        rightSection={
                          <ActionIcon size="xs" radius="xl" variant="transparent" onClick={() => { removeInputOrFilter(i) }}>
                            <IconX size={10} />
                          </ActionIcon>
                        }
                      >
                        {andItem.value}
                      </Badge>
                    </Tooltip>
                  ))}
                </Box>
              </Box>
            ))}
            {localFilters.map((orItem, i) => (
              <Box key={JSON.stringify(orItem)} className={classes.andBox}>
                <Box>
                  {(i !== 0 || localInputFilters.length > 0) && (<Text size="xs">{t.or}</Text>)}
                </Box>
                <Box className={classes.badgeBox}>
                  {orItem.map((andItem, j) => (
                    <div key={andItem.value + j} className={classes.badgeBox}>
                      {j !== 0 && (<Text size="xs">{t.and}</Text>)}
                      <Tooltip
                        withArrow
                        openDelay={650}
                        label={getTooltipLabel(andItem)}
                        key={andItem.value}
                      >
                        <Badge
                          color={andItem.operator === "!=" ? "red" : "green"}
                          style={{ verticalAlign: "middle" }}
                          rightSection={
                            <ActionIcon size="xs" color={andItem.operator === "!=" ? "red" : "green"} variant="transparent" onClick={() => { removeOrFilter(i) }}>
                              <IconX size={10} />
                            </ActionIcon>
                          }
                        >
                          {andItem.value}
                        </Badge>
                      </Tooltip>
                    </div>
                  ))}
                  {advancedMode && (
                    <AdvancedFilter
                      options={options}
                      onChange={filter => { addAndFilter(filter, i) }}
                      textLabels={t}
                      smallBtn
                    />
                  )}
                </Box>
              </Box>
            ))}
          </Box>
          {advancedMode && (
            <AdvancedFilter
              options={options}
              textLabels={t}
              onChange={addOrFilter}
            />
          )}
          {!advancedMode && (
            <Box>
              <MultiSelect
                data={options}
                placeholder={t.basicInputPlaceholder}
                value={inputValue}
                style={{ maxWidth: 200 }}
                onChange={onBasicSelectChange}
                onClick={e => { e.stopPropagation() }}
                searchable
                creatable
                onCreate={(query) => {
                  onBasicSelectChange([...inputValue, query])
                  return query
                }}
                getCreateLabel={e => e}
              />
            </Box>
          )}
        </div>
        <Menu.Divider />
        <Menu.Item
          icon={<IconApps size={14} />}
          onClick={() => { setAdvancedMode(!advancedMode) }}
        >
          {advancedMode ? t.simpleFilters : t.advancedFilters}
        </Menu.Item>
        {(localFilters.length > 0 || localInputFilters.length > 0) && (
          <Menu.Item icon={<IconTrash size={14} />} onClick={resetFilters}>{t.cancelFilters}</Menu.Item>
        )}
      </Menu.Dropdown>
    </Menu>
  )
}


interface DataTableNavigationProps {
  length: number
  perPage?: number
  activePage: number
  setPage: (page: number) => void
  setPerPage: (page: number) => void
}

export function DataTableNavigation(props: DataTableNavigationProps) {
  return (
    <Group mt="md" position="right">
      <Text>{((props.perPage || 1) * (props.activePage - 1) + 1)} - {min(((props.perPage || 1) * (props.activePage)), props.length)} / {props.length}</Text>
      <Select
        placeholder="PP"
        style={{ width: 80 }}
        value={String(props.perPage)}
        onChange={page => {
          props.setPage(1)
          props.setPerPage(Number(page))
        }}
        data={["5", "10", "20", "50", "100", "200"]}
      />
      {props.perPage && props.length > props.perPage && (
        <Pagination
          page={props.activePage}
          onChange={page => {
            props.setPage(page)
          }}
          aria-label="table pagination"
          total={Math.ceil(props.length / (props.perPage || 1))}
          getItemAriaLabel={(page) => {
            switch (page) {
              case 'dots':
                return 'dots element aria-label';
              case 'prev':
                return 'previous page button aria-label';
              case 'next':
                return 'next page button aria-label';
              case 'first':
                return 'first page button aria-label';
              case 'last':
                return 'last page button aria-label';
              default:
                return `${page} item aria-label`;
            }
          }}
        />
      )}
    </Group>
  )
}



const useFormStyle = createStyles(theme => ({
  deleteIcon: {
    position: "absolute",
    top: 0,
    right: 0
  },
  subForm: {
    border: `thin solid ${theme.colorScheme === "light" ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.2)"}`,
  },
}))


interface DataFormProps<T> {
  /**
   * Data item value supposed to be unique and used for selection.
   */
  itemId?: keyof T
  /**
   * The definition of the table columns and form inputs.
   */
  headers: DataTableHeader<T>[]
  /**
   * The properties used to initialize the form (initialValues and validate).
   */
  formProps?: {
    initialValues?: T;
    initialErrors?: FormErrors;
    validate?: (values: T) => any
    clearInputErrorOnChange?: boolean;
    validateInputOnChange?: boolean | any[];
  }
  /**
   * Item to edit
   */
  value?: T | null
  /**
   * Triggered when the button save/create is clicked.
   */
  onChange: (values: Partial<T>) => void
  onDelete?: () => void
  /**
   * Triggered when the cancel button is clicked.
   */
  closeForm?: () => void
  /**
   * Object defining the different text messages displayed to edit or change them for translation. 
   */
  labels?: {
    nothingFound?: string
    cancel?: string
    save?: string
    create?: string
    delete?: string
    sure?: string
    addItem?: string
  }
  /**
   * Function triggered when an image is uploaded in a RichTextEditor.
   * This function must handle the storing and return a string.
   * If *undefined*, the dropped/uploaded images will be converted to base64 format.
   */
  onImageUpload?: (data: FormData) => Promise<string>
  noValidation?: boolean
  useReset?: boolean
}

export function DataForm<T>(props: DataFormProps<T>) {

  const t = {
    nothingFound: "No options",
    cancel: "Cancel",
    save: "Save",
    create: "Create",
    delete: "Delete",
    sure: "You're about to remove the item. Are you sure?",
    addItem: "Add item",
    ...(props.labels || {})
  }

  const { classes } = useFormStyle();

  /**
   * Build the form initial values using formList() for the type *form* items.
   * 
   * @param formProps The full form properties object for initialization
   * @returns The full form properties object with a generated initialValues object.
   */
  const buildFormProps = useCallback((formProps: DataFormProps<T>["formProps"]): DataFormProps<T>["formProps"] => {
    const values = formProps?.initialValues || {} as T;
    const initialValues: any = {}
    for (const prop in values) {
      const h = props.headers.find(header => header.prop === prop) || {} as DataTableHeader<T>;
      const defaultValues = h.defaultValues || {};
      if (h.prop) {
        if (h.type === "itemsform") {
          const val = values[prop];
          if (!!val && Array.isArray(val)) {
            initialValues[prop] = val.map(v => ({ ...defaultValues, ...v }))
          }
        }
        else {
          initialValues[prop] = values[prop]
        }
      }
    }
    return {
      ...formProps,
      initialValues: initialValues as T
    };
  }, [props.headers])

  // initializing the form.
  const {
    values,
    setValues,
    setFieldValue,
    reset,
    removeListItem,
    onSubmit,
    getInputProps,
    insertListItem
  } = useForm(buildFormProps((props.formProps || { initialValues: {} as T })));

  // updating the form using buildFormProps the props.formProps value change.
  useEffect(() => {
    if (props.value && typeof props.value === "object") {
      setValues({
        ...props.value,
        ...(buildFormProps({ initialValues: props.value as T })?.initialValues || {})
      });
    }
  }, [props.value, buildFormProps, setValues])

  /**
   * Triggers the props.closeForm event and empty the form (after 300ms for a smoother modal closing animation). 
   */
  const closeForm = () => {
    if (props.closeForm) {
      props.closeForm()
    }
    setTimeout(() => {
      reset()
    }, 300)
  }

  /**
   * Remove an item from a sub-form based on its index.
   * 
   * @param header The item header.
   * @param i The item position.
   */
  const deleteSubItem = ({ prop }: DataTableHeader<T>, i: number) => {
    if (prop) {
      removeListItem(prop, i)
    }
  }

  /**
   * Add an item from a sub-form.
   * 
   * @param header The item header.
   */
  const addSubItem = ({ prop, defaultValues }: DataTableHeader<T>) => {
    if (prop) {
      if (!values[prop]) {
        setFieldValue(prop, [] as any)
      }
      insertListItem(prop, { ...defaultValues, uid: randId() })
    }
  }

  /**
   * Build a sub-form as an input.
   * 
   * @param header The header definition
   * @param inputProps The input properties to be carried on.
   * @param index The position of the parent input.
   * @param i The position of the item in the value array.
   * @returns The sub-form input.
   */
  const buildItemsForm = (header: DataTableHeader<T>, index: number, i: number) => {
    if (header.headers) {
      return (
        <Grid>
          {header.headers.map((h) => {
            if (header.prop && h.prop) {
              return buildFormItem(h, getInputProps(`${String(header.prop)}.${i}.${String(h.prop)}`), index)
            }
            return null;
          })}
        </Grid>
      )
    }
    return null;
  }

  const buildCheckForm = (header: DataTableHeader<any>, index: number, prop: string) => {
    if (header.headers) {
      return !(header.hideWhenDisabled && header.disabled) ? (
        <Box style={header.itemStyle}>
          {header.headers.map((h) => {
            if (header.prop && h.prop) {
              return buildFormItem(
                { ...h, disabled: !!header.disabled } as unknown as DataTableHeader<T>,
                getInputProps(`${String(header.prop)}.${prop}.${String(h.prop)}`),
                index,
                true
              )
            }
            return null;
          })}
        </Box>
      ) : null
    }
    return null;
  }

  function buildInputProps<T2>(header: DataTableHeader<T2>, inputProps: InputPropsPayload<T2>, index = -1): any {
    return {
      ...inputProps,
      key: String(header.prop) + String(index),
      label: header.label,
      placeholder: header.placeholder,
      icon: header.icon,
      description: header.description,
      required: header.required,
      disabled: header.disabled,
      style: header.inputStyle
    }
  }

  const clickCheckFormCheckbox = (props: InputPropsPayload<T>, prop: string, isChecked: boolean) => {
    let val = props.value ? JSON.parse(JSON.stringify(props.value)) : {}
    if (isChecked) {
      if (val[prop] !== undefined) delete val[prop]
    }
    else {
      val[prop] = {}
    }
    props.onChange(val)
  }

  const handleImageUpload = useCallback(
    (file: File): Promise<string> =>
      new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('image', file);
        if (props.onImageUpload) {
          props.onImageUpload(formData)
        }
      }),
    [props]
  );

  const buildAccordionValue = (header: DataTableHeader<T>, value: any, i: number): string => {
    if (!!value.uid) {
      return value.uid;
    }
    else if (!!header?.accordion?.asString) {
      return header?.accordion?.asString(value, i)
    }
    else if (!!header.accordion?.label) {
      return header.accordion?.label(value, i) as string
    }
    return randId()
  }

  /**
   * Build a form input based on the header and DataTableHeader attributes.
   * The header must have a `prop` attribute.
   * 
   * @param header The input header definition.
   * @param inputProps The input properties to be carried to sub-forms.
   * @param index The level index (by default -1).
   * @returns A form input.
   */
  const buildFormItem = (header: DataTableHeader<T>, inputProps: InputPropsPayload<T>, index: number, nakedInput = false): React.ReactNode => {
    // only if a prop attribute is defined.
    if (!header.prop) {
      return null;
    }

    // we prepare the input props.
    const localProps = buildInputProps<any>(header, inputProps, index)
    let input = null

    // if a custom header filed is provided, we use it instead of building one.
    if (header.formInput) {
      let customInput = header.formInput(localProps, values);
      if (customInput) {
        input = customInput
      }
    }
    else {
      // default text input.
      const stringEnsuredInputProps: any = { ...localProps, value: localProps.value || "", type: header.type || "text" }
      input = <TextInput {...stringEnsuredInputProps} />;
    }



    // the type defines the input, fallback to the default text input of no type os provided.
    if (header.type) {

      if (header.type === "checkform" && header.headers && header.props) {

        const props = Object.keys(header.props);
        const propsLabels = Object.values(header.props);
        const subval: any = values[header.prop] || {};

        input = (
          <Input.Wrapper {...localProps}>
            <Box style={header.wrapperStyle}>
              {props.map((prop, i) => {
                const isChecked = Object.keys(subval).includes(prop);
                return (
                  <Box key={`${String(header.prop)}-${String(prop)}`}>
                    <Group my="xs" spacing="xs">
                      <Checkbox
                        checked={isChecked}
                        onChange={() => { clickCheckFormCheckbox(inputProps, prop, isChecked) }}
                        label={propsLabels[i]}
                        mr="md"
                      />
                    </Group>
                    {buildCheckForm({ ...header, disabled: !isChecked }, index, prop)}
                  </Box>
                )
              })}
            </Box>
          </Input.Wrapper>
        )
      }
      else if (header.type === "itemsform" && header.headers) {
        const items = (localProps.value || [])
        // tab layout
        if (header.accordion) {
          input = (
            <>
              <Input.Wrapper {...localProps}>
                {Array.isArray(items) && items.length > 0 && (
                  <Accordion
                    mt="xs"
                    styles={{
                      control: {
                        padding: "0.5em"
                      },
                      content: {
                        padding: "0.5em"
                      }
                    }}
                  >
                    {header.headers && items?.map((value: any, i: number) => {
                      return (
                        <Accordion.Item
                          key={buildAccordionValue(header, value, i)}
                          value={buildAccordionValue(header, value, i)}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Accordion.Control>
                              <Group>
                                <Text style={{ margin: "0 7px" }}>{header.accordion?.numbered !== false ? `${i + 1}. ` : ""} </Text>
                                {header.accordion?.label(value, i) || "default"}
                              </Group>
                            </Accordion.Control>
                            <ActionIcon size="lg" onClick={() => deleteSubItem(header, i)}>
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Box>
                          <Accordion.Panel>
                            {buildItemsForm(header, index, i)}
                          </Accordion.Panel>
                        </Accordion.Item>
                      )
                    })}
                  </Accordion>
                )}
              </Input.Wrapper>
              <Button
                mt={5}
                variant='subtle'
                size="xs"
                onClick={() => { addSubItem(header) }}
                leftIcon={<IconPlus size={16} />}
              >
                {t.addItem} ({header.label})
              </Button>
            </>
          )
        }
        // tab layout
        else if (header.tabs) {
          input = (
            <>
              <Input.Wrapper {...localProps}>
                {Array.isArray(items) && items.length > 0 && (
                  <Tabs pt={5} defaultValue={items.length > 0 ? items[0].uid : null}>
                    <Tabs.List>
                      {header.headers && items?.map((value: any, i: number) => {
                        return (
                          <Tabs.Tab
                            key={value.uid || (header.tabs?.label(value, i) || randId())}
                            value={value.uid || (header.tabs?.label(value, i) || randId())}
                            icon={header.tabs?.icon ? header.tabs.icon(value, i) : null}
                          >
                            {header.tabs?.label(value, i) || "default"}
                          </Tabs.Tab>
                        )
                      })}
                    </Tabs.List>
                    {header.headers && items?.map((value: any, i: number) => {
                      return (
                        <Tabs.Panel
                          key={value.uid || (header.tabs?.label(value, i) || randId())}
                          value={value.uid || (header.tabs?.label(value, i) || randId())}
                          mt={5}
                        >
                          <Card shadow="sm" p="sm">
                            <ActionIcon size="sm" className={classes.deleteIcon} color="red" onClick={() => deleteSubItem(header, i)}>
                              <IconX size={16} />
                            </ActionIcon>
                            {buildItemsForm(header, index, i)}
                          </Card>
                        </Tabs.Panel>
                      )
                    })}
                  </Tabs>
                )}
              </Input.Wrapper>
              <Button
                mt={5}
                variant='subtle'
                size="xs"
                onClick={() => { addSubItem(header) }}
                leftIcon={<IconPlus size={16} />}
              >
                {t.addItem} ({header.label})
              </Button>
            </>
          )
        }
        // cards layout
        else {
          input = (
            <>
              <Input.Wrapper {...localProps}>
                {header.headers && items.map((value: any, i: number) => (
                  <Paper p="sm" shadow="sm" style={{ position: "relative" }} mt={5} key={String(header.prop) + i}>
                    <ActionIcon size="sm" className={classes.deleteIcon} color="red" onClick={() => deleteSubItem(header, i)}>
                      <IconX size={16} />
                    </ActionIcon>
                    {buildItemsForm(header, index, i)}
                  </Paper>
                ))}
              </Input.Wrapper>
              <Button
                mt={5}
                variant='subtle'
                size="xs"
                onClick={() => { addSubItem(header) }}
                leftIcon={<IconPlus size={16} />}
              >
                {t.addItem} ({header.label})
              </Button>
            </>
          )
        }
      }
      else if (header.type === "autocomplete") {
        input = <Autocomplete data={buildOptions(header, values)} {...localProps} />
      }
      else if (header.type === "number") {
        input = (
          <NumberInput
            stepHoldDelay={500}
            stepHoldInterval={(t) => Math.max(1000 / t ** 2, 25)}
            min={header.min}
            max={header.max}
            step={header.step}
            parser={header.parser}
            formatter={header.formatter}
            precision={header.precision}
            decimalSeparator={header.decimalSeparator}
            hideControls={header.hideControls}
            {...localProps}
          />
        )
      }
      else if (header.type === "switch") {
        input = (
          <Switch
            onLabel={header.onLabel}
            offLabel={header.offLabel}
            {...localProps}
          />
        )
      }
      else if (header.type === "checkbox") {
        input = (
          <Checkbox
            checked={!!localProps.value}
            {...localProps as any}
          />
        )
      }
      else if (header.type === "textarea") {
        input = (
          <Textarea
            autosize
            minRows={header.minRows}
            maxRows={header.maxRows}
            {...localProps}
          />
        )
      }
      else if (header.type === "slider") {
        let sliderProps = JSON.parse(JSON.stringify(localProps));
        if (header.sliderLabel) {
          sliderProps.label = header.sliderLabel;
        }
        input = (
          <Input.Wrapper {...localProps}>
            <Slider
              marks={header.marks}
              defaultValue={header.defaultValues}
              {...sliderProps}
            />
          </Input.Wrapper>
        )
      }
      else if (header.type === "segmented_control" && header.data) {
        input = (
          <Input.Wrapper {...localProps}>
            <Group>
              <SegmentedControl
                data={header.data}
                value={localProps.value}
                onChange={localProps.onChange}
              />
            </Group>
          </Input.Wrapper>
        )
      }
      else if (header.type === "rich") {
        input = (
          <Input.Wrapper {...localProps}>
            {localProps && typeof localProps.value === "string" && (
              <RichTextEditor
                onImageUpload={handleImageUpload}
                {...localProps}
              />
            )}
          </Input.Wrapper>
        )
      }
      else if (header.type === "select") {
        const options = buildOptions(header, values, header.oOption === null)
        if (header.multiple) {
          input = (
            <MultiSelect
              searchable
              clearable={header.clearable}
              transition="pop-top-left"
              data={options}
              nothingFound={header.nothingFound || t.nothingFound}
              maxDropdownHeight={280}
              {...localProps}
              value={localProps.value === undefined ? [] : localProps.value || []}
            />
          )
        }
        else {
          input = (
            <Select
              searchable
              clearable={header.clearable}
              transition="pop-top-left"
              data={options}
              nothingFound={header.nothingFound || t.nothingFound}
              maxDropdownHeight={280}
              {...localProps}
              value={localProps.value === undefined ? "" : (!!localProps.value && typeof localProps.value === "string" ? localProps.value : "")}
            />
          )
        }
      }
      else if (header.type === "chips") {
        const options = buildOptions(header, values, true)
        const remainings = localProps.value && !!options ?
          header.multiple ? localProps.value.filter((v: string) => !options.some(o => o === v)) as string[] :
            [] : localProps.value ? [localProps.value] : []
        input = (
          <Input.Wrapper {...localProps}>
            <Chip.Group
              mt={10}
              multiple={header.multiple}
              spacing={5}
              {...localProps}
              value={localProps.value === undefined ? (header.multiple ? [] : "") : localProps.value}
            >
              {!!options && options.length > 0 && options?.map((option) => {
                if (typeof option === "string") {
                  return <Chip key={option} value={option}>{option}</Chip>
                }
                if (typeof option === "object" && (header.oOption || !!option.value)) {
                  return <Chip key={option[header.oOption || "value"]} value={option[header.oOption || "value"]}>{option.label ? option.label : option[(header.oLabel || header.oOption || "value")]}</Chip>
                }
              })}
              {!!remainings && remainings.length > 0 && remainings?.map((option) => {
                if (typeof option === "string") {
                  return <Chip key={option} value={option}>{option}</Chip>
                }
                if (typeof option === "object" && (header.oOption || !!option.value)) {
                  return <Chip key={option[header.oOption || "value"]} value={option[header.oOption || "value"]}>{option.label ? option.label : option[(header.oLabel || header.oOption || "value")]}</Chip>
                }
              })}
            </Chip.Group>
          </Input.Wrapper>
        )
      }
      else if (header.type === "date") {
        const stringEnsuredInputProps: any = {
          ...localProps,
          value: localProps.value ? new Date(localProps.value).toISOString().split('T')[0] : "",
          type: header.type || "text"
        }
        input = <TextInput {...stringEnsuredInputProps} />;
      }
      else if (header.multiple) {
        input = (
          <StringsListInput
            header={header}
            values={values}
            labels={t}
            {...localProps}
          />
        )
      }
    }

    // we return the wrapped or naked input.
    if (nakedInput) {
      return input
    }
    return (
      <Grid.Col
        key={localProps.key}
        xs={12}
        sm={header.grid || header.sm}
        md={header.grid || header.md}
        lg={header.grid || header.lg}
        xl={header.grid || header.xl}
        style={header.wrapperStyle}
      >
        {input}
      </Grid.Col>
    )
  }

  const noValidationSubmit = () => {
    props.onChange(values)
  }

  const onDelete = () => {
    if (props.onDelete) {
      props.onDelete()
    }
  }

  return (
    <form onSubmit={onSubmit(values => props.onChange(values))}>
      <Grid>
        {props.headers.map((header) => {
          if (header.prop) {
            return buildFormItem(header, getInputProps(header.prop), -1);
          }
          return null;
        })}
      </Grid>
      <Group position="right" mt="md">
        {props.onDelete && props.itemId && props.value && !!props?.value[props.itemId] && (
          <Popover width={200} position="bottom" withArrow shadow="md">
            <Popover.Target>
              <Button mr="auto" variant='outline' color="red">{t.delete}</Button>
            </Popover.Target>
            <Popover.Dropdown>
              <Text size="sm">{t.sure}</Text>
              <Group position="right" mt="md">
                <Button size="sm" compact color="red" onClick={onDelete}>Confirm</Button>
              </Group>
            </Popover.Dropdown>
          </Popover>
        )}
        {props.closeForm && (
          <Button variant='default' onClick={closeForm}>{t.cancel}</Button>
        )}
        {props.useReset !== false && (
          <Button variant="outline" onClick={reset}>Reset form</Button>
        )}
        {props.noValidation ? (
          <Button onClick={noValidationSubmit}>{t.save}</Button>
        ) : (
          <Button type="submit">{props.itemId && values[props.itemId] ? t.save : t.create}</Button>
        )}
      </Group>
    </form >
  )
}


const useStyle = createStyles(theme => ({
  tableWrapper: {
    overflowY: "auto"
  },
  tableActions: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap"
  },
  td: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },
  th: {
    display: "flex",
    alignItems: "center",
    color: "inherit!important",
  },
  thLabel: {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    color: "inherit"
  },
  actionsGroup: {
    marginLeft: "auto",
    display: "flex",
    gap: "0.5em",
    alignItems: "center"
  },
  selectionGroup: {
    display: "flex",
    gap: "0.5em",
    margin: "0 10px",
    alignItems: "center"
  },
  sortCarets: {
    position: "relative",
    display: "inline-block",
    verticalAlign: "top",
    margin: "0 10px",
    userSelect: "none",
    "& > span": {
      fontSize: "0.6em",
      position: "absolute",
      opacity: 0.5,
      transition: "opacity .2s",
      cursor: "pointer",
      zIndex: 1,
      "&:hover": {
        opacity: 1
      },
      "&:first-of-type": {
        top: -11,
        left: 0
      },
      "&:last-child": {
        bottom: -11,
        left: 0
      }
    }
  },
  sortCaretActive: {
    opacity: "1!important"
  },
  selectedRow: {
    backgroundColor: `${theme.colorScheme === "light" ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.15)"}!important`,
  },
  stickyHeader: {
    position: "sticky",
    top: 0,
    zIndex: 1,
    backgroundColor: `${theme.colorScheme === "light" ? "rgba(255,255,255,1)" : "rgba(0,0,0,1)"}`,
  }
}))

type PropLabelObject = {
  [key: string]: string;
};

export interface DataTableHeader<T> {
  /**
   * The attribute of the data items containing the value (for the form).
   */
  prop?: keyof T
  /**
   * If `type` is "checkform", the object (item `prop` value) attributes to use to generate the sub-forms.
   */
  props?: PropLabelObject
  /**
   * The name to display on the column headers and for the form items.
   */
  label?: string
  /**
   * THe placeholder to use for the form item.
   */
  placeholder?: string
  /**
   * The data type to be used in a form.
   */
  type?: "text" | "autocomplete" | "chips" | "select" | "itemsform" | "rich" | "number" | "switch" | "textarea" | "slider" | "segmented_control" | "checkform" | "checkbox" | "date"
  /**
   * The options to display for the form input.
   */
  options?: any[]
  /**
   * If O is an object, the value to use as *label and value* of an option item. 
   * If `oLabel` is defined, `oOption` will only define the value of an option item.
   * If null, the while item will be used as an object and is expected to have be an object: {label, value(, group)}.
   * If not defined, the first value will be used as label and value.
   */
  oOption?: string | null
  /**
   * To be used with `oOption`. Define the item value to be used as option label.
   */
  oLabel?: string
  /**
   * To be used with `oOption`. Define the item value to be used as option group.
   */
  oGroup?: string
  /**
   * Don't show the table column
   */
  hide?: boolean
  /**
   * The options to display for the form input. Intercept function to compute dynamic options based on:
   * - options: the provided options
   * - values: the current item values
   */
  getOptions?: (options: any[], values: any) => string[]
  /**
   * True if the value is an array of values.
   */
  multiple?: boolean
  /**
   * Function to return the cell content. 
   */
  value?: (item: T) => React.ReactNode
  /**
   * If value() doesn't return a string, use filter() to return a string that can be used for searching.
   */
  asString?: (item: T) => string
  /**
   * Return a custom form input.
   * To make it work with the form, use the prop arguments and merge them to the form input JSX element.
   */
  formInput?: (props: any, values: T) => JSX.Element
  /**
   * Return a custom form input item for a *list input*.
   * To make it work with the form, use the prop arguments and merge them to the form input JSX element.
   */
  formInputItem?: (props: Record<string, any>) => JSX.Element
  /**
   * The text to display when no option is found. Used for select inputs.
   */
  nothingFound?: string
  /**
   * Sub headers used to defined the list item sub-form.
   */
  headers?: DataTableHeader<any>[]
  /**
   * The sub-item default values
   */
  defaultValues?: any
  /**
   * Icon for the input.
   */
  icon?: React.ReactNode
  /**
   * Description for the input
   */
  description?: React.ReactNode
  /**
   * If the input is required
   */
  required?: boolean
  /**
   * If a select field can be cleared.
   */
  clearable?: boolean
  /**
   * Min value for the number or slider input.
   */
  min?: number
  /**
   * Max value for the number or slider input.
   */
  max?: number
  /**
   * Step value for the number or slider input.
   */
  step?: number
  /**
   * The number of digits to round the number to for number input.
   */
  precision?: number
  /**
   * The decimal separator sign for number input
   */
  decimalSeparator?: string
  /**
   * Parser function for the number input.
   */
  parser?: (value: string | any) => string
  /**
   * Formatter function for the number input.
   */
  formatter?: (value: string | any) => string
  /**
   * On value displayed label for the switch input.
   */
  onLabel?: string
  /**
   * Off value displayed label for the switch input.
   */
  offLabel?: string
  /**
   * Minimum number or rows for the textarea input.
   */
  minRows?: number
  /**
   * Maximum number or rows for the textarea input.
   */
  maxRows?: number
  /**
   * Marks which will be placed on the track for the slider input.
   */
  marks?: { value: number; label?: React.ReactNode; }[]
  /**
   * Available options for a Segmented control.
   */
  data?: string[] | SegmentedControlItem[]
  /**
   * Label value to be displayed on the tooltip of the slider input.
   */
  sliderLabel?: (value: number) => React.ReactNode
  /**
   * Define the sub-form items display as tabs.
   * Object containing two functions:
   * - label(item, i) => string (the name of the tab)
   * - icon(item, index) => React.ReactNode (the tab icon)
   */
  tabs?: {
    /**
     * Function to build the tab displayed name.
     * Item is the value of the sub-form.
     */
    label: (item: any, index: number) => string
    /**
     * Function to build the tab icon.
     * Item is the value of the sub-form.
     */
    icon?: (item: any, index: number) => React.ReactNode
  }
  /**
   * Define the sub-form items display as accordion.
   * Object containing two functions:
   * - label(item, i) => string (the name of the tab)
   * - icon(item, index) => React.ReactNode (the tab icon)
   */
  accordion?: {
    /**
     * Function to build the tab displayed name.
     * Item is the value of the sub-form.
     */
    label: (item: any, index: number) => React.ReactNode
    /**
     * To be used if `label` doesn't return a string.
     */
    asString?: (item: any, index: number) => string
    /**
     * False to prevent displaying the numeration numbers.
     */
    numbered?: boolean
  }
  /**
   * Main grid responsive column width.
   */
  grid?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
  /**
   * Grid responsive column width.
   */
  sm?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
  /**
   * Grid responsive column width.
   */
  md?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
  /**
   * Grid responsive column width.
   */
  lg?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
  /**
   * Grid responsive column width.
   */
  xl?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12,
  /**
   * If multiple is true, function used to compute the placeholder based on the item index.
   * Used by the types `text` (+ multiple) and `form` (+ tabs).
   */
  placeholderMultiple?: (index: number) => string
  inputStyle?: CSSProperties
  /**
   * Css properties to apply to checkform items wrapper.
   * Ex: the checkfom items (subforms themselves) are stacked vertically: use flexbox to change it.
   */
  wrapperStyle?: CSSProperties
  /**
   * Css properties to apply to a checkform item.
   * Ex: the checkfom items inputs are stacked vertically: use flexbox to change it.
   */
  itemStyle?: CSSProperties
  /**
   * Style applied to the table td.
   */
  style?: CSSProperties
  /**
   * Hide +/- buttons for the number input.
   */
  hideControls?: boolean
  /**
   * If the input should be disabled.
   */
  disabled?: boolean
  /**
   * If the input should be non-editable.
   */
  readonly?: boolean
  /**
   * For the type `checkform`, hide the child inputs when disabled.
   */
  hideWhenDisabled?: boolean
  /**
   * Return a string array for the column filtering. 
   * Each strings in this array must match pass the test to be selected.
   */
  asStringArray?: (items: T) => string[]
  /**
   * Manually disable the column sorting action.
   */
  useSort?: boolean
  /**
   * Manually disable the column filter action.
   */
  useFilters?: boolean
}


export function filterByQuery<T>(items: T[], headers: DataTableHeader<T>[], query: string) {
  const qTab = norm(query).split(" ").filter(e => !!e)
  return items.filter(d => {
    let value = "";
    for (const h of headers) {
      const val = (h.asString ? h.asString(d) : getValue(h, d));
      if (typeof val === "string") {
        value += " " + val
      }
    }
    const vTab = norm(value).split(" ").filter(e => !!e);
    let test = true;
    for (const qt of qTab) {
      let found = false;
      for (const vt of vTab) {
        if (vt.includes(qt)) {
          found = true;
        }
      }
      if (!found) {
        test = false;
      }
    }
    return test;
  })
}

export function filterByFilters<T>(items: T[], headers: DataTableHeader<T>[], filters: FiltersObject<T>) {
  return items.filter(item => {
    let tAllProps = true;
    // checking the props under filters
    for (const p in filters) {
      const orArray = filters[p] || [];
      if (orArray && orArray.length > 0) {
        const value = getFilterable(headers.find(h => h.prop === p) || {} as DataTableHeader<T>, item)
        let tOr = false;
        for (let j = 0; j < orArray.length; j++) {
          const andArray = orArray[j] || []
          let tAnd = true;
          for (let k = 0; k < andArray.length; k++) {
            const comp = andArray[k]
            if (comp.operator === "!=") {
              tAnd = tAnd && value.some(iv => !iv.toLowerCase().includes(comp.value.toLowerCase()))
            }
            else {
              // default is {operator: "=="}
              const lt = value.length > 0 && value.some(iv => iv.toLowerCase().includes(comp.value.toLowerCase()))
              tAnd = tAnd && lt
            }
          }
          tOr = tOr || tAnd
        }
        tAllProps = tAllProps && tOr
      }
      else {
        tAllProps = tAllProps && true;
      }
    }
    return tAllProps
  })
}

export function sortItems<T>(items: T[], headers: DataTableHeader<T>[], sortBy: boolean | keyof T | undefined, sortDesc: boolean) {
  const data = JSON.parse(JSON.stringify(items))
  data.sort((a: T, b: T) => {
    if (typeof sortBy === "string") {
      const aH = headers.find(h => h.prop as any === a[sortBy] as any)
      const aVal = aH?.asString ? aH?.asString(a) : (aH?.value ? aH.value(a) : a[sortBy]) || ""
      const bH = headers.find(h => h.prop as any === b[sortBy] as any)
      const bVal = bH?.asString ? bH?.asString(b) : (bH?.value ? bH.value(b) : b[sortBy]) || ""
      if (sortDesc) {
        if (aVal > bVal) return -1
        if (aVal < bVal) return 1
      }
      else {
        if (aVal < bVal) return -1
        if (aVal > bVal) return 1
      }
    }
    return 0;
  })
  return data;
}

export function splitPerPage<T>(items: T[], activePage: number, perPage: number) {
  const from = ((activePage - 1) * perPage)
  return items.splice(from, perPage);
}

export function filterItems<T>(data: T[], headers: DataTableHeader<T>[], query?: string, filters?: FiltersObject<T>, sortBy?: boolean | keyof T | undefined, sortDesc?: boolean, activePage?: number, perPage?: number) {
  // building the items
  let items: T[] = JSON.parse(JSON.stringify(data));

  // filtering by query
  if (query) {
    items = filterByQuery(items, headers, query)
  }

  // filtering by filters
  if (filters && Object.keys(filters).length > 0) {
    items = filterByFilters(items, headers, filters);
  }

  // sorting the items
  if (typeof sortBy === "string") {
    items = sortItems(items, headers, sortBy, !!sortDesc)
  }

  // splitting by page
  if (perPage && activePage) {
    items = splitPerPage(items, activePage, perPage)
  }

  return items
}



interface DataTableSearchProps {
  value: string
  onChange: (value: string) => void
  labels?: {
    searchPlaceholder?: string
    searchTooltip?: string
    cancelSearchTooltip?: string
  }
}

export function DataTableSearch(props: DataTableSearchProps) {

  const [showSearch, setShowSearch] = useState(false)
  // search input reference for focus.
  const searchInputRef = useRef<HTMLInputElement>(null)

  const t = {
    searchPlaceholder: "Search...",
    searchTooltip: "Search",
    cancelSearchTooltip: "Cancel search",
    ...(props.labels || {})
  }

  /**
   * Search input keyup handler for shortcuts:
   * - Enter: hide the input,
   * - Escape: reset the query.
   * 
   * @param e The keyup event.
   */
  const handleSearchKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      if (!props.value) {
        setShowSearch(false)
      }
      else {
        props.onChange("")
      }
    }
    else if (e.key === "Enter") {
      e.stopPropagation()
      setShowSearch(false)
    }
  }

  return showSearch ? (
    <TextInput
      ref={searchInputRef}
      icon={<IconSearch size={16} />}
      placeholder={t.searchPlaceholder}
      value={props.value}
      onKeyUp={handleSearchKeyUp}
      onChange={e => props.onChange(e.target.value)}
      rightSection={
        <Tooltip label={t.cancelSearchTooltip}>
          <ActionIcon
            variant="transparent"
            onClick={() => {
              setShowSearch(false);
              props.onChange("");
            }}>
            <IconX size={16} />
          </ActionIcon>
        </Tooltip>
      }
    />
  ) : (
    <Tooltip label={t.searchTooltip}>
      <Indicator disabled={!props.value}>
        <ActionIcon onClick={() => {
          setShowSearch(true)
          setTimeout(() => {
            if (searchInputRef.current) searchInputRef.current.focus();
          }, 50);
        }}>
          <IconSearch size={16} />
        </ActionIcon>
      </Indicator>
    </Tooltip>
  )
}


const useColumnHeaderStyle = createStyles(theme => ({
  tableWrapper: {
    overflowY: "auto"
  },
  tableActions: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap"
  },
  td: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },
  th: {
    display: "flex",
    alignItems: "center",
    color: "inherit!important",
  },
  thLabel: {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    color: "inherit",
    //fontWeight: 700,
    lineHeight: 1,
    fontSize: "14px"
  },
  actionsGroup: {
    marginLeft: "auto",
    display: "flex",
    gap: "0.5em",
    alignItems: "center"
  },
  selectionGroup: {
    display: "flex",
    gap: "0.5em",
    margin: "0 10px",
    alignItems: "center"
  },
  sortCarets: {
    position: "relative",
    display: "inline-block",
    verticalAlign: "top",
    margin: "0 10px",
    userSelect: "none",
    "& > span": {
      fontSize: "0.6em",
      position: "absolute",
      opacity: 0.15,
      transition: "opacity .2s",
      cursor: "pointer",
      zIndex: 1,
      "&:hover": {
        opacity: 1
      },
      "&:first-of-type": {
        top: -11,
        left: 0
      },
      "&:last-child": {
        bottom: -11,
        left: 0
      }
    }
  },
  sortCaretActive: {
    opacity: "0.5!important"
  },
  clickableTh: {
    "&:hover": {
      textDecoration: "underline",
      cursor: "pointer"
    }
  }
}))

interface DataTableColumnHeader<T> {
  children?: React.ReactNode
  header?: DataTableHeader<T>
  sortDesc: boolean
  setSortDesc: (desc: boolean) => void
  sortBy: DataTableProps<T>["useSort"]
  setSortBy: (sort: DataTableProps<T>["useSort"]) => void
  labels?: {
    searchPlaceholder?: string
    searchTooltip?: string
    cancelSearchTooltip?: string
    clickToSort?: string
  }
}

export function DataTableColumnHeader<T>(props: DataTableColumnHeader<T>) {

  const { classes, cx } = useColumnHeaderStyle()

  const t = {
    searchPlaceholder: "Search...",
    searchTooltip: "Search",
    cancelSearchTooltip: "Cancel search",
    clickToSort: " (click to sort)",
    ...(props.labels || {})
  }

  /**
   * Triggered when the sorting caret of a column is clicked.
   * Sort the table using `sortBy` and `sortDesc`.
   * 
   * @param header The clicked column header.
   * @param desc If the descending caret has been clicked.
   */
  const sortColumn = (header?: DataTableHeader<T>, desc?: boolean) => {
    if (!!header && header.useSort !== false) {
      if (header.prop === props.sortBy && props.sortDesc === desc) {
        props.setSortDesc(false);
        props.setSortBy(true);
      }
      else {
        props.setSortDesc(!!desc);
        props.setSortBy(header.prop);
      }
    }
  }

  return (
    <div className={classes.th}>
      {props.header && (
        <>
          <Text
            className={cx(classes.thLabel, { [classes.clickableTh]: props.header.useFilters !== false })}
            title={props.header.label + (props.header.useSort !== false ? t.clickToSort : "")}
            onClick={() => sortColumn(props.header, !props.sortDesc)}
          >
            {props.header.label}
          </Text>
          {props.sortBy && props.header.useSort !== false && (
            <span className={classes.sortCarets}>
              <span
                className={props.header.prop === props.sortBy && !props.sortDesc ? classes.sortCaretActive : ""}
                onClick={() => { sortColumn(props.header, false) }}
              >
                ▲
              </span>
              <span
                className={props.header.prop === props.sortBy && props.sortDesc ? classes.sortCaretActive : ""}
                onClick={() => { sortColumn(props.header, true) }}
              >
                ▼
              </span>
            </span>
          )}
        </>
      )}
      {props.children}
    </div>
  )
}



export interface DataTableProps<T> {
  /**
   * Element to display on top of the table (usually a title).
   */
  title?: React.ReactNode
  /**
   * The items to display on the table.
   */
  data: T[]
  /**
   * Data item value supposed to be unique and used for selection.
   */
  itemId?: keyof T
  /**
   * Table width
   */
  width?: CSSProperties["width"]
  /**
   * The definition of the table columns and form inputs.
   */
  headers: DataTableHeader<T>[]
  /**
   * The properties used to initialize the form (initialValues and validate).
   */
  formProps?: DataFormProps<Partial<T>>["formProps"]
  /**
   * Triggered when a new item form is submitted.
   */
  onCreate?: (data: Partial<T>[]) => void
  /**
   * Triggered when an item edit form is submitted.
   */
  onUpdate?: (data: T[]) => void
  /**
   * Triggered when an item deletion is confirmed.
   */
  onDelete?: (data: T[]) => void
  /**
   * Triggered when the selection changes. Emit the and array of `itemId` values, 
   * or the full item if `emitFullItem` is true.
   */
  onChange?: (data: (T | T[keyof T])[]) => void
  /**
   * Triggered when a table row is clicked.
   * The payload is:
   * - The clicked item
   * - The click event
   * - If select mode is true
   */
  onRowClick?: (item: T, event: React.MouseEvent<Element, MouseEvent>, selectMode?: boolean) => void
  /**
   * Function triggered when an image is uploaded in a RichTextEditor.
   * This function must handle the storing and return a string.
   * If *undefined*, the dropped/uploaded images will be converted to base64 format.
   */
  onImageUpload?: (data: FormData) => Promise<string>
  /**
   * Triggered when the select button is clicked.
   */
  onSelect?: boolean | ((data: T[keyof T][]) => void)
  /**
   * Object defining the different text messages displayed to edit or change them for translation. 
   */
  labels?: {
    select?: string
    cancelSelection?: string
    editSelection?: string
    duplicateSelection?: string
    deleteSelection?: string
    selectRows?: string
    addNewItemTooltip?: string
    searchPlaceholder?: string
    searchTooltip?: string
    cancelSearchTooltip?: string
    showCheckboxesTooltip?: string
    hideCheckboxesTooltip?: string
    editRow?: string
    duplicateRow?: string
    deleteRow?: string
    copyRowToClipboard?: string
    pasteRowFromClipboard?: string
    modalEditMultiple?: string
    modalEditItem?: string
    modalCreateItem?: string
    modalConfirmDelete?: string
    modalConfirmDeleteMultiple?: string
    areYouSure?: string
    no?: string
    yes?: string
    warningMultipleDelete?: string
    // form
    nothingFound?: string
    cancel?: string
    save?: string
    create?: string
    // column menu
    equal?: string
    notEqual?: string
    filterMenuTitle?: string
    basicInputPlaceholder?: string
    or?: string
    and?: string
    add?: string
    addAndFilter?: string
    addOrFilter?: string
    typeEnterToAdd?: string
    cancelFilters?: string
    simpleFilters?: string
    advancedFilters?: string
    // filters
    operatorInputPlaceholder?: string
    /* equal?: string
    notEqual?: string
    filterValuePlaceholder?: string
    cancel?: string 
    add?: string */
    clickToSort?: string
  }
  /**
   * Form modal body width
   */
  formSize?: string | number
  /**
   * If the table rows must be striped.
   */
  striped?: boolean
  /**
   * Display the "new item" button outside of the table menu.
   */
  useNewButton?: boolean
  /**
   * Display the search button.
   */
  useSearchButton?: boolean
  /**
   * If the select mode must be on when the table is loaded.
   */
  selectMode?: boolean
  /**
   * Display the "Paste from clipboard to editor" button.
   */
  useImportRow?: boolean
  /**
   * Display the "Copy row to clipboard" button.
   */
  useExportRow?: boolean
  /**
   * Display the "Copy row to clipboard" button.
   */
  useSelectButton?: boolean
  /**
   * If true, the row actions menu will no be displayed.
   */
  noRowActions?: boolean
  /**
   * Emit the full item instead of the `itemId` value when onChange is triggered.
   */
  emitFullItem?: boolean
  /**
   * Activates the navigation buttons and defines the number of items to display per page.
   */
  perPage?: number
  /**
   * If truthy, use the sort by arrows. If is a string, defines the default sort by value.
   */
  useSort?: boolean | keyof T
  /**
   * Display the column headers filters.
   */
  useFilters?: boolean
  /**
   * Display in the header action menu a button to import multiple items from the clipboard
   */
  useBulkImport?: boolean
  /**
   * Css properties to apply to the table wrapper.
   */
  wrapperStyle?: CSSProperties
  /**
   * Css properties to apply to the table headers (the whole headers row).
   */
  headersStyle?: CSSProperties
  /**
   * Css properties to apply to the table element (overwrites `width` and `height`).
   */
  style?: CSSProperties
  /**
   * Css properties to apply to the table body.
   */
  bodyStyle?: CSSProperties
  /**
   * Display the search icon in the header
   */
  useSearch?: boolean
  /**
   * Use sticky headers if `wrapperStyle` has *maxHeight* and *overflowY* properties. 
   */
  stickyHeader?: boolean
  /**
   * Additional action icons to display on the top right.
   */
  topRightIcons?: React.ReactNode
}

/**
 * A customizable table used to display, select, filter or edit items.
 * 
 * @param props 
 * @returns 
 */
export default function DataTable<T>(props: DataTableProps<T>) {

  const t = {
    select: "Select",
    cancelSelection: "Cancel selection",
    editSelection: "Edit selection",
    duplicateSelection: "Duplicate selection",
    deleteSelection: "Delete selection",
    selectRows: "Select rows",
    addNewItemTooltip: "Add new item",
    showImportWindow: "Show import window",
    searchPlaceholder: "Search...",
    searchTooltip: "Search",
    cancelSearchTooltip: "Cancel search",
    showCheckboxesTooltip: "Show checkboxes",
    hideCheckboxesTooltip: "Hide checkboxes",
    editRow: "Edit",
    duplicateRow: "Duplicate",
    deleteRow: "Delete",
    copyRowToClipboard: "Copy to Clipboard",
    pasteRowFromClipboard: "Paste from Clipboard",
    modalEditMultiple: "Update multiple items",
    modalEditItem: "Edit item",
    modalCreateItem: "New item",
    modalConfirmDelete: "Confirm delete",
    modalImport: "Import",
    modalConfirmDeleteMultiple: "Confirm delete multiple",
    areYouSure: "Are you sure ?",
    no: "No",
    yes: "Yes",
    warningMultipleDelete: "You&apos;re about to delete multiple items",
    importMessage: "Paste a JSON object or array to import one or multiple items in the table.",
    invalidJSON: "Invalid JSON",
    importPlaceholder: "Paste here to import...",
    import: "Import",
    cancel: "Cancel",
    clickToSort: " (click to sort)",
    ...(props.labels || {})
  }

  // the style classes
  const { classes } = useStyle()
  // if no header has a label attribute, the table doesn't display the header (columns title and actions).
  const noHeaders = props.headers.reduce((a, e) => a += e.label || "", "") === "";
  // search hide/show flip.
  const [showSearch, setShowSearch] = useState(false)
  // current search query value. 
  const [query, setQuery] = useState("")
  // form modal hide/show flip.
  const [showForm, setShowForm] = useState(false)
  // confirm delete modal hide/show flip.
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  // currently selected item (for edition).
  const [selectedItem, setSelectedItem] = useState<T | null>(null)
  // select mode (visible checkboxes) on/off flip.
  const [selectMode, setSelectMode] = useState(props.selectMode)
  // selection pool: string[] of selected items id.
  const [selectedItemIds, setSelectedItemIds] = useState<T[keyof T][]>([])
  // confirm multiple delete modal hide/show flip.
  const [showDeleteMultipleConfirm, setShowDeleteMultipleConfirm] = useState(false)
  // if multiple items will be edit after submitting the edit.
  const [updateMultiple, setUpdateMultiple] = useState(false)
  // active page number.
  const [activePage, setPage] = useState(1)
  // number of items to display per page.
  const [perPage, setPerPage] = useState(props.perPage)
  // sort by field value.
  const [sortBy, setSortBy] = useState(props.useSort)
  // sorting desc/asc flip.
  const [sortDesc, setSortDesc] = useState(false)
  // list of all the filters to apply to the table.
  const [tableFilters, setTableFilters] = useState<FiltersObject<T>>({})


  const [showImportWindow, setShowImportWindow] = useState(false)
  const [jsonInput, setJsonInput] = useState("")

  // displayed rows stored and updated when a key variable is changed
  const [localRows, setLocalRows] = useState<T[]>([])
  useEffect(() => {
    // setting the local rows and ending.
    setLocalRows(filterItems(props.data, props.headers, query, tableFilters, sortBy, sortDesc, activePage, perPage))
  }, [
    props.data,
    query,
    perPage,
    activePage,
    sortBy,
    sortDesc,
    props.headers,
    props.perPage,
    props.useSort,
    tableFilters
  ])


  /**
   * Triggered when a table row is clicked.
   * If selectMode is on, toggle the row.
   * If props.onRowClick is defined, trigger it.
   * 
   * @param event The click event.
   * @param item The clicked item.
   */
  const onRowClick = (event: React.MouseEvent, item: T) => {
    const itemId = props.itemId
    if ((selectMode || (props.useSelectButton && event.ctrlKey)) && itemId) {
      if (selectedItemIds.includes(item[itemId])) {
        setSelectedItemIds(selectedItemIds.filter(e => e !== item[itemId]))
      }
      else {
        setSelectedItemIds([...selectedItemIds, item[itemId]])
      }
    }
    if (props.onRowClick) {
      props.onRowClick(item, event, selectMode)
    }
  }

  /**
   * Check function. Return true if the item is in the selection.
   * 
   * @param item The item to be checked for selection.
   * @returns True if the item is selected. 
   */
  const isItemSelected = (item: T) => {
    const itemId = props.itemId
    if ((selectMode || props.useSelectButton) && itemId) {
      return selectedItemIds.includes(item[itemId]);
    }
    return false;
  }


  /**
   * Triggered when the form is submitted.
   * Can do multiple actions based on the table props: 
   * - Update multiple items (selection) if `updateMultiple`is true,
   * - Update an item (`selectedItem`),
   * - Create an item (if `selectedItem` is falsy or has no `itemId` value).
   * 
   * @param values The form values.
   */
  const onFormSubmit = (values: Partial<T>) => {
    if (updateMultiple && props.onUpdate) {
      const items = getSelectionItems();
      props.onUpdate(items.map(item => ({ ...item, ...values })))
      setSelectedItemIds([]);
    }
    else if (props.itemId && values[props.itemId] && props.onUpdate) {
      props.onUpdate([values] as T[])
    }
    else if (props.onCreate) {
      props.onCreate([values as Partial<T>])
    }
    closeForm()
  }

  /**
   * Close the form modal and reset:
   * - the selected item
   * - the confirm delete modal
   * - the confirm delete multiple modal
   * - the update multiple flag
   */
  const closeForm = () => {
    setShowForm(false)
    setTimeout(() => { setSelectedItem(null) }, 300)
    setShowConfirmDelete(false)
    setShowDeleteMultipleConfirm(false)
    setUpdateMultiple(false)
    setShowImportWindow(false)
  }

  /**
   * Triggered when the row action "Edit" is clicked.
   * Set the clicked item as selected an open the form modal.
   * 
   * @param item the item to edit.
   */
  const editItem = (item: T) => {
    setSelectedItem(item);
    setShowForm(true)
  }

  /**
   * Delete an item using props.onDelete.
   * 
   * @param item The item to delete
   */
  const deleteItem = (item: T) => {
    if (props.onDelete) {
      props.onDelete([item])
      closeForm()
    }
  }

  /**
   * Delete the selected items using props.onDelete.
   */
  const deleteItems = () => {
    if (props.onDelete) {
      props.onDelete(getSelectionItems())
      closeForm()
      setSelectedItemIds([])
    }
  }

  /**
   * Duplicate an item using onFormSubmit.
   * 
   * @param item The item to duplicate.
   */
  const duplicateItem = (item: T) => {
    let values = JSON.parse(JSON.stringify(item))
    // The duplicated item has its [itemId] attribute deleted
    if (props.itemId && values[props.itemId]) delete values[props.itemId]
    onFormSubmit(values)
  }

  /**
   * Export: copy an item to the clipboard as a JSON string
   * 
   * @param item The item to export.
   * @return Void for await.
   */
  const copyToClipboard = async (item: T) => {
    return await copyTextToClipboard(JSON.stringify(item))
  }

  /**
   * Import: copy an JSON string representing an item from the clipboard to the editor of a selected item.
   * 
   * @param item The item to copy the content into.
   */
  const pasteFromClipboard = async (item: T) => {
    const text = await getTextFromClipboard()
    if (text && IsJsonString(text)) {
      let val = JSON.parse(text);
      if (props.itemId && val[props.itemId]) delete val[props.itemId]
      editItem({ ...item, ...val });
    }
  }

  /**
   * Triggered when the main checkbox is clicked.
   * 
   * @param e The click event.
   */
  const clickMainCheckbox = (e: React.MouseEvent<HTMLInputElement>) => {
    const itemId = props.itemId
    if (((!(selectedItemIds.length === localRows.length) && selectedItemIds.length > 0 && localRows.length > 0) || selectedItemIds.length === 0) && itemId) {
      const selection = localRows.map(e => e[itemId])
      if (e.ctrlKey) {
        setSelectedItemIds(removeDuplicates([...selectedItemIds, ...selection]))
      }
      else {
        setSelectedItemIds(selection)
      }
    }
    else {
      setSelectedItemIds([])
    }
    if (props.onChange && props.data && itemId) {
      props.onChange(props.emitFullItem ? getSelectionItems() : selectedItemIds)
    }
  }

  /**
   * Return an array of selected items. 
   * 
   * @returns The selected items
   */
  const getSelectionItems = (): T[] => {
    const itemId = props.itemId
    if (itemId) {
      return props.data.filter(e => selectedItemIds.includes(e[itemId]));
    }
    return [];
  }

  /**
   * Triggered when the selection menu action "Edit" is clicked.
   * Set the updateMultiple flag to true, the selectedItem to an empty object and open the form.
   */
  const onEditSelection = () => {
    setUpdateMultiple(true);
    setSelectedItem({} as T);
    setShowForm(true);
  }

  /**
   * Triggered when the selection menu action "Duplicate" is clicked.
   * Create a copy of each selected items using `props.onCreate`.
   */
  const onDuplicateSelection = () => {
    if (props.onCreate) {
      const values = getSelectionItems().map(e => {
        let item = JSON.parse(JSON.stringify(e));
        if (props.itemId && item[props.itemId]) delete item[props.itemId]
        return item;
      })
      props.onCreate(values)
      setSelectedItemIds([])
    }
  }

  /**
   * Triggered when the selection menu action "Delete" is clicked.
   * Open the delete multiple confirm modal.
   */
  const onDeleteSelection = () => {
    setShowDeleteMultipleConfirm(true);
    setSelectedItemIds([])
  }

  /**
   * Triggered when the selection menu action "Cancel" is clicked.
   * Empty the selection.
   */
  const cancelSelection = () => {
    setSelectedItemIds([])
  }



  /**
   * Triggered when the filters of a columns have been updated.
   * 
   * @param filters The filters list.
   * @param header The filtered column header.
   */
  const updateFilters = useCallback((filters: FilterValue[][], header: DataTableHeader<T>) => {
    if (header.prop) {
      let newFilters = JSON.parse(JSON.stringify(tableFilters))
      newFilters[header.prop] = filters;
      setTableFilters(newFilters)
    }
  }, [tableFilters])

  /**
   * Build a unique string for the `key` attribute based on a provided item.
   * 
   * @param item The item to build to key for.
   * @returns A unique key.
   */
  const buildItemKey = (item: T) => {
    let v = randomId();
    if (props.itemId) {
      const v0 = item[props.itemId];
      if (v0) v = String(v0);
    }
    else if (typeof item === "object") {
      const v0 = Object.values(item as any)[0]
      if (v0) v = String(v0);
    }
    else if (typeof item === "string") {
      return item;
    }
    return v;
  }

  /**
   * Return true if an item is selected.
   * 
   * @returns True if an item is selected.
   */
  const doWeHaveASelectedItem = () => {
    const prop = props.itemId
    if (!prop) {
      return false;
    }
    return selectedItem && selectedItem[prop]
  }

  const bulkImport = () => {
    if (props.onCreate) {
      const imp = JSON.parse(jsonInput)
      if (Array.isArray(imp)) {
        props.onCreate(imp)
      }
      else {
        props.onCreate([imp])
      }
      closeForm()
    }
  }

  const buildTable = () => {
    return (
      <Table striped={props.striped} highlightOnHover={selectMode} style={{ tableLayout: "fixed", width: props.width || "auto", ...props.style }}>
        {!noHeaders && (
          <thead className={props.stickyHeader ? classes.stickyHeader : undefined} style={props.headersStyle}>
            <tr>
              {selectMode && (
                <th style={{ width: 50 }}>
                  <Checkbox
                    onClick={clickMainCheckbox}
                    indeterminate={!(selectedItemIds.length === localRows.length) && selectedItemIds.length > 0 && localRows.length > 0}
                    readOnly
                    checked={selectedItemIds.length === localRows.length && props.data.length > 0}
                  />
                </th>
              )}
              {props.headers.map(header => header.hide ? null : (
                <th key={header.label} style={{ color: "inherit" }}>
                  <DataTableColumnHeader
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                    sortDesc={sortDesc}
                    setSortDesc={setSortDesc}
                    header={header}
                    labels={t}
                  >
                    {header.prop && props.useFilters && header.useFilters !== false && (
                      <ColumnMenu
                        header={header}
                        options={header.options || props.data.map(e => getValue(header, e)).filter((item, pos, self) => item && self.indexOf(item) == pos)}
                        onChange={filters => updateFilters(filters, header)}
                        textLabels={t}
                      />
                    )}
                  </DataTableColumnHeader>
                </th>
              ))}
              {((props.useImportRow || props.useExportRow || props.onUpdate || props.onDelete) && !props.noRowActions) && (<th style={{ width: 50 }}></th>)}
            </tr>
          </thead>
        )}
        <tbody style={props.bodyStyle}>
          {localRows.map(item => (
            <tr key={buildItemKey(item)} onClick={e => { onRowClick(e, item) }} className={isItemSelected(item) ? classes.selectedRow : ""}>
              {selectMode && (
                <td>
                  <Checkbox checked={isItemSelected(item)} readOnly />
                </td>
              )}
              {props.headers.map(header => header.hide ? null : (
                <td
                  className={classes.td}
                  style={header.style}
                  key={randomId()}
                  title={getValue(header, item, true) as string}
                >
                  {getValue(header, item)}
                </td>
              ))}
              {((props.useImportRow || props.useExportRow || props.onUpdate || props.onDelete) && !props.noRowActions) && (
                <td>
                  <Menu shadow="sm" width={200} position="top-end">
                    <Menu.Target>
                      <ActionIcon variant="subtle" size="xs">
                        <IconDotsVertical />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      {props.onUpdate && (
                        <Menu.Item
                          icon={<IconPencil size={14} />}
                          onClick={() => { editItem(item) }}
                        >
                          {t.editRow}
                        </Menu.Item>
                      )}
                      {props.onCreate && (
                        <Menu.Item
                          icon={<IconCopy size={14} />}
                          onClick={() => { duplicateItem(item) }}
                        >
                          {t.duplicateRow}
                        </Menu.Item>
                      )}
                      {(props.useImportRow || props.useExportRow) && (
                        <>
                          <Menu.Divider />
                          {props.useExportRow && (
                            <Menu.Item
                              icon={<IconFileExport size={14} />}
                              onClick={() => { copyToClipboard(item) }}
                            >
                              {t.copyRowToClipboard}
                            </Menu.Item>
                          )}
                          {props.useImportRow && (
                            <Menu.Item
                              icon={<IconTableImport size={14} />}
                              onClick={() => { pasteFromClipboard(item) }}
                            >
                              {t.pasteRowFromClipboard}
                            </Menu.Item>
                          )}
                        </>
                      )}
                      {props.onDelete && (
                        <>
                          <Menu.Divider />
                          <Menu.Item
                            color="red"
                            icon={<IconTrash size={14} />}
                            onClick={(e: any) => {
                              if (e.ctrlKey) {
                                deleteItem(item)
                              }
                              else {
                                setSelectedItem(item)
                                setShowConfirmDelete(true)
                              }
                            }}
                          >
                            {t.deleteRow}
                          </Menu.Item>
                        </>
                      )}
                    </Menu.Dropdown>
                  </Menu>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </Table>
    )
  }

  return (
    <>
      <div className={classes.tableActions}>
        {props.title}
        <div className={classes.selectionGroup}>
          {selectedItemIds.length > 0 && (
            <>
              <Button
                variant="filled"
                compact
                color="primary"
                radius="xl"
                size="xs"
                style={{ fontSize: "0.8em" }}
              >
                {t.select}
                <span>&nbsp;({selectedItemIds.length})</span>
              </Button>
              <Menu shadow="sm" width={200}>
                <Menu.Target>
                  <ActionIcon variant="subtle" size="xs">
                    <IconDotsVertical />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item
                    color="primary"
                    icon={<IconX size={14} />}
                    onClick={cancelSelection}
                  >
                    {t.cancelSelection}
                  </Menu.Item>
                  {(props.onUpdate || props.onCreate) && (
                    <Divider />
                  )}
                  {props.onUpdate && (
                    <Menu.Item
                      icon={<IconPencil size={14} />}
                      onClick={onEditSelection}
                    >
                      {t.editSelection}
                    </Menu.Item>
                  )}
                  {props.onCreate && (
                    <Menu.Item
                      icon={<IconCopy size={14} />}
                      onClick={onDuplicateSelection}
                    >
                      {t.duplicateSelection}
                    </Menu.Item>
                  )}
                  {props.onDelete && (
                    <>
                      <Divider />
                      <Menu.Item
                        color="red"
                        icon={<IconTrash size={14} />}
                        onClick={(e: any) => {
                          if (e.ctrlKey) {
                            onDeleteSelection()
                          }
                          else {
                            setShowDeleteMultipleConfirm(true)
                          }
                        }}
                      >
                        {t.deleteSelection}
                      </Menu.Item>
                    </>
                  )}
                </Menu.Dropdown>
              </Menu>
            </>
          )}
        </div>
        <div className={classes.actionsGroup}>
          <DataTableSearch value={query} onChange={setQuery} />
          {props.onSelect && (
            <Tooltip label={`${selectMode ? t.hideCheckboxesTooltip : t.showCheckboxesTooltip}`}>
              <ActionIcon onClick={() => setSelectMode(!selectMode)}>
                <IconCheckbox size={16} />
              </ActionIcon>
            </Tooltip>
          )}
          {props.useBulkImport && (
            <Tooltip label={t.showImportWindow}>
              <ActionIcon onClick={() => setShowImportWindow(true)}>
                <IconUpload size={16} />
              </ActionIcon>
            </Tooltip>
          )}
          {props.onCreate && (
            <Tooltip label={t.addNewItemTooltip}>
              <ActionIcon color="primary" variant='default' onClick={() => setShowForm(!showForm)}>
                <IconPlus size={16} />
              </ActionIcon>
            </Tooltip>
          )}
          {props.topRightIcons}
        </div>
      </div>
      <div style={{ overflowX: "auto", maxWidth: "calc(100% - 0px)", ...props.wrapperStyle }}>
        {buildTable()}
      </div>
      {props.perPage && (
        <DataTableNavigation
          length={props.data.length}
          perPage={perPage}
          activePage={activePage}
          setPage={setPage}
          setPerPage={setPerPage}
        />
      )}
      <Modal
        opened={showForm}
        closeOnEscape={false}
        onClose={closeForm}
        size={props.formSize || "md"}
        title={updateMultiple ? t.modalEditMultiple : (doWeHaveASelectedItem() ? t.modalEditItem : t.modalCreateItem)}
      >
        <DataForm
          formProps={props.formProps}
          headers={props.headers as any}
          onChange={onFormSubmit}
          closeForm={closeForm}
          value={selectedItem}
          itemId={props.itemId}
          onImageUpload={props.onImageUpload}
          labels={t}
          noValidation
        />
      </Modal>
      <Modal
        opened={showConfirmDelete}
        closeOnEscape={false}
        onClose={closeForm}
        size="sm"
        title={t.modalConfirmDelete}
      >
        <Notification icon={<IconX size={18} />} color="red" disallowClose>
          {t.areYouSure}
        </Notification>
        <Group position="right" mt="md">
          <Button variant='default' onClick={() => { setShowConfirmDelete(false) }}>{t.no}</Button>
          <Button
            color="red"
            onClick={() => {
              if (doWeHaveASelectedItem() && selectedItem) {
                deleteItem(selectedItem)
              }
            }}
          >
            {t.yes}
          </Button>
        </Group>
      </Modal>
      <Modal
        opened={showDeleteMultipleConfirm}
        closeOnEscape={false}
        onClose={closeForm}
        size="sm"
        title={t.modalConfirmDeleteMultiple}
      >
        <Text mb="md" size="sm">{t.warningMultipleDelete} ({selectedItemIds.length})</Text>
        <Notification icon={<IconX size={18} />} color="red" disallowClose>
          {t.areYouSure}
        </Notification>
        <Group position="right" mt="md">
          <Button variant='default' onClick={() => { setShowDeleteMultipleConfirm(false) }}>{t.no}</Button>
          <Button color="red" onClick={deleteItems}>{t.yes}</Button>
        </Group>
      </Modal>
      <Modal
        opened={showImportWindow}
        closeOnEscape={false}
        onClose={closeForm}
        title={t.modalImport}
        size="lg"
      >
        <Text mb="md" size="sm">{t.importMessage}</Text>
        <JsonInput
          placeholder={t.importPlaceholder}
          validationError={t.invalidJSON}
          aria-label="JSON input"
          value={jsonInput}
          onChange={setJsonInput}
          formatOnBlur
          autosize
          minRows={4}
        />
        <Group position="right" mt="md">
          <Button variant='default' onClick={closeForm}>{t.cancel}</Button>
          <Button onClick={bulkImport}>{t.import}</Button>
        </Group>
      </Modal>
    </>
  )
}