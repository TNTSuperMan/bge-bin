import { watch } from "fs";
import { resolve } from "path";
import { build } from "./build";

console.log("hard reloaded");

const buildArgs = [process.argv[2] ?? "", resolve(process.argv[2] ?? "", "dist"), resolve(__dirname, "..", "tmp")] as const;

watch(resolve(process.argv[2]??"", "src", "program"), {recursive: true}, () =>
    build(...buildArgs));

build(...buildArgs);
