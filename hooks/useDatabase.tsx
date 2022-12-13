import { createContext, useContext, useEffect, useState } from 'react'
import { ref, onValue, set, update, push } from "firebase/database";
import { objectsListToArraysList } from '../utils/helpers';
import { DefaultPageProps } from '../types/shell'
import { db } from '../utils/firebase'

// EDIT HERE... definition of the exposed variables
interface DatabaseContext {
  datasets: any[],
  updateData: (path: string, data: any) => void
  updateItems: (data: Object) => void,
  addItem: (path: string, data: Object) => void
}

/**
 * Defining the context object.
 */
const DatabaseContext = createContext<DatabaseContext>({} as DatabaseContext)

/**
 * Context logic.
 * 
 * @param props object containing the children.
 * @returns The data context provider.
 */
export const DatabaseContextProvider = ({ children }: DefaultPageProps) => {

  // store state
  const [datasets, setDatasets] = useState([])
  // EDIT HERE... add your custom useState hook to store fetched data (see below).

  /**
   * Initialization of the global data listeners.
   * Since the database stores objects with the item id as key (instead of array),
   * you can retrieve and expose an array using the functions `objectToArray` or `objectsListToArraysList`.
   */
  useEffect(() => onValue(ref(db, 'datasets'), snapshot => setDatasets(objectsListToArraysList(snapshot.val(), "id"))), [])

  // EDIT HERE... Add your custom listeners here is useEffect hooks to fetch data.

  /**
   * Update a collection or an item, based on the path.
   * Path example: "datasets/posts/-MslffCeIfNHPXsr7teA".
   * Data contains the content to store at the provided path.
   * If data is null, the item or collection is deleted.
   * 
   * @param path A collection or item path.
   * @param data Data to update or *null* to delete the item or collection.
   * @returns Promise<void>
   */
  const updateData = async (path: string, data: any) => {
    return await set(ref(db, path), data);
  }

  /**
   * Add an item to a collection and create a unique id.
   * If data is null, the item or collection is deleted.
   * 
   * @param path A collection path.
   * @param data The item data to store.
   * @returns Promise<void>
   */
  const addItem = async (path: string, data: Object) => {
    const postListRef = ref(db, path);
    const newPostRef = push(postListRef);
    return await set(newPostRef, data);
  }

  /**
   * Perform multiple updates from a provided DatabaseTargets.
   * Data contains an object having:
   * - a path as key.
   * - some data to update or create as value.
   * 
   * @param data Multiple targets to update.
   * @returns Promise<void>
   */
  const updateItems = async (data: {[path: string]: any}) => {
    return await update(ref(db), data);
  }

  // EDIT HERE... exposed variables (accessible using the useDatabase() hook).
  const contextValues: DatabaseContext = {
    datasets,
    updateData,
    updateItems,
    addItem
  }

  return (
    <DatabaseContext.Provider value={contextValues}>
      {children}
    </DatabaseContext.Provider>
  )
}

export const useDatabase = () => useContext(DatabaseContext)