import { useCallback, useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import Button from '@/components/ui/Button'
import { decideClaim, listClaims, type Claim, type ListResult } from '@/services/website-admin'
import { showToast } from '@/utils/toast'
import { Empty, ErrorNote, errMsg, fmtStamp, Loading, Pager, StatusBadge, useWebsiteCan } from './shared'

export default function Claims() {
  const can = useWebsiteCan()
  const [status, setStatus] = useState('pending')
  const [page, setPage] = useState(1)
  const [list, setList] = useState<ListResult<Claim> | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    listClaims({ page, status: status || undefined }).then(
      (r) => (setError(null), setList(r)),
      (e: unknown) => setError(errMsg(e, 'Couldn’t load claims.')),
    )
  }, [status, page])
  useEffect(load, [load])

  async function decide(c: Claim, s: 'approved' | 'rejected') {
    const msg =
      s === 'approved'
        ? `Hand "${c.item?.description}" to ${c.claimant.name}? The item is marked collected.`
        : `Reject this claim? "${c.item?.description}" goes back on the list.`
    if (!window.confirm(msg)) return
    try {
      await decideClaim(c.id, s)
      showToast.success(s === 'approved' ? 'Marked as handed over' : 'Claim rejected')
      load()
    } catch (e) {
      showToast.error(errMsg(e, 'Couldn’t save.'))
    }
  }

  return (
    <Layout title="Claims" subtitle="People claiming lost items. Check their proof at the Tribe’s Heart desk on Sunday before handing anything over.">
      <div className="mb-4">
        <select className="input sm:w-auto" aria-label="Status" value={status} onChange={(e) => (setStatus(e.target.value), setPage(1))}>
          <option value="pending">Pending</option>
          <option value="approved">Handed over</option>
          <option value="rejected">Rejected</option>
          <option value="">All</option>
        </select>
      </div>
      {error && <ErrorNote>{error}</ErrorNote>}
      {!list && !error && <Loading />}
      {list?.data.length === 0 && <Empty>No claims here.</Empty>}
      <div className="flex flex-col gap-3">
        {list?.data.map((c) => (
          <article key={c.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-base font-semibold text-gray-900 dark:text-white">{c.item?.description ?? 'Item removed'}</p>
              <StatusBadge status={c.status} />
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>{c.claimant.name}</strong> · {c.claimant.phone ?? '—'} · <span className="text-xs text-gray-500">{fmtStamp(c.createdAt)}</span>
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="text-gray-500">Proof:</span> {c.proof}
            </p>
            {c.status === 'pending' && can('U', 'lost_item_claims') && (
              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={() => decide(c, 'approved')}>Handed over</Button>
                <Button size="sm" variant="outline" onClick={() => decide(c, 'rejected')}>Reject</Button>
              </div>
            )}
          </article>
        ))}
      </div>
      {list && <Pager meta={list.meta} onPage={setPage} />}
    </Layout>
  )
}
