import SearchableSelect from '@/components/ui/SearchableSelect'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

const EMPTY_ITEM_FORM = {
  standardItemId: '',
  budget: '',
  weightPercentage: '',
  sequenceOrder: '',
  generalNotes: '',
}

export default function ProjectItemAssignmentFields({
  catalogItems = [],
  selectedItems = [],
  excludedItemIds = [],
  onAddItem,
  onRemoveItem,
  disabled = false,
  ids = {},
}) {
  const { t } = useTranslation()
  const [itemForm, setItemForm] = useState(EMPTY_ITEM_FORM)

  const blockedItemIds = new Set([
    ...selectedItems.map((item) => String(item.standardItemId)),
    ...excludedItemIds.filter(Boolean).map((itemId) => String(itemId)),
  ])
  const availableCatalogItems = catalogItems.filter(
    (item) => !blockedItemIds.has(String(item.itemId)),
  )
  const currentItemStillAvailable =
    !itemForm.standardItemId ||
    availableCatalogItems.some((item) => String(item.itemId) === String(itemForm.standardItemId))

  useEffect(() => {
    if (!currentItemStillAvailable) {
      setItemForm(EMPTY_ITEM_FORM)
    }
  }, [currentItemStillAvailable])

  const field = (key) => (e) => setItemForm((prev) => ({ ...prev, [key]: e.target.value }))

  const handleAddItem = () => {
    if (!itemForm.standardItemId || !itemForm.budget || !itemForm.weightPercentage) return

    onAddItem?.({
      standardItemId: itemForm.standardItemId,
      budget: Number(itemForm.budget),
      weightPercentage: Number(itemForm.weightPercentage),
      ...(itemForm.sequenceOrder ? { sequenceOrder: Number(itemForm.sequenceOrder) } : {}),
      ...(itemForm.generalNotes.trim() ? { generalNotes: itemForm.generalNotes.trim() } : {}),
    })

    setItemForm(EMPTY_ITEM_FORM)
  }

  const catalogName = (id) => {
    const item = catalogItems.find((catalogItem) => String(catalogItem.itemId) === String(id))
    return item ? `${item.nameEn} / ${item.nameAr}` : id
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <SearchableSelect
            id={ids.catalogItem ?? 'project-item-catalog'}
            label={t('projects.catalog_item')}
            value={itemForm.standardItemId}
            onChange={field('standardItemId')}
            disabled={disabled}
            placeholder={t('projects.select_item')}
            options={availableCatalogItems.map((item) => ({
              value: item.itemId,
              label: `${item.nameEn} / ${item.nameAr}`,
            }))}
          />
        </div>

        <label className="text-xs text-gray-600">
          {t('projects.item_budget')} *
          <input
            id={ids.budget ?? 'project-item-budget'}
            className="input-base mt-1 block w-full text-sm"
            type="number"
            min="0"
            step="0.01"
            value={itemForm.budget}
            onChange={field('budget')}
            disabled={disabled}
          />
        </label>
        <label className="text-xs text-gray-600">
          {t('projects.weight')} % *
          <input
            id={ids.weight ?? 'project-item-weight'}
            className="input-base mt-1 block w-full text-sm"
            type="number"
            min="0.01"
            max="100"
            step="0.01"
            value={itemForm.weightPercentage}
            onChange={field('weightPercentage')}
            disabled={disabled}
          />
        </label>
        <label className="text-xs text-gray-600">
          {t('projects.sequence')}
          <input
            id={ids.sequence ?? 'project-item-sequence'}
            className="input-base mt-1 block w-full text-sm"
            type="number"
            min="1"
            value={itemForm.sequenceOrder}
            onChange={field('sequenceOrder')}
            disabled={disabled}
          />
        </label>
        <label className="text-xs text-gray-600">
          {t('projects.notes')}
          <input
            id={ids.notes ?? 'project-item-notes'}
            className="input-base mt-1 block w-full text-sm"
            value={itemForm.generalNotes}
            onChange={field('generalNotes')}
            placeholder={t('projects.notes_placeholder', 'Instructions or notes for the site engineer...')}
            disabled={disabled}
          />
        </label>
      </div>

      {catalogItems.length > 0 && availableCatalogItems.length === 0 && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {t('projects.no_available_items')}
        </p>
      )}

      <button
        type="button"
        id={ids.addButton ?? 'project-item-add'}
        onClick={handleAddItem}
        disabled={
          disabled ||
          !itemForm.standardItemId ||
          !itemForm.budget ||
          !itemForm.weightPercentage ||
          availableCatalogItems.length === 0
        }
        className="rounded-lg border border-warm-brown/40 px-4 py-2 text-sm font-medium text-warm-brown transition-colors hover:bg-warm-brown/10 disabled:pointer-events-none disabled:opacity-40"
      >
        + {t('projects.add_item')}
      </button>

      {selectedItems.length > 0 && (
        <div className="space-y-2 rounded-xl border border-gray-200 bg-gray-50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            {t('projects.selected_items')} ({selectedItems.length})
          </p>
          {selectedItems.map((item, idx) => (
            <div
              key={item.standardItemId}
              className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-warm-brown text-[10px] font-bold text-white">
                  {idx + 1}
                </span>
                <span className="truncate text-gray-800">{catalogName(item.standardItemId)}</span>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-xs text-gray-500">{item.weightPercentage}%</span>
                <button
                  type="button"
                  onClick={() => onRemoveItem?.(item.standardItemId)}
                  disabled={disabled}
                  className="text-xs font-medium text-red-500 transition-colors hover:text-red-600 disabled:pointer-events-none disabled:opacity-30"
                >
                  {t('projects.remove')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}