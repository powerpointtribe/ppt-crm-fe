import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store'

export default function GlobalLoadingIndicator() {
  const { isApiLoading } = useAppStore()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let interval: NodeJS.Timeout
    let timeout: NodeJS.Timeout

    if (isApiLoading) {
      setVisible(true)
      setProgress(0)

      // Simulate progress - fast at first, then slow down
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev // Cap at 90% until complete
          // Faster progress at start, slower as it approaches 90%
          const increment = Math.max(1, (90 - prev) / 10)
          return Math.min(90, prev + increment)
        })
      }, 100)
    } else {
      // Complete the progress bar
      setProgress(100)

      // Hide after completion animation
      timeout = setTimeout(() => {
        setVisible(false)
        setProgress(0)
      }, 300)
    }

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [isApiLoading])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-gray-200/50"
        >
          <motion.div
            className="h-full bg-gradient-to-r from-primary-500 via-primary-600 to-primary-500 shadow-lg shadow-primary-500/30"
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{
              duration: progress === 100 ? 0.2 : 0.1,
              ease: 'easeOut'
            }}
          />
          {/* Animated glow effect */}
          {isApiLoading && (
            <motion.div
              className="absolute top-0 right-0 h-full w-20 bg-gradient-to-r from-transparent via-white/40 to-transparent"
              animate={{
                x: ['-100%', '400%'],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'linear',
              }}
              style={{ right: `${100 - progress}%` }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
