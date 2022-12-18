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

export type SectionName = 'title' | 'body' | 'snippet'
export interface KeywordRule {
  hook: string
  must_contain_any?: string[]
  must_contain_all?: string[]
  must_not_contain?: string[]
  restrict_sections?: SectionName[]
  enforce_maximum?: boolean
  weight?: number
}

export interface Category {
  name: string
  key: string
  id: string
  parentId?: string | null
  color?: string
  rules: KeywordRule[]
  legacy_key?: string
  threshold?: number
}

export interface Dataset {
  id?: string
  name: string
  createdAt: Date
  userId: string
  categories: Category[]
}