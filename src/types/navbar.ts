export interface NavItem {
  id: string
  label: string
  href: string
  children?: NavItem[]
}

export interface User {
  email: string
  profileCompleted: boolean
  currentRole: string
  id?: string
  name?: string
  avatar?: string
}

export interface NavbarProps {
  variant?: 'default' | 'transparent'
  showQuickmenu?: boolean
}
