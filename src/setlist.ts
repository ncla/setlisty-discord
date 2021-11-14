import axios, {AxiosInstance, AxiosResponse} from 'axios';
import knex from 'knex';
import {groupBy} from "./helpers";
import * as util from "util";
import {findOrInsertArtist} from "./helpers/setlist";
const env: string = process.env.NODE_ENV || 'development'
import knexClient from "./helpers/knexClient";
import Config from "./config";

class SetlistUpdater {
    public musicbrainzId: string
    protected artistIdInDb?: number
    protected responses: any[] = []
    protected setlists: any[] = []
    protected setlistTracks: any[] = []
    private axios: AxiosInstance;

    public constructor(musicbrainzId: string) {
        this.musicbrainzId = musicbrainzId

        this.axios = axios.create({
            baseURL: Config.setlistfm.baseURL,
            timeout: 15000,
            headers: {
                'accept': 'application/json',
                'x-api-key': Config.setlistfm.apiKey
            }
        })
    }

    public async run() {
        if (this.musicbrainzId === undefined) {
            return;
        }

        this.artistIdInDb = await findOrInsertArtist(this.musicbrainzId)

        await this.fetchAllSetlists(this.musicbrainzId)
        console.log('done scraping')
        this.responses.forEach((response: any) => {
            this.parseApiResponseSetlistList(response)
        })

        await this.update()
    }

    public async fetchAllSetlists(musicbrainzId: string) {
        const firstPage = await this.axios.get(`artist/${musicbrainzId}/setlists`)
        // console.log(firstPage, firstPage.data)
        // console.log(util.inspect(firstPage, {showHidden: false, depth: null, colors: true}))
        // return;
        // console.log('eee')
        // console.dir(firstPage.data, { depth: null });

        const pageCount = Math.ceil(firstPage.data.total / firstPage.data.itemsPerPage)
        // const pageCount = 2

        this.responses.push(firstPage)

        let page = 2

        while (page <= pageCount) {
            await this.axios.get(`artist/${musicbrainzId}/setlists?p=${page}`).then(response => {
                // console.log(page, response.data.page)
                this.responses.push(response)
                page++
            })
        }

        return this
    }

    protected parseApiResponseSetlistList(response: AxiosResponse) {
        response.data.setlist.forEach((setlistItem: any, setlistIndex: number) => {
            this.parseApiSetlistItemFromSetlistArray(setlistItem)
        })

        return this
    }

    protected parseApiSetlistItemFromSetlistArray(setlist: any) {
        let parts = setlist.eventDate.split('-')
        // Note: months are 0-based
        let eventDate = `${parts[2]}-${parts[1]}-${parts[0]}`
        console.log(eventDate)
        // expected 1975-12-25, have 12-09-2019
        this.setlists.push({
            id: setlist.id,
            artist_id: this.artistIdInDb,
            date: eventDate,
            venue: JSON.stringify(setlist.venue),
            venue_name: setlist.venue.name,
            city_name: setlist.venue.city.name,
            state_name: setlist.venue.city.state,
            country_name: setlist.venue.city.country.name,
            url: setlist.url
        })

        let songIndexOverall = 0

        setlist.sets.set.forEach((setItem: any) => {
            setItem.song.forEach((songItem: any, songIndex: number) => {
                // There are some edge cases where there is no name, such as for Unknown songs.
                if (songItem.name === '') return

                this.setlistTracks.push({
                    setlist_id: setlist.id,
                    name: songItem.name,
                    tape: songItem.tape !== undefined,
                    set_number: setItem.encore ?? 0,
                    note: songItem.info ?? null,
                    order_number: songIndexOverall
                })

                songIndexOverall++
            })
        })
    }

    protected async update() {
        for (const setlist of this.setlists) {
            console.log(`Querying setlist ID: ${setlist.id}`)

            const existing = await knexClient('setlists')
                .where({id: setlist.id}).then(rows => rows.length)

            // console.log(existing)

            console.log(`Setlist exists: ${existing ? 'true' : 'false'}`)

            if (existing) {
                console.log(`Updating existing setlist with ID ${setlist.id}`)

                await knexClient('setlists')
                    .where({id: setlist.id})
                    .update(setlist)
            } else {
                console.log(`Inserting new setlist with ID ${setlist.id}`)

                await knexClient('setlists').insert(setlist)
            }
        }

        const tracksGroupedBySetlistId: Array<any> = groupBy(this.setlistTracks, 'setlist_id')

        for (const [setlistId, setlistTracks] of Object.entries(tracksGroupedBySetlistId)) {
            console.log(`Wiping setlist tracks for setlist ID ${setlistId}`)

            await knexClient('setlist_tracks')
                .where('setlist_id', setlistId)
                .del()

            console.log(`Inserting new setlist tracks for setlist ID ${setlistId}`)

            await knexClient('setlist_tracks')
                .insert(setlistTracks)
        }

        return true
    }
}

export default SetlistUpdater