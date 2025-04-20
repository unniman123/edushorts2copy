declare module 'sonner-native' {
  import { FC } from 'react'

  interface ToasterProps {
    theme?: 'light' | 'dark'
    position?: 'top' | 'bottom'
  }

  export const Toaster: FC<ToasterProps>
}
