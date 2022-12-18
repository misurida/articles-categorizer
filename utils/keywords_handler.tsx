import Fuse from "fuse.js";
import { average, countFrequencies, getWordsFrequency } from "./helpers";
import { Article, Category } from "./types";

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

export const countFuzzyFrequencies = (hooks: string, indx: Fuse<string>) => {
  const res = indx.search(hooks.split("|").map(e => `"${e}"`).join("|"))
  return res.length
}

export const computeScores = (article: Article, categories: Category[], fuzzy = false) => {

  const titleIndex = fuzzy ? new Fuse(article.out.process_sections.title.split(" "), fuzeOptions) : undefined
  const bodyIndex = fuzzy ? new Fuse(article.out.process_sections.body.split(" "), fuzeOptions) : undefined
  const scores = categories.reduce((a, c) => ({ ...a, [c.key]: computeScore(article, c, fuzzy, titleIndex, bodyIndex) }), {})
  return scores
}

export const computeScore = (article: Article, category: Category, fuzzy = false, titleIndex?: Fuse<string>, bodyIndex?: Fuse<string>) => {

  let score = 0
  const rules = category.rules

  if (rules) {
    // title
    const titleWords = article.out.process_sections.title.split(" ")
    const titleFreq = getWordsFrequency(titleWords)
    const titleIndx = titleIndex || fuzzy ? new Fuse(article.out.process_sections.title.split(" "), fuzeOptions) : undefined
    for (const rule of rules) {
      const hooks = rule.hook.split("|")
      const ruleScore = fuzzy && titleIndx ? countFuzzyFrequencies(rule.hook, titleIndx) : countFrequencies(hooks, titleWords)
      score += ruleScore
    }

    // body
    const bodyWords = article.out.process_sections.body.split(" ")
    const bodyFreq = getWordsFrequency(bodyWords)
    const bodyIndx = titleIndex || fuzzy ? new Fuse(article.out.process_sections.body.split(" "), fuzeOptions) : undefined
    for (const rule of rules) {
      const hooks = rule.hook.split("|")
      const ruleScore = fuzzy && bodyIndx ? countFuzzyFrequencies(rule.hook, bodyIndx) : countFrequencies(hooks, titleWords)
      score += ruleScore
    }
  }

  //score *= 1

  return score

}