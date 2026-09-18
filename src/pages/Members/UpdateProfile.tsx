import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { apiService } from '@/services/api'
import { showToast } from '@/utils/toast'
import {
  User, Phone, Calendar, MapPin, Briefcase,
  ChevronRight, ChevronLeft, CheckCircle2,
  Heart, Shield, Loader2, Building2, Lightbulb, Users, Share2
} from 'lucide-react'

interface FormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  gender: string
  maritalStatus: string
  weddingAnniversary: string
  occupation: string
  profession: string
  businessName: string
  businessType: string
  employer: string
  workAddress: string
  interests: string
  skills: string
  district: string
  unit: string
  memberCategory: string
  howLongAttending: string
  previousChurch: string
  address: {
    street: string
    city: string
    state: string
    country: string
    lga: string
    landmark: string
  }
  socialMedia: {
    facebook: string
    instagram: string
    twitter: string
    linkedin: string
    tiktok: string
  }
  emergencyContact: {
    name: string
    relationship: string
    phone: string
  }
}

const EMPTY_FORM: FormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  gender: '',
  maritalStatus: '',
  weddingAnniversary: '',
  occupation: '',
  profession: '',
  businessName: '',
  businessType: '',
  employer: '',
  workAddress: '',
  interests: '',
  skills: '',
  district: '',
  unit: '',
  memberCategory: '',
  howLongAttending: '',
  previousChurch: '',
  address: { street: '', city: '', state: '', country: 'Nigeria', lga: '', landmark: '' },
  socialMedia: { facebook: '', instagram: '', twitter: '', linkedin: '', tiktok: '' },
  emergencyContact: { name: '', relationship: '', phone: '' },
}

