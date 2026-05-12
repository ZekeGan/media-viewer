import { exec } from 'child_process'

export async function openFolder(folderPath: string) {
  console.log(folderPath)

  exec(`start "" "${folderPath}"`)
}
