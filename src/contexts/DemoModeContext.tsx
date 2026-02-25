import { createContext, useContext, useState, ReactNode } from 'react'

interface DemoModeContextType {
  isDemoMode: boolean
  toggleDemoMode: () => void
}

const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined)

export const DemoModeProvider = ({ children }: { children: ReactNode }) => {
  const [isDemoMode, setIsDemoMode] = useState(() => {
    const stored = localStorage.getItem('demo-mode')
    return stored === null ? true : stored === 'true'
  })

  const toggleDemoMode = () => {
    setIsDemoMode(prev => {
      const next = !prev
      localStorage.setItem('demo-mode', String(next))
      return next
    })
  }

  return (
    <DemoModeContext.Provider value={{ isDemoMode, toggleDemoMode }}>
      {children}
    </DemoModeContext.Provider>
  )
}

export const useDemoMode = () => {
  const context = useContext(DemoModeContext)
  if (!context) throw new Error('useDemoMode must be used within DemoModeProvider')
  return context
}
