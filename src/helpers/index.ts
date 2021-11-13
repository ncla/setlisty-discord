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