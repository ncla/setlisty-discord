import dotenv from 'dotenv'
const { Client, Intents } = require('discord.js');
// import {Sync} from './commands/Sync'
import {ShowSetlist} from './commands/ShowSetlist'
import knex from "knex";
import {SetlistDbInterface, Track} from "./types/setlist";
import {escapeRegExp} from "./helpers";
import {Interaction} from "discord.js";
import {SetArtistId} from "./commands/SetArtistId";
import {SetlistfmRequestor} from "./setlistfm_requestor";
// import {SearchSetlists} from "./commands/SearchSetlists";
const { token } = require('../config.json');

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

dotenv.config()

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

export const regexPrefix = `(?:${escapeRegExp(process.env.COMMAND_PREFIX || '$s')}|${escapeRegExp(process.env.COMMAND_PREFIX_SHORT || '$setlist')})`

const SetlistRequestor = new SetlistfmRequestor()

client.on('ready', () => {
    console.log(`Client is logged in as ${client.user!.tag} and ready!`);
    // Set the client user's activity
    client.user!.setActivity('$s to start', { type: 'LISTENING' })
        // .then(presence => console.log(`Activity set to ${presence.activities[0].name}`))
        // .catch(console.error);
});

client.on('interactionCreate', async (interaction: Interaction) => {
    console.log(1)
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'show') {
        new ShowSetlist(interaction)
        // await interaction.reply('Pong!');
    }
    if (commandName === 'set-artist-id') {
        new SetArtistId(interaction, SetlistRequestor)
        // await interaction.reply('Pong!');
    }
});

// client.on('message', (msg: Discord.Message) => {
//     // Routing messages to command actions
//     if (msg.content.match(new RegExp(`${regexPrefix} sync`))) {
//         console.log('sync')
//         // This crashes pm2, investigate
//         new Sync(msg, process.env.MUSICBRAINZ_ARTIST_ID)
//     } else if (msg.content.match(new RegExp(`${regexPrefix} show`))) {
//         new ShowSetlist(msg, Fuse)
//     } else if (msg.content.match(new RegExp(`${regexPrefix} search`))) {
//         new SearchSetlists(msg, Fuse)
//     }
//     // Add shorthand at end
// });

client.login(token)

// Search for setlists
// $setlist search|show venue|city|country|track|tracknote {search}

// Maybe shorthand for $s {str} or $setlist {str}

// Show last played, first played, player per year
// $setlist track {track-name}

// Admin only
// $setlist sync
