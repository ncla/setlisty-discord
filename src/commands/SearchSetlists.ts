import Discord, {MessageEmbed} from 'discord.js'
import knex from 'knex';
import {getFullSetlistDataArray} from '../helpers/setlist';
import FuseInstance from '../helpers/fuse';
import {regexPrefix} from '../index'; // todo: put else where
import { map, slice, uniqBy, property } from 'lodash';

const env: string = process.env.NODE_ENV || 'development'
const knexConfig = require('../../knexfile')[env]
const knexClient = knex(knexConfig)

export class SearchSetlists {
    public DiscordMessage: Discord.Message
    public criteriaType: string|undefined
    public criteriaSearchString: string|undefined
    protected FuseInstance: FuseInstance;

    public static command() {
        return new SlashCommandBuilder().setName('search').setDescription('Replies with pong!')
    }

    public constructor(DiscordMessage: Discord.Message, FuseInstance: FuseInstance) {
        this.DiscordMessage = DiscordMessage
        this.FuseInstance = FuseInstance

        const msg = this.DiscordMessage.content
        const msgRegexed = msg.match(new RegExp(`${regexPrefix} search (date|city|state|venue|country|track|tracknote) (.+)`))

        if (msgRegexed && msgRegexed[1]) {
            this.criteriaType = msgRegexed[1]
        }

        if (msgRegexed && msgRegexed[2]) {
            this.criteriaSearchString = msgRegexed[2]
        }

        // Free form searching
        if (!(msgRegexed) || !(msgRegexed[2])) {
            this.criteriaSearchString = this.DiscordMessage.content.replace(new RegExp(`${regexPrefix} search `), '')
        }

        this.invoke()

        return this
    }

    protected async invoke() {
        if (!this.criteriaType && !this.criteriaSearchString) {
            return this.DiscordMessage.reply('Invalid search format, please look for syntax in $setlist help')
        }

        let setlistDb = null
        let mostRelevant = false
        let mostRecent = true

        // TODO: select only id, less memory consume
        if (this.criteriaType === 'date' && this.criteriaSearchString) {
            setlistDb = await knexClient('setlists')
                .where({date: this.criteriaSearchString})
        }

        if (this.criteriaType === 'city' && this.criteriaSearchString) {
            setlistDb = await knexClient('setlists')
                .where('city_name', 'like', `%${this.criteriaSearchString}%`)
                .orderBy('date', 'desc')
        }

        if (this.criteriaType === 'venue' && this.criteriaSearchString) {
            setlistDb = await knexClient('setlists')
                .where('venue_name', 'like', `%${this.criteriaSearchString}%`)
                .orderBy('date', 'desc')
        }

        if (this.criteriaType === 'state' && this.criteriaSearchString) {
            setlistDb = await knexClient('setlists')
                .where('state_name', 'like', `%${this.criteriaSearchString}%`)
                .orderBy('date', 'desc')
        }

        if (this.criteriaType === 'country' && this.criteriaSearchString) {
            setlistDb = await knexClient('setlists')
                .where('country_name', 'like', `%${this.criteriaSearchString}%`)
                .orderBy('date', 'desc')
        }

        if (this.criteriaType === 'track' && this.criteriaSearchString) {
            let setlistTracks = await knexClient('setlist_tracks')
                .where('name', 'like', `%${this.criteriaSearchString}%`)

            // Some tracks can appear twice in a setlist
            setlistTracks = uniqBy(setlistTracks, (v) => {
                return v.id
            })

            console.log(setlistTracks.length)

            if (setlistTracks) {
                setlistDb = await knexClient('setlists')
                    .whereIn('id', map(setlistTracks, 'id'))
                    .orderBy('date', 'desc')
            }
        }

        if (this.criteriaType === 'tracknote' && this.criteriaSearchString) {
            let setlistTracks = await knexClient('setlist_tracks')
                .where('note', 'like', `%${this.criteriaSearchString}%`)

            // Some tracks can appear twice in a setlist
            setlistTracks = uniqBy(setlistTracks, (v) => {
                return v.id
            })

            if (setlistTracks) {
                setlistDb = await knexClient('setlists')
                    .whereIn('id', map(setlistTracks, 'id'))
                    .orderBy('date', 'desc')
            }
        }

        if (!this.criteriaType && this.criteriaSearchString && this.FuseInstance) {
            mostRelevant = true
            const result = await this.FuseInstance.search(this.criteriaSearchString)
            console.log(result[0])
            if (result.length) {
                setlistDb = await knexClient('setlists')
                    .whereIn('id', map(result, property('item.id')))
            }
        }

        // console.log(setlistDb)
        // console.log(2)

        if (!setlistDb || setlistDb.length === 0) {
            return this.DiscordMessage.reply('No setlists were found!')
        }

        const slicedSetlists = slice(setlistDb, 0, 5)
        const setlistIds = map(slicedSetlists, 'id')
        const setlists = await getFullSetlistDataArray(setlistIds)

        const setlistListText = map(setlists, (setlist) => {
            //console.log(setlist.getFullLocationText(), setlist.date)
            return `\n**[${setlist.getFullLocationText()}](${setlist.url})**\n**ID:** ${setlist.id} **Date**: ${setlist.date} **Tracks**: ${setlist.tracks.length}`
        })

        const resultStatus = `Showing ${setlists.length} out of ${setlistDb.length} most ` +
            `${mostRelevant ? 'relevant' : 'recent'} setlists that matched your search`

        const embed = new MessageEmbed()
            // Set the title of the field
            //.setTitle(`Found ${setlists.length} setlists matched your search criteria (max. setlists is 5)`)
            .setColor(0xff0000)
            .setDescription(`${resultStatus}${setlistListText}`);

        this.DiscordMessage.channel.send(embed);
    }
}