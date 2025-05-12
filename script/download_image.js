/* eslint-disable @typescript-eslint/no-require-imports */
const { get } = require('https') // 或 'http'，取決於 URL 是 http 還是 https
const { createWriteStream } = require('fs')
const { join, basename } = require('path')

// 給定的圖片 URL
const url =
  'https://img.dlsite.jp/modpub/images2/work/doujin/RJ393000/RJ392812_img_smp3.webp'
// 指定的資料夾路徑
const folderPath = 'Z:/_meta'

// 下載並保存圖片
async function downloadFile(url, folderPath) {
  try {
    const fileName = basename(url)

    const filePath = join(folderPath, fileName)
    const file = createWriteStream(filePath)

    return new Promise((resolve, reject) => {
      get(url, response => {
        if (response.statusCode !== 200) {
          reject(`Failed to download. Status code: ${response.statusCode}`)
          return
        }

        const contentType = response.headers['content-type']
        const isImage = contentType.startsWith('image/')
        if (!isImage) {
          reject(`Unexpected content type: ${contentType}`)
          return
        }

        console.log(`Downloading ${fileName}...`)
        response.pipe(file)

        file.on('finish', () => {
          file.close(() => {
            console.log(`Downloaded ${fileName} to ${filePath}`)
            resolve(`Downloaded ${fileName} to ${filePath}`)
          })
        })

        file.on('error', err => {
          reject(`File write error: ${err.message}`)
        })
      }).on('error', err => {
        reject(`Request error: ${err.message}`)
      })
    })
  } catch (error) {
    console.error('Error creating folder:', error)
  }
}

// 調用下載函數
downloadFile(url, folderPath)
  .then(message => console.log(message))
  .catch(error => console.error(error))
