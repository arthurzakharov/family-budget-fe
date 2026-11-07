// Production build of the client: `bun run build` (optionally `-- --outdir=<folder>`).
//
// `bun build` on the command line cannot load plugins (bunfig.toml only gives them to the dev
// server), so without this script Tailwind never ran and the built CSS had none of the app's
// utility classes. The options match what the server does when it bundles index.html.
import tailwind from "bun-plugin-tailwind";

const outdirArg = process.argv.find(arg => arg.startsWith("--outdir="));
const outdir = outdirArg ? outdirArg.slice("--outdir=".length) : "dist";

const result = await Bun.build({
  entrypoints: ["./src/client/index.html"],
  outdir,
  target: "browser",
  minify: true,
  sourcemap: "linked",
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  // Only BUN_PUBLIC_* variables may end up in the browser bundle.
  env: "BUN_PUBLIC_*",
  plugins: [tailwind],
});

if (!result.success) {
  for (const log of result.logs) console.error(log);
  process.exit(1);
}

for (const output of result.outputs) {
  const kb = (output.size / 1024).toFixed(1);
  console.log(`${output.path.replace(`${process.cwd()}/`, "")}  ${kb} KB`);
}
