export type NoticeLevel = 'success' | 'warning' | 'error'

// Transient operation feedback. Never stored in portable folder/project records.
export interface Notice {
  level: NoticeLevel
  message: string
}

export function completionNotice(completed: number, issues: number, message: string): Notice {
  return {
    level: issues === 0 ? 'success' : completed > 0 ? 'warning' : 'error',
    message,
  }
}
