// lodash?
export function groupBy(xs: Array<any>, key: string) {
    return xs.reduce(function(rv, x) {
        (rv[x[key]] = rv[x[key]] || []).push(x);
        return rv;
    }, {});
}

// replace lodash
export function escapeRegExp(string: string) {
    return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
}

export function truncateString(str: string, length:number) {
    var dots = str.length > length ? '...' : '';
    return str.substring(0, length - 3) + dots;
}

export function filterAndBuildSearchMatchAgainstQuery(query: string) {
    // Filter out operators that would error out the query
    // https://stackoverflow.com/questions/26507087/escape-string-for-use-in-mysql-fulltext-search#answer-26537463
    const userQueryFilteredFromOperators = query.replace(/[^\p{L}\p{N}_]+/ug, ' ')

    // Remove any excessive spaces
    const longSpacesRemoved = userQueryFilteredFromOperators.replace(/\s{2,}/g, ' ')

    const againstWithWildcard = `(${longSpacesRemoved.trim().split(' ').map(word => word + '*').join(' ')})`
    const againstNormal = `("${longSpacesRemoved.trim()}")`

    return `${againstWithWildcard} ${againstNormal}`
}