import {SlashCommandStringOption} from "@discordjs/builders";

const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { clientId, guildId, token } = require('../config.json');
const fs = require("fs");

// todo: command to set artist musicbrainz ID
const commands = [
    new SlashCommandBuilder()
        .setName('show')
        .setDescription('Search and show a setlist!')
        .addStringOption((option: SlashCommandStringOption) =>
            option.setName('query')
                .setDescription('Example: "shepherd bush empire", "london 2017"')
        )
].map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(token);

rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
    .then(() => console.log('Successfully registered application commands.'))
    .catch(console.error);