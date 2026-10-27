export interface Cue { start:number;end:number;text:string }
export function parseSubtitles(input:string):Cue[] {
  if(input.length>5*1024*1024)throw new Error('字幕過大')
  const time=(value:string)=>{const parts=value.replace(',','.').split(':').map(Number);if(parts.length<2||parts.length>3||parts.some(n=>!Number.isFinite(n)||n<0))throw new Error('字幕時間格式不合法');return parts.length===3?parts[0]*3600+parts[1]*60+parts[2]:parts[0]*60+parts[1]}
  const lines=input.replace(/^\uFEFF/,'').replace(/\r/g,'').split('\n'),cues:Cue[]=[]
  for(let i=0;i<lines.length;i++){
    const match=/^\s*([\d:.,]+)\s+-->\s+([\d:.,]+)(?:\s.*)?$/.exec(lines[i]);if(!match)continue
    const text:string[]=[];while(i+1<lines.length&&lines[i+1].trim())text.push(lines[++i]);const start=time(match[1]),end=time(match[2]);if(end<=start)throw new Error('字幕結束時間需晚於開始');cues.push({start,end,text:text.join('\n').replace(/<[^>]*>/g,'')})
  }
  if(!cues.length)throw new Error('找不到有效 SRT／VTT 字幕，原字幕保留')
  return cues.sort((a,b)=>a.start-b.start||a.end-b.end)
}
