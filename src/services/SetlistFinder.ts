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
        const artistId: number | undefined = await this.artistRepository.getArtistIdForGuildId(guildId);

        if (!artistId) {
            throw new SetlistFinder.ArtistNotFoundException();
        }

        const idFromAutocomplete = query.startsWith('id:') ? query.replace('id:', '') : null

        let setlist;

        if (idFromAutocomplete) {
            setlist = await this.setlistRepository.getSetlistById(idFromAutocomplete);
        } else {
            setlist = await this.setlistRepository.getSetlistBySearchQuery(query, artistId);
        }

        if (!setlist) {
            throw new SetlistFinder.SetlistNotFoundException();
        }

        return setlist;
    }
}