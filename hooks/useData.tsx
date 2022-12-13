import { useState, createContext, useContext, useEffect } from "react";

// EDIT HERE... replace with your own data payload interface
export interface Data { }

// EDIT HERE... definition of the exposed variables
export interface DataContext {
  data: Data | undefined
  loadData: (data: Data) => Promise<void>
}

/**
 * Defining the context object.
 */
const DataContext = createContext<DataContext>({} as DataContext);

export const DataContextProvider = ({ children }: { children: React.ReactNode }) => {

  // data loading custom web worker
  const [loadWorker, setLoadWorker] = useState<Worker | undefined>()
  // store state
  const [data, setData] = useState<Data | undefined>()
  // EDIT HERE... add your custom useState hook to store fetched data (see below).

  // initialize the loading web worker.
  useEffect(() => {
    const worker = new Worker(new URL('../workers/data_loader.worker', import.meta.url))
    setLoadWorker(worker)
    return () => {
      loadWorker?.terminate()
      setLoadWorker(undefined)
    }
  }, [])

  /**
   * Load and parse data for the global app usage using the `loadWorker` web worker.
   * Generally called by the component `DataLoadForm.tsx`.
   * 
   * @param data
   */
  const loadData = async (data: Data) => {
    loadWorker?.postMessage(data)
    return new Promise<void>((resolve, reject) => {
      loadWorker?.addEventListener('message', (event) => {
        setData(event.data)
        // EDIT HERE... display the data in different states.
        resolve()
      });
    })
  }

  // EDIT HERE... exposed variables (accessible using the useData() hook)
  const contextValues: DataContext = {
    data,
    loadData
  }

  return (
    <DataContext.Provider value={contextValues}>
      {children}
    </DataContext.Provider>
  )
}

export const useData = () => useContext(DataContext)