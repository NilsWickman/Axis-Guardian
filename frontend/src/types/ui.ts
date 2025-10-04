// UI component types
export interface NavigationItem {
  name: string
  path: string
  icon?: string
}

export interface TableColumn {
  key: string
  label: string
  sortable?: boolean
}