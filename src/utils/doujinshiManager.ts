import path from 'path'
import fs from 'fs'
import { DoujinshiPath } from '@/constants/env'
import { nanoid } from 'nanoid'
import { imgExt } from '@/constants'

function parseTitle(str: string) {
  const result: IDoujinshiData = {
    id: '',
    misc: [],
    artists: [],
    groups: [],
    title: str.trim(),
    series: [],
    types: '',
    language: [],
    charactors: [],
    pages: [],
    male: [],
    female: [],
    fullTitle: '',
  }

  const processStr = (s: string) =>
    s
      .split(',')
      .map(p => p.trim())
      .filter(Boolean)
      .map(p => p.toLowerCase())

  const extractResult = ({
    id = '',
    groups = '',
    artists = '',
    misc = '',
    type = 'doujinshi',
    series = '',
    language = '',
    title = '',
  }: {
    id?: string
    groups?: string
    artists?: string
    misc?: string
    type?: string
    series?: string
    language?: string
    title?: string
  }) => {
    if (misc) result.misc = processStr(misc)
    if (artists) result.artists = processStr(artists)
    if (groups) result.groups = processStr(groups)
    if (id) result.id = id
    if (type) result.types = type.trim().toLowerCase()
    if (series) result.series = processStr(series)
    if (language) result.language = processStr(language)
    result.fullTitle = str.trim()
    result.title = title
    return result
  }

  const patterns: [RegExp, (...groups: string[]) => typeof result][] = [
    // [id][groups(artists)][type(series)]title(language)
    [
      /^\[(\d+)\]\[(.+?)\((.+?)\)\]\[(.+?)\((.+?)\)\](.+?)\(([^()]+)\)$/,
      (id, groups, artists, type, series, title, language) =>
        extractResult({ artists, groups, id, type, series, language, title }),
    ],

    // (misc) [groups(artists)] title
    [
      /^\(([^)]+)\)\s+\[([^(]+)\(([^)]+)\)\](.+)$/,
      (misc, groups, artists, title) => extractResult({ misc, artists, groups, title }),
    ],

    // (misc) [artists] title
    [
      /^\(([^)]+)\)\s+\[([^\]]+)\](.+)$/,
      (misc, artists, title) => extractResult({ misc, artists, title }),
    ],

    // (misc) title
    [/^\(([^)]+)\)(.+)$/, (misc, title) => extractResult({ misc, title })],

    // [groups(artists)] title
    [
      /^\[([^\(]+)\(([^)]+)\)\](.+)$/,
      (groups, artists, title) => extractResult({ artists, groups, title }),
    ],

    // [artists] title
    [/^\[([^\]]+)\](.+)$/, (artists, title) => extractResult({ artists, title })],
  ]

  for (const [regex, handler] of patterns) {
    const match = str.match(regex)
    if (match) return handler(...match.slice(1))
  }

  // fallback
  return result
}

export class DoujinshiManager {
  // private _doujinshiName: string = ''
  private _pageTitleList: string[] = []
  private _curDoujinshiPath: string = ''
  private _doujinshiMetaPath: string = ''
  private _doujinshiData: IDoujinshiData = {
    id: '',
    title: '',
    fullTitle: '',
    groups: [],
    artists: [],
    misc: [],
    types: 'Doujinshi',
    series: [],
    language: [],
    charactors: [],
    male: [],
    female: [],
    pages: [],
  }

  constructor(doujinshiName: string) {
    this._doujinshiData.fullTitle = doujinshiName
    this._curDoujinshiPath = path.join(DoujinshiPath, doujinshiName)
    this._doujinshiMetaPath = path.join(DoujinshiPath, doujinshiName, '_meta')
  }

  get doujinshiMetaPath() {
    return this._doujinshiMetaPath
  }

  public async getData() {
    const json = await fs.readFileSync(path.join(this._doujinshiMetaPath, 'data.json'), 'utf-8')
    const data = JSON.parse(json) as IDoujinshiData
    return data
  }

  public async getMeta() {
    const dirs = await fs.readdirSync(this._doujinshiMetaPath)
    const coverName = dirs.find(dir => imgExt.includes(path.extname(dir))) || null

    return {
      root: this._curDoujinshiPath,
      coverName: coverName || '',
    } satisfies IDoujinshiMeta['meta']
  }

  public async createNewMeta() {
    // create meta folder
    await fs.mkdirSync(this._doujinshiMetaPath, { recursive: true })

    if (fs.existsSync(path.join(this._curDoujinshiPath, 'info.txt'))) {
      this._parseInfo()
    } else {
      this._parseFolderTitle()
    }

    await this._getAllImageTitle()
    await this._copyCoverImage()
    // create meta's data.json
    await fs.writeFileSync(
      path.join(this._doujinshiMetaPath, 'data.json'),
      JSON.stringify(this._getDefaultGameData(), null, 2),
      'utf-8'
    )
  }

  public async renewMeta() {
    if (fs.existsSync(path.join(this._curDoujinshiPath, 'info.txt'))) {
      await this._parseInfo()
    } else {
      await this._parseFolderTitle()
    }

    await this._getAllImageTitle()

    await fs.writeFileSync(
      path.join(this._doujinshiMetaPath, 'data.json'),
      JSON.stringify(this._getDefaultGameData(), null, 2),
      'utf-8'
    )
  }

  private async _parseInfo() {
    const dataStr = await fs.readFileSync(`${this._curDoujinshiPath}/info.txt`, 'utf-8')
    const lines = dataStr.trim().split('\n')
    let meta: any = {
      id: '',
      title: '',
      artists: [],
      groups: [],
      types: '',
      series: [],
      charactors: [],
      language: [],
      male: [],
      female: [],
      misc: [],
    }

    for (const line of lines) {
      const [key, ...rest] = line.trim().toLocaleLowerCase().split(':')
      const value = rest.join(':').trim()

      if (!key) continue

      if (value === 'n/a') {
        continue
      } else if (key === 'tags') {
        const valueLines = value.split(',')
        for (const valueLine of valueLines) {
          const [k, ...r] = valueLine.trim().split(':')
          const v = r.join(',')
          if (!v) {
            meta['misc'].push(k)
          } else if (typeof meta[k] === 'string') {
            meta[k] = v
          } else {
            meta[k].push(v)
          }
        }
      } else if (key === 'gallery id') {
        meta['id'] = value
      } else if (typeof meta[key] === 'string') {
        meta[key] = value
      } else if (Object.keys(meta).includes(key)) {
        meta[key] = value.split(',')
      }
    }

    this._doujinshiData = {
      ...this._doujinshiData,
      ...meta,
    }

    // console.log(this._doujinshiData)
  }

  private async _parseFolderTitle() {
    const data = parseTitle(this._doujinshiData.fullTitle ?? '')
    this._doujinshiData = { ...this._doujinshiData, ...data }
    console.log(this._doujinshiData)
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
    const s = {
      ...this._doujinshiData,
      id: this._doujinshiData.id || nanoid(),
      pages: this._pageTitleList,
    } satisfies IDoujinshiData
    console.log(s)
    return s
  }
}
