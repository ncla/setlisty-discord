export class ArtistRepository {
    private knexClient;

    constructor(knexClient: any) {
        this.knexClient = knexClient;
    }

    async getArtistIdForGuildId(guildId: number): Promise<number | undefined> {
        const artist = this.knexClient('discord_guilds')
            .select('artist_id')
            .where({
                guild_id: guildId
            })
            .first()

        return artist?.id
    }
}