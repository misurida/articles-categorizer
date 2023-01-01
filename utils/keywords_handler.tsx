import { Article, Category, KeywordRule, WordFrequency } from "./types";

export const fuzeOptions = {
  // isCaseSensitive: false,
  includeScore: false,
  // shouldSort: true,
  // includeMatches: false,
  // findAllMatches: false,
  // minMatchCharLength: 1,
  //location: 0,
  threshold: 0.0,
  //distance: 0,
  useExtendedSearch: true,
  // ignoreLocation: false,
  // ignoreFieldNorm: false,
  // fieldNormWeight: 1,
};

/**
 * Compute an average value from a number array.
 * 
 * @param arr a number array.
 * @returns the average value.
 */
export const average = (arr: number[]) => {
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

/**
 * Return the lowest value between the two provided.
 * 
 * @param a The first value to compare.
 * @param b The second value to compare.
 * @returns The lowest value.
 */
export const min = (a: number, b: number) => {
  return a > b ? b : a
}

/**
 * Compute a WordFrequency array based on an Article array.
 * 
 * @param articles Article array.
 * @returns WordFrequency array.
 */
export const getArticleWordFrequencies = (articles: Article[]) => {
  const wordsFound: string[] = []
  const wordsCount: number[] = []

  for (let i = 0; i < articles.length; i++) {
    let a = articles[i]

    const titleWords = a.out.process_sections.title.split(" ")
    for (let j = 0; j < titleWords.length; j++) {
      const w = titleWords[j]
      const index = wordsFound.findIndex(e => e === w)
      if (index >= 0) {
        wordsCount[index]++
      }
      else {
        wordsFound.push(w)
        wordsCount.push(1)
      }
    }

    const bodyWords = a.out.process_sections.body.split(" ")
    for (let j = 0; j < bodyWords.length; j++) {
      const w = bodyWords[j]
      const index = wordsFound.findIndex(e => e === w)
      if (index >= 0) {
        wordsCount[index]++
      }
      else {
        wordsFound.push(w)
        wordsCount.push(1)
      }
    }
  }

  return wordsFound.map((e, i) => ({ word: e, count: wordsCount[i] })) as WordFrequency[]
}


export const getWordFrequencies = (arr: string[]) => {
  const wordsFound: string[] = []
  const wordsCount: number[] = []

  for (let j = 0; j < arr.length; j++) {
    const w = arr[j] || ""
    const index = wordsFound.findIndex(e => e === w)
    if (index >= 0) {
      wordsCount[index]++
    }
    else {
      wordsFound.push(w)
      wordsCount.push(1)
    }
  }

  const wf = wordsFound.map((e, i) => ({ word: e, count: wordsCount[i] }))
  wf.sort((a, b) => b.count - a.count)
  return wf as WordFrequency[]
}




/**
 * Return metrics from an array of string.
 * 
 * @param arr string array.
 * @returns An object of metrics.
 */
export const getSectionSummary = (arr: string[]) => {
  const map: Record<string, number> = {}
  let maxFreq = 1
  let maxFreqName = ""
  for (const e of arr) {
    if (map[e]) {
      map[e]++
      if (maxFreq < map[e]) {
        maxFreq = map[e]
        maxFreqName = e
      }
    }
    else {
      map[e] = 1
    }
  }
  return {
    map,
    maxFreq,
    maxFreqName,
    length: arr.length,
    mapSize: Object.keys(map).length,
    avgFreq: average(Object.values(map))
  };
}

/**
 * Count the number needles (hooks) in a haystack (pool).
 * 
 * @param hooks The string to count.
 * @param pool The string to count from.
 * @returns A count.
 */
export const countFrequencies = (hooks: string[], pool: string[]) => {
  let count = 0;
  for (const p of pool) {
    if (hooks.includes(p)) {
      count++
    }
  }
  return count
}

/**
 * Compute a score from a section represented by a string array.
 * 
 * @param arr The string array to compute the score for.
 * @param rules The keywords rules.
 * @returns score metrics.
 */
export const computeSectionScore = (arr: string[], rules: KeywordRule[]): Record<string, number> => {
  const summary = getSectionSummary(arr)
  const l = rules.length
  let f_unique = 0
  let f_total = 0
  for (const rule of rules) {
    const hooks = rule.hook.split("|")
    const count = countFrequencies(hooks, arr)
    f_total += count
    if (count > 0) {
      f_unique++
    }
  }
  const z = min(1, f_total / summary.avgFreq)
  const f_agg = (f_total + f_unique) / (2 * l)
  return {
    l,
    f_unique,
    f_total,
    z,
    f_agg,
    avgFreq: summary.avgFreq,
    maxFreq: summary.maxFreq,
    n: summary.mapSize
  }
}

/**
 * Compute the score of a category for a provided article.
 * 
 * @param article The article to compute the score for.
 * @param categories The category to compute the score from.
 * @returns A score value.
 */
export const computeScore = (article: Article, category: Category) => {

  let score = 0
  const rules = category.rules

  if (rules) {
    score += computeSectionScore(article.out.process_sections.title.split(" "), rules).f_agg
    score += computeSectionScore(article.out.process_sections.body.split(" "), rules).f_agg
  }

  return score
}

/**
 * Compute the provided categories scores for a provided article.
 * 
 * @param article The article to compute the score for.
 * @param categories The scores to compute.
 * @returns The scores.
 */
export const computeScores = (article: Article, categories: Category[]) => {
  const scores = categories.reduce((a, c) => ({ ...a, [c.key]: computeScore(article, c) }), {})
  return scores
}