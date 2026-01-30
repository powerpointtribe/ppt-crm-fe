import { useState } from 'react'
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
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Plus, Trash2, Edit2, ChevronDown, ChevronRight, Check, X } from 'lucide-react'
import { FormSection, createDefaultSection } from '@/types/registration-form'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { cn } from '@/utils/cn'

interface SectionManagerProps {
  sections: FormSection[]
  onChange: (sections: FormSection[]) => void
  disabled?: boolean
}

interface SortableSectionItemProps {
  section: FormSection
  onEdit: (section: FormSection) => void
  onDelete: (sectionId: string) => void
}

function SortableSectionItem({ section, onEdit, onDelete }: SortableSectionItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(section.title)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleSaveEdit = () => {
    if (editTitle.trim()) {
      onEdit({ ...section, title: editTitle.trim() })
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditTitle(section.title)
    setIsEditing(false)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center gap-3 p-3 bg-white rounded-lg border transition-all',
        isDragging ? 'shadow-lg ring-2 ring-primary-500 opacity-50' : 'border-gray-200 hover:border-gray-300'
      )}
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>

      {isEditing ? (
        <div className="flex-1 flex items-center gap-2">
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Section title"
            className="flex-1"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveEdit()
              if (e.key === 'Escape') handleCancelEdit()
            }}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleSaveEdit}
            className="!p-1.5"
          >
            <Check className="h-4 w-4 text-green-600" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleCancelEdit}
            className="!p-1.5"
          >
            <X className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      ) : (
        <>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {section.collapsible ? (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-300" />
              )}
              <span className="font-medium text-gray-900">{section.title}</span>
            </div>
            {section.description && (
              <p className="text-xs text-gray-500 ml-6 truncate">{section.description}</p>
            )}
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="!p-1.5"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => onDelete(section.id)}
              className="!p-1.5"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

export default function SectionManager({ sections, onChange, disabled }: SectionManagerProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id)
      const newIndex = sections.findIndex((s) => s.id === over.id)

      const newSections = arrayMove(sections, oldIndex, newIndex).map((section, index) => ({
        ...section,
        order: index,
      }))

      onChange(newSections)
    }
  }

  const handleAddSection = () => {
    const newSection = createDefaultSection(sections.length)
    onChange([...sections, newSection])
  }

  const handleEditSection = (updatedSection: FormSection) => {
    onChange(sections.map((s) => (s.id === updatedSection.id ? updatedSection : s)))
  }

  const handleDeleteSection = (sectionId: string) => {
    onChange(
      sections
        .filter((s) => s.id !== sectionId)
        .map((section, index) => ({ ...section, order: index }))
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">Form Sections</h4>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleAddSection}
          disabled={disabled}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Section
        </Button>
      </div>

      {sections.length === 0 ? (
        <div className="text-center py-6 text-sm text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
          No sections yet. Add sections to organize your form.
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sections.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {sections.map((section) => (
                <SortableSectionItem
                  key={section.id}
                  section={section}
                  onEdit={handleEditSection}
                  onDelete={handleDeleteSection}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <p className="text-xs text-gray-400">
        Sections help organize your form into logical groups. Fields can be assigned to sections.
      </p>
    </div>
  )
}
