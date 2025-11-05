import React, { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Trash2, User, Phone, Mail,
  ChevronLeft, ChevronRight, Check, AlertCircle, Calendar, Heart, Clock
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import ImageUpload from '@/components/ui/ImageUpload'
import { publicVisitorRegistrationSchema, PublicVisitorRegistrationData } from '@/schemas/publicVisitorRegistration'
import { cn } from '@/utils/cn'

interface PublicVisitorRegistrationFormProps {
  onSubmit: (data: PublicVisitorRegistrationData) => Promise<void>
  loading?: boolean
  onSuccess?: () => void
}

export default function PublicVisitorRegistrationForm({
  onSubmit,
  loading = false,
  onSuccess
}: PublicVisitorRegistrationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [progress, setProgress] = useState(0)

  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
    formState: { errors },
    reset
  } = useForm<PublicVisitorRegistrationData>({
    resolver: zodResolver(publicVisitorRegistrationSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      dateOfBirth: '',
      gender: undefined,
      maritalStatus: undefined,
      occupation: '',
      alternateContactMethod: '',
      website: '',
      socialMediaHandles: {
        facebook: '',
        instagram: '',
        twitter: '',
        linkedin: '',
        tiktok: '',
        other: ''
      },
      referredBy: '',
      invitedBy: '',
      serviceExperience: '',
      profilePhotoUrl: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'Nigeria'
      },
      dateOfVisit: new Date().toISOString().split('T')[0],
      serviceType: '',
      howDidYouHear: undefined,
      familyMembers: [],
      interests: [],
      servingInterests: [],
      prayerRequests: [],
      emergencyContact: {
        name: '',
        relationship: '',
        phone: ''
      },
      comments: '',
      allowFollowUp: true,
      preferredContactMethod: undefined,
      privacyConsent: false
    }
  })

  // Watch all form values for progress calculation
  const watchedValues = watch()

  // Calculate progress based on filled fields
  const calculateProgress = () => {
    const requiredFields = ['firstName', 'lastName', 'phone', 'dateOfVisit']
    const optionalFields = [
      'email', 'dateOfBirth', 'gender', 'occupation', 'address.city', 'address.state',
      'website', 'socialMediaHandles.instagram', 'socialMediaHandles.facebook',
      'invitedBy', 'referredBy', 'howDidYouHear', 'interestedInJoining',
      'serviceExperience', 'profilePhotoUrl', 'prayerRequests', 'allowFollowUp',
      'preferredContactMethod'
    ]

    const allFields = [...requiredFields, ...optionalFields]
    let filledCount = 0

    // Check required fields (higher weight)
    requiredFields.forEach(field => {
      const value = field.includes('.') ?
        field.split('.').reduce((obj, key) => obj?.[key], watchedValues) :
        watchedValues[field as keyof PublicVisitorRegistrationData]

      if (value && value.toString().trim()) {
        filledCount += 2 // Required fields count double
      }
    })

    // Check optional fields
    optionalFields.forEach(field => {
      const value = field.includes('.') ?
        field.split('.').reduce((obj, key) => obj?.[key], watchedValues) :
        watchedValues[field as keyof PublicVisitorRegistrationData]

      if (value && value.toString().trim()) {
        filledCount += 1
      }
    })

    // Special handling for arrays
    if (watchedValues.prayerRequests?.length > 0) {
      filledCount += 1
    }

    const maxPossibleScore = requiredFields.length * 2 + optionalFields.length
    return Math.min(100, Math.round((filledCount / maxPossibleScore) * 100))
  }

  // Update progress when form values change
  useEffect(() => {
    const newProgress = calculateProgress()
    console.log('Progress calculated:', newProgress, 'Required fields filled:', {
      firstName: watchedValues.firstName,
      lastName: watchedValues.lastName,
      phone: watchedValues.phone,
      dateOfVisit: watchedValues.dateOfVisit
    })
    setProgress(newProgress)
  }, [watchedValues])

  const {
    fields: prayerFields,
    append: appendPrayer,
    remove: removePrayer
  } = useFieldArray({
    control,
    name: 'prayerRequests'
  })

  const handleFormSubmit = async (data: PublicVisitorRegistrationData) => {
    try {
      setIsSubmitting(true)
      console.log('Form submission started')
      console.log('Form data being submitted:', data)
      console.log('Form progress:', progress)
      await onSubmit(data)
      console.log('Form submission successful')
      reset()
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error('Form submission error:', error)
      throw error // Re-throw to ensure error is handled properly
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderProgressIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Visitor Registration</h3>
            <p className="text-sm text-gray-600">Tell us about yourself</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">{progress}%</div>
          <div className="text-xs text-gray-500">Complete</div>
        </div>
      </div>

      {/* Animated Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>

      {/* Progress Milestones */}
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <span className={progress >= 25 ? "text-blue-600 font-medium" : ""}>Started</span>
        <span className={progress >= 50 ? "text-blue-600 font-medium" : ""}>Halfway</span>
        <span className={progress >= 75 ? "text-blue-600 font-medium" : ""}>Almost Done</span>
        <span className={progress >= 100 ? "text-green-600 font-medium" : ""}>Complete!</span>
      </div>
    </div>
  )

  const renderAllFields = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Essential Information */}
      <div className="space-y-6">
        {/* Name Fields Group */}
        <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                What's your name? ✨
              </label>
              <Input
                {...register('firstName')}
                placeholder="Your first name"
                error={errors.firstName?.message}
                className="transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:scale-[1.02]"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                And your last name? 📝
              </label>
              <Input
                {...register('lastName')}
                placeholder="Your last name"
                error={errors.lastName?.message}
                className="transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:scale-[1.02]"
              />
            </motion.div>
          </div>
        </div>

        {/* Contact Fields Group */}
        <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-4"
          >
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Phone className="w-4 h-4 text-blue-500" />
              How can we reach you? 📱
            </label>
            <Input
              {...register('phone')}
              placeholder="Your phone number"
              error={errors.phone?.message}
              className="transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:scale-[1.02]"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4 text-green-500" />
              Got another way of reaching you? (Email) 📧
            </label>
            <Input
              type="email"
              {...register('email')}
              placeholder="your.email@example.com"
              error={errors.email?.message}
              className="transition-all duration-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:scale-[1.02]"
            />
          </motion.div>
        </div>

        {/* Visit Date Group */}
        <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-500" />
              When did you visit us? 🗓️
            </label>
            <Input
              type="date"
              {...register('dateOfVisit')}
              error={errors.dateOfVisit?.message}
              className="transition-all duration-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:scale-[1.02]"
            />
          </motion.div>
        </div>

        {/* Additional Information from Step 2 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="text-2xl">📍</div>
            <h4 className="font-semibold text-gray-800">Where's your base?</h4>
            <span className="text-xs bg-gray-200 px-2 py-1 rounded-full text-gray-600">optional</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              {...register('address.city')}
              placeholder="Your city"
              className="transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <Input
              {...register('address.state')}
              placeholder="Your state"
              className="transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="text-2xl">🎂</div>
            <h4 className="font-semibold text-gray-800">When did you arrive on the Planet?</h4>
            <span className="text-xs bg-gray-200 px-2 py-1 rounded-full text-gray-600">optional</span>
          </div>
          <Input
            type="date"
            {...register('dateOfBirth')}
            placeholder="Your date of birth"
            className="transition-all duration-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            error={errors.dateOfBirth?.message}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.37 }}
          className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-4 border border-indigo-200"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="text-2xl">💼</div>
            <h4 className="font-semibold text-gray-800">Occupation?</h4>
            <span className="text-xs bg-gray-200 px-2 py-1 rounded-full text-gray-600">optional</span>
          </div>
          <Input
            {...register('occupation')}
            placeholder="What do you do for work?"
            className="transition-all duration-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.41 }}
          className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl p-4 border border-rose-200"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="text-2xl">🌐</div>
            <h4 className="font-semibold text-gray-800">Where do you live on the web?</h4>
            <span className="text-xs bg-gray-200 px-2 py-1 rounded-full text-gray-600">optional</span>
          </div>
          <Input
            {...register('website')}
            placeholder="Your website or online presence"
            className="transition-all duration-300 focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.43 }}
          className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl p-4 border border-violet-200"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="text-2xl">📱</div>
            <h4 className="font-semibold text-gray-800">So where can we find you on Social Media?</h4>
            <span className="text-xs bg-gray-200 px-2 py-1 rounded-full text-gray-600">optional</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              {...register('socialMediaHandles.instagram')}
              placeholder="Instagram handle"
              className="transition-all duration-300 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            />
            <Input
              {...register('socialMediaHandles.facebook')}
              placeholder="Facebook profile"
              className="transition-all duration-300 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            />
            <Input
              {...register('socialMediaHandles.twitter')}
              placeholder="Twitter/X handle"
              className="transition-all duration-300 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            />
            <Input
              {...register('socialMediaHandles.other')}
              placeholder="Other social media"
              className="transition-all duration-300 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="text-2xl">🤝</div>
            <h4 className="font-semibold text-gray-800">Who match made us? / Can you remember who toasted you?</h4>
            <span className="text-xs bg-gray-200 px-2 py-1 rounded-full text-gray-600">optional</span>
          </div>
          <div className="space-y-3">
            <Input
              {...register('invitedBy')}
              placeholder="Who invited you?"
              className="transition-all duration-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
            <Input
              {...register('referredBy')}
              placeholder="Who referred/recommended you?"
              className="transition-all duration-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 border border-green-200"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="text-2xl">💭</div>
            <h4 className="font-semibold text-gray-800">How did you hear about us?</h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { value: 'friend', label: '👥 Friend', emoji: '👥' },
              { value: 'family', label: '👪 Family', emoji: '👪' },
              { value: 'online', label: '💻 Online', emoji: '💻' },
              { value: 'walkby', label: '🚶 Walking by', emoji: '🚶' },
              { value: 'advertisement', label: '📺 Ad', emoji: '📺' },
              { value: 'event', label: '🎉 Event', emoji: '🎉' },
              { value: 'other', label: '🤷 Other', emoji: '🤷' }
            ].map((option) => (
              <motion.label
                key={option.value}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 hover:border-green-400 hover:bg-green-50 cursor-pointer transition-all duration-200"
              >
                <input
                  type="radio"
                  {...register('howDidYouHear')}
                  value={option.value}
                  className="text-green-500 focus:ring-green-500"
                />
                <span className="text-sm font-medium">{option.label}</span>
              </motion.label>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.47 }}
          className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="text-2xl">⚡</div>
            <h4 className="font-semibold text-gray-800">Would you like to join The PowerPoint Tribe?</h4>
            <span className="text-xs bg-gray-200 px-2 py-1 rounded-full text-gray-600">optional</span>
          </div>
          <motion.label
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-emerald-400 hover:bg-emerald-50 cursor-pointer transition-all duration-200"
          >
            <input
              type="checkbox"
              {...register('interestedInJoining')}
              className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-5 h-5"
            />
            <div>
              <span className="font-medium text-gray-800">Yes, I'm interested in joining! 🎉</span>
              <p className="text-xs text-gray-600">I'd love to be part of The PowerPoint Tribe community</p>
            </div>
          </motion.label>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.49 }}
          className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-4 border border-cyan-200"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="text-2xl">✨</div>
            <h4 className="font-semibold text-gray-800">What did you enjoy about today's service?</h4>
            <span className="text-xs bg-gray-200 px-2 py-1 rounded-full text-gray-600">optional</span>
          </div>
          <Input
            {...register('serviceExperience')}
            placeholder="Tell us what made your experience special..."
            className="transition-all duration-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.51 }}
          className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-4 border border-pink-200"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="text-2xl">📸</div>
            <h4 className="font-semibold text-gray-800">Take a Selfie?</h4>
            <span className="text-xs bg-gray-200 px-2 py-1 rounded-full text-gray-600">optional</span>
          </div>
          <ImageUpload
            value={watch('profilePhotoUrl')}
            onChange={(url) => setValue('profilePhotoUrl', url)}
            placeholder="Upload your photo"
            maxSizeMB={5}
            className="max-w-[200px] mx-auto"
          />
          <p className="text-xs text-gray-500 mt-3 text-center">
            Share a photo so we can recognize you when you visit! 📷
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.53 }}
          className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="text-2xl">🙏</div>
            <h4 className="font-semibold text-gray-800">Any prayer requests?</h4>
            <span className="text-xs bg-gray-200 px-2 py-1 rounded-full text-gray-600">optional</span>
          </div>
          <div className="space-y-2">
            {prayerFields.map((field, index) => (
              <motion.div
                key={field.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2"
              >
                <Input
                  {...register(`prayerRequests.${index}`)}
                  placeholder="Share what's on your heart..."
                  className="flex-1 transition-all duration-300 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => removePrayer(index)}
                  className="p-2 hover:scale-110 transition-transform"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </motion.div>
            ))}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => appendPrayer('')}
              className="flex items-center gap-2 text-yellow-600 hover:text-yellow-700 hover:scale-105 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add prayer request
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="text-2xl">💬</div>
            <h4 className="font-semibold text-gray-800">Stay connected</h4>
          </div>
          <div className="space-y-3">
            <motion.label
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-purple-400 hover:bg-purple-50 cursor-pointer transition-all duration-200"
            >
              <input
                type="checkbox"
                {...register('allowFollowUp')}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 w-5 h-5"
              />
              <div>
                <span className="font-medium text-gray-800">Yes, I'd love to hear from you! 💕</span>
                <p className="text-xs text-gray-600">Someone from our team will reach out to connect</p>
              </div>
            </motion.label>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                How would you prefer we contact you? 📞
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { value: 'phone', label: '📱 Call', emoji: '📱' },
                  { value: 'email', label: '📧 Email', emoji: '📧' },
                  { value: 'sms', label: '💬 Text', emoji: '💬' },
                  { value: 'whatsapp', label: '📲 WhatsApp', emoji: '📲' }
                ].map((option) => (
                  <motion.label
                    key={option.value}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 hover:border-purple-400 hover:bg-purple-50 cursor-pointer transition-all duration-200"
                  >
                    <input
                      type="radio"
                      {...register('preferredContactMethod')}
                      value={option.value}
                      className="text-purple-500 focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium">{option.label}</span>
                  </motion.label>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )


  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit(handleFormSubmit, (errors) => {
        console.log('Form validation errors:', errors)
      })} className="space-y-6">
        <Card className="p-6 md:p-8 shadow-lg border-0 bg-white">
          {renderProgressIndicator()}
          {renderAllFields()}
        </Card>

        {/* Submit Button */}
        <Card className="p-4 bg-gray-50 border-0">
          <div className="flex flex-col items-center gap-4">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full max-w-md"
            >
              <Button
                type="submit"
                loading={isSubmitting}
                disabled={progress < 25} // Require at least basic info
                onClick={() => console.log('Submit button clicked, progress:', progress, 'disabled:', progress < 25)}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 h-12 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  'Submitting...'
                ) : progress >= 100 ? (
                  <>
                    <Check className="w-5 h-5" />
                    Complete Registration ✨
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Submit Registration
                  </>
                )}
              </Button>
            </motion.div>

            {/* Security & Progress Info */}
            <div className="flex items-center justify-center gap-6 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Secure & Confidential</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3" />
                <span>Takes 2-3 minutes</span>
              </div>
              {progress >= 25 && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>Ready to submit</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </form>
    </div>
  )
}
