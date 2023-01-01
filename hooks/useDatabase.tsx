import { Dispatch, SetStateAction, createContext, useContext, useEffect, useMemo, useState } from 'react'
import { ref, onValue, set, update, push } from "firebase/database";
import { getObjectValue, objectToArray, uuidv4 } from '../utils/helpers';
import { DefaultPageProps } from '../types/shell'
import { auth, db } from '../utils/firebase'
import { Article, ArticleRowDetails, Category, CategoryRowDetails, Dataset, DisplaySources, ScoresThresholds, WordFrequency } from '../utils/types';
import { DateRangePickerValue } from '@mantine/dates';
import { isAfter, isBefore } from 'date-fns';
import Fuse from 'fuse.js';

export function passScoreTest(article: Article, cat: Category, thresholds?: Record<string, number>, mode?: DisplaySources) {
  const score = getScore(article, cat, mode)
  if(score === null) return false
  return (score || 0) > (thresholds?.[cat.key] || 0)
}

export function getScore(article: Article, cat: Category, mode?: DisplaySources): number | null {
  let score = null
  if (mode === "delta") {
    const legacyScore = getObjectValue(article, `out.classify_categories.relevance_scores.${cat.legacy_key}`) || 0
    const computedScore = getObjectValue(article, `classification.${cat.key}`) || 0
    if(!legacyScore || !computedScore) {
      return null
    }
    const delta = computedScore - legacyScore
    if (!isNaN(delta)) {
      return delta
    }
    return null
  }
  else if (mode === "legacy") {
    score = getObjectValue(article, `out.classify_categories.relevance_scores.${cat.legacy_key}`) || null
  }
  else if (mode === "computed") {
    score = getObjectValue(article, `classification.${cat.key}`) || null
  }
  else {
    const cScore = getObjectValue(article, `classification.${cat.key}`)
    if (cScore) score = cScore
    else if (cat.legacy_key) score = getObjectValue(article, `out.classify_categories.relevance_scores.${cat.legacy_key}`)
  }
  return score
}

// EDIT HERE... definition of the exposed variables
interface DatabaseContext {
  updateData: (path: string, data: any) => void
  updateItems: (data: Object) => void,
  addItem: (path: string, data: Object) => void
  datasets: Dataset[],
  dataset?: Dataset,
  setDataset: (dataset: Dataset) => void,
  deleteDataset: (id?: string, uid?: string) => void,
  categories: Category[]
  setCategories: (categories: Category[], uid?: string) => void
  updateCategories: (categories: Category[], uid?: string) => void
  addCategory: (item: Category, uid?: string) => void
  updateCategory: (item: Category, uid?: string) => void
  deleteCategory: (item?: Category, uid?: string) => void

