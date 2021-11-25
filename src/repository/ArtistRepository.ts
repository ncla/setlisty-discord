export class ArtistRepository {
    private knexClient;

    constructor(knexClient: any) {
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

    public async findOrInsertArtist(musicbrainzId: string): Promise<number> {
        const artist = await this.knexClient('artists').where({musicbrainz_id: musicbrainzId}).select(['id']).first()

        if (artist) {
            return artist.id
        }

        const inserted = await this.knexClient('artists').insert({
            musicbrainz_id: musicbrainzId,
            artist_name: 'Muse' // todo
        })

        return inserted[0]
    }
}