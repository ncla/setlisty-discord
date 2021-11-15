const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

import Config from "./config"

const token = Config.discord.token;
const clientId = Config.discord.clientId;
const guildId = Config.discord.guildId;

const rest = new REST({ version: '9' }).setToken(token);
rest.get(Routes.applicationGuildCommands(clientId, guildId))
    .then((data: any) => {
        const promises = [];
        for (const command of data) {
            const deleteUrl = `${Routes.applicationGuildCommands(clientId, guildId)}/${command.id}`;
            promises.push(rest.delete(deleteUrl));
        }
        return Promise.all(promises);
    });

rest.get(Routes.applicationCommands(clientId))
    .then((data: any) => {
        const promises = [];
        for (const command of data) {
            const deleteUrl = `${Routes.applicationCommands(clientId)}/${command.id}`;
            promises.push(rest.delete(deleteUrl));
        }
        return Promise.all(promises);
    });
