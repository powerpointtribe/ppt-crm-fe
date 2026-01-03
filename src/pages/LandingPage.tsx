import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Users,
  Calendar,
  ArrowRight,
  Church,
  Shield,
  Clock,
  BarChart3,
  CheckCircle,
  Star,
  Package,
  Building2,
  UserCog,
  Heart,
  TrendingUp,
  Menu,
  X
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

const features = [
  {
    icon: Users,
    title: "Member Management",
    description: "Complete member profiles with contact details, cell group assignments, and engagement tracking.",
    color: "from-blue-500 to-blue-600"
  },
  {
    icon: Calendar,
    title: "First-Timer Follow-up",
    description: "Track visitors with systematic follow-up, call reports, and seamless cell group integration.",
    color: "from-green-500 to-green-600"
  },
  {
    icon: Building2,
    title: "Multi-Branch Support",
    description: "Manage multiple campuses with branch-specific data and cross-campus reporting.",
    color: "from-purple-500 to-purple-600"
  },
  {
    icon: BarChart3,
    title: "Analytics & Reports",
    description: "Growth patterns, attendance tracking, and service reports with visual dashboards.",
    color: "from-orange-500 to-orange-600"
  },
  {
    icon: Package,
    title: "Inventory Management",
    description: "Track church assets, equipment, and resources across categories and locations.",
    color: "from-teal-500 to-teal-600"
  },
  {
    icon: UserCog,
    title: "Role-Based Access",
    description: "Granular permissions for admins, pastors, and ministry leaders with audit logs.",
    color: "from-pink-500 to-pink-600"
  }
]

const testimonials = [
  {
    name: "Pastor Taiwo Adebayo",
    role: "Senior Pastor",
    content: "This platform has revolutionized our administrative processes. Managing cell groups and tracking first-timers has never been easier.",
    rating: 5
  },
  {
    name: "Funmi Olatunji",
    role: "Administrative Coordinator",
    content: "The comprehensive member management helps us stay connected with everyone and ensures no one falls through the cracks.",
    rating: 5
  },
  {
    name: "Damilola Adesanya",
    role: "Cell Group Leader",
    content: "Easy attendance tracking, member communication, and coordination with other ministry leaders all in one place.",
    rating: 5
  }
]

