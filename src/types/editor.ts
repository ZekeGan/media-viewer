import { DataType } from './main'

export interface DisplayBase {
  id: string
  target: string
  type: DataType
  label?: string
}

export interface DisplayString extends DisplayBase {
  type: 'STRING' | 'IMAGE'
  value: string
}

export interface DisplayArrayString extends DisplayBase {
  type: 'ARRAY_STRING'
  value: string[]
}

export interface DisplayButton extends DisplayBase {
  type: 'BUTTON'
  config?: {
    buttonStr?: string
    command: 'OPEN_FOLDER' | 'RUN_EXE' | ''
  }
}

export interface DisplayNumber extends DisplayBase {
  type: 'NUMBER'
  value: number
}

export interface DisplayDate extends DisplayBase {
  type: 'DATE'
  config: {
    formatStr: string
  }
  value: string
}

export interface DisplayBoolean extends DisplayBase {
  type: 'BOOLEAN'
  config: {
    trueStr: string
    falseStr: string
  }
  value: boolean
}

export interface DisplayNone extends DisplayBase {
  type: 'NONE'
}

export type Display =
  | DisplayArrayString
  | DisplayBoolean
  | DisplayButton
  | DisplayDate
  | DisplayString
  | DisplayButton
  | DisplayNumber
  | DisplayNone
