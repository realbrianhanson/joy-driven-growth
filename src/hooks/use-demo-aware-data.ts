import { useDemoMode } from '@/contexts/DemoModeContext'

export function useDemoAwareData<T>(mockData: T, realData: T, isLoading: boolean) {
  const { isDemoMode } = useDemoMode()

  return {
    data: isDemoMode ? mockData : realData,
    isLoading: isDemoMode ? false : isLoading,
    isDemoMode,
  }
}
