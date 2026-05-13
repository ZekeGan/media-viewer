import { exec } from 'child_process'

export async function openFolder(folderPath: string) {
  exec(`start "" "${folderPath}"`)
}
