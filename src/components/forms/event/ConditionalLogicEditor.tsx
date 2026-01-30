import { Plus, Trash2, AlertCircle } from 'lucide-react'
import {
  ConditionalLogic,
  ConditionalRule,
  EnhancedCustomField,
  CONDITIONAL_OPERATORS,
} from '@/types/registration-form'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { cn } from '@/utils/cn'

interface ConditionalLogicEditorProps {
  fieldId: string
  conditionalLogic: ConditionalLogic | undefined
  allFields: EnhancedCustomField[]
  onChange: (logic: ConditionalLogic) => void
}

export default function ConditionalLogicEditor({
  fieldId,
  conditionalLogic,
  allFields,
  onChange,
}: ConditionalLogicEditorProps) {
  const logic: ConditionalLogic = conditionalLogic || {
    enabled: false,
    action: 'show',
    rules: [],
    logicType: 'all',
  }

  // Filter out the current field from the list
  const availableFields = allFields.filter((f) => f.id !== fieldId)

  const handleToggleEnabled = () => {
    onChange({
      ...logic,
      enabled: !logic.enabled,
    })
  }

  const handleActionChange = (action: 'show' | 'hide') => {
    onChange({
      ...logic,
      action,
    })
  }

  const handleLogicTypeChange = (logicType: 'all' | 'any') => {
    onChange({
      ...logic,
      logicType,
    })
  }

  const handleAddRule = () => {
    const newRule: ConditionalRule = {
      fieldId: availableFields[0]?.id || '',
      operator: 'equals',
      value: '',
    }
    onChange({
      ...logic,
      rules: [...logic.rules, newRule],
    })
  }

  const handleUpdateRule = (index: number, updates: Partial<ConditionalRule>) => {
    const newRules = [...logic.rules]
    newRules[index] = { ...newRules[index], ...updates }
    onChange({
      ...logic,
      rules: newRules,
    })
  }

  const handleDeleteRule = (index: number) => {
    onChange({
      ...logic,
      rules: logic.rules.filter((_, i) => i !== index),
    })
  }

  const getFieldById = (id: string) => allFields.find((f) => f.id === id)

  // Check if operator needs a value input
  const operatorNeedsValue = (operator: string) => {
    return !['is_empty', 'is_not_empty'].includes(operator)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">Conditional Logic</h4>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={logic.enabled}
            onChange={handleToggleEnabled}
          />
          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
        </label>
      </div>

      {logic.enabled && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          {availableFields.length === 0 ? (
            <div className="flex items-center gap-2 text-amber-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>Add more fields to enable conditional logic</span>
            </div>
          ) : (
            <>
              {/* Action selector */}
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">This field should</span>
                <div className="flex rounded-md overflow-hidden border border-gray-300">
                  <button
                    type="button"
                    onClick={() => handleActionChange('show')}
                    className={cn(
                      'px-3 py-1.5 text-sm font-medium',
                      logic.action === 'show'
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    Show
                  </button>
                  <button
                    type="button"
                    onClick={() => handleActionChange('hide')}
                    className={cn(
                      'px-3 py-1.5 text-sm font-medium border-l',
                      logic.action === 'hide'
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    Hide
                  </button>
                </div>
                <span className="text-sm text-gray-600">when</span>
              </div>

              {/* Logic type selector */}
              {logic.rules.length > 1 && (
                <div className="flex items-center gap-4">
                  <div className="flex rounded-md overflow-hidden border border-gray-300">
                    <button
                      type="button"
                      onClick={() => handleLogicTypeChange('all')}
                      className={cn(
                        'px-3 py-1.5 text-sm font-medium',
                        logic.logicType === 'all'
                          ? 'bg-primary-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      )}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLogicTypeChange('any')}
                      className={cn(
                        'px-3 py-1.5 text-sm font-medium border-l',
                        logic.logicType === 'any'
                          ? 'bg-primary-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      )}
                    >
                      Any
                    </button>
                  </div>
                  <span className="text-sm text-gray-600">of the following rules match</span>
                </div>
              )}

              {/* Rules */}
              <div className="space-y-2">
                {logic.rules.map((rule, index) => {
                  const sourceField = getFieldById(rule.fieldId)
                  const hasOptions = sourceField?.options && sourceField.options.length > 0

                  return (
                    <div key={index} className="flex items-center gap-2 bg-white p-2 rounded-lg border">
                      {/* Field selector */}
                      <select
                        value={rule.fieldId}
                        onChange={(e) => handleUpdateRule(index, { fieldId: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">Select field</option>
                        {availableFields.map((field) => (
                          <option key={field.id} value={field.id}>
                            {field.label}
                          </option>
                        ))}
                      </select>

                      {/* Operator selector */}
                      <select
                        value={rule.operator}
                        onChange={(e) => handleUpdateRule(index, { operator: e.target.value as any })}
                        className="w-40 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        {CONDITIONAL_OPERATORS.map((op) => (
                          <option key={op.value} value={op.value}>
                            {op.label}
                          </option>
                        ))}
                      </select>

                      {/* Value input */}
                      {operatorNeedsValue(rule.operator) && (
                        hasOptions ? (
                          <select
                            value={rule.value || ''}
                            onChange={(e) => handleUpdateRule(index, { value: e.target.value })}
                            className="w-40 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="">Select value</option>
                            {sourceField?.options?.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <Input
                            value={rule.value || ''}
                            onChange={(e) => handleUpdateRule(index, { value: e.target.value })}
                            placeholder="Value"
                            className="w-40"
                          />
                        )
                      )}

                      {/* Delete button */}
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteRule(index)}
                        className="!p-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                })}
              </div>

              {/* Add rule button */}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddRule}
                disabled={availableFields.length === 0}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Rule
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
