import axios from 'axios';
import TypedException from "../helpers/exceptions";
import { UserRepository } from "../repository/UserRepository";
import { SetlistfmAPIRequestClient } from "../request/SetlistFmAPI";

export class AlreadyLinkedToThisUser extends TypedException {}
export class AccountIsLinkedToSomeoneElse extends TypedException {}
export class SetlistFmAccountNotFound extends TypedException {}
export class MissingStringFromAboutSection extends TypedException {}
export class NoSetlistfmAccountLinked extends TypedException {}

export class AccountManager {
    protected setlistFmApiRequestClient: SetlistfmAPIRequestClient
    protected userRepository: UserRepository;

    constructor(
        setlistFmApiRequestClient: SetlistfmAPIRequestClient,
        userRepository: UserRepository,
    ) {
        this.setlistFmApiRequestClient = setlistFmApiRequestClient
        this.userRepository = userRepository
    }

    public async linkAccount(discordUserId: string, setlistFmUsername: string) {
        const isAlreadyLinked = await this.userRepository.getUserIdByDiscordUserId(discordUserId) !== undefined

        if (isAlreadyLinked) {
            throw new AlreadyLinkedToThisUser()
        }

        const existingSetlistfmLinkedAccount = await this.userRepository.getDiscordUserIdBySetlistfmUsername(setlistFmUsername)
        const setlistfmAccountLinkedToSomeoneElse = existingSetlistfmLinkedAccount !== undefined && existingSetlistfmLinkedAccount.toString() !== discordUserId

        if (setlistfmAccountLinkedToSomeoneElse) {
            throw new AccountIsLinkedToSomeoneElse()
        }

        let apiUserResponse;

        try {
            apiUserResponse = await this.setlistFmApiRequestClient.fetchUser(setlistFmUsername)
        } catch (err) {
            if (axios.isAxiosError(err) && err.response && err.response.status === 404) {
                throw new SetlistFmAccountNotFound()
            } else {
                throw err;
            }
        }

        const stringToLookFor = `discord:${discordUserId}`

        const stringExistsInAboutSection = apiUserResponse.data.about !== undefined && apiUserResponse.data.about.indexOf(stringToLookFor) !== -1

        if (stringExistsInAboutSection === false) {
            throw new MissingStringFromAboutSection()
        }

        await this.userRepository.upsertUser(discordUserId, setlistFmUsername)

        const userId = await this.userRepository.getUserIdByDiscordUserId(discordUserId)

        // This should not happen but just in case. Typescript warns about potential undefined value.
        if (userId === undefined) {
            throw new Error('User ID is not available')
        }

        await this.userRepository.scheduleUserUpdate(userId)
    }

    public async unlinkAccount(discordUserId: string) {
        const userIdToUnlink = await this.userRepository.getUserIdByDiscordUserId(discordUserId)

        if (userIdToUnlink === undefined) {
            throw new NoSetlistfmAccountLinked()
        }

        await this.userRepository.deleteScheduledJobsForUser(userIdToUnlink)
        await this.userRepository.deleteAttendedSetlistsForUser(userIdToUnlink)
        await this.userRepository.deleteUser(userIdToUnlink)
    }

    public async scheduleRefreshForAccount(discordUserId: string) {
        const userId = await this.userRepository.getUserIdByDiscordUserId(discordUserId)

        if (userId === undefined) {
            throw new NoSetlistfmAccountLinked()
        }

        await this.userRepository.scheduleUserUpdate(userId)
    }
}