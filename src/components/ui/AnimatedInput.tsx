import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import Input from './Input'

interface AnimatedInputProps extends React.ComponentProps<typeof Input> {
  delay?: number
}

const AnimatedInput = forwardRef<HTMLInputElement, AnimatedInputProps>(
  ({ delay = 0, className, ...props }, ref) => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay }}
      >
        <Input
          ref={ref}
          className={`transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
          {...props}
        />
      </motion.div>
    )
  }
)

AnimatedInput.displayName = 'AnimatedInput'

export default AnimatedInput