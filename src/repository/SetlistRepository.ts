import {SetlistInterface} from "../types/setlist";
import {getFullSetlistData, Setlist} from "../helpers/setlist";
import knexClient from "../helpers/knexClient";

export class SetlistRepository {
    private knexClient;

    constructor(knexClient: any) {
        this.knexClient = knexClient;
    }

    async getSetlistById(id: string): Promise<Setlist | undefined> {
        try {
            return getFullSetlistData(id)
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
            .select(knexClient.raw('MATCH (searchable_full_name) AGAINST (? IN BOOLEAN MODE) as score', [againstBinding]))
            .where({
                artist_id: artistId
            })
            .having('score', '>', 0)
            .orderBy('score', 'desc')
            .first()

        if (!setlist) return undefined

        return getFullSetlistData(setlist.id)
    }
}