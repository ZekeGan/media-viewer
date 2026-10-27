import {test} from 'node:test'
import assert from 'node:assert/strict'
import {metadata,steamMetadata} from '../electron/metadata'
const payload=(overrides:Record<string,unknown>={})=>({'620':{success:true,data:{steam_appid:620,name:'Portal &amp; Test',type:'game',developers:['Valve'],publishers:['Valve'],genres:[{description:'Puzzle'}],short_description:'<b>Test</b>',release_date:{coming_soon:false,date:'18 Apr, 2011'},header_image:'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/620/header.jpg',...overrides}}})
test('Steam accepts official URL/App ID, keeps store date semantics and limits image hosts',async()=>{
 const requests:string[]=[]
 const fetcher=(async(input:RequestInfo|URL,init?:RequestInit)=>{const url=String(input);requests.push(url);assert.equal(init?.redirect,'error');return url.includes('/api/appdetails')?new Response(JSON.stringify(payload())):new Response(Buffer.from([255,216,255,0]))}) as typeof fetch
 const result=await metadata('620',fetcher)
 assert.equal(result.preview.provider,'steam');assert.equal(result.preview.title,'Portal & Test')
 assert.equal(result.preview.source,'https://store.steampowered.com/app/620/')
 assert.equal(result.preview.values.find(v=>v.key==='STORE_RELEASE_DATE')?.value,'18 Apr, 2011')
 assert.equal(result.preview.values.find(v=>v.key==='DESCRIPTION')?.value,'Test');assert.ok(result.cover)
 assert.ok(requests[0].includes('appids=620&l=english'))
 await steamMetadata('https://store.steampowered.com/app/620/Portal_2/?l=schinese',fetcher)
 for(const url of ['https://store.steampowered.com.evil.test/app/620/','http://store.steampowered.com/app/620/','https://user:pass@store.steampowered.com/app/620/','https://store.steampowered.com:444/app/620/','https://store.steampowered.com/sub/620/','0','4294967296']){
  const count=requests.length;await assert.rejects(steamMetadata(url,fetcher));assert.equal(requests.length,count)
 }
})
test('Steam rejects unavailable/mismatched/oversized replies and treats blocked cover as optional',async()=>{
 for(const data of [{'620':{success:false}},payload({steam_appid:999}),payload({name:''})])await assert.rejects(steamMetadata('620',(async()=>new Response(JSON.stringify(data))) as typeof fetch))
 await assert.rejects(steamMetadata('620',(async()=>new Response('{}',{status:429})) as typeof fetch),/HTTP 429/)
 await assert.rejects(steamMetadata('620',(async()=>new Response('{}',{headers:{'content-length':String(3*1024*1024)}})) as typeof fetch),/過大/)
 const requested:string[]=[]
 const result=await steamMetadata('620',(async(input:RequestInfo|URL)=>{requested.push(String(input));return new Response(JSON.stringify(payload({header_image:'https://untrusted.test/private.jpg',release_date:{coming_soon:true,date:'Coming soon'}})))}) as typeof fetch)
 assert.equal(requested.length,1);assert.equal(result.cover,undefined)
 assert.equal(result.preview.values.find(v=>v.key==='RELEASE_STATUS')?.value,'尚未發售')
 assert.ok(result.preview.values.some(v=>v.key==='COVER_STATUS'))
})
