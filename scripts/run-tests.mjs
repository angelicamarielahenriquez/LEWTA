// Runs LEWTA's automated tests without extra packages.
// It compiles lib/, data/ and tests/ with TypeScript into .test-build/ and runs them with Node's test runner.
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync, copyFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, ".test-build");
rmSync(out, { recursive: true, force: true });
const folders = ["lib", "data", "types", "tests"];
const walk = (dir) => readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
for (const folder of folders) {
  for (const file of walk(join(root, folder))) {
    const rel = relative(root, file);
    const target = join(out, rel).replace(/\.tsx?$/, ".js");
    mkdirSync(dirname(target), { recursive: true });
    if (file.endsWith(".json") || file.endsWith(".csv")) { copyFileSync(file, join(out, rel)); continue; }
    if (!/\.tsx?$/.test(file)) continue;
    let code = ts.transpileModule(readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, resolveJsonModule: true } }).outputText;
    // Turn "@/x" imports into relative paths.
    code = code.replace(/require\("@\/([^"]+)"\)/g, (_, p) => {
      let rel2 = relative(dirname(target), join(out, p)).replace(/\\/g, "/");
      if (!rel2.startsWith(".")) rel2 = "./" + rel2;
      return `require("${rel2}")`;
    });
    writeFileSync(target, code);
  }
}
writeFileSync(join(out, "package.json"), JSON.stringify({ type: "commonjs" }));
const tests = walk(join(out, "tests")).filter((f) => f.endsWith(".test.js"));
try {
  execFileSync(process.execPath, ["--test", ...tests], { stdio: "inherit", env: { ...process.env, LEWTA_ROOT: root } });
} catch { process.exitCode = 1; }
