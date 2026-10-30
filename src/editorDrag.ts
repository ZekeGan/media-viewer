export function grabOffset(clientX:number,clientY:number,rect:Pick<DOMRect,'left'|'top'>) {
 return {x:Math.max(0,clientX-rect.left),y:Math.max(0,clientY-rect.top)}
}
export function localDragPosition(clientX:number,clientY:number,offsetX:number,offsetY:number,rect:Pick<DOMRect,'left'|'top'>,scale:number,scrollLeft:number,scrollTop:number) {
 return {left:(clientX-offsetX-rect.left)/scale+scrollLeft,top:(clientY-offsetY-rect.top)/scale+scrollTop}
}
