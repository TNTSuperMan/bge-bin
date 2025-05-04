#!/usr/bin/env bun

import app from "./debugger/index.html";
import { $, serve } from "bun";
import { resolve } from "path";
import { build } from "./build";

console.log("BGE Toolkit");

const usage = () => 
    console.log("usage: bge [run|build] [entrydir?]");

if(process.argv.length < 3){
    usage();
}else{
    const entry = process.argv[3] ?? process.cwd();
    switch(process.argv[2]){
        case "run":
            $`bun --watch ${resolve(__dirname, "hotbuild.ts")} ${entry}`;
            const server = serve({
                routes: { "/": app }
            });
            console.log(`Running on ${server.url}`);
            break;
        case "build":
            await build(entry, resolve(entry, "dist"));
            break;
        default:
            usage();
            break;
    }
    
}
