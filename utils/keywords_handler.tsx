import { Article, Category, KeywordRule, SectionName, WordFrequency } from "./types";

export const defaultWeights = {
  title: 3,
  body: 1
}

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


import translations from '../translations.json'

export function getTranslation(text: string, lang: string): string {
  const row = (translations as Record<string, string>[]).find(e => e.name === text)
  if (row) {
    return row[lang]?.toLowerCase() || text
  }
  return text
}


export const getLemmatizedHooks = (hooks: string[], lang?: string) => {
  const h = hooks.reduce((a, e) => {
    const o = []
    o.push(e)
    const l = getLemmatized(e)
    if (l && l !== e) {
      o.push(l)
    }
    if (lang && lang !== "en") {
      const t = getTranslation(e, lang)
      if (t !== e) {
        o.push(t)
      }
    }
    return [...a, ...o]
  }, [] as string[])
  return h
}

/**
 * Count the number needles (hooks) in a haystack (pool).
 * 
 * @param hooks The string to count.
 * @param pool The string to count from.
 * @returns A count.
 */
export const countFrequencies = (hooks: string[], pool: string[], lang?: string) => {
  const hooksList = getLemmatizedHooks(hooks, lang)
  // poolText version: the take into account the hooks containing spaces, a regex-based count is used on the whole text for each hook
  const poolText = pool.join(" ")
  let count = 0;
  for (const h of hooksList) {
    count += poolText.match(new RegExp(`(?:^|\\s)${h}(?:$|\\s)`, 'gi'))?.length || 0
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
export const computeSectionScore = (arr: string[], rules: KeywordRule[], sec: SectionName, lang?: string): Record<string, number> => {
  const summary = getSectionSummary(arr)
  
  // First filter out inactive rules for this section, not sure exactly how to do it ...
  const activeRules = rules.filter(r => !r[sec]?.inactive) 
  
  // Now filter to active rules with a non-negative boost weight
  const nonNegativeRules = activeRules.filter(r => (!r[sec]?.boost || (r[sec]?.boost || 0) >= 0)) 
  
  // 1) Relative frequency scoring
  // Here we loop over all active rules which do NOT have a negative boost weight, because these
  // words are assumed irrelevant and should not contribute to the relative frequency score.
  const l = nonNegativeRules.length
  let f_unique = 0
  let f_total = 0
  let weight_total = 0
  for (const rule of nonNegativeRules) {
    const hooks = rule.hook?.split("|") || []
    // # alternative: counting all hook pieces and taking the max.
    const count = countFrequencies(hooks, arr, lang)
    const z = min(1, count / summary.avgFreq)
    if (count > 0) {
      // Only need to increment the values if the count > 0
      f_unique++
      f_total += z * (rule.weight || 1)
      weight_total += (rule.weight || 1)
    }
  }
  const f_agg = ((f_unique / l) + (f_total / weight_total)) / 2

  // 2) Absolute boost scoring
  // Here we loop over all active rules regardless of the boost weight to get the total boost score.
  let boost_total = 0
  for (const rule of activeRules) {
    const hooks = rule.hook?.split("|") || []
    const count = countFrequencies(hooks, arr, lang)
    if (count > 0) {
      boost_total += rule?.boost || 0
    }
  }

  // NOTE: The double loop could be merged into one loop if you are careful about treating
  // the negative boosts separately. Again, rules with a negative boost should not affect
  // the f_agg score in any way.

  return {
    l,
    f_unique,
    f_total,
    f_agg,
    boost_total,
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
  const titleWeight = category.sections_weights?.title || defaultWeights.title || 3
  const bodyWeight = category.sections_weights?.body || defaultWeights.body || 1
  let weight_total = titleWeight + bodyWeight

  if (rules) {
    const titleResults = computeSectionScore(article.out.process_sections.title.split(" "), rules, 'title', article.out.infer_language)
    const bodyResults = computeSectionScore(article.out.process_sections.body.split(" "), rules, 'body', article.out.infer_language)

    const titleScore = titleResults.f_agg
    const bodyScore = bodyResults.f_agg
    
    if (titleScore > 0) {
      score += titleWeight * (titleScore + 1) + titleResults.boost_total
    }
    if (bodyScore > 0) {
      score += bodyWeight * (bodyScore + 1) + bodyResults.boost_total
    }
    score = score / weight_total * 10
  }

  return Number(min(score, 10).toFixed(1))
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


const lemmatize = require('wink-lemmatizer')

export const getLemmatized = (str: string) => {
  const noun = lemmatize.noun(str)
  if (noun !== str) {
    return noun
  }
  const ajd = lemmatize.adjective(str)
  if (ajd !== str) {
    return ajd
  }
  const verb = lemmatize.verb(str)
  if (verb !== str) {
    return verb
  }
  return null
}

