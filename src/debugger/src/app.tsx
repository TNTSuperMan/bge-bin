import { useEffect, useRef, useState } from 'preact/hooks'
import './app.css'
import { createRuntime, Runtime } from './runtime'
import { ReverseAsm } from './rev_asm';
import { useLibkey } from 'libkey';
//@ts-ignore
import mmraw from "../../../tmp/var.map";
let memmap:  [number, string, string][] | void;
fetch(mmraw).then(e=>e.text()).then(e=>
  memmap = e.split("\n").map(e=>{
    const r = e.split(",")
    return [parseInt(r[0], 16), r[1], r[2]]
  }).splice(1) as any);

const keymap = {
  "ArrowUp":    0,
  "ArrowDown":  1,
  "ArrowLeft":  2,
  "ArrowRight": 3,
  "KeyV": 4,
  "KeyC": 5,
  "KeyX": 6,
  "KeyZ": 7,
}

export function App() {
  const runtime = useRef<Runtime>();
  const [memi, setMemi] = useState(0xa000);
  const [rasm, setRasm] = useState<[number,string][]>([]);
  const [err, setErr] = useState("");
  const [running, setRunning] = useState(false);
  const input = useRef(
    Array(8).fill(false) as
      [boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean]
  );
  const [emuinfo, setEmuinfo] = useState<{
    memory: number[],
    stack: number[],
    callstack: number[],
    pc: number,
    ccc: bigint,
    time: number
  }>({
    memory: [],
    stack: [],
    callstack: [],
    pc: 0,
    ccc: 0n,
    time: 0
  });
  function Emulate(isf: boolean){
    const rt = runtime.current;
    if(rt){
      rt.Key();
      const start = performance.now();
      const result = isf ? rt.runtime.emulate_frame() : rt.runtime.emulate_one();
      const end = performance.now();
      let memi = 0;
      setMemi(e => memi = e);
      rt.Draw();
      setErr(result);
      setEmuinfo({
        memory: Array(20).fill(0).map((_,i)=>rt.Load(i+memi)??0),
        stack: Array.from(rt.runtime.get_stack()),
        callstack: Array.from(rt.runtime.get_callstack()),
        pc: rt.runtime.get_pc(),
        ccc: rt.runtime.get_ccc(),
        time: end - start
      })
      setRasm(ReverseAsm(rt.runtime, 20, 7))
    }
  }
  useEffect(()=>{
    if(!runtime.current){
      const ctx = document.querySelector("canvas")?.getContext("2d");
      if(!ctx) throw new Error("Failed to create canvas context");
      const k = useLibkey(document.body);
      k.onupdate(state=>{
        input.current = [
          state.arrow.up,
          state.arrow.down,
          state.arrow.left,
          state.arrow.right,
          state.keys.has("KeyV"),
          state.keys.has("KeyC"),
          state.keys.has("KeyZ"),
          state.keys.has("KeyX"),
        ]
      })
      createRuntime({
        ctx,
        key: ()=>parseInt(
          input.current.map(e=>e?"1":"0").join(""), 2),
        onRedraw(){},
        saveSRAM(){},
        loadSRAM(){return new Uint8Array}
      }).then(e=>{
        runtime.current = e;
        setInterval(()=>{
          let isr_: boolean = false;
          setRunning(e=>isr_=e)
          if(isr_) Emulate(true);
        }, 1000 / 30);
      })
    }
  }, [runtime]);
  useEffect(()=>{
    setEmuinfo({
      ...emuinfo,
      memory: Array(20).fill(0).map((_,i)=>runtime.current?.Load(i+memi)??0)
    })
  }, [memi])

  return (
    <>
      <h1>BGE Debugger</h1>
      <input type="text" value={memi.toString(16)} onInput={e=>setMemi(parseInt((e.target as HTMLInputElement).value, 16))} />
      <div className="long">
        <table>
          <thead>
            <tr><th>Addr</th><th>Value</th><th>Name?</th></tr>
          </thead>
          <tbody>
            {emuinfo.memory.map((e,i)=><tr key={i+memi} style={{background:i+memi==emuinfo.pc?"#f55":void 0}}>
              <td>{(i+memi).toString(16).padStart(4, "0")}</td>
              <td>{e}</td>
              { !memmap ? false :
                <td title={memmap.find(e=>e[0]==i+memi)?.[2]}>{memmap.find(e=>e[0]==i+memi)?.[1]}</td>
              }
            </tr>)}
          </tbody>
        </table>
        <table>
          <thead>
            <tr><th>Addr</th><th>Code</th></tr>
          </thead>
          <tbody>
            {rasm.map(e=><tr key={e[0]} style={{background:e[0]==emuinfo.pc?"#f55":void 0}}>
              <td>{e[0].toString(16).padStart(4, "0")}</td>
              <td class="code">{e[1]}</td>
            </tr>)}
          </tbody>
        </table>
      </div>
      <h3>{err}</h3>
      <canvas width="128" height="128"/>
      <fieldset>
        <legend>Input</legend>
        <label>↑<input type="checkbox" onChange={e=>input.current[0]=(e.target as HTMLInputElement).checked}/></label>
        <label>↓<input type="checkbox" onChange={e=>input.current[1]=(e.target as HTMLInputElement).checked}/></label>
        <label>←<input type="checkbox" onChange={e=>input.current[2]=(e.target as HTMLInputElement).checked}/></label>
        <label>→<input type="checkbox" onChange={e=>input.current[3]=(e.target as HTMLInputElement).checked}/></label>
        <label>sl<input type="checkbox" onChange={e=>input.current[4]=(e.target as HTMLInputElement).checked}/></label>
        <label>St<input type="checkbox" onChange={e=>input.current[5]=(e.target as HTMLInputElement).checked}/></label>
        <label>A<input type="checkbox" onChange={e=>input.current[6]=(e.target as HTMLInputElement).checked}/></label>
        <label>B<input type="checkbox" onChange={e=>input.current[7]=(e.target as HTMLInputElement).checked}/></label>
      </fieldset>
      <button onClick={()=>Emulate(false)}>Emulate</button>
      <button onClick={()=>Emulate(true)}>Frame</button>
      <label>Running: <input type="checkbox" onChange={e=>setRunning((e.target as HTMLInputElement).checked)} checked={running}/></label><br/>
      <span>Time: {emuinfo.time}</span>
      <span>PC: {emuinfo.pc.toString()}({emuinfo.pc.toString(16).padStart(4, "0")})</span>
      <span>CCC: {emuinfo.ccc.toString()}</span>
      <span>Stack: { emuinfo.stack.map((e,i)=><span key={i} className="inlist">
          {e}
        </span>)
      }</span>
      <span>Callstack: { emuinfo.callstack.map((e,i)=><span key={i} className="inlist">
          {e.toString(16).padStart(4, "0")}
        </span>)
      }</span>
    </>
  )
}
