export const getLabels = ({
  doujin,
  curLabel,
  pageCount,
}: {
  curLabel: string
  doujin: IDoujinshiMeta
  pageCount: number
}) => {
  const pages = doujin.meta.pages
  const label = curLabel.split('-')[0]
  const idx = pages.findIndex(d => d.title === label)
  if (idx === -1) return { labels: '', pages: '' }

  if (pageCount === 1 || idx === 0) {
    return { labels: pages[idx].title, pages: `${idx + 1}` }
  }

  // 以後 pageCount 都為 2

  if (idx === 0) {
    return { labels: `${pages[idx].title}-`, pages: `${idx + 1}` }
  }

  // if(idx === page)

  const left = pages[idx % 2 === 0 ? idx - 1 : idx].title
  const right = pages[idx % 2 === 0 ? idx : idx + 1]?.title ?? ''

  return {
    labels: `${left}-${right}`,
    pages: `${Math.min(idx, idx + 1)}-${Math.max(idx, idx + 1) + 1}`,
  }
}
