import {ArtistRepository} from "../repository/ArtistRepository";
import {SetlistRepository} from "../repository/SetlistRepository";
import {Setlist} from "../helpers/setlist";
import TypedException from "../helpers/TypedException";

export default class SetlistFinder {
    static ArtistNotFoundException = class extends TypedException {}
    static SetlistNotFoundException = class extends TypedException {}

    private artistRepository: ArtistRepository;
    private setlistRepository: SetlistRepository;

    constructor(artistRepository: ArtistRepository, setlistRepository: SetlistRepository) {
        this.artistRepository = artistRepository;
        this.setlistRepository = setlistRepository;
    }

    /**
     * @throws ArtistNotFoundException
     * @throws SetlistNotFoundException
     */
    public async invoke(guildId: string, query: string): Promise<Setlist> {
        const artistId = await this.findArtistIdForGuild(guildId)
        return this.findSetlist(query, artistId)
    }

    /**
     * @throws SetlistNotFoundException
     */
    private async findSetlist(query: string, artistId: number): Promise<Setlist> {
        let setlist = await this.getSetlistByAutocompleteQuery(query)
            ?? await this.setlistRepository.getSetlistBySearchQuery(query, artistId)

        if (!setlist) {
            throw new SetlistFinder.SetlistNotFoundException()
        }

        return setlist
    }

    private async getSetlistByAutocompleteQuery(query: string): Promise<Setlist | undefined> {
        if (query.startsWith('id:')) {
            const id = query.replace('id:', '')
            return this.setlistRepository.getSetlistById(id)
        }
    }

    /**
     * @throws ArtistNotFoundException
     */
    private async findArtistIdForGuild(guildId: string): Promise<number> {
        const artistId = await this.artistRepository.getArtistIdForGuildId(guildId)

        if (!artistId) {
            throw new SetlistFinder.ArtistNotFoundException()
        }

        return artistId
    }
}