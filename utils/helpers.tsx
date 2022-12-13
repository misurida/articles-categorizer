/**
 * Check if the argument is an object.
 * 
 * @see https://stackoverflow.com/questions/8511281/check-if-a-value-is-an-object-in-javascript
 * @param {*} obj 
 * @returns 
 */
export function isObject(obj: unknown) {
  return obj === Object(obj);
}

/**
 * Check if the argument is an array.
 * 
 * @param arr 
 * @returns 
 */
export function isArray(arr: unknown) {
  return Array.isArray(arr);
}

/**
 * Check if the argument is a string.
 * 
 * @param str 
 * @returns 
 */
export function isString(str: unknown) {
  return typeof str === "string";
}

/**
 * Check if the argument is an empty array.
 * 
 * @param arr 
 * @returns 
 */
export function isEmpty(arr: unknown) {
  return !(Array.isArray(arr) && arr.length > 0);
}

/**
 * Generate a random id.
 * 
 * @see https://stackoverflow.com/questions/6860853/generate-random-string-for-div-id
 * @returns 
 */
export function randId(n = 4, separator = "") {
  var S4 = function () {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  };
  let o = []
  for (let i = 0; i < n; i++) {
    o.push(S4())
  }
  return o.join(separator)
}

/**
 * Restrict the number of decimal of a number.
 * 
 * @see https://stackoverflow.com/questions/32229667/have-max-2-decimal-places/32229831
 * @param {*} value 
 * @param {*} dp 
 * @returns 
 */
export function toFixedIfNecessary(value: any, dp: number) {
  return + parseFloat(value).toFixed(dp);
}

/**
 * Group items from an array based on a given prop and return an object containing
 * - the value grouped by as key
 * - an array or items sharing the same given prop (the key).
 * 
 * @see https://stackoverflow.com/questions/14446511/most-efficient-method-to-groupby-on-an-array-of-objects
 * @param {*} arr The array of items to group.
 * @param {*} key The items property to group by.
 * @returns An object containing the grouped by items.
 */
