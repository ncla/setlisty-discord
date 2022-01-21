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

    async deleteUser(userId: number) {
        return await this.knexClient('users')
            .where('id', userId)
            .del()
    }

    // todo: setlist attendeeds repository
    async deleteAttendedSetlistsForUser(userId: number) {
        return await this.knexClient('setlist_attendees')
            .where('user_id', userId)
            .del()
    }

    // todo: user scheduled jobs repository
    async deleteScheduledJobsForUser(userId: number) {
        return await this.knexClient('user_update_jobs')
            .where('user_id', userId)
            .del()
    }

    // todo: chunk?
    async insertAttendedSetlistsForUser(userId: number, setlistIds: string[]) {
        return await this.knexClient('setlist_attendees')
            .insert(
                setlistIds.map(setlistId => {
                    return {
                        user_id: userId,
                        setlist_id: setlistId
                    }
                })
            )
    }

    // todo: return all data instead
    async getUserIdByDiscordUserId(discordUserId: string): Promise<number | undefined>  {
        const user = await this.knexClient('users')
            .select('id')
            .where('discord_user_id', discordUserId)
            .first()

        return user?.id
    }

    // todo: return all data instead
    async getDiscordUserIdBySetlistfmUsername(setlistfmUsername: string): Promise<number | undefined> {
        const user = await this.knexClient('users')
            .select('discord_user_id')
            .where('setlistfm_username', setlistfmUsername)
            .first()

        return user?.discord_user_id
    }

    async getUserById(id: number) {
        return await this.knexClient('users').where({id: id}).first()
    }

    // todo: user job schedule repo? otherwise this repo can become too bloated with relations
    // todo: do not schedule duplicate updates?
    // mostly used from AccountManager
    async scheduleUserUpdate(userId: number): Promise<number> {
        const jobRecord = await this.knexClient('user_update_jobs')
            .insert({
                user_id: userId,
                status: 'WAITING'
            })

        return jobRecord[0]
    }
}