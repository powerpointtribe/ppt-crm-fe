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
  UserCog
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

const features = [
  {
    icon: Users,
    title: "Member Management",
    description: "Complete member profiles, contact details, cell group assignments, and engagement tracking."
  },
  {
    icon: Calendar,
    title: "First-Timer Follow-up",
    description: "Track visitors with systematic follow-up, call reports, and cell group integration."
  },
  {
    icon: Building2,
    title: "Multi-Branch Support",
    description: "Manage multiple campuses with branch-specific data and cross-campus reporting."
  },
  {
    icon: BarChart3,
    title: "Analytics & Reports",
    description: "Growth patterns, attendance tracking, and service reports with visual dashboards."
  },
  {
    icon: Package,
    title: "Inventory Management",
    description: "Track church assets, equipment, and resources across categories and locations."
  },
  {
    icon: UserCog,
    title: "Role-Based Access",
    description: "Granular permissions for admins, pastors, and ministry leaders with audit logs."
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

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-background mobile-safe no-overflow">
      {/* Navigation */}
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 mobile-safe ${
          isScrolled ? 'bg-background/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="container-max section-padding">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <Church className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-lg sm:text-xl font-bold text-foreground truncate">PowerPoint Tribe</span>
                <span className="text-xs text-muted-foreground font-medium truncate">Management System</span>
              </div>
            </div>
            <div className="flex items-center ml-4 flex-shrink-0">
              <Button asChild size="sm" className="btn-mobile-safe whitespace-nowrap">
                <Link to="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section - Compact */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-background to-accent-50"></div>
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

        <div className="relative container-max section-padding w-full">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12 py-8">
            {/* Left Content */}
            <div className="flex-1 text-center lg:text-left max-w-2xl">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                  PowerPoint Tribe
                  <span className="block bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                    Church Admin Platform
                  </span>
                </h1>
                <p className="text-base sm:text-lg text-muted-foreground mb-6 leading-relaxed">
                  Comprehensive tools for membership management, attendance tracking, first-timer integration, and ministry coordination.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-6">
                  <Button asChild size="default" className="w-full sm:w-auto h-11 px-6 text-base">
                    <Link to="/login" className="inline-flex items-center whitespace-nowrap">
                      Sign In
                      <ArrowRight className="ml-2 h-4 w-4 flex-shrink-0" />
                    </Link>
                  </Button>
                </div>

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-primary-600 flex-shrink-0" />
                    <span>Secure Access</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>Multi-Branch</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    <span>24/7 Available</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right - Dashboard Preview */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex-1 w-full max-w-lg"
            >
              <div className="relative bg-white rounded-2xl shadow-xl p-2 border border-gray-100">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl aspect-[4/3] flex flex-col overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between p-3 bg-white/60 backdrop-blur-sm border-b border-gray-200">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="w-4 h-4 text-primary-600" />
                      <span className="text-xs font-semibold text-gray-800">Dashboard</span>
                    </div>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 rounded-full bg-red-400"></div>
                      <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                      <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    </div>
                  </div>

                  {/* Chart Area */}
                  <div className="flex-1 p-3 flex items-end justify-center space-x-1">
                    {[65, 85, 45, 95, 75, 55, 80].map((height, index) => (
                      <div key={index} className="flex flex-col items-center h-full flex-1">
                        <div className="flex-1 flex items-end w-full">
                          <div
                            className="w-full bg-gradient-to-t from-primary-600 to-primary-400 rounded-t transition-all duration-1000 ease-out min-h-[8px]"
                            style={{ height: `${height}%` }}
                          ></div>
                        </div>
                        <span className="text-[10px] text-gray-500 mt-1">{['S', 'M', 'T', 'W', 'T', 'F', 'S'][index]}</span>
                      </div>
                    ))}
                  </div>

                  {/* Stats Footer */}
                  <div className="flex justify-between items-center px-3 py-2 bg-white/60 backdrop-blur-sm border-t border-gray-200 text-center">
                    <div>
                      <div className="text-xs font-bold text-primary-600">1,247</div>
                      <div className="text-[10px] text-gray-600">Members</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-green-600">85%</div>
                      <div className="text-[10px] text-gray-600">Attendance</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-blue-600">42</div>
                      <div className="text-[10px] text-gray-600">Groups</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-purple-600">5</div>
                      <div className="text-[10px] text-gray-600">Branches</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section - Compact */}
      <section id="features" className="py-12 sm:py-16 bg-muted/30">
        <div className="container-max section-padding">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Platform Features</h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage your church community effectively.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="p-5 h-full hover:shadow-lg transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      <feature.icon className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1">{feature.title}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section - Compact */}
      <section className="py-10 sm:py-12 bg-gradient-to-r from-primary-600 to-primary-700">
        <div className="container-max section-padding">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            {[
              { number: "2000+", label: "Members" },
              { number: "50+", label: "Cell Groups" },
              { number: "5", label: "Campuses" },
              { number: "24/7", label: "Availability" }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{stat.number}</div>
                <div className="text-xs sm:text-sm text-primary-100">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section - Compact */}
      <section className="py-12 sm:py-16">
        <div className="container-max section-padding">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Trusted by Leadership</h2>
            <p className="text-sm sm:text-base text-muted-foreground">What our team says about the platform.</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="p-5 h-full border-0 bg-white shadow-md hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <blockquote className="text-xs sm:text-sm text-muted-foreground mb-4 italic leading-relaxed">
                    "{testimonial.content}"
                  </blockquote>
                  <div>
                    <div className="text-sm font-semibold text-foreground">{testimonial.name}</div>
                    <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 bg-gray-50 border-t">
        <div className="container-max section-padding">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <Church className="w-4 h-4 text-primary-600" />
              <span className="font-medium">PowerPoint Tribe Management System</span>
            </div>
            <span>&copy; {new Date().getFullYear()} All rights reserved</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
