export function replacer(key, value) {
    if (value instanceof Map) {
        return Object.fromEntries(value.entries())
        return {
            type: 'Map',
            data: Array.from(value.entries()),
        }
    } else if (value instanceof Set) {
        return Array.from(value.values())
        return {
            type: 'Set',
            data: Array.from(value.values()),
        }
    } else {
        return value
    }
}

export function reviver(key, value) {
    if (typeof value === 'object' && value !== null) {
        if (value.type === 'Map') {
            return new Map(value.data)
        } else if(value.type === 'Set') {
            return new Set(value.data)
        }
    }
    return value
}
