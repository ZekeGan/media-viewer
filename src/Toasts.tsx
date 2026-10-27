import { useEffect } from 'react'
import { Notification, Portal } from '@mantine/core'
import type { ReactNode } from 'react'
export function Toasts({message,error,version,close,progress}:{message:string;error:boolean;version:number;close:()=>void;progress:ReactNode}){
  useEffect(()=>{if(!message||error)return;const timer=setTimeout(close,5000);return()=>clearTimeout(timer)},[message,error,version,close])
  return <Portal><div className="app-toasts" aria-live="polite">{progress&&<Notification withCloseButton={false} loading title="處理進度">{progress}</Notification>}{message&&<Notification color={error?'red':'teal'} title={error?'操作未完成':'提示'} onClose={close} role={error?'alert':'status'}><div className="message">{message}</div></Notification>}</div></Portal>
}
