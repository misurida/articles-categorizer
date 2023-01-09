import { countFrequencies } from "./keywords_handler"
import { Article, ArticleSection, Category } from "./types"


export const countOccurrences = (text: string, needle: string) => {
  const regex = new RegExp(needle, 'g')
  return (text.match(regex) || []).length
}

export const countKeywords = (category: Category, articleSection?: ArticleSection | null, article?: Article) => {
  if (category.quick_keywords && article) {
    let count = 0
    if (articleSection === "processed") {
      count += category.quick_keywords.reduce((a,e) => a + countOccurrences(article.out.process_sections.title, e), 0)
      count += category.quick_keywords.reduce((a,e) => a + countOccurrences(article.out.process_sections.body, e), 0)
    }
    if(count > 0) {
      return count
    }
  }
  return undefined
}