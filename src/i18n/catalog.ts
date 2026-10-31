import messages from './messages.json'
import type { LocaleId } from '../../shared/locales'
const terminology: Record<LocaleId, Record<string, string>> = {
  'zh-TW': {
    CARD: '卡片',
    TABLE: '表格',
    TREE: '樹狀圖',
    CELL: '組件',
    ROOT: '根資料夾',
    ICON: '圖示',
    SELECT: '選擇器',
    Hover: '滑過',
  },
  'zh-CN': {
    CARD: '卡片',
    TABLE: '表格',
    TREE: '树状图',
    CELL: '组件',
    ROOT: '根文件夹',
    ICON: '图标',
    SELECT: '选择器',
    Hover: '悬停',
  },
  ja: {
    CARD: 'カード',
    TABLE: '表',
    TREE: 'ツリー',
    CELL: 'コンポーネント',
    ROOT: 'ルートフォルダー',
    ICON: 'アイコン',
    SELECT: '選択欄',
    Hover: 'ホバー',
  },
  en: {
    CARD: 'Cards',
    TABLE: 'Table',
    TREE: 'Tree',
    CELL: 'Component',
    ROOT: 'Root folder',
    ICON: 'Icon',
    SELECT: 'Selector',
    Hover: 'Hover',
  },
  es: {
    CARD: 'Tarjetas',
    TABLE: 'Tabla',
    TREE: 'Árbol',
    CELL: 'Componente',
    ROOT: 'Carpeta raíz',
    ICON: 'Icono',
    SELECT: 'Selector',
    Hover: 'Pasar el cursor',
  },
}
// Only translate catalogued interface messages. User data is substituted afterwards.
export const catalog = Object.fromEntries(
  (['zh-TW', 'ja', 'zh-CN', 'en', 'es'] as const).map((locale) => [
    locale,
    Object.fromEntries(
      Object.entries(messages).map(([source, value]) => [
        source,
        (locale === 'zh-TW' ? source : value[locale]).replace(
          /\b(CARD|TABLE|TREE|CELL|ROOT|ICON|SELECT|Hover)\b/g,
          (token) => terminology[locale][token]
        ),
      ])
    ),
  ])
) as Record<LocaleId, Record<string, string>>
