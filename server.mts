import { promises as fs } from "fs"
import * as bun from "bun"
import indexHTML from "./index.html"
import * as docx from "docx"
import * as path from "path"
import { replacer } from "./shared.mjs"

const templatesDir = './templates'
const outputDir = './output'

let cache = await (new (class Cache {
    
    version = -1
    files = new Map<number, {
        path: string
        content: Buffer
    }>()
    fields = new Map<string, {
        usedBy: Set<number>
    }>()
    
    text: string

    async updated(){
        this.version++
        this.files.clear()
        this.fields.clear()

        await Promise.all(
            (await fs.readdir(templatesDir, { recursive: true }))
            .filter(filepath => filepath.endsWith('.docx'))
            .map((filepath, i) => this.processFile(i, filepath))
        )

        this.text = JSON.stringify({
            files: this.files,
            fields: this.fields,
            version: this.version,
        }, replacer)

        return this
    }
    async processFile(index: number, filepath: string){
        const file = { path: filepath, content: await fs.readFile(path.join(templatesDir, filepath)) }
        this.files.set(index, file)

        const fields = await docx.patchDetector({ data: file.content })
        for(const field of fields){
            let desc = this.fields.get(field) || { usedBy: new Set() }
            this.fields.set(field, desc)

            desc.usedBy.add(index)
        }
    }
})()).updated()

//*/
bun.serve({
    development: true,
    routes: {
        '/': indexHTML,
        '/api/cache': {
            GET: req => new Response(cache.text),
        },
        '/api/cache-updated': {
            GET: async req => new Response((await cache.updated()).text),
        },
        '/api/generate': {
            POST: async (raw: bun.BunRequest<"/api/generate">) => {
                let req = await raw.json()
                await generate(req)
                return new Response()
            }
        }
    },
})
//*/

function generate(req: {
    files?: number[]
    fields: {
        [name: string]: string
    }
    version: number
}){
    req.files ||= []
    console.assert(req.version == cache.version)
    const patches = Object.fromEntries(Object.entries(req.fields).map(([name, value]) => ([name, {
        type: docx.PatchType.PARAGRAPH,
        children: [ new docx.TextRun(value) ]
    }])))
    return Promise.all(req.files.map(index => {
        const file = cache.files.get(index)!
        console.assert(file != undefined)
        return docx.patchDocument({
            outputType: 'nodebuffer',
            data: file.content,
            patches,
            keepOriginalStyles: true,
        }).then(patched => {
            fs.writeFile(path.join(outputDir, path.basename(file.path)), patched)
        })
    }))
}
