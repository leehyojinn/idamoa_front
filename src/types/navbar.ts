export interface NavItem {
  id: string
  label: string
  href: string
  children?: NavItem[]
}

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

export interface NavbarProps {
  variant?: 'default' | 'transparent'
  showQuickmenu?: boolean
}
