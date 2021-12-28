import {AxiosResponse} from 'axios';
import {groupBy} from "./helpers";
import {SetlistfmAPIRequestClient} from "./request/SetlistFmAPI";
import {ArtistRepository} from "./repository/ArtistRepository";
import dayjs from "dayjs";
import { SetlistRepository } from './repository/SetlistRepository';
import { TrackRepository } from './repository/TrackRepository';

class SetlistUpdater {
    protected setlistEntries: any[] = []

    protected artistsMbidsMappedToDbIds: { [key: string]: number } = {}

    protected artists: any[] = []
    protected setlists: any[] = []
    protected setlistTracks: any[] = []

    private setlistRequestClient: SetlistfmAPIRequestClient
    private artistRepository: ArtistRepository;
    private setlistRepository: SetlistRepository;
    private trackRepository: TrackRepository;

    public constructor(
        setlistRequestClient: SetlistfmAPIRequestClient,
        artistRepository: ArtistRepository,
        setlistRepository: SetlistRepository,
        trackRepository: TrackRepository,
    ) {
        this.setlistRequestClient = setlistRequestClient;
        this.artistRepository = artistRepository;
        this.setlistRepository = setlistRepository;
        this.trackRepository = trackRepository;
    }

    public async runArtistUpdate(musicbrainzId: string) {
        await this.fetchArtistSetlists(musicbrainzId)

        console.log('Done fetching all setlists')

        this.parseSetlistEntries()

        console.log('Parsing finished')

        await this.update()

        console.log('Updated')

        this.cleanUp()
    }

    public async runSingleSetlistUpdate(setlistId: string) {
        await this.fetchSingleSetlist(setlistId)

        this.parseSetlistEntries()

        await this.update()

        this.cleanUp()
    }

    public async runSingleUserUpdate(userId: string) {
        await this.fetchUserAttendedSetlists(userId)

        // Move to: afterFetch()
        this.parseSetlistEntries()
        await this.update()

        const setlistIds = this.setlists.map((setlist: any) => setlist.id)

        this.cleanUp()

        return setlistIds
    }

    protected cleanUp() {
        this.artists = []
        this.setlists = []
        this.setlistTracks = []
        this.setlistEntries = []
    }

    // logic is kinda duplicating from fetchArtistSetlists
    public async fetchUserAttendedSetlists(userId: string) {
        const firstPage = await this.setlistRequestClient.fetchUserAttendedSetlists(userId)

        const pageCount = Math.ceil(firstPage.data.total / firstPage.data.itemsPerPage)

        this.pushSetlistEntriesFromPaginationResponse(firstPage)

        let page = 2

        while (page <= pageCount) {
            await this.setlistRequestClient.fetchUserAttendedSetlists(userId, page).then(response => {
                this.pushSetlistEntriesFromPaginationResponse(response)

                page++
            })
        }

        return this
    }

    public async fetchArtistSetlists(musicbrainzId: string) {
        const firstPage = await this.setlistRequestClient.fetchSetlistsPage(musicbrainzId)

        const pageCount = Math.ceil(firstPage.data.total / firstPage.data.itemsPerPage)

        this.pushSetlistEntriesFromPaginationResponse(firstPage)

        let page = 2

        while (page <= pageCount) {
            await this.setlistRequestClient.fetchSetlistsPage(musicbrainzId, page).then(response => {
                this.pushSetlistEntriesFromPaginationResponse(response)

                page++
            })
        }

        return this
    }

    public async fetchSingleSetlist(setlistId: string) {
        const response = await this.setlistRequestClient.fetchSetlist(setlistId)

        this.setlistEntries.push(response.data)
    }

    public async getCachedArtistDbIdFromMusicbrainzId(musicbrainzId: string): Promise<number> {
        if (this.artistsMbidsMappedToDbIds[musicbrainzId]) {
            console.log("CACHED")
            return this.artistsMbidsMappedToDbIds[musicbrainzId]
        }

        console.log("NOT CACHED")

        const artistDbId = await this.artistRepository.findOrInsertArtist(musicbrainzId)

        this.artistsMbidsMappedToDbIds[musicbrainzId] = artistDbId

        return artistDbId
    }

    public pushSetlistEntriesFromPaginationResponse(response: AxiosResponse) {
        response.data.setlist.forEach((setlistItem: any, setlistIndex: number) => {
            this.setlistEntries.push(setlistItem)
        })
    }

    protected parseSetlistEntries() {
        this.setlistEntries.forEach((setlistEntry: any) => {
            this.parseSetlistEntry(setlistEntry)
        })
    }

