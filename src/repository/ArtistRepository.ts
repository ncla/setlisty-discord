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
}