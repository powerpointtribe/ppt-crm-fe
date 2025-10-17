import { useState, useCallback } from 'react'

export interface BulkSelectionHook<T extends { _id: string }> {
  selectedItems: Set<string>
  isAllSelected: boolean
  isIndeterminate: boolean
  selectItem: (id: string) => void
  selectAll: (items: T[]) => void
  clearSelection: () => void
  getSelectedCount: () => number
  getSelectedItems: (items: T[]) => T[]
}

export function useBulkSelection<T extends { _id: string }>(): BulkSelectionHook<T> {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

  const selectItem = useCallback((id: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [])

  const selectAll = useCallback((items: T[]) => {
    setSelectedItems(prev => {
      const allIds = items.map(item => item._id)
      const newSet = new Set(prev)

      if (allIds.every(id => newSet.has(id))) {
        // All are selected, deselect all
        allIds.forEach(id => newSet.delete(id))
      } else {
        // Not all are selected, select all
        allIds.forEach(id => newSet.add(id))
      }

      return newSet
    })
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set())
  }, [])

  const getSelectedCount = useCallback(() => {
    return selectedItems.size
  }, [selectedItems])

  const getSelectedItems = useCallback((items: T[]) => {
    return items.filter(item => selectedItems.has(item._id))
  }, [selectedItems])

  const isAllSelected = useCallback((items: T[]) => {
    return items.length > 0 && items.every(item => selectedItems.has(item._id))
  }, [selectedItems])

  const isIndeterminate = useCallback((items: T[]) => {
    const selectedCount = items.filter(item => selectedItems.has(item._id)).length
    return selectedCount > 0 && selectedCount < items.length
  }, [selectedItems])

  return {
    selectedItems,
    isAllSelected: isAllSelected([]),
    isIndeterminate: isIndeterminate([]),
    selectItem,
    selectAll,
    clearSelection,
    getSelectedCount,
    getSelectedItems
  }
}