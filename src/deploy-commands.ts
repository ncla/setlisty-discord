import {SlashCommandStringOption} from "@discordjs/builders";
import Config from "./config"

const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

// todo: command to set artist musicbrainz ID
const commands = [
    new SlashCommandBuilder()
        .setName('show')
        .setDescription('Search and show a setlist!')
        .addStringOption((option: SlashCommandStringOption) =>
            option.setName('query')
                .setDescription('Example: "shepherd bush empire", "london 2017"')
                .setRequired(true)
        ),
    new SlashCommandBuilder()
        .setName('set-artist-id')
        .setDescription('Set artist ID for this server!')
        .addStringOption((option: SlashCommandStringOption) =>
            option.setName('musicbrainz_id')
                .setDescription('ID from Musicbrainz.org site e.g. 9c9f1380-2516-4fc9-a3e6-f9f61941d090')
                .setRequired(true)
        )
].map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(Config.discord.token);

rest.put(Routes.applicationGuildCommands(Config.discord.clientId, Config.discord.guildId), { body: commands })
    .then(() => console.log('Successfully registered application commands.'))
    .catch(console.error);