import {_electron as electron} from 'playwright-core'
import fs from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'
import {execFile} from 'node:child_process'
import {promisify} from 'node:util'
import {Library} from '../electron/library'
const base=path.resolve('.test-output');await fs.mkdir(base,{recursive:true})
const root=await fs.mkdtemp(path.join(base,'media-ui-')),local=path.join(root,'local'),album=path.join(root,'Album'),video=path.join(root,'Video')
for(const dir of [album,video])await fs.mkdir(dir)
const exec=promisify(execFile)
for(let i=0;i<3;i++)await exec('ffmpeg',['-v','error','-f','lavfi','-i',`color=c=${['#526c85','#ac997f','#758576'][i]}:s=${['100x160','180x100','80x200'][i]}`,'-frames:v','1',path.join(album,`00${i}.png`)],{windowsHide:true})
for(let i=3;i<60;i++)await fs.copyFile(path.join(album,`00${i%3}.png`),path.join(album,String(i).padStart(3,'0')+'.png'))
await exec('ffmpeg',['-v','error','-f','lavfi','-i','testsrc=size=106x162:rate=3','-t','1','-loop','0',path.join(album,'000-motion.gif')],{windowsHide:true})
for(const [index,format]of ['webp','bmp','avif','ico'].entries())await exec('ffmpeg',['-v','error','-i',path.join(album,'000.png'),'-vf','scale=32:32','-frames:v','1',path.join(album,`09${index}.${format}`)],{windowsHide:true})
await exec('ffmpeg',['-v','error','-f','lavfi','-i','color=c=blue:s=160x90:r=12','-f','lavfi','-i','sine=frequency=400:sample_rate=44100','-t','15','-c:v','libx264','-pix_fmt','yuv420p','-c:a','aac',path.join(video,'first.mp4')],{windowsHide:true})
await fs.copyFile(path.join(video,'first.mp4'),path.join(video,'second.mp4'))
await fs.writeFile(path.join(video,'first.srt'),'1\n00:00:00,000 --> 00:00:15,000\nSubtitle fixture\n')
const library=new Library(local,undefined,false);await library.init();const input={depth:{mode:'through' as const,level:1},scanAll:true}
await library.create(album,{...input,name:'Album test',mediaCategory:'album'});await library.create(video,{...input,name:'Video test',mediaCategory:'video'})
const env=Object.fromEntries(Object.entries({...process.env,MEDIA_VIEWER_TEST_DATA:local}).filter((entry):entry is [string,string]=>entry[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE
const app=await electron.launch({args:['.'],env,timeout:30000}),page=await app.firstWindow(),errors:string[]=[]
page.setDefaultTimeout(12000);page.on('pageerror',error=>errors.push(error.message));await page.evaluate('window.__name=(target)=>target')
const open=async(name:string)=>{await page.getByRole('button',{name:'開啟專案 '+name,exact:true}).first().click()}
try{
 await app.evaluate(({BrowserWindow})=>{const win=BrowserWindow.getAllWindows()[0];win.show();win.focus()});await page.bringToFront()
 await open('Video test');await page.locator('.video-stage video').waitFor();await page.waitForFunction(()=>{const v=document.querySelector('video');return v&&!v.paused&&v.currentTime>.1})
 const settingsIcon=page.getByRole('button',{name:'影片設定',exact:true})
 assert.equal((await settingsIcon.innerText()).trim(),'');assert.equal(await settingsIcon.locator('svg').count(),1);assert.equal(await page.locator('.video-stage .video-options').count(),0)
 await settingsIcon.click();await page.getByRole('menuitem',{name:'字幕設定',exact:true}).click()
 const subtitleSettings=page.getByRole('dialog',{name:'字幕設定',exact:true});await subtitleSettings.waitFor();await subtitleSettings.getByRole('button',{name:'first.srt',exact:true}).click();await subtitleSettings.getByLabel('延後秒數（正值＝晚出現）',{exact:true}).fill('0.5');await subtitleSettings.getByRole('button',{name:'保存字幕設定',exact:true}).click()
 await page.waitForFunction(async()=>{const state=await window.media.request({action:'snapshot'});return state.snapshot.rows.filter(row=>row.projectId===state.snapshot.projects.find(p=>p.project?.name==='Video test')?.projectId).some(row=>Object.values(row.record?.details?.playback??{}).some(playback=>Object.values(playback.settings??{}).some(settings=>settings.offset===.5)))})
 await page.keyboard.press('Escape');await subtitleSettings.waitFor({state:'hidden'});await settingsIcon.click();await page.getByRole('menuitem',{name:'字幕設定',exact:true}).click();await subtitleSettings.waitFor();assert.equal(await subtitleSettings.getByLabel('延後秒數（正值＝晚出現）',{exact:true}).inputValue(),'0.5');await page.keyboard.press('Escape');await subtitleSettings.waitFor({state:'hidden'})
 await page.evaluate('window.detachedVideo=document.querySelector("video")')
 await open('Album test');await page.locator('.masonry-gallery').waitFor();await page.waitForFunction(()=>{const video=(window as any).detachedVideo;return video.paused&&!video.getAttribute('src')&&!document.querySelector('video')})
 await page.evaluate('window.detachedVideo.dispatchEvent(new Event("loadedmetadata"))');await page.waitForTimeout(400);assert.equal(await page.evaluate('(window.detachedVideo.paused)'),true)
 await open('Video test');await page.waitForFunction(()=>{const v=document.querySelector('video');return v&&!v.paused})
 await page.getByRole('button',{name:'影片設定',exact:true}).click();await page.getByRole('menuitem',{name:'關閉自動播放',exact:true}).click()
 await page.waitForFunction(async()=>{const state=await window.media.request({action:'snapshot'});return state.snapshot.projects.find(p=>p.project?.name==='Video test')?.project?.videoAutoplay===false})
 await open('Album test');await open('Video test');await page.waitForFunction(()=>{const v=document.querySelector('video');return v&&v.readyState>=1});await page.waitForTimeout(400);assert.equal(await page.locator('video').evaluate(v=>(v as HTMLVideoElement).paused),true)
 await page.getByRole('button',{name:'播放 second.mp4',exact:true}).click();await page.waitForFunction(()=>{const v=document.querySelector('video');return v&&!v.paused&&v.currentTime>.1})
 await page.getByRole('button',{name:'關閉資料夾內容',exact:true}).click();assert.equal(await page.locator('video').count(),0)
 await page.getByRole('button',{name:'切換右側內容',exact:true}).click();await page.waitForFunction(()=>{const v=document.querySelector('video');return v&&v.readyState>=1});assert.equal(await page.locator('video').evaluate(v=>(v as HTMLVideoElement).paused),true)
 await page.getByRole('button',{name:'影片設定',exact:true}).click();await page.getByRole('menuitem',{name:'開啟後自動播放',exact:true}).click();await open('Album test');await open('Video test');await page.waitForFunction(()=>{const v=document.querySelector('video');return v&&!v.paused})
 await open('Album test');await page.locator('.masonry-gallery .media-thumbnail').first().waitFor()
 assert.ok(await page.locator('.masonry-gallery .media-thumbnail img').count()<35)
 // Load all bounded thumbnails once, then scroll past them and back. Natural image
 // slots must remain stable; the former visibility placeholder changed both modes.
 await page.locator('.masonry-gallery img').evaluateAll(images=>images.forEach(image=>(image as HTMLImageElement).loading='eager'))
 await page.waitForFunction(()=>[...document.querySelectorAll('.masonry-gallery img')].every(image=>(image as HTMLImageElement).complete&&(image as HTMLImageElement).naturalWidth>0))
 const animated=page.locator('.masonry-gallery .media-thumbnail[title="000-motion.gif"]'),galleryScroll=page.locator('.folder-panel-body')
 await galleryScroll.evaluate(element=>element.scrollTop=0);await page.waitForFunction(()=>document.querySelector('.media-thumbnail[title="000-motion.gif"] img')?.getAttribute('src')?.startsWith('media://file/'))
 const slotHeight=(await animated.boundingBox())!.height
 await galleryScroll.evaluate(element=>element.scrollTop=element.scrollHeight);await page.waitForFunction(()=>{const image=document.querySelector('.media-thumbnail[title="000-motion.gif"] img');return !image||image.getAttribute('src')?.startsWith('media://thumb/')})
 await page.waitForTimeout(200);await galleryScroll.evaluate(element=>element.scrollTop=element.scrollHeight)
 await page.waitForFunction(()=>['webp','bmp','avif','ico'].every((format,index)=>{const image=document.querySelector<HTMLImageElement>(`.media-thumbnail[title="09${index}.${format}"] img`);return image?.complete&&image.naturalWidth>0&&image.getAttribute('src')?.startsWith('media://thumb/')}))
 await galleryScroll.evaluate(element=>element.scrollTop=0);await animated.waitFor();assert.ok(Math.abs((await animated.boundingBox())!.height-slotHeight)<1)
 await galleryScroll.evaluate(element=>element.scrollTop=0);await animated.click();await page.getByRole('dialog',{name:'圖片檢視',exact:true}).waitFor();await page.waitForFunction(()=>document.querySelector('.media-thumbnail[title="000-motion.gif"] img')?.getAttribute('src')?.startsWith('media://thumb/'));await page.keyboard.press('Escape')
 await page.getByRole('dialog',{name:'圖片檢視',exact:true}).waitFor({state:'hidden'})
 for(const mode of ['瀑布流','列表']){
  await page.getByText(mode,{exact:true}).click();await page.waitForTimeout(100)
  const scroll=page.locator('.folder-panel-body');await scroll.evaluate(element=>element.scrollTop=0)
  await page.waitForFunction(()=>[...document.querySelectorAll('.gallery .media-thumbnail img')].every(image=>(image as HTMLImageElement).complete&&(image as HTMLImageElement).naturalWidth>0));await page.waitForTimeout(100)
  const measure=()=>page.locator('.gallery .media-thumbnail').evaluateAll(elements=>{const port=document.querySelector('.folder-panel-body')!.getBoundingClientRect();return elements.map(element=>({id:element.getAttribute('title'),top:element.getBoundingClientRect().top,height:element.getBoundingClientRect().height})).filter(item=>item.top+item.height>port.top&&item.top<port.bottom)})
  const before=await measure();await scroll.evaluate(element=>element.scrollTop=element.scrollHeight);await page.waitForTimeout(200);await scroll.evaluate(element=>element.scrollTop=0);await page.waitForTimeout(200)
  const after=await measure();assert.ok(before.length>0);for(const original of before){const item=after.find(item=>item.id===original.id);assert.ok(item,`${mode} retains visible ${original.id}`);assert.ok(Math.abs(item.height-original.height)<1,`${mode} height ${original.id}`);assert.ok(Math.abs(item.top-original.top)<1,`${mode} top ${original.id}`)}
 }
 await page.getByRole('button',{name:'開啟搜尋',exact:true}).click();const search=page.getByRole('dialog',{name:'搜尋資料夾',exact:true});await search.waitFor()
 const query=search.getByRole('textbox',{name:'資料夾名稱、路徑或欄位值',exact:true});await query.fill('Album');await page.waitForFunction(()=>document.querySelector('.search-results')?.getAttribute('aria-busy')==='false');assert.equal(await search.locator('.search-results>button').count(),1)
 assert.equal(await search.getByText('進階搜尋與索引',{exact:true}).evaluate(element=>(element.parentElement as HTMLDetailsElement).open),false)
 await search.getByRole('textbox',{name:'搜尋範圍',exact:true}).click();await page.getByRole('option',{name:'全部已連結專案',exact:true}).click();await query.fill('Video');await page.waitForFunction(()=>document.querySelector('.search-results')?.getAttribute('aria-busy')==='false');await search.locator('.search-results>button').filter({hasText:'Video'}).click();await search.waitFor()
 await page.screenshot({path:path.join(root,'search.png')});await search.getByRole('button',{name:'開啟資料夾',exact:true}).click();await search.waitFor({state:'hidden'});await page.locator('.video-panel').waitFor()
 assert.deepEqual(errors,[]);console.log('PASS: autoplay preference and persistence, explicit play, disposal on project/pane changes and late media events; stable masonry/list after scrolling; search scope, selection and opening. Artifacts: '+root)
}catch(error){await page.screenshot({path:path.join(root,'failure.png')}).catch(()=>{});console.error('Artifacts: '+root);console.error(await page.evaluate(()=>({hidden:document.hidden,video:[...document.querySelectorAll('video')].map(video=>({paused:video.paused,time:video.currentTime,ready:video.readyState,error:video.error?.message})),alerts:[...document.querySelectorAll('[role=alert]')].map(element=>element.textContent)})));throw error}finally{await app.evaluate(({BrowserWindow})=>{for(const win of BrowserWindow.getAllWindows()){win.removeAllListeners('close');win.webContents.removeAllListeners('will-prevent-unload');win.webContents.on('will-prevent-unload',event=>event.preventDefault())}});await app.close()}

