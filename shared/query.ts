export interface Term { key?: string; value: string; exclude: boolean }
export function parseQuery(source: string): Term[][] {
  if (typeof source !== 'string' || source.length > 2000) throw new Error('搜尋字串最多 2,000 字')
  const groups: Term[][] = [[]]; let token = '', quote = false, escaped = false
  const push = () => {
    if (!token) return
    const exclude = token.startsWith('-'); if (exclude) token = token.slice(1)
    const restore=(s:string)=>s.replaceAll('\u0002',':').replaceAll('\u0003','-')
    const colon = token.indexOf(':'), key = colon < 0 ? undefined : restore(token.slice(0, colon)).toLocaleLowerCase()
    const values = (colon < 0 ? token : token.slice(colon + 1)).split('\u0001').map(restore)
    if (key === '' || values.some(v => !v)) throw new Error('條件缺少欄位或值')
    for (const value of values) groups.at(-1)!.push({ key, value: value.toLocaleLowerCase(), exclude })
    token = ''
  }
  for (const char of source.trim()) {
    if (escaped) { token += char===':'?'\u0002':char==='-'&&!token?'\u0003':char; escaped = false; continue }
    if (char === '\\') { escaped = true; continue }
    if (char === '"') { quote = !quote; continue }
    if (!quote && /\s/.test(char)) { push(); continue }
    if (!quote && char === '~') { push(); if (!groups.at(-1)!.length) throw new Error('OR 前缺少條件'); groups.push([]); continue }
    token += quote&&char===':'?'\u0002':quote&&char==='-'&&!token?'\u0003':!quote && char === ',' ? '\u0001' : char
  }
  if (quote || escaped) throw new Error('引號或跳脫未完成')
  push(); if (groups.length > 1 && !groups.at(-1)!.length) throw new Error('OR 後缺少條件')
  if (groups.flat().length > 50) throw new Error('一次最多 50 個條件')
  return groups
}
export const describeQuery = (groups: Term[][]) => groups.map(g => g.map(t => `${t.exclude ? 'NOT ' : ''}${t.key ? t.key + ':' : ''}${JSON.stringify(t.value)}`).join(' AND ')).join(' OR ') || '全部資料夾'
export function normalizeValue(value: unknown, type: string) {
  const raw = Array.isArray(value) ? value.join('\n') : value == null ? '' : String(value)
  return (type === 'datetime' && /^\d{8}$/.test(raw) ? `${raw.slice(0,4)}-${raw.slice(4,6)}-${raw.slice(6)}` : raw).toLocaleLowerCase()
}
