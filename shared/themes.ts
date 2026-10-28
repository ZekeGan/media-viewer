export const themeIds = ['dark', 'glass', 'paper'] as const
export type ThemeId = typeof themeIds[number]
export const isThemeId = (value: unknown): value is ThemeId => typeof value === 'string' && themeIds.includes(value as ThemeId)
