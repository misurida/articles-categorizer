import { onSnapshot, doc, query, collection, addDoc, updateDoc, deleteDoc, where, QueryConstraint, getDocs, setDoc } from 'firebase/firestore';
import { createContext, useContext, useEffect, useState } from 'react'
import { showNotification } from '@mantine/notifications';
import { IconX, IconCheck } from '@tabler/icons';
import { auth, firestore } from '../utils/firebase';
import { defaultUsermeta } from '../utils/globals';
import { Upload, UserMeta } from '../types/shell';
import { mergeLists } from '../utils/helpers';

// EDIT HERE... definition of the exposed variables
interface FirestoreContext {
  currentUsermeta?: UserMeta
  uploads: Upload[]
  addItem: (path: string, data: any) => Promise<string>
  updateItem: (path: string, id: string | undefined, data: any) => Promise<void>
  deleteItem: (path: string, id: string | undefined) => void
  addItems: <T>(path: string, data: Partial<T>[], message?: string) => Promise<string[]>
  updateItems: <T>(path: string, data: Partial<T & { id?: string }>[], message?: string) => Promise<void>
  deleteItems: <T>(path: string, data: Partial<T & { id?: string }>[], message?: string) => Promise<void>
  deleteItemsBy: (path: string, whereClause: QueryConstraint) => Promise<void>
  setItem: <T extends { [x: string]: any; }>(path: string, data: T, id?: string) => Promise<void>
}

/**
 * Defining the context object.
 */
const FirestoreContext = createContext<FirestoreContext>({} as FirestoreContext)

/**
 * Context logic.
 * 
 * @param props object containing the children.
 * @returns The data context provider.
 */
