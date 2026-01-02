import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, LogIn, Mail, Lock, ArrowLeft, Church, Shield, CheckCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useAuth } from '@/contexts/AuthContext-unified'
import { debugLog } from '@/components/DebugPanel'
import DebugPanel from '@/components/DebugPanel'

const loginSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z.string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    localStorage.setItem('lastLoginAttempt', Date.now().toString())
    try {
      debugLog('Starting login...')
      await login(data.email, data.password)
      debugLog('Login successful via auth context')

      setTimeout(() => {
        debugLog('Navigating to dashboard...')
        navigate('/dashboard')
      }, 200)
    } catch (error: any) {
      debugLog(`Login error: ${error.message}`)

      // Extract error details from various response formats
      const errorCode = error.errorCode || error.response?.data?.errorCode;
      const errorMessage = error.message || error.response?.data?.message;

      // Handle invitation-related errors
      if (errorCode === 'INVITATION_REQUIRED') {
        setError('email', {
          type: 'manual',
          message: 'Access denied. You need an invitation to access this platform. Please contact an administrator.'
        })
      } else if (errorCode === 'INVITATION_EXPIRED') {
        setError('email', {
          type: 'manual',
          message: 'Your invitation has expired. Please contact an administrator for a new invitation.'
        })
      } else if (error.code === 401) {
        // Check if it's a custom 401 with invitation message
        if (errorMessage?.toLowerCase().includes('invitation')) {
          setError('email', {
            type: 'manual',
            message: errorMessage
          })
        } else {
          setError('password', {
            type: 'manual',
            message: 'Invalid email or password'
          })
        }
      } else if (error.code === 400) {
        setError('email', {
          type: 'manual',
          message: error.message || 'Please check your credentials'
        })
      } else if (error.message?.toLowerCase().includes('network')) {
        setError('email', {
          type: 'manual',
          message: 'Network error. Please check your connection and try again.'
        })
      } else {
        setError('email', {
          type: 'manual',
          message: error.message || 'An error occurred during login. Please try again.'
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative mobile-safe no-overflow">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-background to-accent-50"></div>
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

      {/* Navigation */}
      <motion.nav
        className="relative z-10 p-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center justify-between container-safe gap-4">
          <Link to="/" className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors btn-mobile-safe">
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="font-medium text-sm sm:text-base">Back to home</span>
          </Link>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-lg">
              <Church className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-foreground">PowerPoint Tribe</span>
              <span className="text-xs text-muted-foreground font-medium">Management System</span>
            </div>
          </div>
        </div>
      </motion.nav>

      <div className="relative z-10 flex items-center justify-center section-padding pb-16">
        <div className="w-full max-w-6xl responsive-grid grid-cols-1 lg:grid-cols-2 items-center">
          {/* Left Side - Marketing Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="hidden lg:block"
          >
            <div className="max-w-lg">
              <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-6 leading-tight">
                Welcome back to
                <br />
                <span className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                  PowerPoint Tribe
                </span>
              </h1>
              <p className="text-lg lg:text-xl text-muted-foreground mb-8 leading-relaxed">
                Continue serving PowerPoint Tribe Church with our comprehensive management platform designed for ministry excellence.
              </p>

              <div className="space-y-4">
                {[
                  { icon: CheckCircle, text: "PowerPoint Tribe member directory" },
                  { icon: Shield, text: "Secure church data platform" },
                  { icon: Church, text: "Cell group coordination tools" }
                ].map((feature, index) => (
                  <motion.div
                    key={feature.text}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 + (index * 0.1) }}
                    className="flex items-center space-x-3"
                  >
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <feature.icon className="h-4 w-4 text-primary-600" />
                    </div>
                    <span className="text-muted-foreground">{feature.text}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right Side - Login Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full max-w-md mx-auto lg:mx-0"
          >
            <Card className="p-8 shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3, type: 'spring', bounce: 0.6, duration: 0.8 }}
                  className="w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"
                >
                  <LogIn className="w-8 h-8 text-white" />
                </motion.div>
                <motion.h2
                  className="text-xl lg:text-2xl font-bold text-foreground"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  Sign In
                </motion.h2>
                <motion.p
                  className="text-muted-foreground mt-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  Access your PowerPoint Tribe dashboard
                </motion.p>

              </div>

              <motion.form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <Input
                  {...register('email')}
                  type="email"
                  label="Email Address"
                  placeholder="Enter your email"
                  leftIcon={<Mail className="h-4 w-4" />}
                  error={errors.email?.message}
                />

                <Input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  label="Password"
                  placeholder="Enter your password"
                  leftIcon={<Lock className="h-4 w-4" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  }
                  error={errors.password?.message}
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-border rounded focus-ring"
                    />
                    <label htmlFor="remember-me" className="text-sm text-muted-foreground">
                      Remember me
                    </label>
                  </div>

                  <Link
                    to="/forgot-password"
                    className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  loading={isLoading}
                  className="w-full h-12 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 shadow-lg"
                  size="lg"
                >
                  {isLoading ? 'Signing in...' : 'Sign in to Dashboard'}
                </Button>
              </motion.form>

              <motion.div
                className="mt-8 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
              >
                <p className="text-sm text-muted-foreground">
                  Access restricted to invited Powerpoint Tribe members only. Contact an administrator if you need access.
                </p>
              </motion.div>

              {/* Decorative elements */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-600 to-accent-600 rounded-t-lg"></div>
            </Card>
          </motion.div>
        </div>
      </div>
      <DebugPanel />
    </div>
  )
}
