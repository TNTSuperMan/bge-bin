import { BGEXCompile } from "bgex-compiler";
import { write } from "bun";
import { watch } from "fs";
import { resolve } from "path";

console.log("hard reloaded");

const build = async () => {
    console.time("compile");
    const res = await BGEXCompile(resolve(process.argv[2]??"", "src", "program", "index.js"), "main");
    if(!res) throw void 0;
    await Promise.all([
        write(resolve(__dirname, "..", "tmp", "obj.bge"), res[0]),
        write(resolve(__dirname, "..", "tmp", "var.map"),
            "addr,name,at\n" + res[1].map(e=>
                `${e[0].toString(16)},${e[2]},${e[1]}`)
            .join("\n")),
        write(resolve(__dirname, "..", "tmp", "out.bin"), new Uint8Array(res[2]??[]))
    ]);
    console.timeEnd("compile");
    if(!res[2]) console.log("Failed to generate bin");
};

watch(resolve(process.argv[2]??"", "src", "program"), {recursive: true}, build);

build();