    protected parseSetlistEntry(setlist: any) {
        // Artists
        this.artists[setlist.artist.mbid] = {
            musicbrainz_id: setlist.artist.mbid,
            artist_name: setlist.artist.name
        }

        // Setlists
        let parts = setlist.eventDate.split('-')
        // Note: months are 0-based
        let eventDate = `${parts[2]}-${parts[1]}-${parts[0]}`
        console.log(eventDate)
        // expected 1975-12-25, have 12-09-2019
        // TODO: Key by setlist ID?
        this.setlists.push({
            id: setlist.id,
            artist_id: setlist.artist.mbid, // this has to be mapped to a database artist_id for later
            date: eventDate,
            venue: JSON.stringify(setlist.venue),
            venue_name: setlist.venue.name,
            city_name: setlist.venue.city.name,
            state_name: setlist.venue.city.state,
            country_name: setlist.venue.city.country.name,
            url: setlist.url,
            note: setlist.info ?? null,
            tour_name: setlist?.tour?.name ?? null,
            last_revision: setlist?.lastUpdated ? dayjs(setlist.lastUpdated).format('YYYY-MM-DD HH:mm:ss') : null
        })

        // Tracks
        let songIndexOverall = 0

        setlist.sets.set.forEach((setItem: any, setIndex: number) => {
            setItem.song.forEach((songItem: any, songIndex: number) => {
                // TODO: Key by setlist ID?
                this.setlistTracks.push({
                    setlist_id: setlist.id,
                    // There are some edge cases where there is no name, such as for Unknown songs, intro songs.
                    // Web displays "Unknown" or "Intro" respectively but in the API name is just empty string.
                    // See these following setlist IDs: 43d6e773 53d7a32d 43de0fcf 43de0fcf
                    name: songItem.name === '' ? null : songItem.name,
                    tape: songItem.tape !== undefined,
                    cover: songItem.cover ? JSON.stringify(songItem.cover) : null,
                    with: songItem.with ? JSON.stringify(songItem.with) : null,
                    note: songItem.info ?? null,
                    order_number: songIndexOverall,
                    // Only set name for first track in set
                    set_name: setItem.name && songIndex === 0 ? setItem.name : null,
                    // Set number is different from encore number, setlists without encore but multiple sets can exist
                    // and encore property may not be always present. See setlist ID: 5bd0db0c
                    set_number: setIndex,
                    encore: setItem.encore ?? null
                })

                songIndexOverall++
            })
        })
    }

    protected async mapSetlistEntryArtistMbidToArtistDbId(setlist: any) {
        console.log("mapSetlistEntryMbidToArtistDbId setlist.artist_id", setlist.artist_id)
        setlist.artist_id = await this.getCachedArtistDbIdFromMusicbrainzId(setlist.artist_id)

        return setlist;
    }

    protected async update() {
        // Object.entries because we are keying by Musicbrainz ID
        for (let [artistMbid, artist] of Object.entries(this.artists)) {
            console.log('update/insert artist', artist)
            await this.artistRepository.findOrInsertArtist(artist.musicbrainz_id, artist.artist_name)
        }

        for (let setlistItem of this.setlists) {
            console.log(`Querying setlist ID: ${setlistItem.id}`)

            console.log("ARIST ID DB BEFORE:", setlistItem.artist_id)

            const setlist = await this.mapSetlistEntryArtistMbidToArtistDbId(setlistItem)

            console.log("ARIST ID DB AFTER:", setlist.artist_id)

            const setlistExists = await this.setlistRepository.checkIfSetlistExistsBySetlistId(setlist.id)

            console.log(setlistExists)
            console.log(`Setlist exists: ${setlistExists ? 'true' : 'false'}`)

            if (setlistExists) {
                console.log(`Updating existing setlist with ID ${setlist.id}`)

                await this.setlistRepository.updateSetlistBySetlistId(setlist, setlist.id)
            } else {
                console.log(`Inserting new setlist with ID ${setlist.id}`)

                await this.setlistRepository.insertSetlist(setlist)
            }
        }
        // Grouping here does not guarantee that same track won't be inserted multiple times
        const tracksGroupedBySetlistId: Array<any> = groupBy(this.setlistTracks, 'setlist_id')

        for (const [setlistId, setlistTracks] of Object.entries(tracksGroupedBySetlistId)) {
            console.log(`Wiping setlist tracks for setlist ID ${setlistId}`)

            await this.trackRepository.deleteAllTracksBySetlistId(setlistId)

            console.log(`Inserting new setlist tracks for setlist ID ${setlistId}`)

            await this.trackRepository.insertTracks(setlistTracks)
        }

        return true
    }
}

export default SetlistUpdater