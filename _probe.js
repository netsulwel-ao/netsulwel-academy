const postcss = require("postcss");
const cssPlugin = require("@tailwindcss/postcss");
const fs = require("fs");
const css = fs.readFileSync("C:/Users/USER/AppData/Local/Temp/opencode/probe.css", "utf8");
postcss([cssPlugin()]).process(css, { from: undefined }).then((res) => {
  const out = res.css;
  console.log("HAS animate-page-enter:", out.includes("animate-page-enter"));
  console.log("HAS page-enter keyframes:", out.includes("keyframes page-enter") || out.includes("page-enter{") || /page-enter\s*\{[^}]*from/.test(out.replace(/\s/g,"")));
  console.log("HAS aurora-drift:", out.includes("aurora-drift"));
  console.log("LEN:", out.length);
}).catch((e) => { console.error("ERR", e); process.exit(1); });
