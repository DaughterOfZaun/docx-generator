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
    let [checkedFiles, setCheckedFiles] = useState([] as number[])

    useEffect(reloadCache, [])
    function reloadCache() {
        const endpoint = (cache.version == -1) ? '/api/cache' : '/api/cache-updated'
        fetch(endpoint).then(res => res.json()).then(res => setCache(res))
    }
        
    function handleSubmit(event){
        event.preventDefault()
        const formData = new FormData(event.target)
        fetch('/api/generate', {
            method: 'POST',
            body: JSON.stringify({
                files: checkedFiles,
                fields: Object.fromEntries(formData),
                version: cache.version,
            })
        })
    }

    function handleReset(event) {
        event.preventDefault()
        for(let textarea of document.querySelectorAll('textarea'))
            textarea.value = ''
    }
    
    function handleReload(event) {
        event.preventDefault()
        reloadCache()
    }

    function handleChange(event) {
        const index = parseInt(event.target.value)
        const checked = !!event.target.checked
        const newCheckedFiles = checked ? [...checkedFiles, index] : checkedFiles.filter(i => i != index)
        setCheckedFiles(newCheckedFiles)
    }
    
    return <form onSubmit={handleSubmit} onReset={handleReset}>
        <button onClick={handleReload}>Reload</button>
        <hr/>{
            Object.entries(cache.files).map(([index, { path }]) => {
                const id = `file-${index}`
                return <div key={id}>
                    <input id={id} type="checkbox" value={index} onChange={handleChange}></input>
                    <label htmlFor={id}>{path}</label>
                </div>
            })
        }<hr/>{
            Object.entries(cache.fields).map(([field, { usedBy }]) => {
                const hidden = usedBy.every(index => !checkedFiles.includes(index))
                return <div key={field} className="field" data-usedby={usedBy.join(',')} hidden={hidden}>
                    <textarea name={field} placeholder={field}></textarea>
                </div>
            })
        }<hr/>
        <button type="submit" disabled={!checkedFiles.length}>Generate</button>
        <button type="reset">Reset</button>
    </form>
}

const domNode = document.querySelector('#App')!
const root = createRoot(domNode)
root.render(<App/>)