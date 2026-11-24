import { useEffect, useState } from 'react'
import { Download, Gift } from 'lucide-react'
import Layout from '@/components/Layout'
import Button from '@/components/ui/Button'
import { exportDonations, getDonationTotals, listDonations, type Donation, type DonationTotal, type ListResult } from '@/services/website-admin'
import { showToast } from '@/utils/toast'
import { Empty, ErrorNote, errMsg, fmtMoney, fmtStamp, Pager, useWebsiteCan } from './shared'

const FUNDS: Record<string, string> = { tithe: 'Tithe', offering: 'Offering', partnership: 'Partnership', project: 'Project' }

/** Month-to-date by default; dates are Lagos calendar days. */
const today = () => new Date().toISOString().slice(0, 10)
const monthStart = () => `${today().slice(0, 8)}01`
const dayAfter = (d: string) => new Date(new Date(`${d}T00:00:00+01:00`).getTime() + 86_400_000).toISOString()

export default function Donations() {
  const can = useWebsiteCan()
  const rows = can('R', 'donations')
  const [from, setFrom] = useState(monthStart())
  const [to, setTo] = useState(today())
  const [fund, setFund] = useState('')
  const [page, setPage] = useState(1)
  const [totals, setTotals] = useState<DonationTotal[] | null>(null)
  const [list, setList] = useState<ListResult<Donation> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  const filter = {
    from: from ? new Date(`${from}T00:00:00+01:00`).toISOString() : undefined,
    to: to ? dayAfter(to) : undefined,
    fund: fund || undefined,
  }
  const key = JSON.stringify(filter)

  useEffect(() => {
    const f = JSON.parse(key) as typeof filter
    const fail = (e: unknown) => setError(errMsg(e, 'Couldn’t load donations.'))
    getDonationTotals({ from: f.from, to: f.to }).then((r) => (setError(null), setTotals(r)), fail)
    if (rows) listDonations({ ...f, page }).then(setList, fail)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` captures the filters
  }, [key, page, rows])

  async function doExport() {
    setExporting(true)
    try {
      await exportDonations(filter)
    } catch (e) {
      showToast.error(errMsg(e, 'Couldn’t export.'))
    } finally {
      setExporting(false)
    }
  }

  return (
    <Layout
      title="Donations"
      subtitle="Online gifts confirmed by the payment provider. Bank transfers don’t appear here."
      actions={
        can('X', 'donations') && (
          <Button variant="outline" size="sm" loading={exporting} onClick={doExport}>
            {!exporting && <Download className="w-4 h-4 mr-1" />} Export CSV
          </Button>
        )
      }
    >
      <div className="flex flex-col sm:flex-row sm:items-end gap-3 mb-6">
        <div className="form-group">
          <label className="label" htmlFor="don-from">From</label>
          <input id="don-from" className="input sm:w-44" type="date" value={from} onChange={(e) => (setFrom(e.target.value), setPage(1))} />
        </div>
        <div className="form-group">
          <label className="label" htmlFor="don-to">To</label>
          <input id="don-to" className="input sm:w-44" type="date" value={to} onChange={(e) => (setTo(e.target.value), setPage(1))} />
        </div>
        {rows && (
          <div className="form-group">
            <label className="label" htmlFor="don-fund">Fund</label>
            <select id="don-fund" className="input sm:w-44" value={fund} onChange={(e) => (setFund(e.target.value), setPage(1))}>
              <option value="">All funds</option>
              {Object.entries(FUNDS).map(([k, l]) => (
                <option key={k} value={k}>{l}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && <ErrorNote>{error}</ErrorNote>}

      {totals?.length === 0 && <div className="mb-6"><Empty>No gifts in this period.</Empty></div>}
      {totals && totals.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {totals.map((t) => (
            <div key={`${t.currency}-${t.fund}`} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {FUNDS[t.fund] ?? t.fund} · {t.count} {t.count === 1 ? 'gift' : 'gifts'}
                </span>
                <div className="p-2 rounded-lg bg-green-50 text-green-600">
                  <Gift className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{fmtMoney(t.total, t.currency)}</p>
            </div>
          ))}
        </div>
      )}

      {rows && list && list.data.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/40">
                <tr>
                  {['Receipt', 'Date', 'Fund', 'Amount', 'Giver', 'Campus'].map((h) => (
                    <th key={h} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {list.data.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 text-sm text-gray-700 dark:text-gray-200">
                    <td className="px-6 py-4 font-mono text-xs">{d.receiptNo}</td>
                    <td className="px-6 py-4">{fmtStamp(d.createdAt)}</td>
                    <td className="px-6 py-4">{FUNDS[d.fund] ?? d.fund}</td>
                    <td className="px-6 py-4 font-medium">{fmtMoney(d.amount, d.currency)}</td>
                    <td className="px-6 py-4">
                      {d.donor.name ?? '—'}
                      {d.donor.email && <p className="text-xs text-gray-500">{d.donor.email}</p>}
                    </td>
                    <td className="px-6 py-4">{d.campus ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {rows && list && <Pager meta={list.meta} onPage={setPage} />}
    </Layout>
  )
}
