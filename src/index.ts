#!/usr/bin/env bun

import { BGEXCompile } from "bgex-compiler";
import { $, write } from "bun";
import { existsSync, mkdirSync, watch, watchFile } from "fs";
import { resolve } from "path";
import { createServer } from "vite";

console.log("BGE Toolkit");

const usage = () => 
    console.log("usage: bge [run|build] [entrydir?]");

if(process.argv.length < 3){
    usage();
}else{
    const entry = process.argv[3] ?? process.cwd();
    switch(process.argv[2]){
        case "run":
            $`bun --watch ${resolve(__dirname, "hotbuild.ts")} ${entry}`.then(()=>{});
            const server = await createServer({
                root: resolve(__dirname, "debugger"),
                server: {
                    port: 4000
                }
            });
            await server.listen();
            server.printUrls();
            watchFile(resolve(__dirname, "..", "tmp", "out.bin"), {}, ()=>
                server.ws.send({
                    type: "update",
                    updates: [{
                        type: "js-update",
                        path: "/src/runtime.ts",
                        acceptedPath: "/src/runtime.ts",
                        timestamp: Date.now()
                    }]
                })
            )
            break;
        case "build":
            console.time("compile");
            const result = await BGEXCompile(resolve(entry, "src", "program", "index.js"), "main");
            if(!result) break;
            if(!existsSync(resolve(entry, "dist"))) mkdirSync(resolve(entry, "dist"));
            await Promise.all([
                write(resolve(entry, "dist", "obj.bge"), result[0]),
                write(resolve(entry, "dist", "var.map"), 
                    "addr,name,at\n" + result[1].map(e=>
                        `${e[0].toString(16)},${e[2]},${e[1]}`)
                    .join("\n")),
                write(resolve(entry, "dist", "out.bin"), new Uint8Array(result[2]??[]))
            ]);
            console.timeEnd("compile");
            if(!result[2]) console.log("Failed to generate bin");
            break;
        default:
            usage();
            break;
    }
    
}
