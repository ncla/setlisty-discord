import TypedException from "../helpers/exceptions";
import { UserRepository } from "../repository/UserRepository";
import { SetlistfmAPIRequestClient } from "../request/SetlistFmAPI";
import SetlistUpdater from "./SetlistUpdater";
import axios from 'axios';

export class AlreadyLinkedToThisUser extends TypedException {}
export class AccountIsLinkedToSomeoneElse extends TypedException {}
export class SetlistFmAccountNotFound extends TypedException {}
export class MissingStringFromAboutSection extends TypedException {}
export class NoSetlistfmAccountLinked extends TypedException {}

export class AccountManager {
    protected setlistFmApiRequestClient: SetlistfmAPIRequestClient
    protected userRepository: UserRepository;
    protected setlistUpdater: SetlistUpdater;

    constructor(
        setlistFmApiRequestClient: SetlistfmAPIRequestClient,
        userRepository: UserRepository,
        setlistUpdater: SetlistUpdater
    ) {
        this.setlistFmApiRequestClient = setlistFmApiRequestClient
        this.userRepository = userRepository
        this.setlistUpdater = setlistUpdater
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

        let response;

        try {
            response = await this.setlistFmApiRequestClient.fetchUser(setlistFmUsername)
        } catch (err) {
            if (axios.isAxiosError(err) && err.response && err.response.status === 404) {
                throw new SetlistFmAccountNotFound()
            } else {
                throw err;
            }
        }

        const stringToLookFor = `discord:${discordUserId}`

        const stringExistsInAboutSection = response.data.about !== undefined && response.data.about.indexOf(stringToLookFor) !== -1

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
        const accountIdToUnlink = await this.userRepository.getUserIdByDiscordUserId(discordUserId)

        if (accountIdToUnlink === undefined) {
            throw new NoSetlistfmAccountLinked()
        }

        await this.userRepository.deleteAttendedSetlistsForUser(accountIdToUnlink)
        await this.userRepository.deleteUser(accountIdToUnlink)
    }

    public async scheduleRefreshForAccount(discordUserId: string) {
        const userId = await this.userRepository.getUserIdByDiscordUserId(discordUserId)

        if (userId === undefined) {
            throw new NoSetlistfmAccountLinked()
        }

        await this.userRepository.scheduleUserUpdate(userId)
    }
}