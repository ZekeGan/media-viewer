import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Background, Controls, MiniMap, ReactFlow, type Edge, type Node } from '@xyflow/react'
import dagre from '@dagrejs/dagre'
import '@xyflow/react/dist/style.css'
import type { FolderRow } from '../shared/model'
import type { BrowseState } from '../shared/explorer'
const pathKey=(p:string)=>p.replace(/\\/g,'/').replace(/\/$/,'').toLocaleLowerCase()
const parent=(p:string)=>p.replace(/[\\/][^\\/]+[\\/]?$/,'')
export default function Tree({rows,selected,onSelect,onOpen,onConfigure,viewport,save}:{rows:FolderRow[];selected?:string;onSelect:(id:string)=>void;onOpen:(id:string)=>void;onConfigure:(id:string)=>void;viewport?:BrowseState['viewport'];save:(v:NonNullable<BrowseState['viewport']>)=>void}) {
  const actions=useRef({onOpen,onConfigure});actions.current={onOpen,onConfigure}
  const canvas=useRef<HTMLDivElement>(null),[initialView,setInitialView]=useState(viewport)
  const {nodes,edges}=useMemo(()=>{
    const graph=new dagre.graphlib.Graph().setGraph({rankdir:'LR',ranksep:80,nodesep:22}).setDefaultEdgeLabel(()=>({})), byPath=new Map(rows.map(r=>[pathKey(r.path),r.rowId])),edges:Edge[]=[]
    for(const row of rows)graph.setNode(row.rowId,{width:220,height:70})
    for(const row of rows){const above=byPath.get(pathKey(parent(row.path)));if(above){graph.setEdge(above,row.rowId);edges.push({id:`${above}/${row.rowId}`,source:above,target:row.rowId,type:'smoothstep'})}}
    dagre.layout(graph)
    const nodes:Node[]=rows.map(r=>{const pos=graph.node(r.rowId);return{id:r.rowId,initialWidth:220,initialHeight:70,position:{x:pos.x-110,y:pos.y-35},sourcePosition:'right' as Node['sourcePosition'],targetPosition:'left' as Node['targetPosition'],selected:false,data:{label:<div tabIndex={0} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();actions.current.onOpen(r.rowId)}if(e.key==='ContextMenu'||e.shiftKey&&e.key==='F10'){e.preventDefault();actions.current.onConfigure(r.rowId)}}}><strong>{r.name}</strong><small>{r.structural?'結構祖先':r.boundary?'遊戲邊界 · 內部未納管':r.readonly?'唯讀':`第 ${r.depth} 層`}</small></div>},style:{width:220,height:70,opacity:r.structural?0.4:1}}})
    return{nodes,edges}
  },[rows])
  useLayoutEffect(()=>{
    if(initialView||!canvas.current)return
    const initialize=()=>{
      const width=canvas.current!.clientWidth,height=canvas.current!.clientHeight;if(!width||!height)return
      let minX=0,minY=0,maxX=220,maxY=70
      for(const node of nodes){minX=Math.min(minX,node.position.x);minY=Math.min(minY,node.position.y);maxX=Math.max(maxX,node.position.x+220);maxY=Math.max(maxY,node.position.y+70)}
      const zoom=Math.max(.05,Math.min(1,width/(maxX-minX+80),height/(maxY-minY+80))),next={x:(width-(maxX-minX)*zoom)/2-minX*zoom,y:(height-(maxY-minY)*zoom)/2-minY*zoom,zoom}
      setInitialView(next);save(next)
    }
    const observer=new ResizeObserver(initialize);observer.observe(canvas.current);initialize();return()=>observer.disconnect()
  },[initialView,nodes,save])
  return <div className="tree-canvas" ref={canvas}>{initialView&&<ReactFlow nodes={nodes.map(n=>({...n,selected:n.id===selected}))} edges={edges} nodesDraggable={false} nodesConnectable={false} elementsSelectable deleteKeyCode={null} fitView={false} defaultViewport={initialView} minZoom={.05} maxZoom={4} onlyRenderVisibleElements zoomOnDoubleClick={false} onNodeClick={(_,node)=>onSelect(node.id)} onNodeDoubleClick={(_,node)=>onOpen(node.id)} onNodeContextMenu={(e,node)=>{e.preventDefault();onConfigure(node.id)}} onMoveEnd={(_,v)=>save(v)} colorMode="dark"><Background/><Controls showInteractive={false}/><MiniMap pannable zoomable/></ReactFlow>}</div>
}
