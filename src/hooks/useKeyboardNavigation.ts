import { useEffect } from 'react'

interface UseKeyboardNavigationProps {
  currentStep: number
  totalSteps: number
  onPreviousStep: () => void
  onNextStep: () => void
  onSubmit?: () => void
  disabled?: boolean
}

export function useKeyboardNavigation({
  currentStep,
  totalSteps,
  onPreviousStep,
  onNextStep,
  onSubmit,
  disabled = false
}: UseKeyboardNavigationProps) {
  useEffect(() => {
    if (disabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't interfere if user is typing in an input
      if (event.target instanceof HTMLInputElement ||
          event.target instanceof HTMLTextAreaElement ||
          event.target instanceof HTMLSelectElement) {
        return
      }

      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'ArrowLeft':
            event.preventDefault()
            if (currentStep > 1) {
              onPreviousStep()
            }
            break
          case 'ArrowRight':
            event.preventDefault()
            if (currentStep < totalSteps) {
              onNextStep()
            }
            break
          case 'Enter':
            event.preventDefault()
            if (currentStep === totalSteps && onSubmit) {
              onSubmit()
            } else if (currentStep < totalSteps) {
              onNextStep()
            }
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentStep, totalSteps, onPreviousStep, onNextStep, onSubmit, disabled])
}

export default useKeyboardNavigation