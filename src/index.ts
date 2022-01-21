import {SetArtist} from "./commands/SetArtist";

const {Client, Intents} = require('discord.js');
import {Interaction} from "discord.js";
import Config from "./config";
import SetlistFinder from "./services/SetlistFinder";
import knexClient from "./helpers/knexClient";
import {ArtistRepository} from "./repository/ArtistRepository";
import {SetlistRepository} from "./repository/SetlistRepository";
import {ShowSetlistInteraction} from "./interactions/ShowSetlistInteraction";
import {SetlistfmAPIRequestClient} from "./request/SetlistFmAPI";
import {AutocompleteSetlists} from "./autocomplete/Setlists";
import {AutocompleteArtists} from "./autocomplete/Artists";
import {MusicbrainzRequestClient} from "./request/Musicbrainz";
import {ShowAnySetlistInteraction} from "./interactions/ShowAnySetlistInteraction";
import {SetlistfmWebRequestClient} from "./request/SetlistFmWeb";
import SetlistUpdater from "./services/SetlistUpdater";
import SetlistFinderWeb from "./services/SetlistFinderWeb";
import {SetlistFmWebSearchResultsParser} from "./parsers/SetlistFmWebSearchResults";
import {InteractionGuardException} from "./helpers/exceptions";
import { TrackRepository } from "./repository/TrackRepository";
import { LinkAccount } from "./interactions/LinkAccount";
import { UserRepository } from "./repository/UserRepository";
import { UnlinkAccount } from "./interactions/UnlinkAccount";
import { AccountManager } from "./services/AccountManager";
import { RefreshAccount } from "./interactions/RefreshAccount";

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

const setlistRequestorApi = new SetlistfmAPIRequestClient()
const setlistRequestorWeb = new SetlistfmWebRequestClient()
const setlistFmWebSearchResultsParser = new SetlistFmWebSearchResultsParser()
const setlistFinderWeb = new SetlistFinderWeb(setlistRequestorWeb, setlistFmWebSearchResultsParser)
const artistRepo = new ArtistRepository(knexClient)
const setlistRepo = new SetlistRepository(knexClient)
const trackRepo = new TrackRepository(knexClient)
const userRepo = new UserRepository(knexClient)
const setlistFinder = new SetlistFinder(
    new ArtistRepository(knexClient),
    setlistRepo
)
const musicBrainzRequestClient = new MusicbrainzRequestClient()

const accountManager = new AccountManager(
    setlistRequestorApi,
    userRepo
)

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

                console.log(err)
                return await interaction.reply('Encountered unexpected exception')
            }
        }

        if (interaction.commandName === 'show-any') {
            return new ShowAnySetlistInteraction(
                interaction,
                setlistFinderWeb,
                new SetlistUpdater(setlistRequestorApi, artistRepo, setlistRepo, trackRepo),
                setlistRepo
            ).invoke()
        }

        if (interaction.commandName === 'account' && interaction.options.getSubcommand() === 'link') {
            return new LinkAccount(
                interaction,
                accountManager
            ).invoke()
        }

        if (interaction.commandName === 'account' && interaction.options.getSubcommand() === 'unlink') {
            return new UnlinkAccount(
                interaction,
                accountManager
            ).invoke()
        }

        if (interaction.commandName === 'account' && interaction.options.getSubcommand() === 'refresh') {
            return new RefreshAccount(
                interaction,
                accountManager
            ).invoke()
        }

        if (interaction.commandName === 'set-artist') {
            return new SetArtist(interaction, setlistRequestorApi)
        }
    }

    if (interaction.isAutocomplete()) {
        if (interaction.commandName === 'show') {
            return new AutocompleteSetlists(interaction, setlistRepo)
        }

        if (interaction.commandName === 'set-artist') {
            return new AutocompleteArtists(interaction, musicBrainzRequestClient)
        }
    }
});

client.login(Config.discord.token)