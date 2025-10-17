import { motion } from 'framer-motion'
import { Heart, Mail, Phone, MapPin, Clock, Globe, Github, Twitter, Facebook, Instagram } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const quickLinks = [
    { label: 'Dashboard', href: '/' },
    { label: 'Members', href: '/members' },
    { label: 'Groups', href: '/groups' },
    { label: 'Settings', href: '/settings' },
  ]

  const supportLinks = [
    { label: 'Help Center', href: '#' },
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
  ]

  const churchInfo = {
    name: 'PowerPoint Tribe',
    address: '123 Faith Street, Community City, CC 12345',
    phone: '+1 (555) 123-4567',
    email: 'info@powerpointtribe.org',
    website: 'www.powerpointtribe.org',
    serviceTime: 'Sundays 9:00 AM & 11:00 AM',
  }

  const socialLinks = [
    { icon: Facebook, label: 'Facebook', href: '#' },
    { icon: Twitter, label: 'Twitter', href: '#' },
    { icon: Instagram, label: 'Instagram', href: '#' },
  ]

  return (
    <motion.footer
      className="bg-gray-900 border-t border-gray-800 w-full mt-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
          {/* Church Information */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Heart className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white">{churchInfo.name}</h3>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">
              Building communities, strengthening faith, and managing growth through technology.
            </p>
            <div className="space-y-2">
              <div className="flex items-start space-x-2 text-sm text-gray-300">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-400" />
                <span>{churchInfo.address}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <Clock className="h-4 w-4 flex-shrink-0 text-gray-400" />
                <span>{churchInfo.serviceTime}</span>
              </div>
            </div>
          </div>

          {/* Navigation & Support */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Navigation</h3>
            <div className="grid grid-cols-2 gap-x-4">
              <ul className="space-y-2">
                {quickLinks.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      className="text-sm text-gray-300 hover:text-blue-400 transition-colors duration-200"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
              <ul className="space-y-2">
                {supportLinks.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      className="text-sm text-gray-300 hover:text-blue-400 transition-colors duration-200"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Contact & Social */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Connect</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <a
                  href={`mailto:${churchInfo.email}`}
                  className="text-sm text-gray-300 hover:text-blue-400 transition-colors duration-200"
                >
                  {churchInfo.email}
                </a>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <a
                  href={`tel:${churchInfo.phone}`}
                  className="text-sm text-gray-300 hover:text-blue-400 transition-colors duration-200"
                >
                  {churchInfo.phone}
                </a>
              </div>
            </div>

            {/* Social Media Links */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-white">Follow Us</h4>
              <div className="flex space-x-3">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    title={social.label}
                    className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-all duration-200 transform hover:scale-105"
                  >
                    <social.icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.footer>
  )
}
