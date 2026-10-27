export type GalleryMode='masonry'|'manga'|'list'
export interface GalleryTile {index:number;x:number;y:number;width:number;height:number}
export interface GalleryLayout {tiles:GalleryTile[];height:number;columns:number}
export function galleryLayout(count:number,width:number,mode:GalleryMode,ratios:ReadonlyMap<number,number>):GalleryLayout{
 const gap=mode==='manga'?8:mode==='masonry'?10:0,minWidth=mode==='manga'?105:140
 const columns=mode==='list'?1:Math.max(1,Math.floor((width+gap)/(minWidth+gap))),cellWidth=Math.max(1,(width-gap*(columns-1))/columns),bottom=Array(columns).fill(0) as number[],tiles:GalleryTile[]=[]
 for(let index=0;index<count;index++){
  // Column membership stays fixed while unknown image ratios arrive: no lateral
  // reshuffling or CSS column rebalancing in the middle of a scroll.
  const column=index%columns,ratio=ratios.get(index)??1,height=mode==='list'?60:mode==='manga'?174:Math.min(100000,Math.max(40,cellWidth/Math.max(.0001,ratio)))+24
  tiles.push({index,x:column*(cellWidth+gap),y:bottom[column],width:cellWidth,height});bottom[column]+=height+gap
 }
 return{tiles,height:Math.max(0,...bottom)- (count?gap:0),columns}
}
export function galleryWindow(layout:GalleryLayout,top:number,height:number,overscan=240,focused=-1){
 return layout.tiles.filter(tile=>tile.index===focused||tile.y+tile.height>=top-overscan&&tile.y<=top+height+overscan)
}
