import { useState, createContext, useContext, Dispatch, SetStateAction } from "react";

// EDIT HERE... replace with your own data payload interface
export interface Article {

}

// EDIT HERE... definition of the exposed variables
export interface CosmosContext {
  init: () => void
  loading: boolean
  articles: Article[]
  setArticles: Dispatch<SetStateAction<Article[]>>
}

/**
 * Defining the context object.
 */
const CosmosContext = createContext<CosmosContext>({} as CosmosContext);

export const CosmosContextProvider = ({ children }: { children: React.ReactNode }) => {

  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(false)
  // EDIT HERE... add your custom useState hook to store fetched data (see below).

  const init = () => {
    setLoading(true)
    fetch(`/api/init`)
      .then((res) => res.json())
      .then(res => {
        setArticles(res.data?.resources || [])
        setLoading(false)
      })
      .catch(e => {
        console.warn(e)
        setLoading(false)
      })
  }


  // EDIT HERE... exposed variables (accessible using the useData() hook)
  const contextValues: CosmosContext = {
    init,
    loading,
    articles,
    setArticles
  }

  return (
    <CosmosContext.Provider value={contextValues}>
      {children}
    </CosmosContext.Provider>
  )
}

export const useCosmos = () => useContext(CosmosContext)