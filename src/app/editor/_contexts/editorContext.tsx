import React, { ReactNode, createContext, useContext, useState } from 'react'

interface EditorValue {
  currentEdittingItemId: string
  setCurrentEdittingItemId: (value: string) => void
}

const EditorContext = createContext<EditorValue | undefined>(undefined)

interface EditorProps {
  children: ReactNode
  initialValue?: string
}

export const EditorProvider = ({ children }: EditorProps) => {
  const [currentEdittingItemId, setCurrentEdittingItemId] = useState('')

  const value: EditorValue = {
    currentEdittingItemId,
    setCurrentEdittingItemId,
  }

  return (
    <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
  )
}

export const useEditorContext = () => {
  const context = useContext(EditorContext)
  if (context === undefined) {
    throw new Error('editorContext error')
  }
  return context
}
