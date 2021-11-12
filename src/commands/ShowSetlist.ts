import Discord, {MessageEmbed} from 'discord.js'
import knex from 'knex';
import {getFullSetlistData} from '../helpers/setlist';
import FuseInstance from "../helpers/fuse";
import {regexPrefix} from "../index"; // todo: put else where

const env: string = process.env.NODE_ENV || 'development'
const knexConfig = require('../../knexfile')[env]
const knexClient = knex(knexConfig)

export class ShowSetlist {
    public DiscordMessage: Discord.Message
    public criteriaType: string|undefined
    public criteriaSearchString: string|undefined
    protected FuseInstance: FuseInstance;

    public constructor(DiscordMessage: Discord.Message, FuseInstance: FuseInstance) {
        this.DiscordMessage = DiscordMessage
        this.FuseInstance = FuseInstance

        const msg = this.DiscordMessage.content
        const msgRegexed = msg.match(new RegExp(`${regexPrefix} show (id|date|city|state|venue|country|track|tracknote) (.+)`))

        if (msgRegexed && msgRegexed[1]) {
            this.criteriaType = msgRegexed[1]
        }

        if (msgRegexed && msgRegexed[2]) {
            this.criteriaSearchString = msgRegexed[2]
        }

        // Free form searching
        if (!(msgRegexed) || !(msgRegexed[2])) {
            this.criteriaSearchString = this.DiscordMessage.content.replace(new RegExp(`${regexPrefix} show `), '')
        }

        this.invoke()

        return this
    }

    protected async invoke() {
        if (!this.criteriaType && !this.criteriaSearchString) {
            return this.DiscordMessage.reply('Invalid search format, please look for syntax in $setlist help')
        }

        let setlistDb = null

        if (this.criteriaType === 'id' && this.criteriaSearchString) {
            setlistDb = await knexClient('setlists')
                .where({id: this.criteriaSearchString})
                .first()
        }

        if (this.criteriaType === 'date' && this.criteriaSearchString) {
            setlistDb = await knexClient('setlists')
                .where({date: this.criteriaSearchString})
                .first()
        }

        if (this.criteriaType === 'city' && this.criteriaSearchString) {
            setlistDb = await knexClient('setlists')
                .where('city_name', 'like', `%${this.criteriaSearchString}%`)
                .orderBy('date', 'desc')
                .first()
        }

        if (this.criteriaType === 'venue' && this.criteriaSearchString) {
            setlistDb = await knexClient('setlists')
                .where('venue_name', 'like', `%${this.criteriaSearchString}%`)
                .orderBy('date', 'desc')
                .first()
        }

        if (this.criteriaType === 'state' && this.criteriaSearchString) {
            setlistDb = await knexClient('setlists')
                .where('state_name', 'like', `%${this.criteriaSearchString}%`)
                .orderBy('date', 'desc')
                .first()
        }

        if (this.criteriaType === 'country' && this.criteriaSearchString) {
            setlistDb = await knexClient('setlists')
                .where('country_name', 'like', `%${this.criteriaSearchString}%`)
                .orderBy('date', 'desc')
                .first()
        }

        if (this.criteriaType === 'track' && this.criteriaSearchString) {
            const setlistTrack = await knexClient('setlist_tracks')
                .where('name', 'like', `%${this.criteriaSearchString}%`)
                .first()

            if (setlistTrack) {
                setlistDb = await knexClient('setlists')
                    .where('id', '=', setlistTrack.id)
                    .first()
            }
        }

        if (this.criteriaType === 'tracknote' && this.criteriaSearchString) {
            const setlistTrack = await knexClient('setlist_tracks')
                .where('note', 'like', `%${this.criteriaSearchString}%`)
                .first()

            if (setlistTrack) {
                setlistDb = await knexClient('setlists')
                    .where('id', '=', setlistTrack.id)
                    .first()
            }
        }

        if (!this.criteriaType && this.criteriaSearchString && this.FuseInstance) {
            const result = await this.FuseInstance.search(this.criteriaSearchString)
            if (result[0]) {
                const id = result[0].item.id
                console.log(id)
                setlistDb = await knexClient('setlists')
                    .where('id', '=', `${id}`)
                    .first()
            }
        }

        if (!setlistDb) {
            return this.DiscordMessage.reply('No setlist was found!')
        }

        let setlist = await getFullSetlistData(setlistDb.id)

        const embed = new MessageEmbed()
            // Set the title of the field
            .setTitle(setlist.getLocationAndDateText())
            .setURL(setlist.url)
            .setColor(0xff0000)
            .setDescription(setlist.getTrackListText());

        // this.DiscordMessage.channel.send(embed);
    }
}