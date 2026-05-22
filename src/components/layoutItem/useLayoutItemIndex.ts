import { useMemo } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { useEditorContext } from '../../app/editor/_contexts/editorContext'
import { ValueType } from '../../app/editor/page'

export const useLayoutItemIndex = () => {
  const { control } = useFormContext<ValueType>()
  const { currentEdittingItemId } = useEditorContext()
  const layoutItems = useWatch({ control, name: 'layout.layoutItems' })
  const itemIdx = useMemo(() => {
    if (!layoutItems) return -1
    return layoutItems.findIndex(i => i.id === currentEdittingItemId)
  }, [currentEdittingItemId, layoutItems])
  return itemIdx
}
