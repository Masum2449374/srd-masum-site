import { copyFileSync } from "node:fs";
// Pages advanced mode is mandatory: never deploy the asset bundle without its worker.
copyFileSync(
  new URL("../worker/_worker.js", import.meta.url),
  new URL("../dist/_worker.js", import.meta.url),
);
console.log("Pages worker packaged: dist/_worker.js");
