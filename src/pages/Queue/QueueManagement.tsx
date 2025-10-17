import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, Clock, CheckCircle, XCircle, AlertCircle, Trash2, Eye, BarChart3 } from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { queueService, JobStatus, JobHistory, QueueStats } from '@/services/queue'
import { formatDate } from '@/utils/formatters'
import { showToast } from '@/utils/toast'

export default function QueueManagement() {
  const [jobs, setJobs] = useState<JobStatus[]>([])
  const [stats, setStats] = useState<QueueStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)
  const [selectedJob, setSelectedJob] = useState<JobStatus | null>(null)
  const [pollingJobs, setPollingJobs] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadData()
    // Refresh every 30 seconds
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    try {
      setError(null)
      const [jobHistory, queueStats] = await Promise.all([
        queueService.getJobHistory(20),
        queueService.getQueueStats()
      ])
      setJobs(jobHistory.jobs || [])
      setStats(queueStats)
    } catch (error: any) {
      console.error('Error loading queue data:', error)
      setError(error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelJob = async (jobId: string) => {
    try {
      await queueService.cancelJob(jobId)
      showToast('Job cancelled successfully', 'success')
      loadData()
    } catch (error: any) {
      showToast(`Failed to cancel job: ${error.message}`, 'error')
    }
  }

  const handleJobDetail = async (jobId: string) => {
    try {
      const jobStatus = await queueService.getJobStatus(jobId)
      setSelectedJob(jobStatus)
    } catch (error: any) {
      showToast(`Failed to load job details: ${error.message}`, 'error')
    }
  }

  const startPolling = (jobId: string) => {
    if (pollingJobs.has(jobId)) return

    setPollingJobs(prev => new Set(prev).add(jobId))

    const stopPolling = queueService.pollJobStatus(
      jobId,
      (status) => {
        // Update job in list
        setJobs(prev => prev.map(job =>
          job.id === jobId ? status : job
        ))
      },
      (finalStatus) => {
        setPollingJobs(prev => {
          const newSet = new Set(prev)
          newSet.delete(jobId)
          return newSet
        })
        showToast(`Job ${finalStatus.status}`, finalStatus.status === 'completed' ? 'success' : 'error')
      },
      (error) => {
        setPollingJobs(prev => {
          const newSet = new Set(prev)
          newSet.delete(jobId)
          return newSet
        })
        console.error('Polling error:', error)
      }
    )

    // Clean up polling after 10 minutes
    setTimeout(() => {
      stopPolling()
      setPollingJobs(prev => {
        const newSet = new Set(prev)
        newSet.delete(jobId)
        return newSet
      })
    }, 600000)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'waiting': return <Clock className="h-4 w-4 text-yellow-500" />
      case 'active': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />
      case 'delayed': return <AlertCircle className="h-4 w-4 text-orange-500" />
      default: return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'success' | 'error' | 'warning'> = {
      waiting: 'warning',
      active: 'default',
      completed: 'success',
      failed: 'error',
      delayed: 'warning'
    }
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>
  }

  if (loading) {
    return (
      <Layout title="Queue Management">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout title="Queue Management">
        <ErrorBoundary error={error} onRetry={loadData} />
      </Layout>
    )
  }

  return (
    <Layout title="Queue Management">
      <div className="space-y-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            {[
              { label: 'Waiting', value: stats.waiting, color: 'text-yellow-600', bg: 'bg-yellow-50' },
              { label: 'Active', value: stats.active, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Completed', value: stats.completed, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Failed', value: stats.failed, color: 'text-red-600', bg: 'bg-red-50' },
              { label: 'Delayed', value: stats.delayed, color: 'text-orange-600', bg: 'bg-orange-50' },
              { label: 'Total', value: stats.totalJobs, color: 'text-gray-600', bg: 'bg-gray-50' },
            ].map((stat) => (
              <Card key={stat.label} className={`p-4 ${stat.bg}`}>
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </Card>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Recent Jobs</h2>
          <Button onClick={loadData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Jobs Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-mono text-xs">
                    {job.id.substring(0, 8)}...
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{job.type}</div>
                      {job.metadata?.filename && (
                        <div className="text-xs text-gray-500">{job.metadata.filename}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(job.status)}
                      {getStatusBadge(job.status)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {job.progress !== undefined ? (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">
                    {formatDate(job.createdAt)}
                  </TableCell>
                  <TableCell className="text-xs">
                    {formatDate(job.updatedAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleJobDetail(job.id)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      {pollingJobs.has(job.id) ? (
                        <Badge variant="default" className="text-xs">
                          <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                          Live
                        </Badge>
                      ) : (
                        job.status === 'active' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startPolling(job.id)}
                          >
                            <BarChart3 className="h-3 w-3" />
                          </Button>
                        )
                      )}
                      {['waiting', 'active', 'delayed'].includes(job.status) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancelJob(job.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* Job Detail Modal */}
        {selectedJob && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Job Details</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedJob(null)}
                >
                  Close
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">ID</label>
                  <p className="font-mono text-sm">{selectedJob.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Type</label>
                  <p>{selectedJob.type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedJob.status)}
                    {getStatusBadge(selectedJob.status)}
                  </div>
                </div>
                {selectedJob.progress !== undefined && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Progress</label>
                    <div className="w-full bg-gray-200 rounded-full h-3 mt-1">
                      <div
                        className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${selectedJob.progress}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{selectedJob.progress}%</p>
                  </div>
                )}
                {selectedJob.error && (
                  <div>
                    <label className="text-sm font-medium text-red-500">Error</label>
                    <pre className="bg-red-50 p-3 rounded text-sm text-red-700 whitespace-pre-wrap">
                      {selectedJob.error}
                    </pre>
                  </div>
                )}
                {selectedJob.result && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Result</label>
                    <pre className="bg-gray-50 p-3 rounded text-sm whitespace-pre-wrap">
                      {JSON.stringify(selectedJob.result, null, 2)}
                    </pre>
                  </div>
                )}
                {selectedJob.metadata && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Metadata</label>
                    <pre className="bg-gray-50 p-3 rounded text-sm">
                      {JSON.stringify(selectedJob.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </Layout>
  )
}