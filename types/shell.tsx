export interface DefaultPageProps {
  children?: React.ReactNode
}

export interface InternationalizationStaticProps {
  locale: string
}

export interface MenuLink {
  label: string;
  icon?: React.ReactNode
  color?: string;
  to?: string;
  auth?: boolean
  role?: UserMeta["role"][]
  rightSection?: React.ReactNode
  children?: MenuLink[]
  style?: React.CSSProperties
}

export interface UserMeta {
  displayName: string
  email: string
  role: "member" | "admin"
  suggestAddToFavorite?: boolean
  suggestAddAsExercise?: boolean
  registrationDate?: Date
}

export interface DefaultPageProps {
  children?: React.ReactNode
}

export interface InternationalizationStaticProps {
  locale: string
}

export interface UserMeta {
  displayName: string
  email: string
  role: "member" | "admin"
  suggestAddToFavorite?: boolean
  suggestAddAsExercise?: boolean
  registrationDate?: Date
}

export interface Upload {
  id?: string
  uid?: string
  name: string
  size: number
  contentType: string
  timeCreated: string
  url: string
  loading?: number
  userId?: string
  isPublic?: boolean
}
