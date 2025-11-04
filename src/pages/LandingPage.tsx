import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Heart,
  Users,
  Calendar,
  MessageCircle,
  ArrowRight,
  ChevronDown,
  Church,
  Shield,
  Clock,
  BarChart3,
  CheckCircle,
  Star
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

const features = [
  {
    icon: Users,
    title: "Member Directory",
    description: "Manage PowerPoint Tribe member profiles, contact details, cell group assignments, and engagement history with powerful search and filtering."
  },
  {
    icon: Calendar,
    title: "Service Management",
    description: "Coordinate Sunday services, cell group meetings, special events, and ministry activities with automated scheduling and notifications."
  },
  {
    icon: Heart,
    title: "First-Timer Welcome",
    description: "Track and nurture first-time visitors to PowerPoint Tribe with systematic follow-up processes and integration into cell groups."
  },
  {
    icon: BarChart3,
    title: "Ministry Analytics",
    description: "Monitor PowerPoint Tribe's growth patterns, service attendance, cell group participation, and member engagement trends."
  },
  {
    icon: MessageCircle,
    title: "Cell Group Communication",
    description: "Facilitate communication between cell group leaders, ministry heads, and members with integrated messaging tools."
  },
  {
    icon: Shield,
    title: "Secure Platform",
    description: "Protect PowerPoint Tribe's sensitive member data with enterprise-grade security and reliable cloud infrastructure."
  }
]

