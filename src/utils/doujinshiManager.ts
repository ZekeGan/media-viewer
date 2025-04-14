import path from 'path'
import fs from 'fs'
import { DoujinshiPath } from '@/constants/env'
import { nanoid } from 'nanoid'
import { imgExt } from '@/constants'

function parseTitle(str: string) {
  const result = {
    other: [''],
    artists: [''],
    groups: [''],
    name: str.trim(),
  }

  // 1. (<type>) [<author>(<groups>)] <name>
  const fullWithGroups = str.match(/^\(([^)]+)\)\s+\[([^(]+)\(([^)]+)\)\](.+)$/)
  if (fullWithGroups) {
    result.other = fullWithGroups[1].split(',').map(s => s.trim())
    result.artists = fullWithGroups[2].split(',').map(s => s.trim())
    result.groups = fullWithGroups[3].split(',').map(s => s.trim())
    result.name = fullWithGroups[4].trim()
    return result
  }

  // 優先解析完整格式: (<type>) [<author>] <name>
  const fullMatch = str.match(/^\(([^)]+)\)\s+\[([^\]]+)\](.+)$/)
  if (fullMatch) {
    result.other = fullMatch[1].split(',').map(s => s.trim())
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
    result.other = typeMatch[1].split(',').map(s => s.trim())
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

  public async getAllImages() {
    await this._getAllImageTitle()
    console.log(this._pageTitleList)

    return Promise.all(
      this._pageTitleList.map(async d => {
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
    const data = JSON.parse(json) as IGameData
    return data
  }

  public async createNewMeta() {
    // create meta folder
    await fs.mkdirSync(this._doujinshiMetaPath, { recursive: true })
    const data = parseTitle(this._doujinshiName)
    this._miscTags = data.other
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

  public async getCover() {
    const dirs = await fs.readdirSync(this._doujinshiMetaPath)
    // get name of cover with extname
    const coverName = dirs.find(dir => imgExt.includes(path.extname(dir))) || null
    if (coverName) {
      const coverPath = path.join(this._doujinshiMetaPath, coverName)
      const coverBuffer = await fs.readFileSync(coverPath)
      return `data:image/${path
        .extname(coverPath)
        .slice(1)};base64,${coverBuffer.toString('base64')}`
    } else {
      return ''
    }
  }

  private async _getAllImageTitle() {
    this._pageTitleList = await fs
      .readdirSync(this._curDoujinshiPath)
      .filter(t => fs.statSync(path.join(this._curDoujinshiPath, t)).isFile())
  }

  private async _copyCoverImage() {
    const titles = this._pageTitleList.sort()
    console.log(titles)

    if (titles.length === 0) return

    const ext = path.extname(titles[0])
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
      page: this._pageTitleList.length,
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
