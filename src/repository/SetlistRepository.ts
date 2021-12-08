import {Setlist} from "../helpers/setlist";
import {SetlistDbInterface, SetlistOptions, Track, TrackArtist, Venue} from "../types/setlist";
import {Knex} from "knex";

export class SetlistRepository {
    private knexClient;

    constructor(knexClient: Knex) {
        this.knexClient = knexClient;
    }

    async getFullSetlistData(setlistId: string): Promise<Setlist> {
        let setlist = await this.knexClient<SetlistDbInterface>('setlists').where({id: setlistId}).first()

        if (!setlist) {
            throw Error('Setlist not found')
        }

        let venue = JSON.parse(setlist.venue)

        let venueObj = <Venue>{
            name: venue.name,
            cityname: venue.city.name,
            statename: venue.city.state,
            countryname: venue.city.country.name
        }

        let tracksDb = await this.knexClient<Track>('setlist_tracks')
            .where({setlist_id: setlistId})
            .orderBy('order_number', 'asc')

        tracksDb.map((track: Track) => {
            if (track.with !== null && typeof track.with === "string") {
                track.with = <TrackArtist>JSON.parse(track.with)
            }

            if (track.cover !== null && typeof track.cover === "string") {
                track.cover = <TrackArtist>JSON.parse(track.cover)
            }

            return track
        })

        // console.log(tracksDb)

        return new Setlist(<SetlistOptions>{
            id: setlist.id,
            date: setlist.date,
            url: setlist.url,
            tracks: tracksDb,
            event_id: setlist.event_id,
            event_name: setlist.event_name,
            venue: venueObj,
            note: setlist.note,
            tour_name: setlist.tour_name,
            last_revision: setlist.last_revision,
            created_at: setlist.created_at,
            updated_at: setlist.updated_at
        })
    }

    async getSetlistById(id: string): Promise<Setlist | undefined> {
        try {
            return await this.getFullSetlistData(id)
        } catch (e) {
            return undefined
        }
    }

    async getSetlistBySearchQuery(query: string, artistId: number): Promise<Setlist | undefined> {
        const againstWithWildcard = `(${query.split(' ').map(word => word + '*').join(' ')})`
        const againstNormal = `("${query}")`

        const againstBinding = `${againstWithWildcard} ${againstNormal}`;

        const setlist = await this.knexClient('setlists')
            .select('id')
            .select(this.knexClient.raw('MATCH (searchable_full_name) AGAINST (? IN BOOLEAN MODE) as score', [againstBinding]))
            .where({
                artist_id: artistId
            })
            .having('score', '>', 0)
            .orderBy('score', 'desc')
            .first()

        if (!setlist) return undefined

        return this.getFullSetlistData(setlist.id)
    }
}