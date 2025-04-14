import path from 'path'
import fs from 'fs'
import { GamePath } from '@/constants/env'
import { nanoid } from 'nanoid'
import { imgExt } from '@/constants'

export class GameManager {
  private _gameName: string = ''
  private _curGamePath: string = ''
  private _gameMetaPath: string = ''

  constructor(gameName: string) {
    this._gameName = gameName
    this._curGamePath = path.join(GamePath, gameName)
    this._gameMetaPath = path.join(GamePath, gameName, '_meta')
  }

  get gameMetaPath() {
    return this._gameMetaPath
  }

  public async getData() {
    const json = await fs.readFileSync(path.join(this._gameMetaPath, 'data.json'), 'utf-8')
    const data = JSON.parse(json) as IGameData
    return { ...data, folder_path: this._curGamePath }
  }

  public async getCover() {
    const dirs = await fs.readdirSync(this._gameMetaPath)
    // get name of cover with extname
    const coverName = dirs.find(dir => imgExt.includes(path.extname(dir))) || null
    if (coverName) {
      const coverPath = path.join(this._gameMetaPath, coverName)
      const coverBuffer = await fs.readFileSync(coverPath)
      return `data:image/${path
        .extname(coverPath)
        .slice(1)};base64,${coverBuffer.toString('base64')}`
    } else {
      return ''
    }
  }

  public async createNewMeta() {
    // create meta folder
    await fs.mkdirSync(this._gameMetaPath, { recursive: true })
    // create meta's data.json
    await fs.writeFileSync(
      path.join(this._gameMetaPath, 'data.json'),
      JSON.stringify(this._getDefaultGameData(), null, 2),
      'utf-8'
    )
  }

  // default meta data
  private _getDefaultGameData() {
    return {
      id: nanoid(),
      game_name: this._gameName,
      game_url: '',
      tags: [],
      author: 'undefined',
      author_from: 'undefined',
      isDynamic: 'static',
      isCensored: 'censored',
      folder_path: this._curGamePath,
    } satisfies IGameData
  }
}
