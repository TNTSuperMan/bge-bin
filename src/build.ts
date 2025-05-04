import { BGEXCompile } from "bgex-compiler";
import { write } from "bun";
import { resolve } from "path";

export const writeBuildResult = (path: string, result: Exclude<Awaited<ReturnType<typeof BGEXCompile>>, void>) => Promise.all([
    write(resolve(path, "obj.bge"), result[0]),
    write(resolve(path, "var.map"), 
        "addr,name,at\n" + result[1].map(e=>
            `${e[0].toString(16)},${e[2]},${e[1]}`)
        .join("\n")),
    write(resolve(path, "out.bin"), new Uint8Array(result[2]??[])),
    write(resolve(path, "tag.map"), "addr,name\n"+result[3]?.entries().map(e=>
        `${e[1].toString(16).padStart(4, "0")},${e[0]}`
    ).toArray().join("\n"))])

export const build = async(entry: string, path: string, subpath?: string) => {
    console.time("compile");
    const result = await BGEXCompile(resolve(entry, "src", "program", "index.js"), "main");
    if(!result) return;
    if(!result[2]) console.log("Failed to generate bin");
    if(subpath) writeBuildResult(subpath, result);
    await writeBuildResult(path, result);
    console.timeEnd("compile");
}