export const FirestoreContextProvider = ({ children }: { children: React.ReactNode }) => {

  // store state
  const [currentUsermeta, setCurrentUsermeta] = useState<UserMeta>(defaultUsermeta)
  const [uploads, setUploads] = useState<Upload[]>([])
  const [myUploads, setMyUploads] = useState<Upload[]>([])
  // EDIT HERE... add your custom useState hook to store fetched data (see below).

  // listening to: current user meta data
  useEffect(() => {
    if (auth.currentUser?.uid) {
      // example of item fetching
      return onSnapshot(doc(firestore, 'usermetas', auth.currentUser?.uid), doc => {
        setCurrentUsermeta({ id: doc.id, ...doc.data() } as unknown as UserMeta)
      });
    }
  }, [auth.currentUser])

  // listening to: private uploads
  useEffect(() => {
    if (auth.currentUser?.uid) {
      // example of collection fetching
      return onSnapshot(query(collection(firestore, 'uploads'), where("userId", "==", auth.currentUser?.uid)), q => {
        setMyUploads(q.docs.map(doc => ({ id: doc.id, ...doc.data() } as Upload)) || []);
      });
    }
  }, [auth.currentUser])

  // listening to: public uploads
  useEffect(() => {
    return onSnapshot(query(collection(firestore, 'uploads'), where("isPublic", "==", true)), q => {
      setUploads(q.docs.map(doc => ({ id: doc.id, ...doc.data() } as Upload)) || []);
    });
  }, [])

  // EDIT HERE... Add your custom listeners here is useEffect hooks to fetch data.

  /**
   * Display a generic notification for an error message
   * 
   * @param msg The error message to display.
   */
  const errorMessage = (msg?: string) => {
    showNotification({ message: msg || "Item non identifiable", color: "red", icon: <IconX size={18} /> })
  }

  /**
   * Push an item to a collection
   * 
   * @param path The collection path.
   * @param item The item to push.
   * @returns The pushed item id.
   */
  const addItem = async (path: string, item: any): Promise<string> => {
    const doc = await addDoc(collection(firestore, path), item);
    return doc.id
  }

  /**
   * Update an item in a collection
   * 
   * @param path The collection path.
   * @param id The item id.
   * @param data The updated item data.
   * @returns A promise resolving to void.
   */
  const updateItem = async (path: string, id: string | undefined, data: any) => {
    if (!!id) {
      return await updateDoc(doc(firestore, path, id), data);
    }
    else {
      errorMessage()
    }
  }

  /**
   * Delete an item in a collection.
   * 
   * @param path The collection path.
   * @param id The item id.
   * @returns A promise resolving to void. 
   */
  const deleteItem = async (path: string, id: string | undefined) => {
    if (!!id) {
      return await deleteDoc(doc(firestore, path, id));
    }
    else {
      errorMessage()
    }
  }

  /**
   * Add multiple items to a collection and display a success/error notification.
   * 
   * @param path The collection path.
   * @param data The items to push to the collection.
   * @param message The success message.
   * @returns 
   */
  async function addItems<T>(path: string, data: Partial<T>[], message?: string) {
    const o: string[] = []
    try {
      for (const d of data) o.push(await addItem(path, d));
      if (message) {
        showNotification({ message, color: "green", icon: <IconCheck size={18} /> })
      }
    }
    catch (e: any) {
      errorMessage(e.message)
    }
    return o;
  }

  /**
   * Update multiple items from a collection and display a success/error notification.
   * 
   * @param path The collection path.
   * @param data The items to update.
   * @param message The success message.
   */
  async function updateItems<T>(path: string, data: Partial<T & { id?: string }>[], message?: string) {
    try {
      for (const d of data) {
        if (d.id) {
          let item = JSON.parse(JSON.stringify(d))
          delete item.id
          await updateItem(path, d.id, item);
        }
        else {
          errorMessage()
        }
      }
      if (message) {
        showNotification({ message, color: "green", icon: <IconCheck size={18} /> })
      }
    }
    catch (e: any) {
      errorMessage(e.message)
    }
  }

  /**
   * Delete multiple items from a collection and display a success/error notification.
   * 
   * @param path The collection path.
   * @param data The items to update.
   * @param message The success message.
   */
  async function deleteItems<T>(path: string, data: Partial<T & { id?: string }>[], message?: string) {
    try {
      for (const d of data) {
        if (d.id) {
          await deleteItem(path, d.id);
        }
        else {
          errorMessage()
        }
      }
      if (message) {
        showNotification({ message, color: "green", icon: <IconCheck size={18} /> })
      }
    }
    catch (e: any) {
      errorMessage(e.message)
    }
  }

  /**
   * Delete items from a collection.
   * The items must match a condition.
   * 
   * @param path The collection path.
   * @param whereClause A where QueryConstraint condition (e.g.: where("name", "==", file.name))
   */
  async function deleteItemsBy(path: string, whereClause: QueryConstraint) {
    const q = query(collection(firestore, path), whereClause);
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      deleteDoc(doc.ref)
    });
  }

  /**
   * Update an item from a collection, allowing the attribute merge.
   * 
   * @param path The collection path.
   * @param data The new data
   * @param id The item id
   * @param merge If the documents must be merged, or if the new data must overwrite the exiting data.
   * @returns A promise resolving when the data is updated.
   */
  async function setItem<T extends { [x: string]: any; }>(path: string, data: T, id?: string, merge?: boolean) {
    const ref = !!id ? doc(firestore, path, id) : doc(firestore, path);
    return await setDoc(ref, data, { merge });
  }

  // EDIT HERE... exposed variables (accessible using the useFirebase() hook)
  const contextValues: FirestoreContext = {
    currentUsermeta,
    uploads: mergeLists(uploads, myUploads),
    updateItem,
    addItem,
    deleteItem,
    updateItems,
    addItems,
    deleteItems,
    deleteItemsBy,
    setItem
  }

  return (
    <FirestoreContext.Provider value={contextValues}>
      {children}
    </FirestoreContext.Provider>
  )
}

export const useFirestore = () => useContext(FirestoreContext)