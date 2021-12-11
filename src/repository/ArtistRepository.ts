import { Knex } from "knex";

export class ArtistRepository {
    private knexClient;

    constructor(knexClient: Knex) {
        this.knexClient = knexClient;
    }

    async getArtistIdForGuildId(guildId: string): Promise<number | undefined> {
        const artist = await this.knexClient('discord_guilds')
            .select('artist_id')
            .where({
                guild_id: guildId
            })
            .first()

        return artist?.artist_id
    }

    /**
     * @param musicbrainzId
     * @param artistName
     * @return number Artist ID in the database
     */
    public async findOrInsertArtist(musicbrainzId: string, artistName?: string): Promise<number> {
        const artist = await this.knexClient('artists').where({musicbrainz_id: musicbrainzId}).select(['id']).first()
        console.log("findOrInsertArtist args", musicbrainzId, artistName)
        console.log('artist in findOrInsertArtist', artist)
        if (artist) {
            return artist.id
        }

        const inserted = await this.knexClient('artists').insert({
            musicbrainz_id: musicbrainzId,
            artist_name: artistName
        })

        return inserted[0]
    }
}