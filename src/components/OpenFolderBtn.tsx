'use client'

import { Button, ButtonProps } from '@mantine/core'


interface IOpenFolderBtn extends ButtonProps {
  folderPath: string
}

export default function OpenFolderBtn({ folderPath, ...rest }: IOpenFolderBtn) {
  const openFolder = async (folderPath: string) => {
    await window.electronApi.openFolder(folderPath)
  }

  return (
    <Button {...rest} variant="light" onClick={() => openFolder(folderPath)}>
      打開資料夾
    </Button>
  )
}