  fetchArticles: (offset?: number, limit?: number) => void
  loading: boolean
  filteredArticles: Article[]
  articles: Article[]
  setArticles: Dispatch<SetStateAction<Article[]>>
  articlesIndex: Fuse<Article>
  articlesQuery: string
  setArticlesQuery: Dispatch<SetStateAction<string>>
  sortBy?: string
  setSortBy: Dispatch<SetStateAction<string | undefined>>
  sortAsc: boolean
  setSortAsc: Dispatch<SetStateAction<boolean>>
  selectedCategories: string[]
  setSelectedCategories: Dispatch<SetStateAction<string[]>>
  toggleCategory: (item: Category) => void
  sortByScore?: Category
  setSortByScore: Dispatch<SetStateAction<Category | undefined>>
  andMode: boolean
  setAndMode: Dispatch<SetStateAction<boolean>>
  filterBy: Record<string, string[]>
  setFilterBy: Dispatch<SetStateAction<Record<string, string[]>>>
  filterByDate: DateRangePickerValue
  setFilterByDate: Dispatch<SetStateAction<DateRangePickerValue>>
  loadArticlesFromFile: (data: any) => Promise<void>
  computeArticles: () => Promise<void>
  computeWordsFrequencies: () => Promise<void>
  scoreDisplayMode?: "flex" | "grid"
  setScoreDisplayMode: Dispatch<SetStateAction<"flex" | "grid" | undefined>>
  scoreDisplaySource?: DisplaySources
  setScoreDisplaySource: Dispatch<SetStateAction<DisplaySources | undefined>>
  articleRowDetails: ArticleRowDetails
  setArticleRowDetails: Dispatch<SetStateAction<ArticleRowDetails>>
  displayedCategories: string[]
  setDisplayedCategories: Dispatch<SetStateAction<string[]>>
  scoresThresholds: ScoresThresholds
  setScoresThresholds: Dispatch<SetStateAction<ScoresThresholds>>
  thresholds: Record<string, number>
  categoryRowDetails: CategoryRowDetails
  setCategoryRowDetails: Dispatch<SetStateAction<CategoryRowDetails>>
  wordsFrequencies: WordFrequency[]
  frequenciesQuery: string
  setFrequenciesQuery: Dispatch<SetStateAction<string>>
  filteredWordFrequencies: WordFrequency[]
  freqSortBy?: keyof WordFrequency
  setFreqSortBy: Dispatch<SetStateAction<keyof WordFrequency | undefined>>
  freqSortAsc: boolean
  setFreqSortAsc: Dispatch<SetStateAction<boolean>>
  freqThreshold: number
  setFreqThreshold: Dispatch<SetStateAction<number>>
  freqThresholdGT: boolean
  setFreqThresholdGT: Dispatch<SetStateAction<boolean>>
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

