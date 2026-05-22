import { Layout } from 'shared/main'
import { DateTextConfigPanel, DateTextRenderer } from './dateText'
import { DividerConfigPanel, DividerRenderer } from './divider'
import { TextConfigPanel, TextRenderer } from './text'

export function LayoutItemRenderer({
  layoutItem,
}: {
  layoutItem: Layout['layoutItems'][0]
}) {
  //  DataLayoutItem
  if ('columnId' in layoutItem) {
    if (layoutItem.renderer === 'TEXT') {
      return <TextRenderer layoutItem={layoutItem} cell={undefined} />
    }
    if (layoutItem.renderer === 'DATE_TEXT') {
      return <DateTextRenderer layoutItem={layoutItem} cell={undefined} />
    }
  } else {
    if (layoutItem.renderer === 'DIVIDER') {
      return <DividerRenderer layoutItem={layoutItem} />
    }
  }
}

export function LayoutItemConfigPanel({
  layoutItem,
}: {
  layoutItem: Layout['layoutItems'][0]
}) {
  if ('columnId' in layoutItem) {
    if (layoutItem.renderer === 'TEXT') {
      return <TextConfigPanel />
    }
    if (layoutItem.renderer === 'DATE_TEXT') {
      return <DateTextConfigPanel />
    }
  } else {
    if (layoutItem.renderer === 'DIVIDER') {
      return <DividerConfigPanel />
    }
  }
}
