import {AutocompleteArtists} from "./autocomplete/Artists";

const { Client, Intents } = require('discord.js');
import {Interaction, MessageEmbed} from "discord.js";
import Config from "./config";
import {AutocompleteSetlists} from "./autocomplete/Setlists";
import {SetArtist} from "./commands/SetArtist";
import {SetlistfmRequestClient} from "./request/SetlistFm";
import {MusicbrainzRequestClient} from "./request/Musicbrainz";
import {ArtistNotFoundException, SetlistFinder, SetlistNotFoundException} from "./services/SetlistFinder";
import knexClient from "./helpers/knexClient";
import {ArtistRepository} from "./repository/ArtistRepository";
import {SetlistRepository} from "./repository/SetlistRepository";

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
    // if (interaction.isAutocomplete() && interaction.commandName === 'show') {
    //     return new AutocompleteSetlists(interaction)
    // }
    //
    // if (interaction.isAutocomplete() && interaction.commandName === 'set-artist') {
    //     return new AutocompleteArtists(interaction, new MusicbrainzRequestClient())
    // }
    //
    if (!interaction.isCommand()) return;

    if (interaction.commandName === 'show') {
        if (!interaction.inGuild()) {
            return interaction.reply({
                content: 'Sorry, this bot is not available through DMs',
                ephemeral: true
            })
        }

        const query = interaction.options.getString('query')

        if (!query) {
            return interaction.reply('Missing query parameter')
        }

        const setlistFinder = new SetlistFinder(
            new ArtistRepository(knexClient),
            new SetlistRepository(knexClient)
        )


        let setlist;

        try {
            setlist = await setlistFinder.invoke(interaction.guildId, query)
        } catch (err) {
            if (err instanceof ArtistNotFoundException) {
                return interaction.reply('No artist ID set in this server')
            } else if (err instanceof SetlistNotFoundException) {
                return await interaction.reply('No setlist was found!')
            } else {
                throw err
            }
        }

        const embed = new MessageEmbed()
            // Set the title of the field
            .setTitle(setlist.getLocationAndDateText())
            .setURL(setlist.url)
            .setColor(0xff0000)
            .setDescription(setlist.getTrackListText());

        return await interaction.reply({
            embeds: [embed]
        });
    }
    //
    // if (interaction.commandName === 'set-artist') {
    //     return new SetArtist(interaction, SetlistRequestor)
    // }
});

client.login(Config.discord.token)