import {AutocompleteArtists} from "./autocomplete/Artists";

const { Client, Intents } = require('discord.js');
import {ShowSetlist} from './commands/ShowSetlist'
import {Interaction} from "discord.js";
import Config from "./config";
import {AutocompleteSetlists} from "./autocomplete/Setlists";
import {SetArtist} from "./commands/SetArtist";
import {SetlistfmRequestClient} from "./request/SetlistFm";
import {MusicbrainzRequestClient} from "./request/Musicbrainz";

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

const SetlistRequestor = new SetlistfmRequestClient()

client.on('ready', () => {
    console.log(`Client is logged in as ${client.user!.tag} and ready!`);
    client.user!.setActivity('/show to start', { type: 'LISTENING' })
});

client.on('interactionCreate', async (interaction: Interaction) => {
    if (interaction.isAutocomplete() && interaction.commandName === 'show') {
        return new AutocompleteSetlists(interaction)
    }

    if (interaction.isAutocomplete() && interaction.commandName === 'set-artist') {
        return new AutocompleteArtists(interaction, new MusicbrainzRequestClient())
    }

    if (!interaction.isCommand()) return;

    if (interaction.commandName === 'show') {
        return new ShowSetlist(interaction)
    }

    if (interaction.commandName === 'set-artist') {
        return new SetArtist(interaction, SetlistRequestor)
    }
});

client.login(Config.discord.token)