import {SetArtist} from "./commands/SetArtist";

const {Client, Intents} = require('discord.js');
import {Interaction} from "discord.js";
import Config from "./config";
import SetlistFinder from "./services/SetlistFinder";
import knexClient from "./helpers/knexClient";
import {ArtistRepository} from "./repository/ArtistRepository";
import {SetlistRepository} from "./repository/SetlistRepository";
import {InteractionGuardException, ShowSetlistInteraction} from "./interactions/ShowSetlistInteraction";
import {SetlistfmAPIRequestClient} from "./request/SetlistFmAPI";
import {AutocompleteSetlists} from "./autocomplete/Setlists";
import {AutocompleteArtists} from "./autocomplete/Artists";
import {MusicbrainzRequestClient} from "./request/Musicbrainz";
import {ShowAnySetlistInteraction} from "./interactions/ShowAnySetlistInteraction";
import {SetlistfmWebRequestClient} from "./request/SetlistFmWeb";
import SetlistUpdater from "./setlist-updater";

// See: http://knexjs.org/#typescript-support
// declare module 'knex/types/tables' {
//     interface Tables {
//         setlists: SetlistDbInterface;
//         setlists_composite: knex.CompositeTableType<
//             SetlistDbInterface,
//             SetlistDbInterface,
//             Partial<Omit<SetlistDbInterface, 'id'>>
//             >;
//         setlist_tracks: Track,
//         setlist_tracks_composite: knex.CompositeTableType<
//             Track,
//             Track,
//             Partial<Omit<Track, 'id'>>
//             >
//     }
// }

const client = new Client({
    intents: [Intents.FLAGS.GUILDS]
});

const SetlistRequestorApi = new SetlistfmAPIRequestClient()
const SetlistRequestorWeb = new SetlistfmWebRequestClient()
const ArtistRepo = new ArtistRepository(knexClient)
const SetlistRepo = new SetlistRepository(knexClient)
const setlistFinder = new SetlistFinder(
    new ArtistRepository(knexClient),
    SetlistRepo
)
const setlistUpdater = new SetlistUpdater(SetlistRequestorApi, ArtistRepo)
const musicBrainzRequestClient = new MusicbrainzRequestClient()

client.on('ready', () => {
    console.log(`Client is logged in as ${client.user!.tag} and ready!`);
    client.user!.setActivity('/show to start', {type: 'LISTENING'})
});

client.on('interactionCreate', async (interaction: Interaction) => {
    if (interaction.isCommand()) {
        if (interaction.commandName === 'show') {
            const showSetlistInteraction = new ShowSetlistInteraction(interaction, setlistFinder)

            try {
                await showSetlistInteraction.invoke()
            } catch (err) {
                if (err instanceof InteractionGuardException) {
                    return await interaction.reply(err.options)
                }

                return await interaction.reply('Encountered unexpected exception')
            }
        }

        if (interaction.commandName === 'show-any') {
            return new ShowAnySetlistInteraction(interaction, SetlistRequestorWeb, setlistUpdater, SetlistRepo).invoke()
        }

        if (interaction.commandName === 'set-artist') {
            return new SetArtist(interaction, SetlistRequestorApi)
        }
    }

    if (interaction.isAutocomplete()) {
        if (interaction.commandName === 'show') {
            return new AutocompleteSetlists(interaction, SetlistRepo)
        }

        if (interaction.commandName === 'set-artist') {
            return new AutocompleteArtists(interaction, musicBrainzRequestClient)
        }
    }
});

client.login(Config.discord.token)