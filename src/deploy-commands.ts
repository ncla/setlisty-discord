import {SlashCommandStringOption} from "@discordjs/builders";
import Config from "./config"

const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

const commands = [
    {
        name: 'show',
        description: 'Search and show a setlist!',
        options: [
            {
                type: 3,
                name: 'query',
                description: 'Example: "shepherd bush empire", "london 2017"',
                required: true,
                autocomplete: true
            }
        ],
        default_permission: undefined
    },
    new SlashCommandBuilder()
        .setName('set-artist-id')
        .setDescription('Set artist ID for this server!')
        .addStringOption((option: SlashCommandStringOption) =>
            option.setName('musicbrainz_id')
                .setDescription('ID from Musicbrainz.org site e.g. 9c9f1380-2516-4fc9-a3e6-f9f61941d090')
                .setRequired(true)
        )
        .toJSON()
]

const rest = new REST({ version: '9' }).setToken(Config.discord.token);

rest.put(
    // Routes.applicationCommands(Config.discord.clientId),
    Routes.applicationGuildCommands(Config.discord.clientId, Config.discord.guildId),
    { body: commands }
)
.then(() => console.log('Successfully registered application commands.'))
.catch(console.error);