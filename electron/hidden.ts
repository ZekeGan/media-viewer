import { spawn } from 'node:child_process'
import path from 'node:path'
import { DATA_DIR } from '../shared/model'
import { message, safePath } from './files'

// Read attributes once per directory listing. This does not change files or scan rules.
export async function hiddenFileNames(directory: string): Promise<Set<string>> {
  if (process.platform !== 'win32') return new Set()
  const source = `[Console]::InputEncoding = New-Object System.Text.UTF8Encoding($false)
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
$ErrorActionPreference = 'Stop'
try {
  $directory = ConvertFrom-Json ([Console]::In.ReadToEnd())
  $names = @((New-Object IO.DirectoryInfo($directory)).GetFileSystemInfos() | Where-Object { $_.Attributes -band ([IO.FileAttributes]::Hidden -bor [IO.FileAttributes]::System) } | ForEach-Object { $_.Name })
  ConvertTo-Json -InputObject $names -Compress
} catch { [Console]::Error.WriteLine($_.Exception.Message); exit 1 }`
  const output = await new Promise<string>((resolve, reject) => {
    const executable = path.join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe')
    const child = spawn(executable, ['-NoLogo', '-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(source, 'utf16le').toString('base64')], { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] })
    let stdout = '', stderr = ''
    const timer = setTimeout(() => { child.kill(); reject(new Error('讀取隱藏屬性逾時')) }, 15000)
    child.stdout.setEncoding('utf8').on('data', chunk => { stdout += chunk; if (stdout.length > 8 * 1024 * 1024) { child.kill(); reject(new Error('隱藏屬性清單過大')) } })
    child.stderr.setEncoding('utf8').on('data', chunk => { stderr = (stderr + chunk).slice(-2000) })
    child.on('error', error => { clearTimeout(timer); reject(error) })
    child.on('close', code => { clearTimeout(timer); code === 0 ? resolve(stdout) : reject(new Error(stderr || '無法讀取隱藏屬性')) })
    child.stdin.on('error', reject)
    child.stdin.end(JSON.stringify(directory))
  })
  const names: unknown = JSON.parse(output.replace(/^\uFEFF/, ''))
  if (!Array.isArray(names) || !names.every(name => typeof name === 'string')) throw new Error('隱藏屬性結果不合法')
  return new Set(names)
}

// Paths are data on stdin, never interpolated into PowerShell source or wildcards.
const script = `
$ErrorActionPreference = 'Stop'
[Console]::InputEncoding = New-Object System.Text.UTF8Encoding($false)
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
$paths = ConvertFrom-Json ([Console]::In.ReadToEnd())
$failures = @()
foreach ($item in $paths) {
  try {
    $attrs = [IO.File]::GetAttributes($item)
    if (($attrs -band [IO.FileAttributes]::ReparsePoint) -or -not ($attrs -band [IO.FileAttributes]::Directory)) {
      throw 'Metadata path is not a regular directory'
    }
    if (-not ($attrs -band [IO.FileAttributes]::Hidden)) {
      [IO.File]::SetAttributes($item, ($attrs -bor [IO.FileAttributes]::Hidden))
    }
  } catch { $failures += @{ path = $item; error = $_.Exception.Message } }
}
ConvertTo-Json -InputObject @($failures) -Compress
`

export async function hideDirectories(dirs: string[]): Promise<{ dir: string; error: string }[]> {
  if (process.platform !== 'win32' || !dirs.length) return []
  const failures: { dir: string; error: string }[] = [], paths: string[] = []
  for (const dir of dirs) {
    try { const meta = path.join(dir, DATA_DIR); await safePath(dir, meta); paths.push(meta) }
    catch (error) { failures.push({ dir, error: message(error) }) }
  }
  if (!paths.length) return failures
  try {
    const output = await new Promise<string>((resolve, reject) => {
      const executable = path.join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe')
      const child = spawn(executable, ['-NoLogo', '-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(script, 'utf16le').toString('base64')], { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] })
      let stdout = '', stderr = ''
      const timer = setTimeout(() => { child.kill(); reject(new Error('設定隱藏屬性逾時')) }, 30000)
      child.stdout.setEncoding('utf8').on('data', chunk => { stdout += chunk })
      child.stderr.setEncoding('utf8').on('data', chunk => { stderr += chunk })
      child.on('error', error => { clearTimeout(timer); reject(error) })
      child.on('close', code => { clearTimeout(timer); code === 0 ? resolve(stdout) : reject(new Error(stderr || `隱藏屬性程序退出：${code}`)) })
      child.stdin.on('error', reject)
      child.stdin.end(JSON.stringify(paths))
    })
    const reported: { path: string; error: string }[] = JSON.parse(output.replace(/^\uFEFF/, ''))
    failures.push(...reported.map(item => ({ dir: path.dirname(item.path), error: item.error })))
  } catch (error) { failures.push(...paths.map(meta => ({ dir: path.dirname(meta), error: message(error) }))) }
  return failures
}
