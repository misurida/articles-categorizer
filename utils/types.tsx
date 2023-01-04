export interface Article {
  id: string
  std: {
    title: string
    publication_datetime: string
    lang_code: string
    url: string
  }
  non_std: {
    publisher_name: string
    source_name: string
  }
  out: {
    infer_language: string
    process_sections: {
      title: string
      body: string
    }
    classify_categories: {
      relevance_scores: {
        [key: string]: number
      }
    }
  }
}

export interface ArticleRowDetails {
  title?: boolean
  publisher_name?: boolean
  source_name?: boolean
  publication_datetime?: boolean
  lang?: boolean
  sections_length?: boolean
}

export interface CategoryRowDetails {
  color?: boolean
  display_button?: boolean
  edit_button?: boolean
  count?: boolean
}

export interface ScoresThresholds {
  auto: Record<string, number>
  legacy: Record<string, number>
  computed: Record<string, number>
  delta: Record<string, number>
}

export type DisplaySources = "legacy" | "computed" | "delta"

export type SectionName = 'title' | 'body' | 'snippet'
export interface KeywordRule {
  hook?: string
  inactive?: boolean
  must_contain_any?: string[]
  must_contain_all?: string[]
  must_not_contain?: string[]
  weight?: number
  boost?: number
  
  title?: KeywordRule
  body?: KeywordRule
}

export interface Category {
  name: string
  key: string
  id: string
  parentId?: string | null
  color?: string
  rules: KeywordRule[]
  legacy_key?: string
}

export interface Dataset {
  id?: string
  name: string
  createdAt: Date
  userId: string
  categories: Category[]
}

export interface WordFrequency {
  word: string
  count: number
  index: number
}