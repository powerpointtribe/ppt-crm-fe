import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Users, Mail, Trash2, Plus, Search, Upload, Calendar, Edit, X, Check } from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Modal from '@/components/ui/Modal'
import { bulkEmailService } from '@/services/bulk-email'
import { useToast } from '@/hooks/useToast'
import { formatDate } from '@/utils/formatters'

const SOURCE_BADGE: Record<string, { label: string; color: string }> = {
  csv_import: { label: 'CSV Import', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  event: { label: 'From Event', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  manual: { label: 'Manual', color: 'bg-gray-50 text-gray-700 border-gray-200' },
}

export default function MailingListDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const [list, setList] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [addEmails, setAddEmails] = useState('')
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)

  useEffect(() => { if (id) loadList() }, [id])

  const loadList = async () => {
    try {
      setLoading(true)
      const data = await bulkEmailService.getMailingListById(id!)
      setList(data)
    } catch {
      toast.error('Failed to load mailing list')
    } finally {
      setLoading(false)
    }
  }

  const handleAddContacts = async () => {
    if (!addEmails.trim()) return
    try {
      setAdding(true)
      const contacts = addEmails
        .split(/[,;\n]+/)
        .map(e => e.trim())
        .filter(e => e.includes('@'))
        .map(email => ({ email }))

      if (contacts.length === 0) {
        toast.warning('No valid emails found')
        return
      }

      await bulkEmailService.addContactsToMailingList(id!, contacts)
      toast.success(`${contacts.length} contact(s) added`)
      setShowAddModal(false)
      setAddEmails('')
      loadList()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add contacts')
    } finally {
      setAdding(false)
    }
  }

  const handleRemoveContact = async (email: string) => {
    try {
      setRemoving(email)
      await bulkEmailService.removeContactsFromMailingList(id!, [email])
      toast.success('Contact removed')
      loadList()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to remove')
    } finally {
      setRemoving(null)
    }
  }

  if (loading) {
    return <Layout title="Mailing List"><div className="flex justify-center py-16"><LoadingSpinner /></div></Layout>
  }

  if (!list) {
    return <Layout title="Mailing List"><div className="text-center py-16 text-gray-500">Mailing list not found</div></Layout>
  }

  const source = SOURCE_BADGE[list.source] || SOURCE_BADGE.manual
  const contacts = (list.contacts || []).filter((c: any) =>
    !search || c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.firstName?.toLowerCase().includes(search.toLowerCase()) ||
    c.lastName?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Layout title={list.name}>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/bulk-email/mailing-lists')} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-gray-900">{list.name}</h1>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${source.color}`}>{source.label}</span>
              </div>
              {list.description && <p className="text-sm text-gray-500 mt-0.5">{list.description}</p>}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowAddModal(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Contacts
            </Button>
            <Button size="sm" onClick={() => navigate(`/bulk-email/campaigns/new`)}>
              <Mail className="w-3.5 h-3.5 mr-1" /> Send Campaign
            </Button>
          </div>
        </div>

        {/* Info cards */}
        <div className="flex gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium bg-white border-gray-200 text-gray-700">
            <Users className="w-3.5 h-3.5" /> {list.contactCount || contacts.length} contacts
          </div>
          {list.sourceEventId && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium bg-purple-50 border-purple-200 text-purple-700">
              <Calendar className="w-3.5 h-3.5" /> {typeof list.sourceEventId === 'object' ? list.sourceEventId.title : 'Event'}
            </div>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium bg-gray-50 border-gray-200 text-gray-500">
            Created {formatDate(list.createdAt)}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0D7770]/20 focus:border-[#0D7770] outline-none bg-white"
          />
        </div>

        {/* Contacts table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/80">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Linked</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {contacts.map((c: any, i: number) => (
                  <motion.tr
                    key={c.email + i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-xs font-semibold text-gray-500">
                          {(c.firstName || c.email)[0]?.toUpperCase()}
                        </div>
                        <span className="text-sm text-gray-900">{c.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {[c.firstName, c.lastName].filter(Boolean).join(' ') || '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {c.member ? (
                        <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">Member</span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleRemoveContact(c.email)}
                        disabled={removing === c.email}
                        className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                        title="Remove"
                      >
                        {removing === c.email ? <LoadingSpinner size="sm" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          {contacts.length === 0 && (
            <div className="p-8 text-center text-sm text-gray-500">
              {search ? 'No contacts match your search' : 'No contacts in this list'}
            </div>
          )}
        </Card>
      </div>

      {/* Add Contacts Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Contacts">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Paste email addresses separated by commas, semicolons, or new lines.</p>
          <textarea
            value={addEmails}
            onChange={e => setAddEmails(e.target.value)}
            rows={5}
            placeholder="john@example.com, jane@example.com"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0D7770]/20 focus:border-[#0D7770] outline-none resize-none"
          />
          {addEmails.trim() && (
            <p className="text-xs text-gray-500">
              {addEmails.split(/[,;\n]+/).filter(e => e.trim().includes('@')).length} valid email(s) detected
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button size="sm" onClick={handleAddContacts} disabled={adding || !addEmails.trim()}>
              {adding ? 'Adding...' : 'Add Contacts'}
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  )
}
