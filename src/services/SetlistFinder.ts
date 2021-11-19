import {ArtistRepository} from "../repository/ArtistRepository";
import {SetlistRepository} from "../repository/SetlistRepository";
import {SetlistInterface} from "../types/setlist";

export class SetlistFinder {
    private artistRepository: ArtistRepository;
    private setlistRepository: SetlistRepository;

    constructor(artistRepository: ArtistRepository, setlistRepository: SetlistRepository) {
        this.artistRepository = artistRepository;
        this.setlistRepository = setlistRepository;
    }

    public async invoke(guildId: number, query: string): Promise<SetlistInterface> {
        // if (!this.interaction.isCommand()) return;
        //
        // if (!this.interaction.inGuild()) {
        //     return this.interaction.reply({
        //         content: 'Sorry, this bot is not available through DMs',
        //         ephemeral: true
        //     })
        // }
        //
        // const query = this.interaction.options.getString('query')
        //
        // if (!query) {
        //     return this.interaction.reply('Missing query parameter')
        // }
        //
        // const guildId = this.interaction.guildId

        const artistId: number | undefined = await this.artistRepository.getArtistIdForGuildId(guildId);

        if (!artistId) {
            throw new ArtistDoesntExistException();
            //return this.interaction.reply('No artist ID set in this server')
        }

        // todo: validation for empty or trash input

        const idFromAutocomplete = query.startsWith('id:') ? query.replace('id:', '') : null

        let setlist;

        if (idFromAutocomplete) {
            setlist = await this.setlistRepository.getSetlistById(idFromAutocomplete);
        } else {
            setlist = await this.setlistRepository.getSetlistBySearchQuery(query, artistId);
        }

        if (!setlist) {
            throw new SetlistNotFoundException();
            // return await this.interaction.reply('No setlist was found!')
        }

        return setlist;

        //let setlist = await getFullSetlistData(setlistDb.id)

        // const embed = new MessageEmbed()
        //     // Set the title of the field
        //     .setTitle(setlist.getLocationAndDateText())
        //     .setURL(setlist.url)
        //     .setColor(0xff0000)
        //     .setDescription(setlist.getTrackListText());
        //
        // throw new Error();
        // // await this.interaction.reply({
        // //     embeds: [embed]
        // // });
    }
}

export class ArtistDoesntExistException extends Error {
    constructor() {
        super();
    }
}

export class SetlistNotFoundException extends Error {
    constructor() {
        super();
    }
}