const testimonials = [
  {
    name: "Pastor Taiwo Adebayo",
    role: "Senior Pastor",
    church: "PowerPoint Tribe Church",
    content: "This platform has revolutionized our administrative processes at PowerPoint Tribe. Managing our cell groups and tracking first-timers has never been easier.",
    rating: 5
  },
  {
    name: "Funmi Olatunji",
    role: "Administrative Coordinator",
    church: "PowerPoint Tribe Church",
    content: "The comprehensive member management system helps us stay connected with every PowerPoint Tribe member and ensures no one falls through the cracks.",
    rating: 5
  },
  {
    name: "Damilola Adesanya",
    role: "Cell Group Leader",
    church: "PowerPoint Tribe Church",
    content: "As a cell group leader, this system makes it easy to track attendance, communicate with members, and coordinate with other ministry leaders.",
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

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
  }

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

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-background to-accent-50"></div>
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

        <div className="relative container-max section-padding w-full">
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] py-12">
            {/* Main Content */}
            <div className="text-center max-w-5xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="mb-12"
              >
                <h1 className="mb-8">
                  PowerPoint Tribe
                  <br />
                  <span className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                    Church Admin Platform
                  </span>
                </h1>
                <div className="text-max">
                  <p>
                    Empowering PowerPoint Tribe Church leadership with comprehensive tools for membership management, attendance tracking and first timers integration.
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="flex justify-center items-center mb-12"
              >
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-muted-foreground mb-16"
              >
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-primary-600 flex-shrink-0" />
                  <span>Authorized Access Only</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Leadership & Admin Portal</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <span>24/7 System Access</span>
                </div>
              </motion.div>
            </div>

            {/* Dashboard Preview - Smaller and Optional on Mobile */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="w-full max-w-4xl mx-auto"
            >
              <div className="relative bg-white rounded-2xl shadow-xl p-2 sm:p-3 border border-gray-100">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl aspect-video sm:aspect-[16/10] flex flex-col overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between p-3 sm:p-4 bg-white/60 backdrop-blur-sm border-b border-gray-200">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
                      <h4 className="text-xs sm:text-sm font-semibold text-gray-800">PowerPoint Tribe Dashboard</h4>
                    </div>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 rounded-full bg-red-400"></div>
                      <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                      <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    </div>
                  </div>

                  {/* Chart Area */}
                  <div className="flex-1 p-3 sm:p-4 flex items-end justify-center space-x-1 sm:space-x-2">
                    {/* Sample Bar Chart */}
                    {[65, 85, 45, 95, 75, 55, 80].map((height, index) => (
                      <div key={index} className="flex flex-col items-center h-full flex-1">
                        <div className="flex-1 flex items-end w-full">
                          <div
                            className="w-full bg-gradient-to-t from-primary-600 to-primary-400 rounded-t transition-all duration-1000 ease-out min-h-[8px]"
                            style={{ height: `${height}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500 mt-1">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][index]}</span>
                      </div>
                    ))}
                  </div>

                  {/* Stats Footer */}
                  <div className="flex justify-between items-center px-3 sm:px-4 py-2 bg-white/60 backdrop-blur-sm border-t border-gray-200">
                    <div className="text-center">
                      <div className="text-xs sm:text-sm font-bold text-primary-600">1,247</div>
                      <div className="text-xs text-gray-600">Members</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs sm:text-sm font-bold text-green-600">85%</div>
                      <div className="text-xs text-gray-600">Attendance</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs sm:text-sm font-bold text-blue-600">42</div>
                      <div className="text-xs text-gray-600">Cell Groups</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Scroll Indicator */}
            <motion.button
              onClick={scrollToFeatures}
              className="mt-8 text-muted-foreground hover:text-foreground transition-colors"
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <ChevronDown className="h-6 w-6" />
            </motion.button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="section-spacing bg-muted/30">
        <div className="container-max section-padding">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="mb-6">
              Everything PowerPoint Tribe Needs
            </h2>
            <div className="text-max">
              <p>
                Comprehensive tools designed specifically for PowerPoint Tribe's unique ministry structure and community needs.
              </p>
            </div>
          </motion.div>

          <div className="responsive-grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="h-full"
              >
                <Card className="p-8 h-full hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                    <feature.icon className="h-8 w-8 text-primary-600" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-4 leading-tight">{feature.title}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="section-spacing bg-gradient-to-r from-primary-600 to-primary-700">
        <div className="container-max section-padding">
          <div className="responsive-grid grid-cols-2 lg:grid-cols-4 text-center">
            {[
              { number: "2000+", label: "PowerPoint Tribe Members" },
              { number: "50+", label: "Active Cell Groups" },
              { number: "99.9%", label: "System Reliability" },
              { number: "24/7", label: "Technical Support" }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="px-2 sm:px-4 safe-area"
              >
                <div className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-2 sm:mb-3">{stat.number}</div>
                <div className="text-xs sm:text-sm lg:text-base text-primary-100 leading-tight">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="section-spacing">
        <div className="container-max section-padding">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="mb-6">
              Trusted by PowerPoint Tribe Leadership
            </h2>
            <div className="text-max">
              <p>
                Hear from our pastors, administrators, and cell group leaders about how this platform serves our community.
              </p>
            </div>
          </motion.div>

          <div className="responsive-grid grid-cols-1 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="h-full"
              >
                <Card className="p-8 h-full border-0 bg-white shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center mb-6">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <blockquote className="text-muted-foreground mb-8 italic text-base leading-relaxed">
                    "{testimonial.content}"
                  </blockquote>
                  <div className="mt-auto">
                    <div className="font-semibold text-foreground text-base sm:text-lg">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground mt-1">{testimonial.role}</div>
                    <div className="text-sm text-primary-600 font-medium mt-1">{testimonial.church}</div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-spacing bg-gradient-to-r from-primary-600 to-accent-600">
        <div className="content-max section-padding text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-white mb-6">
              PowerPoint Tribe Leadership Portal
            </h2>
            <p className="text-lg sm:text-xl text-primary-100 mb-10 leading-relaxed">
              Authorized access for PowerPoint Tribe Church leadership and administrative team to manage our growing community effectively.
            </p>
            <div className="flex justify-center">
              <Button asChild size="lg" variant="secondary" className="min-w-[280px] h-14 text-base sm:text-lg">
                <Link to="/login">
                  Enter Leadership Dashboard
                  <ArrowRight className="ml-3 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  )
}