const stats = [
  { number: "2000+", label: "Members", icon: Users },
  { number: "50+", label: "Cell Groups", icon: Heart },
  { number: "5", label: "Campuses", icon: Building2 },
  { number: "99%", label: "Uptime", icon: TrendingUp }
]

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Navigation */}
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100'
            : 'bg-transparent'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-18">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-600/20">
                <Church className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-base sm:text-lg font-bold text-gray-900 leading-tight">PowerPoint Tribe</span>
                <span className="text-[10px] sm:text-xs text-gray-500 font-medium leading-tight hidden sm:block">Church Management</span>
              </div>
            </div>

            {/* Desktop CTA */}
            <div className="hidden sm:flex items-center">
              <Button asChild size="sm" className="shadow-lg shadow-primary-600/20 whitespace-nowrap">
                <Link to="/login" className="inline-flex items-center">
                  Sign In
                  <ArrowRight className="ml-1.5 h-4 w-4 flex-shrink-0" />
                </Link>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-2 -mr-2 text-gray-600 hover:text-gray-900"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="sm:hidden bg-white border-t border-gray-100 shadow-lg"
          >
            <div className="px-4 py-4 space-y-3">
              <Button asChild className="w-full justify-center">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  Sign In
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </motion.div>
        )}
      </motion.nav>

      {/* Hero Section */}
      <section className="relative min-h-[100svh] flex items-center pt-16 sm:pt-20 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-blue-50" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-primary-100/40 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-blue-100/40 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />

        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16 py-8 sm:py-12">

            {/* Left Content */}
            <div className="flex-1 text-center lg:text-left w-full">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-4 sm:space-y-5"
              >
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-50 border border-primary-100 rounded-full">
                  <Church className="w-3.5 h-3.5 text-primary-600" />
                  <span className="text-xs sm:text-sm font-medium text-primary-700">Church Management Platform</span>
                </div>

                {/* Heading */}
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-[1.15] tracking-tight">
                  Empowering Your{' '}
                  <span className="relative">
                    <span className="bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent">
                      Church Community
                    </span>
                    <svg className="absolute -bottom-0.5 left-0 w-full h-1.5 sm:h-2 text-primary-200" viewBox="0 0 200 8" preserveAspectRatio="none">
                      <path d="M0 7c50-6 100-6 200 0" stroke="currentColor" strokeWidth="3" fill="none" />
                    </svg>
                  </span>
                </h1>

                {/* Subtitle */}
                <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                  Streamline membership management, track attendance, coordinate ministries, and grow your congregation with our all-in-one platform.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                  <Button asChild size="lg" className="w-full sm:w-auto h-11 sm:h-12 px-6 sm:px-8 text-sm sm:text-base shadow-xl shadow-primary-600/20 hover:shadow-2xl hover:shadow-primary-600/30 transition-all">
                    <Link to="/login" className="inline-flex items-center">
                      Sign In to Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Link
                    to="#features"
                    className="text-xs sm:text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors flex items-center gap-1"
                    onClick={(e) => {
                      e.preventDefault()
                      document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
                    }}
                  >
                    Learn more
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {/* Trust Indicators */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-4 gap-y-2 pt-3 sm:pt-4">
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-500">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-green-100 flex items-center justify-center">
                      <Shield className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-600" />
                    </div>
                    <span>Secure</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-500">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-blue-100 flex items-center justify-center">
                      <Building2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-600" />
                    </div>
                    <span>Multi-Branch</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-500">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-purple-100 flex items-center justify-center">
                      <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-purple-600" />
                    </div>
                    <span>24/7 Access</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right - Dashboard Preview (Hidden on small mobile, simplified on tablet) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="flex-1 w-full max-w-md lg:max-w-lg hidden sm:block"
            >
              <div className="relative">
                {/* Decorative Elements */}
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl opacity-20 blur-xl" />
                <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl opacity-20 blur-xl" />

                {/* Main Card */}
                <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 p-3 sm:p-4">
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl sm:rounded-2xl overflow-hidden">
                    {/* Browser Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg">
                        <div className="w-3 h-3 rounded bg-primary-500" />
                        <span className="text-[10px] sm:text-xs text-gray-500 font-medium">Dashboard</span>
                      </div>
                      <div className="w-16" />
                    </div>

                    {/* Dashboard Content */}
                    <div className="p-4 space-y-4">
                      {/* Stats Row */}
                      <div className="grid grid-cols-4 gap-2 sm:gap-3">
                        {[
                          { value: '1,247', label: 'Members', color: 'text-primary-600' },
                          { value: '85%', label: 'Attendance', color: 'text-green-600' },
                          { value: '42', label: 'Groups', color: 'text-blue-600' },
                          { value: '23', label: 'New', color: 'text-purple-600' },
                        ].map((stat, i) => (
                          <div key={i} className="bg-white rounded-lg p-2 sm:p-3 text-center shadow-sm">
                            <div className={`text-sm sm:text-lg font-bold ${stat.color}`}>{stat.value}</div>
                            <div className="text-[9px] sm:text-[10px] text-gray-500">{stat.label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Chart */}
                      <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs sm:text-sm font-semibold text-gray-700">Weekly Attendance</span>
                          <span className="text-[10px] sm:text-xs text-green-600 font-medium">+12%</span>
                        </div>
                        <div className="flex items-end justify-between gap-1 sm:gap-2 h-20 sm:h-24">
                          {[65, 78, 52, 90, 75, 88, 95].map((height, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                              <div
                                className="w-full bg-gradient-to-t from-primary-500 to-primary-400 rounded-t-sm transition-all duration-500"
                                style={{ height: `${height}%` }}
                              />
                              <span className="text-[8px] sm:text-[9px] text-gray-400">
                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'][i]}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recent Activity */}
                      <div className="bg-white rounded-xl p-3 shadow-sm">
                        <span className="text-xs font-semibold text-gray-700">Recent Activity</span>
                        <div className="mt-2 space-y-2">
                          {[
                            { text: 'New member registered', time: '2m ago', dot: 'bg-green-500' },
                            { text: 'First-timer follow-up', time: '15m ago', dot: 'bg-blue-500' },
                          ].map((item, i) => (
                            <div key={i} className="flex items-center gap-2 text-[10px] sm:text-xs text-gray-600">
                              <div className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />
                              <span className="flex-1">{item.text}</span>
                              <span className="text-gray-400">{item.time}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator - Mobile Only */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 sm:hidden"
        >
          <div className="flex flex-col items-center gap-2 text-gray-400">
            <span className="text-xs">Scroll to explore</span>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-5 h-8 border-2 border-gray-300 rounded-full flex justify-center pt-1"
            >
              <div className="w-1 h-2 bg-gray-400 rounded-full" />
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-16 bg-gradient-to-r from-primary-600 via-primary-700 to-blue-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-white rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-white/10 rounded-2xl mb-3">
                  <stat.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1">{stat.number}</div>
                <div className="text-sm sm:text-base text-primary-100">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-20 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 text-xs sm:text-sm font-medium rounded-full mb-4">
              Features
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Manage Your Church
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              Powerful tools designed specifically for church administration and community building.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="p-5 sm:p-6 h-full bg-white border-0 shadow-sm hover:shadow-xl transition-all duration-300 group">
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-700 text-xs sm:text-sm font-medium rounded-full mb-4">
              Testimonials
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Church Leaders
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              See what ministry leaders say about our platform.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="p-5 sm:p-6 h-full bg-gradient-to-br from-gray-50 to-white border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <blockquote className="text-sm sm:text-base text-gray-700 mb-5 leading-relaxed">
                    "{testimonial.content}"
                  </blockquote>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center">
                      <span className="text-sm sm:text-base font-bold text-primary-700">
                        {testimonial.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm sm:text-base font-semibold text-gray-900">{testimonial.name}</div>
                      <div className="text-xs sm:text-sm text-gray-500">{testimonial.role}</div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 bg-gradient-to-br from-primary-600 via-primary-700 to-blue-800 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
              Ready to Access Your Dashboard?
            </h2>
            <p className="text-sm sm:text-base text-primary-100 max-w-xl mx-auto">
              Sign in to manage members, track attendance, and coordinate your ministry activities.
            </p>
            <div className="flex items-center justify-center pt-2">
              <Button asChild size="lg" variant="secondary" className="h-11 sm:h-12 px-6 sm:px-8 text-sm sm:text-base bg-white text-primary-700 hover:bg-gray-100 shadow-xl">
                <Link to="/login">
                  Sign In Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-10 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                <Church className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-400">PowerPoint Tribe Management System</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <span>&copy; {new Date().getFullYear()} All rights reserved</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
