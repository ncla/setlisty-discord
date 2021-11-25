import {AxiosResponse} from 'axios';
import {groupBy} from "./helpers";
import knexClient from "./helpers/knexClient";
import {SetlistfmRequestClient} from "./request/SetlistFm";
import {ArtistRepository} from "./repository/ArtistRepository";

class SetlistUpdater {
    public musicbrainzId: string
    protected artistIdInDb?: number
    protected responses: any[] = []
    protected setlists: any[] = []
    protected setlistTracks: any[] = []
    private setlistRequestClient: SetlistfmRequestClient
    private artistRepository: ArtistRepository;

    public constructor(musicbrainzId: string, setlistRequestClient: SetlistfmRequestClient, artistRepository: ArtistRepository) {
        this.musicbrainzId = musicbrainzId
        this.setlistRequestClient = setlistRequestClient;
        this.artistRepository = artistRepository;
    }

    public async run() {
        if (this.musicbrainzId === undefined) {
            return;
        }

        this.artistIdInDb = await this.artistRepository.findOrInsertArtist(this.musicbrainzId)

        await this.fetchAllSetlists(this.musicbrainzId)
        console.log('done scraping')
        this.responses.forEach((response: any) => {
            this.parseApiResponseSetlistList(response)
        })

        await this.update()
    }

    public async fetchAllSetlists(musicbrainzId: string) {
        const firstPage = await this.setlistRequestClient.fetchSetlistsPage(musicbrainzId)

        const pageCount = Math.ceil(firstPage.data.total / firstPage.data.itemsPerPage)

        this.responses.push(firstPage)

        let page = 2

        while (page <= pageCount) {
            await this.setlistRequestClient.fetchSetlistsPage(musicbrainzId, page).then(response => {
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
        // TODO: Key by setlist ID?
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

                // TODO: Key by setlist ID?
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
        // Grouping here does not guarantee that same track won't be inserted multiple times
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