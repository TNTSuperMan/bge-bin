#!/usr/bin/env bun

import app from "./debugger/index.html";
import { file, serve, spawn } from "bun";
import { resolve } from "path";
import { build } from "./build";

console.log("BGE Toolkit");

const usage = () => 
    console.log("usage: bge [dev|build] [entrydir?]");

if(process.argv.length < 3){
    usage();
}else{
    const entry = process.argv[3] ?? process.cwd();
    switch(process.argv[2]){
        case "dev":
            const buildProcess = spawn({
                cmd: ["bun", "--watch", resolve(__dirname, "hotbuild.ts"), entry],
                stdout: "pipe"
            });
            const server = serve({ routes: {
                "/": app,
                "/rom": () => new Response(file(resolve(__dirname, "..", "tmp", "out.bin"))),
                "/varmap": () => new Response(file(resolve(__dirname, "..", "tmp", "var.map"))),
            }});
            process.on("SIGINT", () => {
                buildProcess.kill("SIGINT");
                process.exit();
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
