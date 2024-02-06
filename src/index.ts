import fs from 'fs'
import path from 'path'
import yargs from 'yargs'
import * as glob from 'glob'
import { execSync } from "child_process"
import { hideBin } from 'yargs/helpers'
import { optimize } from 'svgo'
/**
 * 
 * import AdmZip from "adm-zip";
import { execSync } from "child_process";
import Download from "download";
import { ensureDir, remove } from "fs-extra";
import { join } from "path";

import { tempDownloadDir } from "./constants";
import { list } from "./utils";

function getVersion(version: string): string {
  const versions = JSON.parse(
    execSync("npm view material-design-icons versions --json").toString()
  );
 */
const argv = yargs(hideBin(process.argv))
    .option('out-dir', {
        describe: 'Output directory for wrapped SVG files',
        demandOption: true,
        default: "./svgx",
        type: 'string'
    })
    .option('case', {
        describe: 'Change _,- to camel case',
        default: true,
        type: 'boolean'
    })
    .help()
    .argv

const outputDir = argv['out-dir']
const ccase = argv['case']

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
    console.log(`Created output directory: ${outputDir}`)
}

if (!outputDir) {
    console.error('Please provide the output directory using --out-dir option.')
    process.exit(1)
}

function insertPropsIntoSvg(str: string): string {
    const openTagIndex = str.indexOf('<svg')
    const closeTagIndex = str.indexOf('>', openTagIndex)

    if (openTagIndex !== -1 && closeTagIndex !== -1) {
        const insertIndex = closeTagIndex
        const result = str.slice(0, insertIndex) + ' {...props}' + str.slice(insertIndex)
        return result
    } else {
        console.error('Invalid input format')
        return str
    }
}

function comment(svgContent: string) {
    // // Use regular expressions to match and comment out specific lines
    // const commentedSvgContent = svgContent.replace(
    //     /\s*<\?xml version=".+?" .+?>\s*|\s*<!--[^>]*-->\s*|\s*<!DOCTYPE[^>]*>\s*/igm,
    //     (match) => '' // `/* ${match} */`
    // )

    // return commentedSvgContent.replace(/\s*\w+:\w+="[^"]*"\s*/igm, ' ')
    return svgContent.replace(/\s*\w+:\w+="[^"]*"\s*/igm, ' ')
}

const snakeToCamel = (input: string) => ccase ? (() => {
    const words = input.split(/[-_]/)
    const capitalizedWords = words.map((word, index) => {
        if (index === 0) {
            // Capitalize the first word
            return word.charAt(0).toUpperCase() + word.slice(1)
        } else {
            // Capitalize the rest of the words
            return word.charAt(0).toUpperCase() + word.slice(1)
        }
    })
    return capitalizedWords.join('')
})()
    : input

const svgFilesPattern = argv._[0] || './**/*.svg'
const svgFiles = glob.sync(svgFilesPattern)

console.log(`Looking for svg from ${svgFilesPattern}`)
// console.log(`Files to process`, svgFiles)

console.log(`Files to processed:`)

svgFiles.forEach(svgFilePath => {
    try {
        const svgContent = fs.readFileSync(svgFilePath, 'utf-8').trim()
        const fileName = svgFilePath.replace(/^.*[\\/]/, '').replace('.svg', '')
        const od = `${outputDir}/${path.dirname(svgFilePath)}`
        if (!fs.existsSync(od))
            fs.mkdirSync(od, { recursive: true })

        const outputFilePath = `${od}/${snakeToCamel(fileName)}.tsx`
        const wrappedSvg = `
import { type JSX } from 'woby'
export default (props: JSX.SVGAttributes<SVGElement>) => ${insertPropsIntoSvg(comment(optimize(svgContent, {
            multipass: true,
            js2svg: {
                indent: 2, // string with spaces or number of spaces. 4 by default
                pretty: true, // boolean, false by default
            },
        }).data))}
`

        fs.writeFileSync(outputFilePath, wrappedSvg)
        console.log(`${svgFilePath} -> ${outputFilePath}`)
    } catch (error) {
        console.error(`An error occurred while processing ${svgFilePath}:`, (error as any).message)
    }
})
