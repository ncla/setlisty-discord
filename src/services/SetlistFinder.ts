import {ArtistRepository} from "../repository/ArtistRepository";
import {SetlistRepository} from "../repository/SetlistRepository";
import {Setlist} from "../helpers/setlist";

export class SetlistFinder {
    private artistRepository: ArtistRepository;
    private setlistRepository: SetlistRepository;

    constructor(artistRepository: ArtistRepository, setlistRepository: SetlistRepository) {
        this.artistRepository = artistRepository;
        this.setlistRepository = setlistRepository;
    }

    public async invoke(guildId: string, query: string): Promise<Setlist> {
        const artistId: number | undefined = await this.artistRepository.getArtistIdForGuildId(guildId);

        if (!artistId) {
            throw new ArtistNotFoundException();
        }

        const idFromAutocomplete = query.startsWith('id:') ? query.replace('id:', '') : null

        let setlist;

        if (idFromAutocomplete) {
            setlist = await this.setlistRepository.getSetlistById(idFromAutocomplete);
        } else {
            setlist = await this.setlistRepository.getSetlistBySearchQuery(query, artistId);
        }

        if (!setlist) {
            throw new SetlistNotFoundException();
        }

        return setlist;
    }
}

export class ArtistNotFoundException extends Error {
    constructor() {
        super();
    }
}

export class SetlistNotFoundException extends Error {
    constructor() {
        super();
    }
}