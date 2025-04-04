import { Runtime } from "bge-wasm";

enum Command{
    nop,push,pop,cls,
    add,sub,mul,div,rem,nand,equal,greater,
    truejump,jump,call,ret,
    load,store,
    dumpkey,
    redraw,rect,graph,
    sound,stopsound,
    io,break
}

export const ReverseAsm = (runtime: Runtime, count: number, back: number): [number,string][] => {
    const asmSet: [number,string][] = [];
    let i = Math.max(0, runtime.get_pc() - back);
    while(asmSet.length !== count){
        const oprRaw = runtime.load(i);
        const oprText = Command[oprRaw] as string;
        if(oprText == "push"){
            const pc = i;
            const value = runtime.load(++i);
            asmSet.push([pc, `push ${value}(0x${value.toString(16).padStart(4,"0")})`]);
        }else if(oprText){
            asmSet.push([i, oprText]);
        }else{
            asmSet.push([i, `${oprRaw}(0x${oprRaw.toString(16).padStart(4, "0")})`]);
        }
        i++;
    }
    return asmSet;
}