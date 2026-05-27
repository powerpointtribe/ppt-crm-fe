import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Upload, Calendar, Mail, Users, FileText, Check, X
} from 'lucide-react'
import Layout from '@/components/Layout'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useToast } from '@/hooks/useToast'
import { bulkEmailService } from '@/services/bulk-email'
import { eventsService } from '@/services/events'

type SourceTab = 'csv' | 'event' | 'paste'

interface ParsedContact {
  email: string
  firstName?: string
  lastName?: string
}

export default function MailingListNew() {
  const navigate = useNavigate()
  const toast = useToast()

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [activeTab, setActiveTab] = useState<SourceTab>('csv')

  // CSV state
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvContacts, setCsvContacts] = useState<ParsedContact[]>([])
  const [csvParsing, setCsvParsing] = useState(false)

  // Event state
  const [events, setEvents] = useState<any[]>([])
  const [eventsLoaded, setEventsLoaded] = useState(false)
  const [eventsLoading, setEventsLoading] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState('')
  const [selectedEvent, setSelectedEvent] = useState<any>(null)

  // Paste state
  const [pasteText, setPasteText] = useState('')
  const [pastedContacts, setPastedContacts] = useState<ParsedContact[]>([])

  // UI state
  const [creating, setCreating] = useState(false)

  // Load events when "From Event" tab is selected
  const loadEvents = async () => {
    if (eventsLoaded) return
    try {
      setEventsLoading(true)
      const response = await eventsService.getEvents({ limit: 100 })
      setEvents(response?.items || response?.data || [])
      setEventsLoaded(true)
    } catch (err: any) {
      toast.error('Failed to load events')
    } finally {
      setEventsLoading(false)
    }
  }

  const handleTabChange = (tab: SourceTab) => {
    setActiveTab(tab)
    if (tab === 'event' && !eventsLoaded) {
      loadEvents()
    }
  }

  // CSV parsing
  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCsvFile(file)
    setCsvParsing(true)

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        const lines = text.split(/\r?\n/).filter(line => line.trim())
        if (lines.length === 0) {
          setCsvContacts([])
          setCsvParsing(false)
          return
        }

        // Detect header row
        const header = lines[0].toLowerCase()
        const hasHeader = header.includes('email') || header.includes('name')
        const dataLines = hasHeader ? lines.slice(1) : lines

        const contacts: ParsedContact[] = []
        const headerCols = hasHeader ? lines[0].split(',').map(h => h.trim().toLowerCase()) : []
        const emailIdx = headerCols.indexOf('email')
        const firstNameIdx = headerCols.findIndex(h => h === 'firstname' || h === 'first_name' || h === 'first name')
        const lastNameIdx = headerCols.findIndex(h => h === 'lastname' || h === 'last_name' || h === 'last name')
        const nameIdx = headerCols.findIndex(h => h === 'name' || h === 'full_name' || h === 'fullname')

        for (const line of dataLines) {
          const cols = line.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''))
          if (cols.length === 0) continue

          let email = ''
          let firstName = ''
          let lastName = ''

          if (hasHeader && emailIdx >= 0) {
            email = cols[emailIdx] || ''
            if (firstNameIdx >= 0) firstName = cols[firstNameIdx] || ''
            if (lastNameIdx >= 0) lastName = cols[lastNameIdx] || ''
            if (!firstName && nameIdx >= 0) {
              const nameParts = (cols[nameIdx] || '').split(' ')
              firstName = nameParts[0] || ''
              lastName = nameParts.slice(1).join(' ') || ''
            }
          } else {
            // Try to detect email column
            const emailCol = cols.find(c => c.includes('@'))
            email = emailCol || cols[0] || ''
            if (cols.length > 1 && !cols[1]?.includes('@')) firstName = cols[1] || ''
            if (cols.length > 2 && !cols[2]?.includes('@')) lastName = cols[2] || ''
          }

          if (email && email.includes('@')) {
            contacts.push({ email: email.toLowerCase(), firstName, lastName })
          }
        }

        setCsvContacts(contacts)
      } catch {
        toast.error('Failed to parse CSV file')
        setCsvContacts([])
      } finally {
        setCsvParsing(false)
      }
    }
    reader.readAsText(file)
  }

  // Paste parsing
  const handleParsePastedEmails = () => {
    if (!pasteText.trim()) {
      setPastedContacts([])
      return
    }

    const raw = pasteText
      .split(/[,;\n\r]+/)
      .map(s => s.trim())
      .filter(s => s.includes('@'))

    const unique = [...new Set(raw.map(e => e.toLowerCase()))]
    const contacts: ParsedContact[] = unique.map(email => ({ email }))
    setPastedContacts(contacts)
  }

  // Event selection
  const handleEventSelect = (eventId: string) => {
    setSelectedEventId(eventId)
    const found = events.find(e => e._id === eventId)
    setSelectedEvent(found || null)
  }

  // Create mailing list
  const handleCreate = async () => {
    if (!name.trim()) {
      toast.warning('Please enter a list name')
      return
    }

    try {
      setCreating(true)

      if (activeTab === 'csv') {
        if (!csvFile) {
          toast.warning('Please select a CSV file')
          setCreating(false)
          return
        }
        const formData = new FormData()
        formData.append('file', csvFile)
        formData.append('name', name.trim())
        if (description.trim()) formData.append('description', description.trim())
        await bulkEmailService.importCsvMailingList(formData)
        toast.success('Mailing list created from CSV')
      } else if (activeTab === 'event') {
        if (!selectedEventId) {
          toast.warning('Please select an event')
          setCreating(false)
          return
        }
        await bulkEmailService.createMailingListFromEvent({
          name: name.trim(),
          description: description.trim() || undefined,
          eventId: selectedEventId,
        })
        toast.success('Mailing list created from event')
      } else if (activeTab === 'paste') {
        if (pastedContacts.length === 0) {
          toast.warning('Please paste and parse some emails first')
          setCreating(false)
          return
        }
        const list = await bulkEmailService.createMailingList({
          name: name.trim(),
          description: description.trim() || undefined,
        })
        const listId = list._id || list.id
        await bulkEmailService.addContactsToMailingList(listId, pastedContacts)
        toast.success(`Mailing list created with ${pastedContacts.length} contacts`)
      }

      navigate('/bulk-email/mailing-lists')
    } catch (err: any) {
      toast.error('Failed to create mailing list: ' + (err?.message || 'Unknown error'))
    } finally {
      setCreating(false)
    }
  }

  const currentContacts: ParsedContact[] =
    activeTab === 'csv' ? csvContacts :
    activeTab === 'paste' ? pastedContacts : []

  const tabs: { key: SourceTab; label: string; icon: any; desc: string }[] = [
    { key: 'csv', label: 'Import CSV', icon: Upload, desc: 'Upload a CSV file with email contacts' },
    { key: 'event', label: 'From Event', icon: Calendar, desc: 'Import registrants from an existing event' },
    { key: 'paste', label: 'Paste Emails', icon: Mail, desc: 'Paste a list of email addresses directly' },
  ]

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 pb-10">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/bulk-email/mailing-lists')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Back to Mailing Lists
            </p>
            <h1 className="text-2xl font-bold text-gray-900">Create Mailing List</h1>
          </div>
        </div>

        {/* List details */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#0D7770]" />
            List Details
          </h2>
          <Card>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  List Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Sunday Service Attendees"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0D7770] focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Optional description for this list"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0D7770] focus:border-transparent outline-none"
                />
              </div>
            </div>
          </Card>
        </section>

        {/* Source tabs */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#0D7770]" />
            Contact Source
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {tabs.map(tab => {
              const isSelected = activeTab === tab.key
              const TabIcon = tab.icon
              return (
                <motion.div
                  key={tab.key}
                  whileHover={{ y: -2 }}
                  onClick={() => handleTabChange(tab.key)}
                  className={`rounded-xl p-4 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-2 border-[#0D7770] ring-2 ring-[#0D7770]/20 bg-white'
                      : 'border border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <TabIcon className={`w-5 h-5 ${isSelected ? 'text-[#0D7770]' : 'text-gray-500'}`} />
                      <h3 className="font-medium text-gray-900 text-sm">{tab.label}</h3>
                    </div>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-[#0D7770] flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{tab.desc}</p>
                </motion.div>
              )
            })}
          </div>

          {/* Tab content */}
          {activeTab === 'csv' && (
            <Card>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Upload CSV File</label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                      <Upload className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">{csvFile ? csvFile.name : 'Choose file'}</span>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleCsvFileChange}
                        className="sr-only"
                      />
                    </label>
                    {csvFile && (
                      <button
                        onClick={() => { setCsvFile(null); setCsvContacts([]) }}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">CSV should have columns: email, firstName (optional), lastName (optional)</p>
                </div>
                {csvParsing && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <LoadingSpinner /> Parsing CSV...
                  </div>
                )}
              </div>
            </Card>
          )}

          {activeTab === 'event' && (
            <Card>
              <div className="p-5 space-y-4">
                {eventsLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <LoadingSpinner /> Loading events...
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Event</label>
                    <select
                      value={selectedEventId}
                      onChange={e => handleEventSelect(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0D7770] focus:border-transparent outline-none bg-white"
                    >
                      <option value="">Choose an event...</option>
                      {events.map(event => (
                        <option key={event._id} value={event._id}>
                          {event.title || event.name}
                        </option>
                      ))}
                    </select>
                    {events.length === 0 && (
                      <p className="text-xs text-gray-500 mt-1">No events found</p>
                    )}
                  </div>
                )}
                {selectedEvent && (
                  <div className="flex items-center gap-3 p-3 bg-[#0D7770]/5 rounded-lg border border-[#0D7770]/20">
                    <Calendar className="w-5 h-5 text-[#0D7770]" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{selectedEvent.title || selectedEvent.name}</p>
                      <p className="text-xs text-gray-500">
                        {selectedEvent.registrationCount ?? selectedEvent.attendees?.length ?? '—'} registrations
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {activeTab === 'paste' && (
            <Card>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Paste Email Addresses</label>
                  <textarea
                    value={pasteText}
                    onChange={e => setPasteText(e.target.value)}
                    rows={6}
                    placeholder={'john@example.com, jane@example.com\nmark@example.com\nlucy@example.com'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0D7770] focus:border-transparent outline-none resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Separate emails with commas, semicolons, or new lines</p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleParsePastedEmails}
                  disabled={!pasteText.trim()}
                >
                  Parse Emails
                </Button>
              </div>
            </Card>
          )}
        </section>

        {/* Preview section */}
        {currentContacts.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Check className="w-5 h-5 text-[#0D7770]" />
              Preview ({currentContacts.length} contacts)
            </h2>
            <Card>
              <div className="p-5">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                        <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">First Name</th>
                        <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Last Name</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentContacts.slice(0, 10).map((contact, idx) => (
                        <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-2 px-3 text-gray-400">{idx + 1}</td>
                          <td className="py-2 px-3 text-gray-900 font-medium">{contact.email}</td>
                          <td className="py-2 px-3 text-gray-600">{contact.firstName || '—'}</td>
                          <td className="py-2 px-3 text-gray-600">{contact.lastName || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {currentContacts.length > 10 && (
                    <p className="text-xs text-gray-500 mt-2 px-3">
                      Showing 10 of {currentContacts.length} contacts
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </section>
        )}

        {/* Create button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            variant="secondary"
            onClick={() => navigate('/bulk-email/mailing-lists')}
            disabled={creating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={creating || !name.trim()}
            className="flex items-center gap-2"
          >
            {creating ? (
              <>
                <LoadingSpinner /> Creating...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Create Mailing List
              </>
            )}
          </Button>
        </div>
      </div>
    </Layout>
  )
}
