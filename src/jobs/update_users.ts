import { ArtistRepository } from "../repository/ArtistRepository";
import { SetlistRepository } from "../repository/SetlistRepository";
import { TrackRepository } from "../repository/TrackRepository";
import { UserRepository } from "../repository/UserRepository";
import { SetlistfmAPIRequestClient } from "../request/SetlistFmAPI";
import RefreshUser from "../services/RefreshUser";
import SetlistUpdater from "../services/SetlistUpdater";
import knexClient, {now} from "../helpers/knexClient";

async function updateUserUpdateJob(jobId: number, status: string, debug?: string) {
    return await knexClient('user_update_jobs')
        .where({
            id: jobId
        })
        .update({
            status: status,
            debug: debug,
            updated_at: now
        })
}

async function getFirstWaitingJob() {
    return await knexClient('user_update_jobs')
        .where({
            'status': 'WAITING'
        })
        .first()
}

async function execute() {
    const userJob = await getFirstWaitingJob()

    if (!userJob) {
        console.log('No user update job :(')
        return;
    }

    const jobId = userJob.id

    await updateUserUpdateJob(jobId, 'IN_PROGRESS')

    try {
        let updater = new RefreshUser(
            new UserRepository(knexClient),
            new SetlistUpdater(
                new SetlistfmAPIRequestClient(),
                new ArtistRepository(knexClient),
                new SetlistRepository(knexClient),
                new TrackRepository(knexClient)
            )
        )
        
        await updater.refresh(userJob.user_id)
    } catch (err) {
        return await updateUserUpdateJob(jobId, 'ERROR', JSON.stringify(err))
    }

    return await updateUserUpdateJob(jobId, 'COMPLETED')
}

execute().then(() => knexClient.destroy())