const {Client, Intents} = require('discord.js');
import {Interaction} from "discord.js";
import Config from "./config";
import SetlistFinder from "./services/SetlistFinder";
import knexClient from "./helpers/knexClient";
import {ArtistRepository} from "./repository/ArtistRepository";
import {SetlistRepository} from "./repository/SetlistRepository";
import {InteractionGuardException, ShowSetlistInteraction} from "./interactions/ShowSetlistInteraction";

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

// const SetlistRequestor = new SetlistfmRequestClient()

const setlistFinder = new SetlistFinder(
    new ArtistRepository(knexClient),
    new SetlistRepository(knexClient)
)

client.on('ready', () => {
    console.log(`Client is logged in as ${client.user!.tag} and ready!`);
    client.user!.setActivity('/show to start', {type: 'LISTENING'})
});

client.on('interactionCreate', async (interaction: Interaction) => {
    if (!interaction.isCommand()) return;

    const showSetlistInteraction = new ShowSetlistInteraction(interaction, setlistFinder)

    if (interaction.commandName === 'show') {
        try {
            await showSetlistInteraction.invoke()
        } catch (err) {
            if (err instanceof InteractionGuardException) {
                return await interaction.reply(err.options)
            }

            return await interaction.reply('Encountered unexpected exception')
        }
    }
});

client.login(Config.discord.token)