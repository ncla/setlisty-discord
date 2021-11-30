import {AxiosResponse} from "axios";
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

export interface ParsedSearchResult {
    setlistId: string,
}

export class SetlistFmWebSearchResultsParser {
    public parse(response: AxiosResponse): Array<ParsedSearchResult> {
        const dom = new JSDOM(response.data);
        const document = dom.window.document

        const noResultsAlert = document.querySelector(".festivalBg")

        if (noResultsAlert) {
            return []
        }

        const setlistPreviews = document.querySelectorAll('div.row.contentBox .setlistPreview')

        let setlists: Array<ParsedSearchResult> = []

        setlistPreviews.forEach((setlistPreviewEl: Element) => {
            const anchorEl = setlistPreviewEl.querySelector('h2 a')

            if (!anchorEl) return

            const hrefAttr = anchorEl.getAttribute('href')

            if (!hrefAttr) return

            const regexId = hrefAttr.match(/(\w+)\.html$/)

            if (!regexId) return

            setlists.push(<ParsedSearchResult>{
                setlistId: regexId[1]
            })
        })

        return setlists
    }
}