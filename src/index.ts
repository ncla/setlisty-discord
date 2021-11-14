const { Client, Intents } = require('discord.js');
import {ShowSetlist} from './commands/ShowSetlist'
import {Interaction} from "discord.js";
import {SetArtistId} from "./commands/SetArtistId";
import {SetlistfmRequestor} from "./setlistfm_requestor";
import Config from "./config";
import {AutocompleteSetlists} from "./autocomplete/setlists";

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

const SetlistRequestor = new SetlistfmRequestor()

client.on('ready', () => {
    console.log(`Client is logged in as ${client.user!.tag} and ready!`);
    client.user!.setActivity('/show to start', { type: 'LISTENING' })
});

client.on('interactionCreate', async (interaction: Interaction) => {
    if (interaction.isAutocomplete() && interaction.commandName === 'show') {
        new AutocompleteSetlists(interaction)
    }

    if (!interaction.isCommand()) return;

    if (interaction.commandName === 'show') {
        new ShowSetlist(interaction)
    }

    if (interaction.commandName === 'set-artist-id') {
        new SetArtistId(interaction, SetlistRequestor)
    }
});

client.login(Config.discord.token)