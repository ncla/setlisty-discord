import { SlashCommandBuilder } from "@discordjs/builders";
import Config from "./config"

const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

const commands = [
    {
        name: 'show',
        description: 'Search and show a setlist from this servers set artist',
        options: [
            {
                type: 3,
                name: 'query',
                description: 'Example: "shepherd bush empire", "london 2017"',
                required: true,
                autocomplete: true
            }
        ]
    },
    {
        name: 'show-any',
        description: 'Search and show a setlist from any artist',
        options: [
            {
                type: 3,
                name: 'query',
                description: 'Example: "muse shepherd bush empire", "allie x london"',
                required: true
            }
        ]
    },
    {
        name: 'set-artist',
        description: 'Search and set artist on this server from the provided search results',
        options: [
            {
                type: 3,
                name: 'name',
                description: 'Set artist ID by choosing an artist from returned auto-complete search results',
                autocomplete: true
            },
            {
                type: 3,
                name: 'id',
                description: 'Set artist Musicbrainz ID manually'
            }
        ]
    },
    new SlashCommandBuilder()
        .setName('account')
        .setDescription('Control your account')
        .addSubcommand(subcommand => 
            subcommand
                .setName('link')
                .setDescription('Link your Setlist.fm account with your current Discord account')
                .addStringOption(option => 
                    option
                        .setName('username')
                        .setDescription('Username on setlist.fm')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand => 
            subcommand
                .setName('unlink')
                .setDescription('Unlink your Setlist.fm account from your current Discord account and delete associated data')
        )
        .addSubcommand(subcommand => 
            subcommand
                .setName('refresh')
                .setDescription('Refresh your account data from setlist.fm')
        )
        .toJSON()
]

const rest = new REST({ version: '9' }).setToken(Config.discord.token);

rest.put(
    Routes.applicationCommands(Config.discord.clientId),
    // Routes.applicationGuildCommands(Config.discord.clientId, Config.discord.guildId),
    { body: commands }
)
.then(() => console.log('Successfully registered application commands.'))
.catch(console.error);