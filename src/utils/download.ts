import { createWriteStream } from 'fs'
import { get } from 'https'
import { basename, join } from 'path'
import { URL } from 'url'

export async function downloadFile(
  url: string,
  folderPath: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const parsedUrl = new URL(url)
      const fileName = basename(parsedUrl.pathname)
      const filePath = join(folderPath, fileName)
      const file = createWriteStream(filePath)

      get(url, response => {
        if (response.statusCode !== 200) {
          file.close()
          reject(
            new Error(`Failed to download. Status code: ${response.statusCode}`)
          )
          return
        }

        const contentType = response.headers['content-type']
        if (!contentType) {
          file.close()
          reject(new Error('No content-type header'))
          return
        }

        const isImage = contentType.startsWith('image/')
        if (!isImage) {
          file.close()
          reject(new Error(`Unexpected content type: ${contentType}`))
          return
        }

        response.pipe(file)

        file.on('finish', () => {
          file.close(() => {
            console.log(`Downloaded ${fileName} to ${filePath}`)
            resolve(`Downloaded ${fileName} to ${filePath}`)
          })
        })

        file.on('error', err => {
          file.close()
          reject(new Error(`File write error: ${err.message}`))
        })
      }).on('error', err => {
        file.close()
        reject(new Error(`Request error: ${err.message}`))
      })
    } catch (error) {
      reject(
        new Error(
          `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
        )
      )
    }
  })
}