export default function UpdateProfile() {
  const [step, setStep] = useState<'form' | 'success'>('form')
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM)
  const [activeSection, setActiveSection] = useState(0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      showToast.error('First name and last name are required')
      return
    }
    setSubmitting(true)
    try {
      const payload: any = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
      }
      if (formData.email) payload.email = formData.email.trim()
      if (formData.phone) payload.phone = formData.phone.trim()
      if (formData.dateOfBirth) payload.dateOfBirth = formData.dateOfBirth
      if (formData.gender) payload.gender = formData.gender
      if (formData.maritalStatus) payload.maritalStatus = formData.maritalStatus
      if (formData.weddingAnniversary) payload.weddingAnniversary = formData.weddingAnniversary
      if (formData.occupation) payload.occupation = formData.occupation.trim()
      if (formData.profession) payload.profession = formData.profession.trim()
      if (formData.businessName) payload.businessName = formData.businessName.trim()
      if (formData.businessType) payload.businessType = formData.businessType.trim()
      if (formData.employer) payload.employer = formData.employer.trim()
      if (formData.workAddress) payload.workAddress = formData.workAddress.trim()
      if (formData.district) payload.district = formData.district.trim()
      if (formData.unit) payload.unit = formData.unit.trim()
      if (formData.memberCategory) payload.memberCategory = formData.memberCategory
      if (formData.howLongAttending) payload.howLongAttending = formData.howLongAttending.trim()
      if (formData.previousChurch) payload.previousChurch = formData.previousChurch.trim()

      if (formData.interests) {
        payload.interests = formData.interests.split(',').map((s: string) => s.trim()).filter(Boolean)
      }
      if (formData.skills) {
        payload.skills = formData.skills.split(',').map((s: string) => s.trim()).filter(Boolean)
      }

      const addr = formData.address
      if (addr.street || addr.city || addr.state || addr.lga || addr.landmark) {
        payload.address = { ...addr }
      }
      const sm = formData.socialMedia
      if (sm.facebook || sm.instagram || sm.twitter || sm.linkedin || sm.tiktok) {
        payload.socialMedia = { ...sm }
      }
      const ec = formData.emergencyContact
      if (ec.name || ec.phone) {
        payload.emergencyContact = { ...ec }
      }

      await apiService.post('/members/profile-submissions', payload)
      setStep('success')
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to submit profile'
      showToast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const updateField = (field: string, value: string) => {
    setFormData((prev) => {
      if (field.startsWith('address.')) {
        const key = field.split('.')[1]
        return { ...prev, address: { ...prev.address, [key]: value } }
      }
      if (field.startsWith('socialMedia.')) {
        const key = field.split('.')[1]
        return { ...prev, socialMedia: { ...prev.socialMedia, [key]: value } }
      }
      if (field.startsWith('emergencyContact.')) {
        const key = field.split('.')[1]
        return { ...prev, emergencyContact: { ...prev.emergencyContact, [key]: value } }
      }
      return { ...prev, [field]: value }
    })
  }

  const sections = [
    { title: 'Personal', icon: User },
    { title: 'Contact & Address', icon: MapPin },
    { title: 'Work & Business', icon: Briefcase },
    { title: 'Church Info', icon: Users },
    { title: 'Interests & Skills', icon: Lightbulb },
    { title: 'Social Media', icon: Share2 },
    { title: 'Emergency Contact', icon: Shield },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-start justify-center p-4 pt-8 md:pt-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white mb-4 shadow-lg shadow-indigo-200">
            <User size={26} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Member Profile</h1>
          <p className="text-gray-500 text-sm mt-1">
            Fill in your details to help us keep our records up to date
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Section tabs */}
                <div className="flex border-b border-gray-100 overflow-x-auto">
                  {sections.map((sec, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveSection(i)}
                      className={`flex items-center gap-1.5 px-3 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition ${
                        activeSection === i
                          ? 'border-indigo-600 text-indigo-600'
                          : 'border-transparent text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      <sec.icon size={14} />
                      <span className="hidden sm:inline">{sec.title}</span>
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="p-6">
                    <AnimatePresence mode="wait">
                      {/* Section 0: Personal */}
                      {activeSection === 0 && (
                        <motion.div key="s0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <InputField label="First Name" value={formData.firstName} onChange={(v) => updateField('firstName', v)} required />
                            <InputField label="Last Name" value={formData.lastName} onChange={(v) => updateField('lastName', v)} required />
                          </div>
                          <InputField label="Email Address" type="email" value={formData.email} onChange={(v) => updateField('email', v)} placeholder="your.email@example.com" />
                          <InputField label="Phone Number" value={formData.phone} onChange={(v) => updateField('phone', v)} placeholder="08012345678" icon={<Phone size={16} />} />
                          <DateOfBirthField label="Date of Birth" value={formData.dateOfBirth} onChange={(v) => updateField('dateOfBirth', v)} />
                          <div className="grid grid-cols-2 gap-3">
                            <SelectField
                              label="Gender"
                              value={formData.gender}
                              onChange={(v) => updateField('gender', v)}
                              options={[
                                { value: '', label: 'Select...' },
                                { value: 'male', label: 'Male' },
                                { value: 'female', label: 'Female' },
                              ]}
                            />
                            <SelectField
                              label="Marital Status"
                              value={formData.maritalStatus}
                              onChange={(v) => updateField('maritalStatus', v)}
                              options={[
                                { value: '', label: 'Select...' },
                                { value: 'single', label: 'Single' },
                                { value: 'married', label: 'Married' },
                                { value: 'divorced', label: 'Divorced' },
                                { value: 'widowed', label: 'Widowed' },
                              ]}
                            />
                          </div>
                          {formData.maritalStatus === 'married' && (
                            <DateOfBirthField label="Wedding Anniversary" value={formData.weddingAnniversary} onChange={(v) => updateField('weddingAnniversary', v)} startYear={1960} />
                          )}
                        </motion.div>
                      )}

                      {/* Section 1: Address */}
                      {activeSection === 1 && (
                        <motion.div key="s1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                          <InputField label="Street Address" value={formData.address.street} onChange={(v) => updateField('address.street', v)} placeholder="123 Main Street" />
                          <InputField label="Nearest Landmark" value={formData.address.landmark} onChange={(v) => updateField('address.landmark', v)} placeholder="e.g. Opposite Total Filling Station" />
                          <div className="grid grid-cols-2 gap-3">
                            <InputField label="City / Town" value={formData.address.city} onChange={(v) => updateField('address.city', v)} placeholder="Ikeja" />
                            <InputField label="LGA" value={formData.address.lga} onChange={(v) => updateField('address.lga', v)} placeholder="Ikeja" />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <InputField label="State" value={formData.address.state} onChange={(v) => updateField('address.state', v)} placeholder="Lagos" />
                            <InputField label="Country" value={formData.address.country} onChange={(v) => updateField('address.country', v)} placeholder="Nigeria" />
                          </div>
                        </motion.div>
                      )}

                      {/* Section 2: Work & Business */}
                      {activeSection === 2 && (
                        <motion.div key="s2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                          <InputField label="Profession" value={formData.profession} onChange={(v) => updateField('profession', v)} placeholder="e.g. Medical Doctor, Lawyer, Engineer" icon={<Briefcase size={16} />} />
                          <InputField label="Occupation / Job Title" value={formData.occupation} onChange={(v) => updateField('occupation', v)} placeholder="e.g. Senior Software Engineer" />
                          <InputField label="Employer / Company" value={formData.employer} onChange={(v) => updateField('employer', v)} placeholder="Where do you work?" icon={<Building2 size={16} />} />
                          <InputField label="Work Address" value={formData.workAddress} onChange={(v) => updateField('workAddress', v)} placeholder="Office address" />
                          <div className="border-t border-gray-100 pt-4 mt-2">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Business Info (if applicable)</p>
                            <div className="space-y-4">
                              <InputField label="Business Name" value={formData.businessName} onChange={(v) => updateField('businessName', v)} placeholder="Your business name" />
                              <InputField label="Business Type / Industry" value={formData.businessType} onChange={(v) => updateField('businessType', v)} placeholder="e.g. Fashion, Tech, Catering" />
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Section 3: Church Info */}
                      {activeSection === 3 && (
                        <motion.div key="s3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                          <SelectField
                            label="Member Category"
                            value={formData.memberCategory}
                            onChange={(v) => updateField('memberCategory', v)}
                            options={[
                              { value: '', label: 'Select...' },
                              { value: 'member', label: 'Member' },
                              { value: 'first-timer', label: 'First Timer' },
                              { value: 'visitor', label: 'Visitor' },
                            ]}
                          />
                          <InputField label="How Long Have You Been Attending?" value={formData.howLongAttending} onChange={(v) => updateField('howLongAttending', v)} placeholder="e.g. 2 years, 6 months" />
                          <InputField label="District" value={formData.district} onChange={(v) => updateField('district', v)} placeholder="Your district name" />
                          <InputField label="Unit" value={formData.unit} onChange={(v) => updateField('unit', v)} placeholder="Your unit name" />
                          <InputField label="Previous Church (if any)" value={formData.previousChurch} onChange={(v) => updateField('previousChurch', v)} placeholder="Where were you attending before?" />
                        </motion.div>
                      )}

                      {/* Section 4: Interests & Skills */}
                      {activeSection === 4 && (
                        <motion.div key="s4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Interests / Hobbies</label>
                            <textarea
                              value={formData.interests}
                              onChange={(e) => updateField('interests', e.target.value)}
                              placeholder="e.g. Music, Sports, Reading, Cooking (separate with commas)"
                              rows={3}
                              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
                            />
                            <p className="text-xs text-gray-400 mt-1">Separate multiple interests with commas</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Skills / Expertise</label>
                            <textarea
                              value={formData.skills}
                              onChange={(e) => updateField('skills', e.target.value)}
                              placeholder="e.g. Graphic Design, Public Speaking, Project Management (separate with commas)"
                              rows={3}
                              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
                            />
                            <p className="text-xs text-gray-400 mt-1">Separate multiple skills with commas</p>
                          </div>
                        </motion.div>
                      )}

                      {/* Section 5: Social Media */}
                      {activeSection === 5 && (
                        <motion.div key="s5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                          <InputField label="Facebook" value={formData.socialMedia.facebook} onChange={(v) => updateField('socialMedia.facebook', v)} placeholder="Facebook profile URL or username" />
                          <InputField label="Instagram" value={formData.socialMedia.instagram} onChange={(v) => updateField('socialMedia.instagram', v)} placeholder="Instagram handle (e.g. @yourname)" />
                          <InputField label="Twitter / X" value={formData.socialMedia.twitter} onChange={(v) => updateField('socialMedia.twitter', v)} placeholder="Twitter/X handle (e.g. @yourname)" />
                          <InputField label="LinkedIn" value={formData.socialMedia.linkedin} onChange={(v) => updateField('socialMedia.linkedin', v)} placeholder="LinkedIn profile URL" />
                          <InputField label="TikTok" value={formData.socialMedia.tiktok} onChange={(v) => updateField('socialMedia.tiktok', v)} placeholder="TikTok handle (e.g. @yourname)" />
                        </motion.div>
                      )}

                      {/* Section 6: Emergency */}
                      {activeSection === 6 && (
                        <motion.div key="s6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                          <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl p-4 mb-2">
                            <Heart size={18} className="text-amber-600 mt-0.5 shrink-0" />
                            <p className="text-sm text-amber-800">
                              Please provide someone we can contact in case of an emergency.
                            </p>
                          </div>
                          <InputField label="Contact Name" value={formData.emergencyContact.name} onChange={(v) => updateField('emergencyContact.name', v)} placeholder="Full name" />
                          <InputField label="Relationship" value={formData.emergencyContact.relationship} onChange={(v) => updateField('emergencyContact.relationship', v)} placeholder="e.g. Spouse, Parent, Sibling" />
                          <InputField label="Contact Phone" value={formData.emergencyContact.phone} onChange={(v) => updateField('emergencyContact.phone', v)} placeholder="08012345678" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4 bg-gray-50/50">
                    <button
                      type="button"
                      onClick={() => activeSection > 0 && setActiveSection(activeSection - 1)}
                      disabled={activeSection === 0}
                      className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                      <ChevronLeft size={16} />
                      Previous
                    </button>

                    <div className="flex items-center gap-1.5">
                      {sections.map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full transition ${
                            i === activeSection ? 'bg-indigo-600' : i < activeSection ? 'bg-indigo-300' : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>

                    {activeSection < sections.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => setActiveSection(activeSection + 1)}
                        className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition"
                      >
                        Next <ChevronRight size={16} />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition"
                      >
                        {submitting ? (
                          <><Loader2 size={16} className="animate-spin" /> Submitting...</>
                        ) : (
                          <><CheckCircle2 size={16} /> Submit</>
                        )}
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Profile Submitted!</h2>
                <p className="text-gray-500 text-sm mb-6">
                  Thank you, <strong>{formData.firstName}</strong>. Your information has been received and will be reviewed by our team.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setStep('form')
                    setFormData(EMPTY_FORM)
                    setActiveSection(0)
                  }}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition"
                >
                  Submit another profile
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-xs text-gray-400 mt-6">
          Your data is handled securely and used only for church administration.
        </p>
      </div>
    </div>
  )
}

function InputField({
  label, value, onChange, type = 'text', placeholder = '', required = false, icon,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean; icon?: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <div className="relative">
        {icon && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className={`w-full ${icon ? 'pl-10' : 'px-3.5'} pr-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition`}
        />
      </div>
    </div>
  )
}

function SelectField({
  label, value, onChange, options,
}: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-white"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function DateOfBirthField({
  label, value, onChange, startYear = 1940,
}: {
  label: string; value: string; onChange: (v: string) => void; startYear?: number;
}) {
  const currentYear = new Date().getFullYear()

  const parseValue = (v: string) => {
    if (!v) return { day: '', month: '', year: '' }
    const parts = v.split('-')
    if (parts.length === 3) {
      return { year: parts[0], month: String(parseInt(parts[1], 10)), day: String(parseInt(parts[2], 10)) }
    }
    return { day: '', month: '', year: '' }
  }

  const [parts, setParts] = useState(() => parseValue(value))

  useEffect(() => {
    const parsed = parseValue(value)
    if (parsed.day !== parts.day || parsed.month !== parts.month || parsed.year !== parts.year) {
      if (value) setParts(parsed)
    }
  }, [value])

  const handleChange = (field: 'day' | 'month' | 'year', val: string) => {
    const next = { ...parts, [field]: val }
    setParts(next)
    if (next.day && next.month && next.year) {
      onChange(`${next.year}-${next.month.padStart(2, '0')}-${next.day.padStart(2, '0')}`)
    } else if (!next.day && !next.month && !next.year) {
      onChange('')
    }
  }

  const daysInMonth = parts.month && parts.year
    ? new Date(parseInt(parts.year), parseInt(parts.month), 0).getDate()
    : 31

  const selectClass = 'w-full px-2.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-white'

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="grid grid-cols-3 gap-2">
        <select value={parts.day} onChange={(e) => handleChange('day', e.target.value)} className={selectClass}>
          <option value="">Day</option>
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
            <option key={d} value={String(d)}>{d}</option>
          ))}
        </select>
        <select value={parts.month} onChange={(e) => handleChange('month', e.target.value)} className={selectClass}>
          <option value="">Month</option>
          {MONTHS.map((m, i) => (
            <option key={i + 1} value={String(i + 1)}>{m}</option>
          ))}
        </select>
        <select value={parts.year} onChange={(e) => handleChange('year', e.target.value)} className={selectClass}>
          <option value="">Year</option>
          {Array.from({ length: currentYear - startYear + 1 }, (_, i) => currentYear - i).map((y) => (
            <option key={y} value={String(y)}>{y}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
