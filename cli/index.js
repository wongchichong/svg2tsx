"use strict";
const fs = require("fs");
const path = require("path");
const yargs = require("yargs");
const glob = require("glob");
const helpers = require("yargs/helpers");
const svgo = require("svgo");
function _interopNamespaceDefault(e) {
  const n = Object.create(null, { [Symbol.toStringTag]: { value: "Module" } });
  if (e) {
    for (const k in e) {
      if (k !== "default") {
        const d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: () => e[k]
        });
      }
    }
  }
  n.default = e;
  return Object.freeze(n);
}
const glob__namespace = /* @__PURE__ */ _interopNamespaceDefault(glob);
const argv = yargs(helpers.hideBin(process.argv)).option("out-dir", {
  describe: "Output directory for wrapped SVG files",
  demandOption: true,
  default: "./svgx",
  type: "string"
}).option("case", {
  describe: "Change _,- to camel case",
  default: true,
  type: "boolean"
}).help().argv;
const outputDir = argv["out-dir"];
const ccase = argv["case"];
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`Created output directory: ${outputDir}`);
}
if (!outputDir) {
  console.error("Please provide the output directory using --out-dir option.");
  process.exit(1);
}
function insertPropsIntoSvg(str) {
  const openTagIndex = str.indexOf("<svg");
  const closeTagIndex = str.indexOf(">", openTagIndex);
  if (openTagIndex !== -1 && closeTagIndex !== -1) {
    const insertIndex = closeTagIndex;
    const result = str.slice(0, insertIndex) + " {...props}" + str.slice(insertIndex);
    return result;
  } else {
    console.error("Invalid input format");
    return str;
  }
}
function comment(svgContent) {
  return svgContent.replace(/\s*\w+:\w+="[^"]*"\s*/igm, " ");
}
const snakeToCamel = (input) => ccase ? (() => {
  const words = input.split(/[-_]/);
  const capitalizedWords = words.map((word, index) => {
    if (index === 0) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    } else {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }
  });
  return capitalizedWords.join("");
})() : input;
const svgFilesPattern = argv._[0] || "./**/*.svg";
const svgFiles = glob__namespace.sync(svgFilesPattern);
console.log(`Looking for svg from ${svgFilesPattern}`);
console.log(`Files to processed:`);
svgFiles.forEach((svgFilePath) => {
  try {
    const svgContent = fs.readFileSync(svgFilePath, "utf-8").trim();
    const fileName = svgFilePath.replace(/^.*[\\/]/, "").replace(".svg", "");
    const od = `${outputDir}/${path.dirname(svgFilePath)}`;
    if (!fs.existsSync(od))
      fs.mkdirSync(od, { recursive: true });
    const outputFilePath = `${od}/${snakeToCamel(fileName)}.tsx`;
    const wrappedSvg = `
import { type JSX } from 'voby'
export default (props: JSX.SVGAttributes<SVGElement>) => ${insertPropsIntoSvg(comment(svgo.optimize(svgContent, {
      multipass: true,
      js2svg: {
        indent: 2,
        // string with spaces or number of spaces. 4 by default
        pretty: true
        // boolean, false by default
      }
    }).data))}
`;
    fs.writeFileSync(outputFilePath, wrappedSvg);
    console.log(`${svgFilePath} -> ${outputFilePath}`);
  } catch (error) {
    console.error(`An error occurred while processing ${svgFilePath}:`, error.message);
  }
});
//# sourceMappingURL=index.js.map
