import {Setlist} from "../helpers/setlist";
import {SetlistDbInterface, SetlistOptions, Track, Venue} from "../types/setlist";
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

        return new Setlist(<SetlistOptions>{
            id: setlist.id,
            date: setlist.date,
            url: setlist.url,
            tracks: tracksDb,
            event_id: setlist.event_id,
            event_name: setlist.event_name,
            venue: venueObj
        })
    }

    async getSetlistById(id: string): Promise<Setlist | undefined> {
        try {
            return this.getFullSetlistData(id)
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