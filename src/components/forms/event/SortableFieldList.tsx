import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { EnhancedCustomField } from '@/types/registration-form'
import SortableFieldItem from './SortableFieldItem'
import { Layers } from 'lucide-react'

interface SortableFieldListProps {
  fields: EnhancedCustomField[]
  onReorder: (fields: EnhancedCustomField[]) => void
  onEdit: (field: EnhancedCustomField) => void
  onDelete: (fieldId: string) => void
  onDuplicate: (field: EnhancedCustomField) => void
  selectedFieldId?: string
}

export default function SortableFieldList({
  fields,
  onReorder,
  onEdit,
  onDelete,
  onDuplicate,
  selectedFieldId,
}: SortableFieldListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((field) => field.id === active.id)
      const newIndex = fields.findIndex((field) => field.id === over.id)

      const newFields = arrayMove(fields, oldIndex, newIndex).map((field, index) => ({
        ...field,
        order: index,
      }))

      onReorder(newFields)
    }
  }

  if (fields.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
        <Layers className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No fields yet</h3>
        <p className="text-sm text-gray-500 text-center max-w-sm">
          Add fields from the selector above to build your registration form. Drag and drop to reorder.
        </p>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={fields.map((f) => f.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {fields.map((field) => (
            <SortableFieldItem
              key={field.id}
              field={field}
              onEdit={onEdit}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              isSelected={selectedFieldId === field.id}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
