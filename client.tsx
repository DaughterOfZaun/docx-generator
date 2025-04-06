let cache = await (await fetch('/api/cache')).json()

import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

type Cache = {
    version: number
    files: {
        [index: string]: {
            path: string
        },
    },
    fields: {
        [name: string]: {
            usedBy: Array<number>
        }
    }
}
const cacheInitialValue: Cache = {version: -1, files:{}, fields:{}}
function App() {

    let [cache, setCache] = useState(cacheInitialValue)
    //let [cacheVersion, setCacheVersion] = useState(0) //HACK:
    //let [cacheVersion, setCacheVersion] = [0, (to: number) => { cacheVersion = to; reloadCache() }]
    let [checkedFiles, setCheckedFiles] = useState([] as number[])

    useEffect(reloadCache, [/*cacheVersion*/])
    function reloadCache() {
        const endpoint = (cache.version == -1) ? '/api/cache' : '/api/cache-updated'
        fetch(endpoint).then(res => res.json()).then(res => setCache(res))
    }
    
    if(cache == cacheInitialValue){
        //return <h1>Loading cache...</h1>
    }
    
    async function handleSubmit(event){
        event.preventDefault()
        const formData = new FormData(event.target)
        await fetch('/api/generate', {
            method: 'POST',
            body: JSON.stringify({
                files: checkedFiles,
                fields: Object.fromEntries(formData),
                version: cache.version,
            })
        })
    }
    
    async function handleReload(event) {
        event.preventDefault()
        //setCacheVersion(cacheVersion + 1)
        reloadCache()
    }

    function handleChange(event) {
        //event.preventDefault()
        const index = parseInt(event.target.value)
        const checked = !!event.target.checked
        const newCheckedFiles = checked ? [...checkedFiles, index] : checkedFiles.filter(i => i != index)
        setCheckedFiles(newCheckedFiles)
    }
    
    return <form onSubmit={handleSubmit}>
        {/* <button onClick={handleReload}>Reload</button> */}
        <p>{
            Object.entries(cache.files).map(([index, { path }]) => {
                const id = `file-${index}`
                return <div key={id}>
                    <input id={id} type="checkbox" value={index} onChange={handleChange}></input>
                    <label htmlFor={id}>{path}</label>
                </div>
            })
        }</p><p>{
            Object.entries(cache.fields).map(([field, { usedBy }]) => {
                const hidden = usedBy.every(index => !checkedFiles.includes(index))
                return <div key={field} className="field" data-usedby={usedBy.join(',')} hidden={hidden}>
                    <textarea name={field} placeholder={field}></textarea>
                </div>
            })
        }</p>
        <button type="submit" disabled={!checkedFiles.length}>Generate</button>
    </form>
}

const domNode = document.querySelector('#App')!
const root = createRoot(domNode)
root.render(<App/>)