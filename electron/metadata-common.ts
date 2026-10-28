export async function limitedBytes(response:Response,limit:number) {
  if(!response.ok)throw new Error(`來源無法取得（HTTP ${response.status}）`)
  if(Number(response.headers.get('content-length')??0)>limit)throw new Error('來源回應過大')
  const reader=response.body?.getReader();if(!reader)throw new Error('來源沒有內容');const chunks:Uint8Array[]=[];let size=0
  try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>limit)throw new Error('來源回應過大');chunks.push(value)}}finally{await reader.cancel()}
  return Buffer.concat(chunks)
}
export const decode=(value:unknown)=>String(value??'').replace(/&(amp|quot|apos|lt|gt|#\d+|#x[0-9a-f]+);/gi,(m,key:string)=>{const common:Record<string,string>={amp:'&',quot:'"',apos:"'",lt:'<',gt:'>'};if(key[0]!=='#')return common[key.toLowerCase()]??m;const n=key[1].toLowerCase()==='x'?parseInt(key.slice(2),16):Number(key.slice(1));return n>0&&n<=0x10ffff?String.fromCodePoint(n):m})
