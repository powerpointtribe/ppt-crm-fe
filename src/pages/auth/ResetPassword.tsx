import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, Eye, EyeOff, ArrowLeft, Shield, AlertCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { apiService } from '@/services/api'

const resetPasswordSchema = z.object({
  newPassword: z.string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
    .min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

export default function ResetPassword() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)
  const [isSuccess, setIsSuccess] = useState(false)
  const [tokenError, setTokenError] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const token = searchParams.get('token')

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setTokenError('No reset token provided. Please request a new password reset link.')
        setIsVerifying(false)
        return
      }

      try {
        const response = await apiService.get(`/auth/verify-reset-token?token=${token}`)
        if (response.data?.email) {
          setUserEmail(response.data.email)
        }
        setIsVerifying(false)
      } catch (error: any) {
        setTokenError(error.message || 'This reset link is invalid or has expired. Please request a new one.')
        setIsVerifying(false)
      }
    }

    verifyToken()
  }, [token])

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) return

    setIsLoading(true)
    try {
      await apiService.post('/auth/reset-password', {
        token,
        newPassword: data.newPassword,
      })
      setIsSuccess(true)
    } catch (error: any) {
      if (error.code === 400) {
        setError('newPassword', {
          type: 'manual',
          message: error.message || 'Invalid or expired reset link'
        })
      } else {
        setError('newPassword', {
          type: 'manual',
          message: error.message || 'An error occurred. Please try again.'
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToLogin = () => {
    navigate('/login')
  }

  // Loading state while verifying token
  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <Card className="card-content">
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Verifying your reset link...</p>
            </div>
          </Card>
        </motion.div>
      </div>
    )
  }

  // Error state for invalid/expired token
  if (tokenError) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <Card className="card-content">
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', bounce: 0.5 }}
                className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
              >
                <AlertCircle className="w-8 h-8 text-white" />
              </motion.div>
              <motion.h1
                className="text-2xl font-bold text-foreground"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Invalid Reset Link
              </motion.h1>
              <motion.p
                className="text-muted-foreground mt-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                {tokenError}
              </motion.p>
            </div>

            <motion.div
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <Link to="/forgot-password">
                <Button className="w-full" size="lg">
                  Request New Reset Link
                </Button>
              </Link>

              <div className="text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Login
                </Link>
              </div>
            </motion.div>

            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-red-400 rounded-t-lg"></div>
          </Card>
        </motion.div>
      </div>
    )
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <Card className="card-content">
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', bounce: 0.6, duration: 0.8 }}
                className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
              >
                <Shield className="w-8 h-8 text-white" />
              </motion.div>
              <motion.h1
                className="text-3xl font-bold text-foreground"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Password Reset Successfully
              </motion.h1>
              <motion.p
                className="text-muted-foreground mt-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                Your password has been updated. You can now sign in with your new password.
              </motion.p>
            </div>

            <motion.div
              className="space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <Button
                onClick={handleBackToLogin}
                className="w-full"
                size="lg"
              >
                Continue to Login
              </Button>
            </motion.div>

            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-600 to-green-400 rounded-t-lg"></div>
          </Card>
        </motion.div>
      </div>
    )
  }

  // Reset password form
  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <Card className="card-content">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', bounce: 0.6, duration: 0.8 }}
              className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
            >
              <Lock className="w-8 h-8 text-white" />
            </motion.div>
            <motion.h1
              className="text-3xl font-bold text-foreground"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Reset Password
            </motion.h1>
            <motion.p
              className="text-muted-foreground mt-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {userEmail ? (
                <>Create a new password for <span className="font-medium text-foreground">{userEmail}</span></>
              ) : (
                'Create a new password for your account.'
              )}
            </motion.p>
          </div>

          <motion.form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Input
              {...register('newPassword')}
              type={showPassword ? 'text' : 'password'}
              label="New Password"
              placeholder="Enter new password"
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
              error={errors.newPassword?.message}
            />

            <Input
              {...register('confirmPassword')}
              type={showConfirmPassword ? 'text' : 'password'}
              label="Confirm New Password"
              placeholder="Confirm new password"
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              }
              error={errors.confirmPassword?.message}
            />

            <Button
              type="submit"
              loading={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? 'Resetting Password...' : 'Reset Password'}
            </Button>
          </motion.form>

          <motion.div
            className="mt-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <Link
              to="/login"
              className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Link>
          </motion.div>

          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-600 to-primary-400 rounded-t-lg"></div>
        </Card>
      </motion.div>
    </div>
  )
}
