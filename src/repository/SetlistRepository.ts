import {SetlistInterface} from "../types/setlist";
import {getFullSetlistData} from "../helpers/setlist";

export class SetlistRepository {
    private knexClient;

    constructor(knexClient: any) {
        this.knexClient = knexClient;
    }

    async getSetlistById(id: string): Promise<SetlistInterface | undefined> {
        try {
            return getFullSetlistData(id)
        } catch (e) {
            return undefined
        }
    }

    async getSetlistBySearchQuery(query: string, artistId: number): Promise<SetlistInterface | undefined> {
        const setlist = await this.knexClient('setlists')
            .select('id')
            .whereRaw('MATCH (searchable_full_name) AGAINST (?)', [query])
            .where({
                artist_id: artistId
            })
            .first()

        if (!setlist) return undefined

        return getFullSetlistData(setlist.id)
    }
}