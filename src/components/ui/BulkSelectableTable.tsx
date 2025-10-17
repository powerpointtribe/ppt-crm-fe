import { ReactNode } from 'react'
import { Check, Minus } from 'lucide-react'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './Table'
import { cn } from '@/utils/cn'

interface BulkSelectableTableProps {
  children: ReactNode
  className?: string
}

interface BulkSelectHeaderProps {
  children: ReactNode
  checked: boolean
  indeterminate: boolean
  onToggle: () => void
}

interface BulkSelectRowProps {
  children: ReactNode
  checked: boolean
  onToggle: () => void
  onClick?: () => void
  className?: string
}

interface BulkSelectCellProps {
  checked: boolean
  onToggle: () => void
}

export function BulkSelectableTable({ children, className }: BulkSelectableTableProps) {
  return <Table className={className}>{children}</Table>
}

export function BulkSelectHeader({ children, checked, indeterminate, onToggle }: BulkSelectHeaderProps) {
  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-12">
          <BulkSelectCheckbox
            checked={checked}
            indeterminate={indeterminate}
            onChange={onToggle}
          />
        </TableHead>
        {children}
      </TableRow>
    </TableHeader>
  )
}

export function BulkSelectRow({ children, checked, onToggle, onClick, className }: BulkSelectRowProps) {
  return (
    <TableRow
      onClick={onClick}
      className={cn(
        checked && 'bg-blue-50',
        className
      )}
    >
      <TableCell className="w-12">
        <BulkSelectCheckbox
          checked={checked}
          onChange={(e) => {
            e.stopPropagation()
            onToggle()
          }}
        />
      </TableCell>
      {children}
    </TableRow>
  )
}

interface BulkSelectCheckboxProps {
  checked: boolean
  indeterminate?: boolean
  onChange: (e?: React.MouseEvent) => void
}

function BulkSelectCheckbox({ checked, indeterminate, onChange }: BulkSelectCheckboxProps) {
  return (
    <div
      className={cn(
        'w-4 h-4 border-2 rounded cursor-pointer flex items-center justify-center transition-colors',
        checked || indeterminate
          ? 'bg-blue-600 border-blue-600'
          : 'border-gray-300 hover:border-gray-400'
      )}
      onClick={onChange}
    >
      {indeterminate ? (
        <Minus className="w-3 h-3 text-white" />
      ) : checked ? (
        <Check className="w-3 h-3 text-white" />
      ) : null}
    </div>
  )
}

export { TableHeader, TableBody, TableRow, TableHead, TableCell }