  // data loading custom web worker
  const [articlesLoadWorker, setArticlesLoadWorker] = useState<Worker | undefined>()
  const [articlesComputationsWorker, setArticlesComputationsWorker] = useState<Worker | undefined>()
  const [wordsFrequenciesWorker, setWordsFrequenciesWorker] = useState<Worker | undefined>()
  // store state
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [dataset, setLocalDataset] = useState<Dataset | undefined>()
  const [categories, setCategoriesValues] = useState<Category[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(false)
  const [articlesQuery, setArticlesQuery] = useState("")
  const [sortBy, setSortBy] = useState<string | undefined>()
  const [sortAsc, setSortAsc] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [sortByScore, setSortByScore] = useState<Category | undefined>()
  const [andMode, setAndMode] = useState(false)
  const [filterBy, setFilterBy] = useState<Record<string, string[]>>({})
  const [filterByDate, setFilterByDate] = useState<DateRangePickerValue>([null, null])
  const [scoreDisplayMode, setScoreDisplayMode] = useState<'flex' | 'grid' | undefined>('flex')
  const [scoreDisplaySource, setScoreDisplaySource] = useState<DisplaySources | undefined>()
  const [articleRowDetails, setArticleRowDetails] = useState<ArticleRowDetails>({
    title: true,
    lang: true,
    publication_datetime: true
  })
  const [displayedCategories, setDisplayedCategories] = useState<string[]>([])
  const [scoresThresholds, setScoresThresholds] = useState<ScoresThresholds>({
    auto: {},
    legacy: {},
    computed: {},
    delta: {}
  })
  const [categoryRowDetails, setCategoryRowDetails] = useState<CategoryRowDetails>({
    color: true,
    display_button: true,
    edit_button: true,
    count: true
  })
  const [wordsFrequencies, setWordsFrequencies] = useState<WordFrequency[]>([])
  const [frequenciesQuery, setFrequenciesQuery] = useState("")
  const [freqSortBy, setFreqSortBy] = useState<keyof WordFrequency | undefined>()
  const [freqSortAsc, setFreqSortAsc] = useState(false)
  const [freqThreshold, setFreqThreshold] = useState(0)
  const [freqThresholdGT, setFreqThresholdGT] = useState(true)

  const thresholds = useMemo(() => {
    if (!scoreDisplaySource) {
      return scoresThresholds.auto
    }
    return scoresThresholds[scoreDisplaySource]
  }, [])


  // initializing the web workers

  useEffect(() => {
    const worker = new Worker(new URL('../workers/articles_loader.worker', import.meta.url))
    setArticlesLoadWorker(worker)
    return () => {
      articlesLoadWorker?.terminate()
      setArticlesLoadWorker(undefined)
    }
  }, [])

  useEffect(() => {
    const worker = new Worker(new URL('../workers/articles_computation.worker', import.meta.url))
    setArticlesComputationsWorker(worker)
    return () => {
      articlesComputationsWorker?.terminate()
      setArticlesComputationsWorker(undefined)
    }
  }, [])

  useEffect(() => {
    const worker = new Worker(new URL('../workers/words_frequencies.worker', import.meta.url))
    setWordsFrequenciesWorker(worker)
    return () => {
      wordsFrequenciesWorker?.terminate()
      setWordsFrequenciesWorker(undefined)
    }
  }, [])

  // custom worker functions

  const loadArticlesFromFile = async (data: any) => {
    articlesLoadWorker?.postMessage(data)
    return new Promise<void>((resolve, reject) => {
      articlesLoadWorker?.addEventListener('message', (event) => {
        setArticles(event.data)
        resolve()
      });
    })
  }

  const computeArticles = async () => {
    articlesComputationsWorker?.postMessage({ articles, categories: dataset?.categories || [] })
    return new Promise<void>((resolve, reject) => {
      articlesComputationsWorker?.addEventListener('message', (event) => {
        setArticles(event.data)
        resolve()
      });
    })
  }

  const computeWordsFrequencies = async () => {
    wordsFrequenciesWorker?.postMessage({ articles: filteredArticles })
    return new Promise<void>((resolve, reject) => {
      wordsFrequenciesWorker?.addEventListener('message', (event) => {
        setWordsFrequencies(event.data)
        resolve()
      });
    })
  }

  const articlesIndex = useMemo(() => {
    const options = {
      // isCaseSensitive: false,
      // includeScore: false,
      // shouldSort: true,
      includeMatches: false,
      // findAllMatches: false,
      // minMatchCharLength: 1,
      // location: 0,
      threshold: 0.2,
      // distance: 100,
      // useExtendedSearch: false,
      // ignoreLocation: false,
      // ignoreFieldNorm: false,
      // fieldNormWeight: 1,
      keys: [
        "std.title",
        "out.process_sections.title",
        "out.process_sections.body",
      ]
    };
    return new Fuse(articles, options);
  }, [articles])

  const wordFrequenciesIndex = useMemo(() => {
    const options = {
      // isCaseSensitive: false,
      // includeScore: false,
      // shouldSort: true,
      includeMatches: false,
      // findAllMatches: false,
      // minMatchCharLength: 1,
      // location: 0,
      threshold: 0.2,
      // distance: 100,
      // useExtendedSearch: false,
      // ignoreLocation: false,
      // ignoreFieldNorm: false,
      // fieldNormWeight: 1,
      keys: [
        "word"
      ]
    };
    return new Fuse(wordsFrequencies, options);
  }, [wordsFrequencies])

  const filteredArticles = useMemo(() => {
    let data: Article[] = JSON.parse(JSON.stringify(articles))
    // query filters
    if (articlesQuery) {
      data = articlesIndex.search(articlesQuery).map(e => e.item).filter(e => !!e)
    }
    if (filterByDate[0] || filterByDate[1]) {
      data = data.filter(a => {
        const d = getObjectValue(a, "std.publication_datetime")
        if (d) {
          const date = new Date(d)
          if (!!filterByDate[0] && !!filterByDate[1]) {
            return isBefore(filterByDate[0], date) && isAfter(filterByDate[1], date)
          }
          else if (!!filterByDate[0]) {
            return isBefore(filterByDate[0], date)
          }
          else if (!!filterByDate[1]) {
            return isAfter(filterByDate[1], date)
          }
        }

        return true
      })
    }
    // string filters
    if (Object.keys(filterBy).length > 0) {
      for (let p in filterBy) {
        const pa = filterBy[p] || []
        data = data.filter(a => pa.includes(getObjectValue(a, p) || ""))
      }
    }
    // categories filters
    if (selectedCategories.length > 0) {
      const selCat = categories.filter(c => selectedCategories.includes(c.id))
      const thresholdSet = scoresThresholds[scoreDisplaySource || "auto"]
      if (andMode) {
        data = data.filter(a => selCat.every(c => passScoreTest(a, c, thresholdSet, scoreDisplaySource)))
      }
      else {
        data = data.filter(a => selCat.some(c => passScoreTest(a, c, thresholdSet, scoreDisplaySource)))
      }
    }
    // sort by prop
    if (sortBy) {
      data.sort((a, b) => {
        const A = getObjectValue(a, sortBy)
        const B = getObjectValue(b, sortBy)
        if (A > B) return sortAsc ? 1 : -1
        if (A < B) return sortAsc ? -1 : 1
        return 0
      })
    }
    // sort by score
    if (sortByScore) {
      data.sort((a, b) => {
        const A = getScore(a, sortByScore) || 0
        const B = getScore(b, sortByScore) || 0
        if (A > B) return sortAsc ? 1 : -1
        if (A < B) return sortAsc ? -1 : 1
        return 0
      })
    }
    return data
  }, [articles, articlesQuery, sortBy, sortAsc, selectedCategories, categories, sortByScore, andMode, filterBy, filterByDate, scoresThresholds, scoreDisplaySource])


  const filteredWordFrequencies = useMemo(() => {
    let data: WordFrequency[] = JSON.parse(JSON.stringify(wordsFrequencies))
    // count threshold filter
    if(freqThreshold !== 0 || !freqThresholdGT) {
      data = data.filter(d => (d.count > freqThreshold && freqThresholdGT) || (d.count < freqThreshold && !freqThresholdGT))
    }
    // sort by prop
    if (freqSortBy) {
      data.sort((a, b) => {
        const A = a[freqSortBy]
        const B = b[freqSortBy]
        if (A > B) return freqSortAsc ? 1 : -1
        if (A < B) return freqSortAsc ? -1 : 1
        return 0
      })
    }
    data = data.map((d, i) => ({ ...d, index: i }))
    // query filters
    if (frequenciesQuery) {
      data = wordFrequenciesIndex.search(frequenciesQuery).map(e => data.find(ee => ee.word === e.item.word) || e.item)
      if (freqSortBy) {
        data.sort((a, b) => {
          const A = a[freqSortBy]
          const B = b[freqSortBy]
          if (A > B) return freqSortAsc ? 1 : -1
          if (A < B) return freqSortAsc ? -1 : 1
          return 0
        })
      }
    }
    return data
  }, [wordsFrequencies, frequenciesQuery, freqSortBy, freqSortAsc, freqThreshold, freqThresholdGT])


  // EDIT HERE... add your custom useState hook to store fetched data (see below).

  const fetchArticles = (offset?: number, limit?: number) => {
    setLoading(true)
    fetch(`/api/articles?offset=${offset || 0}&limit=${limit || 0}`)
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

  const setCategories = (categories: Category[], uid?: string) => {
    setCategoriesValues(categories)
    if (uid && dataset) {
      updateData(`datasets/${uid}/${dataset.id}`, { ...dataset, categories })
    }
  }

  const toggleCategory = (item: Category) => {
    if (item.id && selectedCategories.includes(item.id)) {
      setSelectedCategories(selectedCategories.filter(a => a !== item.id))
    }
    else {
      setSelectedCategories([...selectedCategories, item.id])
    }
  }

  const setDataset = (dataset: Dataset) => {
    setLocalDataset(dataset)
    setCategoriesValues(dataset.categories || [])
  }

  const deleteDataset = (id?: string, uid?: string) => {
    if (id && uid) {
      updateData(`datasets/${uid}/${id}`, null)
    }
  }

  const addCategory = (item: Category, uid?: string) => {
    if (uid && dataset?.id) {
      const categories = dataset.categories || []
      updateData(`datasets/${uid}/${dataset.id}/categories`, [...categories, { ...item, id: uuidv4() }])
    }
  }

  const updateCategory = (item: Category, uid?: string) => {
    if (uid && dataset?.id) {
      const categories = dataset.categories || []
      const i = categories.findIndex(e => e.id === item.id)
      if (i >= 0) {
        categories.splice(i, 1, item)
        updateData(`datasets/${uid}/${dataset.id}/categories`, categories)
      }
    }
  }

  const updateCategories = (categories: Category[], uid?: string) => {
    if (uid && dataset?.id) {
      updateData(`datasets/${uid}/${dataset.id}/categories`, categories)
    }
  }

  const deleteCategory = (item?: Category, uid?: string) => {
    if (item && uid && dataset?.id) {
      const categories = (dataset.categories || []).filter(c => c.id !== item.id)
      updateData(`datasets/${uid}/${dataset.id}/categories`, categories)
    }
  }

  // EDIT HERE... add your custom useState hook to store fetched data (see below).

  /**
   * Initialization of the global data listeners.
   * Since the database stores objects with the item id as key (instead of array),
   * you can retrieve and expose an array using the functions `objectToArray` or `objectsListToArraysList`.
   */
  useEffect(() => {
    if (auth.currentUser?.uid) {
      // example of collection fetching
      return onValue(ref(db, `datasets/${auth.currentUser?.uid}`), snapshot => setDatasets(objectToArray((snapshot.val()), "id")))
    }
  }, [auth.currentUser])


  // EDIT HERE... Add your custom listeners here is useEffect hooks to fetch data.

  useEffect(() => {
    if (auth.currentUser?.uid && dataset) {
      setLocalDataset(datasets.find(d => d.id === dataset.id))
    }
  }, [auth.currentUser, datasets])

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
  const updateItems = async (data: { [path: string]: any }) => {
    return await update(ref(db), data);
  }



  // EDIT HERE... exposed variables (accessible using the useDatabase() hook).
  const contextValues: DatabaseContext = {
    loadArticlesFromFile,
    computeArticles,
    computeWordsFrequencies,

    updateData,
    updateItems,
    addItem,

    datasets,
    dataset,
    setDataset,
    deleteDataset,
    categories,
    setCategories,
    updateCategories,
    addCategory,
    updateCategory,
    deleteCategory,

    fetchArticles,
    loading,
    filteredArticles,
    articles,
    setArticles,
    articlesIndex,
    articlesQuery,
    setArticlesQuery,
    sortBy,
    setSortBy,
    sortAsc,
    setSortAsc,
    selectedCategories,
    setSelectedCategories,
    toggleCategory,
    sortByScore,
    setSortByScore,
    andMode,
    setAndMode,
    filterBy,
    setFilterBy,
    filterByDate,
    setFilterByDate,
    scoreDisplayMode,
    setScoreDisplayMode,
    scoreDisplaySource,
    setScoreDisplaySource,
    articleRowDetails,
    setArticleRowDetails,
    displayedCategories,
    setDisplayedCategories,
    scoresThresholds,
    setScoresThresholds,
    thresholds,
    categoryRowDetails,
    setCategoryRowDetails,
    wordsFrequencies,
    frequenciesQuery,
    setFrequenciesQuery,
    filteredWordFrequencies,
    freqSortBy,
    setFreqSortBy,
    freqSortAsc,
    setFreqSortAsc,
    freqThreshold,
    setFreqThreshold,
    freqThresholdGT,
    setFreqThresholdGT
  }

  return (
    <DatabaseContext.Provider value={contextValues}>
      {children}
    </DatabaseContext.Provider>
  )
}

export const useDatabase = () => useContext(DatabaseContext)