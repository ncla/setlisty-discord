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
    setlistUpdater: SetlistUpdater;

    // static AlreadyLinkedToThisUser = class extends TypedException {}
    // static AccountIsLinkedToSomeoneElse = class extends TypedException {}
    // static SetlistFmAccountNotFound = class extends TypedException {}
    // static MissingStringFromAboutSection = class extends TypedException {}
    // static NoSetlistfmAccountLinked = class extends TypedException {}

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

        this.userRepository.upsertUser(discordUserId, setlistFmUsername)

        // TODO: Move to jobs, expensive and potentially long running task
        const updatedSetlistIds = await this.setlistUpdater.runSingleUserUpdate(setlistFmUsername)

        const userDbId = await this.userRepository.getUserIdByDiscordUserId(discordUserId)

        // This should not happen but just in case. If we can't find it then throw same exception as verification 
        // has not been setup yet, letting them know to just retry.
        if (userDbId === undefined) {
            throw new MissingStringFromAboutSection()
        }

        await this.userRepository.insertAttendedSetlistsForUser(userDbId, updatedSetlistIds)
    }

    public async unlinkAccount(discordUserId: string) {
        const accountIdToUnlink = await this.userRepository.getUserIdByDiscordUserId(discordUserId)

        if (accountIdToUnlink === undefined) {
            throw new NoSetlistfmAccountLinked()
        }

        await this.userRepository.deleteAttendedSetlistsForUser(accountIdToUnlink)
        await this.userRepository.deleteUser(accountIdToUnlink)
    }
}