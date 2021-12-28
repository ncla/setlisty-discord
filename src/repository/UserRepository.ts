import { Knex } from "knex";

export class UserRepository {
    private knexClient;

    constructor(knexClient: Knex) {
        this.knexClient = knexClient;
    }

    // this is kinda poopy, just use object/array destructuring for all possible properties
    async upsertUser(userId: string, setlistfmUsername: string): Promise<void> {
        await this.knexClient('users')
            .insert({
                discord_user_id: userId,
                setlistfm_username: setlistfmUsername
            })
            .onConflict('discord_user_id')
            .merge()
    }

    async deleteAttendedSetlistsForUser(userId: number) {
        await this.knexClient('setlist_attendees')
            .where('user_id', userId)
            .del()
    }

    async insertAttendedSetlistsForUser(userId: number, setlistIds: string[]) {
        console.log(
            setlistIds.map(setlistId => {
                return {
                    user_id: userId,
                    setlist_id: setlistId
                }
            })
        )
        await this.knexClient('setlist_attendees')
            .insert(
                setlistIds.map(setlistId => {
                    return {
                        user_id: userId,
                        setlist_id: setlistId
                    }
                })
            )
    }

    async getUserIdByDiscordUserId(discordUserId: string): Promise<number | undefined>  {
        const user = await this.knexClient('users')
            .select('id')
            .where('discord_user_id', discordUserId)
            .first()

        return user?.id
    }

    async getDiscordUserIdBySetlistfmUsername(setlistfmUsername: string): Promise<number | undefined> {
        const user = await this.knexClient('users')
            .select('discord_user_id')
            .where('setlistfm_username', setlistfmUsername)
            .first()

        return user?.discord_user_id
    }
}