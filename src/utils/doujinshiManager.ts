import path from 'path'
import fs from 'fs'
import { DoujinshiPath } from '@/constants/env'
import { nanoid } from 'nanoid'
import { imgExt } from '@/constants'
import sharp from 'sharp'
import pLimit from 'p-limit'

const limit = pLimit(5) // 最多同時處理 5 張

function parseTitle(str: string) {
  const result: { misc: string[]; artists: string[]; groups: string[]; name: string } = {
    misc: [],
    artists: [],
    groups: [],
    name: str.trim(),
  }

  // 1. (<type>) [<author>(<groups>)] <name>
  const fullWithGroups = str.match(/^\(([^)]+)\)\s+\[([^(]+)\(([^)]+)\)\](.+)$/)
  if (fullWithGroups) {
    result.misc = fullWithGroups[1].split(',').map(s => s.trim())
    result.artists = fullWithGroups[2].split(',').map(s => s.trim())
    result.groups = fullWithGroups[3].split(',').map(s => s.trim())
    result.name = fullWithGroups[4].trim()
    return result
  }

  // 優先解析完整格式: (<type>) [<author>] <name>
  const fullMatch = str.match(/^\(([^)]+)\)\s+\[([^\]]+)\](.+)$/)
  if (fullMatch) {
    result.misc = fullMatch[1].split(',').map(s => s.trim())
    result.artists = fullMatch[2].split(',').map(s => s.trim())
    result.name = fullMatch[3].trim()
    return result
  }

  // 解析格式: [<author>] <name>
  const authorMatch = str.match(/^\[([^\]]+)\](.+)$/)
  if (authorMatch) {
    result.artists = authorMatch[1].split(',').map(s => s.trim())
    result.name = authorMatch[2].trim()
    return result
  }

  // 解析格式: (<type>) <name>
  const typeMatch = str.match(/^\(([^)]+)\)(.+)$/)
  if (typeMatch) {
    result.misc = typeMatch[1].split(',').map(s => s.trim())
    result.name = typeMatch[2].trim()
    return result
  }

  // 沒匹配就保持原始 name
  return result
}

export class DoujinshiManager {
  private _doujinshiName: string = ''
  private _pageTitleList: string[] = []
  private _miscTags: string[] = []
  private _artistsTags: string[] = []
  private _groupsTags: string[] = []
  private _curDoujinshiPath: string = ''
  private _doujinshiMetaPath: string = ''

  constructor(doujinshiName: string) {
    this._doujinshiName = doujinshiName
    this._curDoujinshiPath = path.join(DoujinshiPath, doujinshiName)
    this._doujinshiMetaPath = path.join(DoujinshiPath, doujinshiName, '_meta')
  }

  get doujinshiMetaPath() {
    return this._doujinshiMetaPath
  }

  public async getImages(pages: [number, number]) {
    await this._getAllImageTitle()

    return Promise.all(
      this._pageTitleList.slice(pages[0], pages[1]).map(async d => {
        const imagePath = path.join(this._curDoujinshiPath, d)

        const coverBuffer = await fs.readFileSync(imagePath)
        return `data:image/${path
          .extname(imagePath)
          .slice(1)};base64,${coverBuffer.toString('base64')}`
      })
    )
  }

  public async getData() {
    const json = await fs.readFileSync(path.join(this._doujinshiMetaPath, 'data.json'), 'utf-8')
    const data = JSON.parse(json) as IDoujinshiData
    return data
  }

  public async createNewMeta() {
    // create meta folder
    await fs.mkdirSync(this._doujinshiMetaPath, { recursive: true })
    const data = parseTitle(this._doujinshiName)
    this._miscTags = data.misc
    this._artistsTags = data.artists
    this._groupsTags = data.groups
    await this._getAllImageTitle()
    await this._copyCoverImage()
    // create meta's data.json
    await fs.writeFileSync(
      path.join(this._doujinshiMetaPath, 'data.json'),
      JSON.stringify(this._getDefaultGameData(), null, 2),
      'utf-8'
    )
  }

  public async getMeta() {
    const dirs = await fs.readdirSync(this._doujinshiMetaPath)
    const coverName = dirs.find(dir => imgExt.includes(path.extname(dir))) || null

    return {
      root: this._curDoujinshiPath,
      coverName: coverName || '',
    } satisfies IDoujinshiMeta['meta']
  }

  private async _getAllImageTitle() {
    this._pageTitleList = await fs
      .readdirSync(this._curDoujinshiPath)
      .filter(t => fs.statSync(path.join(this._curDoujinshiPath, t)).isFile())
      .filter(t => imgExt.includes(path.extname(t).toLocaleLowerCase()))
  }

  private async _copyCoverImage() {
    const titles = this._pageTitleList.sort()

    if (titles.length === 0) return

    const ext = path.extname(titles[0]).toLocaleLowerCase()
    if (imgExt.includes(ext)) {
      const srcPath = path.join(this._curDoujinshiPath, titles[0])
      const destPath = path.join(this._doujinshiMetaPath, `cover${ext}`)
      await fs.copyFileSync(srcPath, destPath)
    }
  }

  // default meta data
  private _getDefaultGameData() {
    return {
      id: nanoid(),
      page: this._pageTitleList,
      name: this._doujinshiName,
      type: 'Doujinshi',
      male: [],
      female: [],
      artist: this._artistsTags,
      group: this._groupsTags,
      language: [],
      misc: this._miscTags,
      character: [],
      parody: [],
    } satisfies IDoujinshiData
  }
}
