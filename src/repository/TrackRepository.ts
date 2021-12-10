import { Knex } from "knex";

export class TrackRepository {
    private knexClient;

    constructor(knexClient: Knex) {
        this.knexClient = knexClient;
    }

    async deleteAllTracksBySetlistId(setlistId: string): Promise<void> {
        await this.knexClient('setlist_tracks')
            .where('setlist_id', setlistId)
            .del()
    }

    async insertTracks(tracks: any[]): Promise<void> {
        await this.knexClient('setlist_tracks')
            .insert(tracks)
    }
}