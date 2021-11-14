import Discord, {MessageEmbed} from 'discord.js'
import knex from 'knex';
import {getFullSetlistData} from '../helpers/setlist';
import {Interaction} from "discord.js";

const env: string = process.env.NODE_ENV || 'development'
const knexConfig = require('../../knexfile')[env]
const knexClient = knex(knexConfig)

export class ShowSetlist {
    public interaction: Interaction

    public constructor(interaction: Interaction) {
        this.interaction = interaction
        this.invoke()
    }

    protected async invoke() {
        if (!this.interaction.isCommand()) return;

        if (!this.interaction.inGuild()) {
            return this.interaction.reply({
                content: 'Sorry, this bot is not available through DMs',
                ephemeral: true
            })
        }

        const query = this.interaction.options.getString('query')

        const guildId = this.interaction.guildId

        const artistDb = await knexClient('discord_guilds')
            .select('artist_id')
            .where({
                guild_id: guildId
            })
            .first()

        if (!artistDb) {
            return this.interaction.reply('No artist ID set in this server')
        }

        console.log(guildId)

        // todo: validation for empty or trash input

        const setlistDb = await knexClient('setlists')
            .select('id')
            .whereRaw('MATCH (searchable_full_name) AGAINST (?)', [query])
            .where({
                artist_id: artistDb.artist_id
            })
            .first()

        if (!setlistDb) {
            return await this.interaction.reply('No setlist was found!')
        }

        console.log(setlistDb)

        let setlist = await getFullSetlistData(setlistDb.id)

        const embed = new MessageEmbed()
            // Set the title of the field
            .setTitle(setlist.getLocationAndDateText())
            .setURL(setlist.url)
            .setColor(0xff0000)
            .setDescription(setlist.getTrackListText());

        await this.interaction.reply({
            embeds: [embed]
        });
    }
}