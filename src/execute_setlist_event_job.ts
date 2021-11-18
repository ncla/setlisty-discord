import knexClient, {now} from "./helpers/knexClient";
import axios from "axios";
import {SetlistDbInterface} from "./types/setlist";
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

async function getFirstSetlistWithNoPageCheck(): Promise<SetlistDbInterface|undefined> {
    return await knexClient<SetlistDbInterface>('setlists')
        .whereNull('setlist_page_last_checked')
        .first()
}

async function fetchSetlistPage(url: string) {
    return await axios.get(url)
}

function parsePageForEventData(html: string): null | any {
    const dom = new JSDOM(html);
    const document = dom.window.document

    const festivalEl = document.querySelector(".festivalBg")

    if (!festivalEl) return null

    const anchorEl = festivalEl.querySelector('a.nested[href][title]')

    if (!anchorEl) return null

    return {
        eventName: anchorEl.textContent.replace(/(?:\d{4} )?setlists$/, '').trim(),
        eventId: anchorEl.getAttribute('href').match(/(\w+)\.html$/)[1],
        // url: (new URL(anchorEl.getAttribute('href'), 'https://setlist.fm')).href
    }
}

async function updateSetlist(setlistId: string, eventId: string|null, eventName: string|null) {
    return await knexClient('setlists')
        .where({
            id: setlistId
        })
        .update({
            event_id: eventId,
            event_name: eventName,
            setlist_page_last_checked: now
        })
}

async function execute(setlist: SetlistDbInterface) {
    const response = await fetchSetlistPage(setlist.url)

    const parsed = parsePageForEventData(response.data)

    console.log(setlist.id, parsed)

    if (parsed) {
        const {eventName, eventId} = parsed

        await updateSetlist(setlist.id, eventId, eventName)
    } else {
        await updateSetlist(setlist.id, null, null)
    }
}

async function tryExecute() {
    const setlist = await getFirstSetlistWithNoPageCheck()

    if (!setlist) return

    try {
        await execute(setlist)
    } catch (err) {
        console.log(err)
        await updateSetlist(setlist.id, null, null)
    }
}

tryExecute().then(() => knexClient.destroy())