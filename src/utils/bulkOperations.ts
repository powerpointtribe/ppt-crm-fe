// Bulk operations utilities and types

export interface BulkOperationResult {
  success: boolean
  processedCount: number
  failedCount: number
  errors?: string[]
  message: string
}

export interface BulkUpdateData {
  [key: string]: any
}

// Export utilities
export function downloadCSV(data: any[], filename: string, columns?: string[]) {
  if (!data.length) return

  const headers = columns || Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(item =>
      headers.map(header => {
        const value = item[header]
        if (value === null || value === undefined) return ''
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return String(value)
      }).join(',')
    )
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

export function downloadJSON(data: any[], filename: string) {
  const jsonContent = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' })
  const link = document.createElement('a')

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}.json`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

// Batch processing utilities
export async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize: number = 10,
  delayMs: number = 100
): Promise<(R | Error)[]> {
  const results: (R | Error)[] = []

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchPromises = batch.map(async (item) => {
      try {
        return await processor(item)
      } catch (error) {
        return error instanceof Error ? error : new Error(String(error))
      }
    })

    const batchResults = await Promise.all(batchPromises)
    results.push(...batchResults)

    // Add delay between batches to avoid overwhelming the server
    if (i + batchSize < items.length && delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }

  return results
}

// Validation utilities
export function validateBulkUpdateData(data: BulkUpdateData, allowedFields: string[]): string[] {
  const errors: string[] = []

  Object.keys(data).forEach(field => {
    if (!allowedFields.includes(field)) {
      errors.push(`Field "${field}" is not allowed for bulk updates`)
    }
  })

  return errors
}

// Progress tracking
export interface BulkOperationProgress {
  total: number
  processed: number
  failed: number
  current?: string
}

export type ProgressCallback = (progress: BulkOperationProgress) => void