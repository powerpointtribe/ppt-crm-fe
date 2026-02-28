import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Trash2,
  GripVertical,
  Eye,
  Settings,
  Copy,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'

export interface CustomField {
  id: string
  name: string
  label: string
  type: 'text' | 'email' | 'phone' | 'select' | 'radio' | 'checkbox' | 'textarea' | 'number' | 'date' | 'url'
  required: boolean
  placeholder?: string
  description?: string
  defaultValue?: string | boolean
  options?: string[]
  validation?: {
    minLength?: number
    maxLength?: number
    pattern?: string
    min?: number
    max?: number
    mustBeTrue?: boolean
  }
  conditionalDisplay?: {
    field: string
    value: string | string[]
    operator?: 'equals' | 'contains' | 'notEquals'
  }
}

interface Props {
  fields: CustomField[]
  onChange: (fields: CustomField[]) => void
}

export default function FormBuilder({ fields, onChange }: Props) {
  const [editingField, setEditingField] = useState<CustomField | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const fieldTypes = [
    { value: 'text', label: 'Text Input' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone Number' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'url', label: 'URL' },
    { value: 'textarea', label: 'Long Text (Textarea)' },
    { value: 'select', label: 'Dropdown (Select)' },
    { value: 'radio', label: 'Radio Buttons' },
    { value: 'checkbox', label: 'Checkbox' },
  ]

  const addField = () => {
    const newField: CustomField = {
      id: `field_${Date.now()}`,
      name: `field_${fields.length + 1}`,
      label: 'New Field',
      type: 'text',
      required: false,
    }
    onChange([...fields, newField])
    setEditingField(newField)
  }

  const updateField = (id: string, updates: Partial<CustomField>) => {
    const updated = fields.map(f => f.id === id ? { ...f, ...updates } : f)
    onChange(updated)
    if (editingField?.id === id) {
      setEditingField({ ...editingField, ...updates })
    }
  }

  const deleteField = (id: string) => {
    onChange(fields.filter(f => f.id !== id))
    if (editingField?.id === id) {
      setEditingField(null)
    }
  }

  const duplicateField = (field: CustomField) => {
    const duplicate: CustomField = {
      ...field,
      id: `field_${Date.now()}`,
      name: `${field.name}_copy`,
      label: `${field.label} (Copy)`,
    }
    onChange([...fields, duplicate])
  }

  const moveField = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === fields.length - 1)
    ) {
      return
    }

    const newFields = [...fields]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    ;[newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]]
    onChange(newFields)
  }

  const needsOptions = (type: string) => ['select', 'radio'].includes(type)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Registration Form Builder</h3>
          <p className="text-sm text-muted-foreground">
            Configure custom fields for your event registration form
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPreview(true)}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={addField}>
            <Plus className="h-4 w-4 mr-2" />
            Add Field
          </Button>
        </div>
      </div>

      {/* Default Fields Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Default Fields (Always Included)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">First Name</Badge>
            <Badge variant="secondary">Last Name</Badge>
            <Badge variant="secondary">Email</Badge>
            <Badge variant="secondary">Phone</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            These fields are always required and cannot be removed
          </p>
        </CardContent>
      </Card>

      {/* Fields List */}
      {fields.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No custom fields added yet</p>
            <Button onClick={addField}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Field
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {fields.map((field, index) => (
            <Card key={field.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {/* Drag Handle */}
                  <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />

                  {/* Field Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{field.label}</span>
                      <Badge variant="outline">{field.type}</Badge>
                      {field.required && (
                        <Badge variant="destructive" className="text-xs">Required</Badge>
                      )}
                      {field.conditionalDisplay && (
                        <Badge variant="secondary" className="text-xs">Conditional</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Field name: {field.name}
                      {field.description && ` • ${field.description}`}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveField(index, 'up')}
                      disabled={index === 0}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveField(index, 'down')}
                      disabled={index === fields.length - 1}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => duplicateField(field)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingField(field)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteField(field.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                {/* Options Preview */}
                {needsOptions(field.type) && field.options && (
                  <div className="mt-2 ml-8 flex flex-wrap gap-1">
                    {field.options.map((opt, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {opt}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Field Editor Dialog */}
      <Dialog open={!!editingField} onOpenChange={(open) => !open && setEditingField(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Field</DialogTitle>
            <DialogDescription>
              Configure the field properties, validation, and display rules
            </DialogDescription>
          </DialogHeader>

          {editingField && (
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Field Name (ID)</Label>
                  <Input
                    value={editingField.name}
                    onChange={(e) => updateField(editingField.id, { name: e.target.value })}
                    placeholder="e.g., company, businessType"
                  />
                  <p className="text-xs text-muted-foreground">
                    Used as key in form data (no spaces, lowercase)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Field Type</Label>
                  <Select
                    value={editingField.type}
                    onValueChange={(value: any) => updateField(editingField.id, { type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fieldTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Label (Display Text)</Label>
                <Input
                  value={editingField.label}
                  onChange={(e) => updateField(editingField.id, { label: e.target.value })}
                  placeholder="e.g., Company/Organization"
                />
              </div>

              <div className="space-y-2">
                <Label>Description (Help Text)</Label>
                <Textarea
                  value={editingField.description || ''}
                  onChange={(e) => updateField(editingField.id, { description: e.target.value })}
                  placeholder="Optional help text shown below the field"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Placeholder</Label>
                <Input
                  value={editingField.placeholder || ''}
                  onChange={(e) => updateField(editingField.id, { placeholder: e.target.value })}
                  placeholder="e.g., Enter your company name"
                />
              </div>

              {/* Options (for select/radio) */}
              {needsOptions(editingField.type) && (
                <div className="space-y-2">
                  <Label>Options (one per line)</Label>
                  <Textarea
                    value={(editingField.options || []).join('\n')}
                    onChange={(e) =>
                      updateField(editingField.id, {
                        options: e.target.value.split('\n').filter(Boolean)
                      })
                    }
                    placeholder="Option 1&#10;Option 2&#10;Option 3"
                    rows={5}
                  />
                  <p className="text-xs text-muted-foreground">
                    Only one option can be selected by the user
                  </p>
                </div>
              )}

              {/* Required */}
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingField.required}
                  onCheckedChange={(checked) => updateField(editingField.id, { required: checked })}
                />
                <Label>Required Field</Label>
              </div>

              {/* Validation */}
              {editingField.type === 'text' && (
                <div className="space-y-3">
                  <Label>Validation Rules</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Min Length</Label>
                      <Input
                        type="number"
                        value={editingField.validation?.minLength || ''}
                        onChange={(e) =>
                          updateField(editingField.id, {
                            validation: {
                              ...editingField.validation,
                              minLength: e.target.value ? parseInt(e.target.value) : undefined,
                            },
                          })
                        }
                        placeholder="e.g., 3"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Max Length</Label>
                      <Input
                        type="number"
                        value={editingField.validation?.maxLength || ''}
                        onChange={(e) =>
                          updateField(editingField.id, {
                            validation: {
                              ...editingField.validation,
                              maxLength: e.target.value ? parseInt(e.target.value) : undefined,
                            },
                          })
                        }
                        placeholder="e.g., 100"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Conditional Display */}
              <div className="space-y-3 p-4 border rounded-lg">
                <Label>Conditional Display (Optional)</Label>
                <p className="text-xs text-muted-foreground">
                  Show this field only when another field has a specific value
                </p>

                {editingField.conditionalDisplay ? (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Show when field:</Label>
                      <Select
                        value={editingField.conditionalDisplay.field}
                        onValueChange={(value) =>
                          updateField(editingField.id, {
                            conditionalDisplay: {
                              ...editingField.conditionalDisplay!,
                              field: value,
                            },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          {fields
                            .filter((f) => f.id !== editingField.id)
                            .map((f) => (
                              <SelectItem key={f.id} value={f.name}>
                                {f.label}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Has value:</Label>
                      <Input
                        value={
                          Array.isArray(editingField.conditionalDisplay.value)
                            ? editingField.conditionalDisplay.value.join(', ')
                            : editingField.conditionalDisplay.value
                        }
                        onChange={(e) =>
                          updateField(editingField.id, {
                            conditionalDisplay: {
                              ...editingField.conditionalDisplay!,
                              value: e.target.value,
                            },
                          })
                        }
                        placeholder="e.g., Professional"
                      />
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateField(editingField.id, { conditionalDisplay: undefined })}
                    >
                      Remove Condition
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() =>
                      updateField(editingField.id, {
                        conditionalDisplay: { field: '', value: '' },
                      })
                    }
                  >
                    Add Conditional Display
                  </Button>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingField(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Form Preview</DialogTitle>
            <DialogDescription>
              This is how the form will appear on the registration page
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 border rounded-lg p-6">
            {/* Default Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>First Name *</Label>
                <Input disabled placeholder="John" />
              </div>
              <div>
                <Label>Last Name *</Label>
                <Input disabled placeholder="Doe" />
              </div>
            </div>

            <div>
              <Label>Email *</Label>
              <Input disabled type="email" placeholder="john@example.com" />
            </div>

            <div>
              <Label>Phone Number *</Label>
              <Input disabled type="tel" placeholder="+234 800 000 0000" />
            </div>

            {/* Custom Fields */}
            {fields.map((field) => (
              <div key={field.id}>
                <Label>
                  {field.label} {field.required && '*'}
                </Label>
                {field.description && (
                  <p className="text-xs text-muted-foreground mb-2">{field.description}</p>
                )}

                {field.type === 'select' && (
                  <Select disabled>
                    <SelectTrigger>
                      <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
                    </SelectTrigger>
                  </Select>
                )}

                {field.type === 'radio' && field.options && (
                  <div className="space-y-2">
                    {field.options.map((opt, i) => (
                      <div key={i} className="flex items-center space-x-2">
                        <input type="radio" disabled name={field.name} />
                        <Label>{opt}</Label>
                      </div>
                    ))}
                  </div>
                )}

                {field.type === 'checkbox' && (
                  <div className="flex items-center space-x-2">
                    <Checkbox disabled />
                    <Label>{field.label}</Label>
                  </div>
                )}

                {field.type === 'textarea' && (
                  <Textarea disabled placeholder={field.placeholder} rows={3} />
                )}

                {['text', 'email', 'phone', 'number', 'date', 'url'].includes(field.type) && (
                  <Input disabled type={field.type} placeholder={field.placeholder} />
                )}
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button onClick={() => setShowPreview(false)}>Close Preview</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
