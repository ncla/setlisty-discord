import SetlistUpdater from "../setlist-updater";
import knexClient, {now} from "../helpers/knexClient";
import {SetlistfmRequestClient} from "../request/SetlistFm";

async function getFirstNeverUpdatedArtist() {
    return await knexClient('artists')
        .select(['artists.id', 'artists.musicbrainz_id'])
        .leftJoin('artist_update_jobs', 'artists.id', 'artist_update_jobs.artist_id')
        .whereNull('artist_update_jobs.status')
        .first()
}

async function getFirstExpiredArtist() {
    return await knexClient('artists')
        .select(['artists.id', 'artists.musicbrainz_id'])
        .leftJoin('artist_update_jobs', 'artists.id', 'artist_update_jobs.artist_id')
        .whereIn('artist_update_jobs.status', ['ERROR', 'COMPLETED'])
        .where('updated_at', '<=', knexClient.raw("DATE_SUB(NOW(), INTERVAL 1 DAY)"))
        .whereNotExists(
            knexClient('artist_update_jobs AS newer_jobs')
                .where('newer_jobs.updated_at', '>', knexClient.raw('artist_update_jobs.updated_at'))
                .where('newer_jobs.artist_id', '=', knexClient.raw('artist_update_jobs.artist_id'))
                .select('id')
        )
        .orderBy('artist_update_jobs.updated_at', 'asc')
        .first()
}

async function findArtistToUpdate() {
    return await getFirstNeverUpdatedArtist() ?? await getFirstExpiredArtist()
}

async function createArtistUpdateJob(artistId: number): Promise<number> {
    const jobRecord = await knexClient('artist_update_jobs')
        .insert({
            artist_id: artistId,
            status: 'IN_PROGRESS'
        })

    return jobRecord[0]
}

async function updateArtistUpdateJob(jobId: number, status: string, debug?: string) {
    return await knexClient('artist_update_jobs')
        .where({
            id: jobId
        })
        .update({
            status: status,
            debug: debug,
            updated_at: now
        })
}

async function execute() {
    const artist = await findArtistToUpdate()

    if (!artist) {
        console.log('No artist :(')
        return;
    }

    const jobId = await createArtistUpdateJob(artist.id)
    try {
        let updater = new SetlistUpdater(artist.musicbrainz_id, new SetlistfmRequestClient());
        await updater.run()
    } catch (err) {
        return updateArtistUpdateJob(jobId, 'ERROR', JSON.stringify(err))
    }

    return await updateArtistUpdateJob(jobId, 'COMPLETED')
}

execute().then(() => knexClient.destroy())