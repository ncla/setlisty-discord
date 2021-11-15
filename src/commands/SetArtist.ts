import {Interaction} from "discord.js";
import {SetlistfmRequestor} from "../setlistfm_requestor";
import knexClient from "../helpers/knexClient";

export class SetArtist {
    public interaction: Interaction
    protected requestor: SetlistfmRequestor

    public constructor(interaction: Interaction, requestor: SetlistfmRequestor) {
        this.interaction = interaction
        this.requestor = requestor;
        this.invoke()
    }

    protected async invoke() {
        if (!this.interaction.isCommand()) return;

        const isOwner = this.interaction.guild?.ownerId === this.interaction.user.id

        if (!this.interaction.inGuild()) {
            return this.interaction.reply({
                content: 'Sorry, this bot is not available through DMs',
                ephemeral: true
            })
        }

        if (!isOwner) {
            return this.interaction.reply({
                content: 'Only the owner of this server can set the artist ID',
                ephemeral: true
            })
        }

        const mbIdFromIdOption = this.interaction.options.getString('id')
        const mbIdFromNameOption = this.interaction.options.getString('name')

        if (mbIdFromNameOption === null && mbIdFromIdOption === null) {
            return this.interaction.reply({
                content: 'ID or name is required',
                ephemeral: true
            })
        }

        const mbId = mbIdFromIdOption ?? mbIdFromNameOption

        console.log(mbId)

        if (!mbId) {
            return this.interaction.reply({
                content: 'Musicbrainz ID must be valid',
                ephemeral: true
            })
        }

        let artistName;
        try {
            artistName = await this.requestor.fetchArtistName(mbId)
        } catch (err) {
            // todo: handle not found exception better
            return this.interaction.reply({
                content: 'Artist was not found with this Musicbrainz ID',
                ephemeral: true
            })
        }

        console.log(artistName)

        const artistInDb = await knexClient('artists')
            .where({
                musicbrainz_id: mbId
            })
            .first()

        let artistId;

        if (!artistInDb) {
            const insertedArtist = await knexClient('artists').insert({
                musicbrainz_id: mbId,
                artist_name: artistName
            })

            artistId = insertedArtist[0]
        } else {
            artistId = artistInDb.id
        }

        await knexClient('discord_guilds')
            .insert({
                guild_id: this.interaction.guildId,
                artist_id: artistId
            })
            .onConflict('guild_id')
            .merge()

        return this.interaction.reply({
            content: 'Artist for this server has been set to: ' + artistName,
            ephemeral: true
        })
    }
}