export const groupBy = function (arr: any[], key: string) {
  return arr.reduce(function (rv, x) {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
};

/**
 * Return the max between the two arguments.
 * 
 * @param a 
 * @param b 
 * @returns 
 */
export const max = function (a: number, b: number) {
  return b > a ? b : a;
}

/**
 * Return the min between the two arguments.
 * 
 * @param a 
 * @param b 
 * @returns 
 */
export const min = function (a: number, b: number) {
  return b < a ? b : a;
}

/**
 * Remove the duplicates from an array (of string generally).
 * 
 * @see https://stackoverflow.com/questions/9229645/remove-duplicate-values-from-js-array
 * @param {*} data 
 * @returns 
 */
export const removeDuplicates = function (data: any[]) {
  return data.filter(function (item, pos, self) {
    return item && self.indexOf(item) == pos;
  });
}

/**
 * Create a array of unique values (generally string) from an array of objects.
 * 
 * @param data The array of objects.
 * @param dataKey The attribute to extract the value from.
 * @returns 
 */
export function extractUniqueList<R>(data: any[], dataKey: string) {
  if (data && isArray(data) && data.length > 0) {
    const fVal = data[0][dataKey];
    if (isNaN(fVal) && typeof fVal === "string") {
      let rawExtract = data.map(e => e[dataKey]);
      return removeDuplicates(rawExtract);
    }
  }
  else if (data && isObject(data)) {
    const values = Object.values(data);
    let rawExtract = values.map(e => e[dataKey]);
    return removeDuplicates(rawExtract);
  }
  return [];
}

/**
 * Return a random number between min and max.
 * 
 * @param min 
 * @param max 
 * @returns 
 */
export const rand = function (min: number, max: number) { // min and max included 
  return Math.floor(Math.random() * (max - min + 1) + min)
}

/**
 * Check if an array contains only strings.
 * 
 * @param x 
 * @returns 
 */
export const arrayContainStrings = (x: unknown[] | undefined) => {
  if (!x) return false;
  return x.every(i => isString(i));
}

/**
 * Arguments for the sort() function.
 * 
 * @param a First item
 * @param b Second item
 * @returns A sorting code (-1, 0, 1);
 */
export function classicSorting(a: any, b: any) {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/**
 * Return true if a string is a valid hex color.
 * 
 * @param str A string representing a hex color.
 * @returns 
 */
export function looksLikeColor(str: string) {
  return new RegExp('^#(([0-9a-fA-F]{2}){3}|([0-9a-fA-F]){3})$').test(str);
}


/**
 * Format bytes as human-readable text.
 * 
 * @see https://stackoverflow.com/questions/10420352/converting-file-size-in-bytes-to-human-readable-string
 * @param bytes Number of bytes.
 * @param si True to use metric (SI) units, aka powers of 1000. False to use 
 *           binary (IEC), aka powers of 1024.
 * @param dp Number of decimal places to display.
 * 
 * @return Formatted string.
 */
export function humanFileSize(bytes: number, si = false, dp = 1) {
  const thresh = si ? 1000 : 1024;
  if (Math.abs(bytes) < thresh) {
    return bytes + ' B';
  }
  const units = si
    ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
  let u = -1;
  const r = 10 ** dp
  do {
    bytes /= thresh;
    ++u;
  } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);
  return bytes.toFixed(dp) + ' ' + units[u];
}

/**
 * Split a split using the separator and return a part.
 * Return the given string if the operation failed.
 * 
 * @param str The string to split.
 * @param part Can be the index of the part to return or 'last'.
 * @param separator The separator to use (default: '/')
 * @returns A part of the spliced string.
 */
export const getStringPart = (str: string, part: number | 'last' = 'last', separator = '/') => {
  const val = str.split(separator)
  if (val.length > 0 && part === "last") {
    return val[val.length - 1]
  }
  else if (typeof part === "number" && val.length >= part + 1) {
    return val[part]
  }
  return str
}

/**
 * Sanitize an array of objects and delete all the *falsy* attributes.
 * 
 * @param arr An array of objects to clean.
 * @returns 
 */
 export const naOmit = (arr: any[]) => {
  return arr.map(e => {
    let item = e;
    for (const p in item) {
      if (!item[p]) {
        delete item[p];
      }
    }
    return item;
  });
}

/**
 * Remove the empty or useless values in an object.
 * 
 * @param obj The object to clean.
 * @returns The clean object.
 */
 export function cleanObject<T>(obj: T): T {
  for (const p in obj) {
    const item: any = obj[p];
    if (!p.length || item === "" || (Array.isArray(item) && !item.length) || (typeof item === "object" && !Object.keys(item).length)) {
      delete obj[p];
    }
  }
  return obj;
}

/**
 * Remove all the defined attributes from an object if possible.
 * 
 * @param item The object the remove the attributes from.
 * @param props An array of attributes to delete.
 * @returns
 */
export function deleteProps<T>(item: T, props: (keyof T)[]): T {
  let e = JSON.parse(JSON.stringify(item))
  for (const p of props) {
    if (e[p]) delete e[p]
  }
  return e
}

/**
 * Return a hex color string.
 * 
 * @returns 
 */
export const buildColor = () => {
  return "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")
}

/**
 * Return a text contrasted color ('black' or 'white') based on a provided background color.
 * 
 * @param color The background color the get the font color for.
 * @returns 'black' or 'white'
 */
export const getContrastColor = (color: string) => {
  const rgb = color.match(/[A-Fa-f0-9]{1,2}/g)?.map(v => parseInt(v, 16)) || []
  if (rgb.length === 3) {
    const brightness = Math.round(((rgb[0] * 299) +
      (rgb[1] * 587) +
      (rgb[2] * 114)) / 1000);
    return (brightness > 125) ? 'black' : 'white'
  }
  return 'black'
}

/**
 * Download a file created on-the-fly containing provided data.
 * 
 * @param content The data to write in the file.
 * @param fileName The file name.
 * @param contentType The file contentType.
 */
export function download(content: string, fileName: string, contentType: string) {
  const a = document.createElement("a");
  const file = new Blob([content], { type: contentType });
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
}

/**
 * Read a file asynchronously and return a JSON parsed version of the content.
 * 
 * @param file The JSON file to read.
 * @returns The file content as a string.
 */
export function processFile<T>(file: File): Promise<T[]> {
  return new Promise((resolve, reject) => {
    var reader = new FileReader();
    reader.onload = event => {
      if (event.target?.result) {
        return resolve(JSON.parse(event.target.result as string) as T[]);
      }
      return reject([])
    }
    reader.readAsText(file);
  })
}

/**
 * Merge two objects array together and remove the duplicated items.
 * Duplicated items are detected using the id argument.
 * 
 * @param listA The first list to merge.
 * @param listB The second list to merge.
 * @param id The attribute used to detect duplicated.
 * @returns A merged array.
 */
export function mergeLists<T>(listA: T[], listB: T[], id = "id" as keyof T): T[] {
  const aIds = listA.map(e => e[id])
  const mex = listB.filter(e => !aIds.includes(e[id]))
  return [...mex, ...listA]
}

/**
 * Convert an object containing an id as key and an object as value in an array of objects.
 * The key is integrated in the object at the *storeKeyUnder* attribute if a value is provided.
 * 
 * @param obj The array-object to convert to an array.
 * @param storeKeyUnder The attribute to store the key under.
 * @returns An array of objects.
 */
export function objectToArray<T>(obj: Record<string, T>, storeKeyUnder?: keyof T) {
  if (!obj) {
    return [];
  }
  let values = Object.values(obj);
  if (storeKeyUnder) {
    const keys = Object.keys(obj);
    values = values.map((e, i) => ({ ...e, [storeKeyUnder]: keys[i] }));
  }
  return values;
}

/**
 * Similar to `objectToArray()`, convert an object containing multiple array-objects.
 * 
 * @param obj The object to convert.
 * @param storeKeyUnder The attribute to store the key under.
 * @returns An object containing real arrays instead of object-arrays.
 */
export function objectsListToArraysList<A, T>(obj: A, storeKeyUnder?: keyof T) {
  let o: any = {}
  for (const p in obj) {
    const v = obj[p] as any
    o[p] = objectToArray(v, storeKeyUnder)
  }
  return o as A
}

/**
 * Normalize a string (mainly for comparison).
 * 
 * @param str 
 * @returns 
 */
export const norm = (str: string) => {
  return str.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase()
}

/**
 * Generate random UUID.
 * 
 * @see https://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid
 * @returns A random string.
 */
 export function uuidv4() {
  var d = new Date().getTime();//Timestamp
  var d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now() * 1000)) || 0;//Time in microseconds since page-load or 0 if unsupported
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16;//random number between 0 and 16
    if (d > 0) {//Use timestamp until depleted
      r = (d + r) % 16 | 0;
      d = Math.floor(d / 16);
    } else {//Use microseconds since page-load if supported
      r = (d2 + r) % 16 | 0;
      d2 = Math.floor(d2 / 16);
    }
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

/**
 * Capitalize the first letter of a string.
 * 
 * @param text 
 * @returns 
 */
export const capitalize = function (text: string) {
  return text.replace(/(^\w{1})|(\s+\w{1})/g, firstLetter => firstLetter.toUpperCase())
}

/**
 * Create an initials string from a name.
 * Return a 1 or 2 uppercase characters string based on a string containing multiple words.
 * 
 * @param name 
 * @returns 
 */
export const buildInitials = (name: string) => {
  let rgx = new RegExp(/(\p{L}{1})\p{L}+/, 'gu');
  // @ts-ignore
  let initials = [...name.matchAll(rgx)] || [];
  return (
    (initials.shift()?.[1] || '') + (initials.pop()?.[1] || '')
  ).toUpperCase();
}