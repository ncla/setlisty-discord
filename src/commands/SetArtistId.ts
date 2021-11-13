import Discord, {MessageEmbed} from 'discord.js'
import knex from 'knex';
import {getFullSetlistData} from '../helpers/setlist';
import {Interaction} from "discord.js";
import {SetlistfmRequestor} from "../setlistfm_requestor";

const env: string = process.env.NODE_ENV || 'development'
const knexConfig = require('../../knexfile')[env]
const knexClient = knex(knexConfig)

export class SetArtistId {
    public interaction: Interaction
    protected requestor: SetlistfmRequestor

    public constructor(interaction: Interaction, requestor: SetlistfmRequestor) {
        this.interaction = interaction
        this.requestor = requestor;
        this.invoke()
    }

    protected async invoke() {
        if (!this.interaction.isCommand()) return;
        console.log(this.interaction.guild?.ownerId, this.interaction.user.id)
        const isOwner = this.interaction.guild?.ownerId === this.interaction.user.id

        if (!isOwner) {
            return this.interaction.reply({
                content: 'Only the owner of this server can set the artist ID',
                ephemeral: true
            })
        }

        const musicbrainzId = this.interaction.options.getString('musicbrainz_id')

        if (!musicbrainzId) {
            return this.interaction.reply({
                content: 'Musicbrainz ID must be valid',
                ephemeral: true
            })
        }

        let artistName;
        try {
            artistName = await this.requestor.fetchArtistName(musicbrainzId)
        } catch (err) {
            // todo: handle not found exception better
            return this.interaction.reply({
                content: 'Artist not found',
                ephemeral: true
            })
        }

        console.log(artistName)
        // todo: artist_id izvilkt, tad if insertedArtist

        const insertedArtist = await knexClient('artists').insert({
            musicbrainz_id: musicbrainzId,
            artist_name: artistName
        }).onConflict('musicbrainz_id').ignore()

        console.log(insertedArtist)

        await knexClient('discord_guilds')
            .insert({
                guild_id: this.interaction.guildId,
                artist_id: insertedArtist[0]
            })
            .onConflict('guild_id')
            .merge()

    }
}