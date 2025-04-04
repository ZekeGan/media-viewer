'use client'

import { Button, ButtonProps } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import axios from 'axios'

interface IOpenFolderBtn extends ButtonProps {
  folderPath: string
}

export default function OpenFolderBtn({ folderPath, ...rest }: IOpenFolderBtn) {
  const openFolder = async (folderPath: string) => {
    const res = await axios.post('/api/exec', { folderPath })
    if (res.status === 200) {
      notifications.show({
        title: '成功打開資料夾',
        message: '',
        position: 'top-right',
      })
    }
  }

  return (
    <Button {...rest} onClick={() => openFolder(folderPath)}>
      打開資料夾
    </Button>
  )
}
