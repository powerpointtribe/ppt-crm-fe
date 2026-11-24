import { useEffect, useState } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { ChevronRight, Plus, Search } from 'lucide-react'
import Layout from '@/components/Layout'
import Button from '@/components/ui/Button'
import { listResource, type Doc, type ListResult } from '@/services/website-admin'
import { resourceByKey, type Column } from './resources'
import { Empty, ErrorNote, errMsg, fmtDay, fmtMoney, fmtStamp, getPath, Loading, Pager, StatusBadge, useLookups, useWebsiteCan } from './shared'

type Row = Doc & { id: string }

/** List screen for any website resource in resources.ts (`/website/:resource`). */
export default function ResourceList() {
  const { resource = '' } = useParams()
  const cfg = resourceByKey(resource)
  const [sp, setSp] = useSearchParams()
  const can = useWebsiteCan()
  const { lookups } = useLookups()
  const [result, setResult] = useState<ListResult<Row> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState(sp.get('q') ?? '')

  const query = cfg
    ? Object.fromEntries([...sp.entries()].filter(([k]) => k === 'page' || k === 'q' || cfg.filters?.some((f) => f.name === k)))
    : {}
  const key = JSON.stringify(query)

  useEffect(() => {
    if (!cfg) return
    let live = true
    setResult(null)
    listResource(cfg.key, JSON.parse(key))
      .then((r) => {
        if (!live) return
        setError(null)
        setResult(r as ListResult<Row>)
      })
      .catch((e: unknown) => live && setError(errMsg(e, 'Couldn’t load this list.')))
    return () => {
      live = false
    }
  }, [cfg, key])

  if (!cfg) return <Navigate to="/website" replace />

  /** Filters live in the URL, so they survive reloads and can be shared. Changing one resets to page 1. */
  function setParam(name: string, value: string | null) {
    const next = new URLSearchParams(sp)
    if (value) next.set(name, value)
    else next.delete(name)
    if (name !== 'page') next.delete('page')
    setSp(next, { replace: true })
  }

  const refLabel = (lookup: string | undefined, id: unknown) => {
    if (id === null || id === undefined || id === '') return 'All'
    const opts = lookups[lookup as keyof typeof lookups] ?? []
    return opts.find((o) => o.id === id)?.label ?? '…'
  }
  const cell = (c: Column, row: Row) => {
    const v = getPath(row, c.key)
    switch (c.kind) {
      case 'date':
        return fmtDay(v as string)
      case 'datetime':
        return fmtStamp(v as string)
      case 'money':
        return typeof v === 'number' ? fmtMoney(v) : '—'
      case 'status':
        return v ? <StatusBadge status={String(row.pendingChange ? 'pending' : v)} /> : '—'
      case 'bool':
        return v ? 'Yes' : '—'
      case 'ref':
        return refLabel(c.lookup, v)
      default:
        return v === null || v === undefined || v === '' ? '—' : String(v)
    }
  }
  const editHref = (id?: string) => `/website/${cfg.key}/${id ?? 'new'}`

  return (
    <Layout
      title={cfg.label}
      subtitle={cfg.intro ?? `Website ${cfg.label.toLowerCase()}`}
      actions={
        can('C', cfg.policy) && (
          <Link to={editHref()}>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" /> New {cfg.singular}
            </Button>
          </Link>
        )
      }
    >
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <form
          role="search"
          className="relative flex-1 sm:max-w-xs"
          onSubmit={(e) => {
            e.preventDefault()
            setParam('q', q.trim() || null)
          }}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9" type="search" placeholder={`Search ${cfg.label.toLowerCase()}…`} aria-label={`Search ${cfg.label}`} value={q} onChange={(e) => setQ(e.target.value)} />
        </form>
        {cfg.filters?.map((f) => (
          <select key={f.name} className="input sm:w-auto" aria-label={f.label} value={sp.get(f.name) ?? ''} onChange={(e) => setParam(f.name, e.target.value || null)}>
            <option value="">{f.label}: all</option>
            {(f.options ?? (lookups[f.lookup!] ?? []).map((o) => [o.id, o.label] as const)).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        ))}
      </div>

      {error && <ErrorNote>{error}</ErrorNote>}
      {!result && !error && <Loading />}
      {result && result.data.length === 0 && <Empty>{sp.toString() ? 'Nothing matches these filters.' : `No ${cfg.label.toLowerCase()} yet.`}</Empty>}
      {result && result.data.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/40">
                <tr>
                  {cfg.columns.map((c) => (
                    <th key={c.key} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      {c.label}
                    </th>
                  ))}
                  <th scope="col" className="px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {result.data.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                    {cfg.columns.map((c, i) => (
                      <td key={c.key} className="px-6 py-4 text-sm text-gray-700 dark:text-gray-200">
                        {i === 0 ? (
                          <Link to={editHref(row.id)} className="font-medium text-gray-900 dark:text-white hover:text-primary-600">
                            {cell(c, row)}
                          </Link>
                        ) : (
                          cell(c, row)
                        )}
                      </td>
                    ))}
                    <td className="px-6 py-4 text-right">
                      <Link to={editHref(row.id)} className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700">
                        {can('U', cfg.policy) ? 'Edit' : 'View'}
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {result && <Pager meta={result.meta} onPage={(p) => setParam('page', String(p))} />}
    </Layout>
  )
}
