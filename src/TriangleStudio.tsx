import { useEffect, useState } from "react";
import { defaultLayers, spherePlate } from "./plate.ts";
import type { Scene, ObjectId } from "./plate.ts";
import { emptyConstruction, isSide, isVertex, measurement, relations, sideBetween, triangleFrame } from "./triangle.ts";
import type { Construction, Vertex, Target } from "./triangle.ts";

type Mode = "Inspect" | "Vertices" | "Sides" | "Labels";
export function useTriangle(scene: Scene, initial=emptyConstruction) {
  const [opened, open] = useState(false);
  const [mode, setMode] = useState<Mode>("Vertices");
  const [steps,setSteps] = useState([initial]);
  const [index,at] = useState(0);
  const work = steps[index];
  const [ends,setEnds] = useState<Vertex[]>([]);
  const [message,say] = useState("");
  function cancel() { setEnds([]); say(""); setMode("Inspect"); }
  useEffect(()=>{
    if (!opened) return;
    function key(e:KeyboardEvent) { if(e.key==="Escape") cancel(); }
    document.addEventListener("keydown",key);
    return ()=>document.removeEventListener("keydown",key);
  },[opened]);
  useEffect(()=>{setEnds([]);say("");},[scene]);
  function changeMode(value:Mode){ setMode(value);setEnds([]);say(""); }
  function commit(next:Construction) {
    setSteps([...steps.slice(0,index+1),next]); at(index+1); setEnds([]); say("");
  }
  function pick(id:ObjectId) {
    if (!opened || scene.degeneracy || mode==="Inspect") return;
    say("");
    if (mode==="Vertices" && !isVertex(id)) say("Choose the north celestial pole, zenith or star.");
    if (mode!=="Sides") return;
    if (!isVertex(id) || !work.vertices.includes(id)) {say("Choose an added triangle vertex as the endpoint.");return;}
    if (ends.length===1 && ends[0]===id) {say("A side needs two distinct endpoints.");return;}
    setEnds(ends.length===1 ? [...ends,id] : [id]);
  }
  function move(delta:number){at(index+delta);setEnds([]);say("");}
  return {opened,open,mode,changeMode,work,commit,pick,ends,message,say,
    preview:ends.length===2 ? sideBetween(ends[0],ends[1]) : undefined,
    undo:()=>move(-1),redo:()=>move(1),canUndo:index>0,canRedo:index+1<steps.length,cancel};
}
type Studio = ReturnType<typeof useTriangle>;
export function TriangleStudio({studio:t,scene,selected,pick}:{studio:Studio;scene:Scene;selected:ObjectId|"";pick:(id:ObjectId)=>void}) {
  const [choice,setChoice]=useState("");
  const [path,setPath]=useState("minor");
  const [expanded,expand]=useState(false);
  if (!t.opened) return null;
  const normal=triangleFrame(scene);
  const target:Target|null=selected==="P" || isSide(selected) ? selected : null;
  const ready=target==="P" ? t.work.sides.includes("PZ") && t.work.sides.includes("PS") : target && t.work.sides.includes(target);
  function diagram(isolated:boolean) {
    return <figure><figcaption>{isolated?"Isolated triangle":"Celestial-sphere sketch"}</figcaption>
      {isolated && (!normal || !t.work.vertices.length) ? <p>{scene.degeneracy || "Add a vertex to begin the triangle."}</p> :
      <div className="linked-plate" onClick={e=>{const id=(e.target as Element).closest("[data-object]")?.getAttribute("data-object");if(id)pick(id as ObjectId);}}
        dangerouslySetInnerHTML={{__html:spherePlate(scene,{practice:true,construction:t.work,selected,
          preview:t.preview,frame:isolated && normal ? normal : undefined, isolated, layers:defaultLayers,prefix:isolated?"triangle-":"sketch-"})}}/>}
    </figure>;
  }
  return <section className="triangle-studio" id="triangle-studio" aria-label="Triangle studio">
    <div className="bench-heading"><h2>Triangle studio</h2><div className="actions">
      <button disabled={!t.canUndo} onClick={t.undo}>Undo construction</button><button disabled={!t.canRedo} onClick={t.redo}>Redo construction</button>
      <button onClick={()=>{t.cancel();t.open(false);}}>Close studio</button></div></div>
    <div className="studio-grid"><div className="construction-tools">
    <label className="field">Construction tool<select value={t.mode} onChange={e=>t.changeMode(e.target.value as Mode)}>
      {["Inspect","Vertices","Sides","Labels"].map(id=><option key={id}>{id}</option>)}</select></label>
    {scene.degeneracy ? <p className="notice">{scene.degeneracy} Change the problem coordinates to construct a triangle.</p> : <>
    {t.mode==="Vertices" && <><p>Select a candidate, then add the vertex.</p>
      <button disabled={!isVertex(selected)||t.work.vertices.includes(selected)} onClick={()=>{if(isVertex(selected))t.commit({...t.work,vertices:[...t.work.vertices,selected]});}}>Add vertex</button></>}
    {t.mode==="Sides" && <><p>Pick two added vertices to preview a side.</p><label className="field">Path<select aria-label="Path" value={path} onChange={e=>setPath(e.target.value)}><option value="minor">Minor great-circle arc</option><option value="parallel">Declination parallel</option></select></label>
      <button disabled={!t.preview||t.work.sides.includes(t.preview)} onClick={()=>{
        if(path==="parallel") {t.say("Declination parallels generally trace small circles. Use the great circle in the plane through both endpoints and the sphere’s centre.");return;}
        if(t.preview)t.commit({...t.work,sides:[...t.work.sides,t.preview]});
      }}>Commit side{t.preview?" "+t.preview:""}</button></>}
    {t.mode==="Labels" && <><p>Select a constructed side, or P for the included angle between PZ and PS.</p>
      <label className="field">Angular relation<select value={choice} onChange={e=>setChoice(e.target.value)}><option value="">Choose a relation…</option>{Object.values(relations).map(r=><option key={r}>{r}</option>)}</select></label>
      <button disabled={!ready||!choice||!target||t.work.labels.includes(target)} onClick={()=>{
        if (!target)return;
        if (choice!==relations[target]) {t.say(({PZ:"PZ runs from the pole to the observer’s zenith. Which observer coordinate sets that distance?",PS:"PS is the star’s polar distance. Which equatorial coordinate locates the star?",ZS:"ZS measures distance from overhead. Which horizon coordinate complements it?",P:"At P the meridian meets the star’s hour circle. Use the interior angle in the range 0°–180°."})[target]);return;}
        t.commit({...t.work,labels:[...t.work.labels,target]});
      }}>Check label</button></>}
    <div className="pick-list">{(["P","Z","S",...t.work.sides] as ObjectId[]).map(id=><button aria-label={"Pick "+id} aria-pressed={selected===id} key={id} onClick={()=>pick(id)}>{id}</button>)}</div>
    <small>Vertices {t.work.vertices.join(", ")||"—"} · Sides {t.work.sides.join(", ")||"—"}</small>
    <p role="status">{t.message || (t.mode==="Sides"&&t.ends.length ? "Endpoints: "+t.ends.join(" → ") : "")}</p>
    {t.work.labels.map(id=><div className="checked-label" key={id}>{id==="P"?"∠ZPS":id} = {relations[id]} = {measurement(scene,id)?.toFixed(5)}°</div>)}</>}
    </div><div className="diagram-area"><button onClick={()=>expand(!expanded)}>{expanded?"Compact diagrams":"Enlarge diagrams"}</button>
      <div className={"diagram-pair"+(expanded?" expanded":"")}>{diagram(false)}{diagram(true)}</div>
      <small>Measurements follow the spherical arcs. Dashed portions pass behind the sphere.</small></div></div></section>;
}

