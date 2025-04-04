import { watchFile } from "fs";
import { resolve } from "path";
import { createServer } from "vite";

createServer({
    root: __dirname
}).then(e=>e.listen()).then(e=>{
    watchFile(resolve(__dirname, "..", "ACEGameX", "dist", "out.bin"), {}, ()=>
        e.ws.send({
            type: "update",
            updates: [{
                type: "js-update",
                path: "/src/runtime.ts",
                acceptedPath: "/src/runtime.ts",
                timestamp: Date.now()
            }]
        })
    )
});
