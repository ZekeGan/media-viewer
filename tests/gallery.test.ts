import {test} from 'node:test'
import assert from 'node:assert/strict'
import {galleryLayout,groupedGalleryLayout,galleryWindow} from '../shared/gallery'

test('source groups keep original indices and collapse removes rendering work in every presentation',()=>{
 for(const mode of ['manga','list','masonry'] as const){
  const groups=[{id:'A',indices:[0,2]},{id:'B',indices:[1,3]}],full=groupedGalleryLayout(groups,430,mode,new Map([[2,.5]]),new Set()),closed=groupedGalleryLayout(groups,430,mode,new Map(),new Set(['A']))
  assert.deepEqual(full.tiles.map(tile=>tile.index),[0,2,1,3]);assert.deepEqual(closed.tiles.map(tile=>tile.index),[1,3]);assert.equal(closed.headers.length,2)
  assert.ok(full.tiles.filter(tile=>tile.index===1||tile.index===3).every(tile=>tile.y>full.headers[1].top))
  assert.ok(closed.height<full.height)
 }
})
test('gallery window bounds mounted work and retains keyboard focus outside the viewport',()=>{
 for(const mode of ['manga','list','masonry'] as const){const layout=galleryLayout(200,430,mode,new Map()),visible=galleryWindow(layout,3000,600);assert.ok(visible.length<40);assert.ok(visible.every(tile=>tile.y+tile.height>=2760&&tile.y<=3840));assert.ok(galleryWindow(layout,3000,600,240,0).some(tile=>tile.index===0));assert.equal(layout.tiles.length,200)}
})
test('late image ratios retain masonry column membership and resize without overlapping neighbors',()=>{
 const initial=galleryLayout(200,430,'masonry',new Map()),loaded=galleryLayout(200,430,'masonry',new Map([[0,.2],[1,3],[5,.5]]))
 assert.ok(loaded.tiles[0].height>initial.tiles[0].height)
 for(let index=0;index<200;index++){assert.equal(loaded.tiles[index].x,initial.tiles[index].x);const next=loaded.tiles[index+loaded.columns];if(next)assert.ok(next.y>=loaded.tiles[index].y+loaded.tiles[index].height)}
 const narrow=galleryLayout(200,240,'masonry',new Map());assert.equal(narrow.columns,1);assert.ok(narrow.tiles.every(tile=>tile.width===240))
 assert.equal(galleryLayout(0,400,'manga',new Map()).height,0)
})
