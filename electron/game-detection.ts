import fs from 'node:fs/promises'
import path from 'node:path'
import { safePath } from './files'
export async function detectGame(dir: string): Promise<{ engines: string[]; evidence: string[] } | undefined> {
  const list = await fs.readdir(dir, { withFileTypes: true }), names = new Set(list.filter(e => !e.isSymbolicLink()).map(e => e.name.toLowerCase()))
  const exe = [...names].some(n => n.endsWith('.exe')), engines: string[] = [], evidence: string[] = []
  if (!exe) return undefined
  async function probe(rel: string) { const file = path.join(dir, rel); await safePath(dir, file); try { return (await fs.readdir(file)).slice(0, 10000).map(n => n.toLowerCase()) } catch (e) { if (['ENOENT','ENOTDIR'].includes((e as NodeJS.ErrnoException).code ?? '')) return []; throw e } }
  const add = (name: string, reason: string) => { engines.push(name); evidence.push(reason) }
  if (exe && names.has('unityplayer.dll') && [...names].some(n => n.endsWith('_data'))) add('Unity', 'EXE + UnityPlayer.dll + *_Data')
  if (exe && ([...names].some(n => n.endsWith('.pck')) || names.has('godot.windows.opt.tools.64.exe'))) add('Godot', 'EXE + PCK（單檔版需人工標記）')
  const js = [...await probe('js'), ...await probe('www/js')]
  if (exe && js.includes('rmmz_core.js')) add('RPG Maker MZ', 'rmmz_core.js + EXE')
  else if (exe && js.includes('rpg_core.js')) add('RPG Maker MV', 'rpg_core.js + EXE')
  if (exe && ['game.rgssad','game.rgss2a','game.rgss3a'].some(n => names.has(n))) add('RPG Maker XP/VX/Ace', 'RGSS archive + EXE')
  if (exe && names.has('rpg_rt.ldb') && names.has('rpg_rt.lmt')) add('RPG Maker 2000/2003', 'LDB + LMT + EXE')
  if (exe && (names.has('engine') || names.has('binaries')) && ((await probe('Content/Paks')).some(n => /\.(pak|utoc)$/.test(n)) || (await probe('Binaries/Win64')).some(n => n.endsWith('.exe')))) add('Unreal', 'EXE + Engine/Binaries + packaged content')
  if (exe && names.has('renpy') && (await probe('game')).some(n => /\.(rpy|rpyc|rpa)$/.test(n))) add('Ren’Py', 'renpy + game archive/scripts + EXE')
  if (exe && [...names].some(n => n.endsWith('.xp3'))) add('KiriKiri', 'EXE + XP3（需確認是否遊戲）')
  if (exe && names.has('tyrano') && names.has('data')) add('TyranoScript', 'tyrano + data + EXE')
  if (exe && names.has('data.wolf')) add('WOLF RPG', 'EXE + Data.wolf')
  if (exe && names.has('data.win')) add('GameMaker', 'EXE + data.win（YYC 需人工標記）')
  if (exe && names.has('game.arcd') && names.has('game.arci')) add('Defold', 'EXE + game.arcd + game.arci')
  if (exe && (names.has('love.dll') && [...names].some(n => n.endsWith('.love')))) add('LÖVE', 'EXE + love.dll + .love')
  if (exe && names.has('resources') && names.has('cocos2d.dll')) add('Cocos', 'EXE + cocos2d.dll + resources')
  if (exe && (await probe('www')).includes('c2runtime.js')) add('Construct', 'EXE + c2runtime.js')
  return engines.length ? { engines, evidence } : undefined
}
