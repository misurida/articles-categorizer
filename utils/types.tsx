import { MantineNumberSize } from "@mantine/core"

export interface Article {
  id: string
  std: {
    title: string
    publication_datetime: string
    lang_code: string
    url: string
    body?: string
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
  extracts?: TextPart[]
  tags?: string[]
}

export interface ArticleRowDetails {
  title?: boolean
  publisher_name?: boolean
  source_name?: boolean
  publication_datetime?: boolean
  lang?: boolean
  sections_length?: boolean
  checkbox?: boolean
}

export interface CategoryRowDetails {
  color?: boolean
  display_button?: boolean
  edit_button?: boolean
  count?: boolean
}

export interface ScoresThresholds {
  auto?: Record<string, number>
  legacy?: Record<string, number>
  computed?: Record<string, number>
  delta?: Record<string, number>
}

export type ScoreThresholds = Record<string, number>

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
  snippet?: KeywordRule
}

export interface Category {
  name: string
  key: string
  id: string
  parentId?: string | null
  color?: string
  rules: KeywordRule[]
  legacy_key?: string
  sections_weights?: Partial<Record<SectionName, number>>
  quick_keywords?: string[]
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

export const textPartTypes = ['extract', 'keyword'] as const

export type TextPartType = typeof textPartTypes[number]

/**
 * Object to be stored
 */
export type TextPart = {
  text: string
  id?: string
  color?: string
  categoryKey?: string
  type?: TextPartType
  start?: number
  end?: number
  section?: string
}

export type TextPartPooled = TextPart & {
  typesPool?: TextPartType[] // computed on UI (not stored). Used to store multiple types.
}

export type TextPartPooledGroup = {
  text: string
  parts: TextPartPooled[]
}

/**
 * Object to be displayed as span
 */
export type TextPartPos = {
  text: string
  id?: string
  start?: number
  end?: number
  payload?: TextPart[]
  open?: boolean
}

/**
 * Simple position marker used by buildTextParts()
 */
export type TextPos = {
  id: string
  start: number
  end: number
}

export type ArticleListAction = 'details' | 'check' | 'click' | 'select'

export type ArticleSection = 'default' | 'processed'

export interface TagsParameters {
  highlight?: boolean
  color?: boolean
  background?: boolean
  underline?: boolean
  textSize?: MantineNumberSize
}

export type DbImportMode = 'first_to_last' | 'last_to_first' | 'random' 