import esbuild from "esbuild";

esbuild.build({
  entryPoints: ["main.ts"],
  bundle: true,
  external: ["obsidian"],
  format: "cjs",
  outfile: "main.js",
  platform: "browser",
  target: "ES6",
  minify: true,
}).catch(() => process.exit(1));
