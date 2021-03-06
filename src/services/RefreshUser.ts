import { UserRepository } from "../repository/UserRepository";
import SetlistUpdater from "./SetlistUpdater";

export default class RefreshUser {
    protected userRepository: UserRepository;
    protected setlistUpdater: SetlistUpdater;

    constructor(
        userRepository: UserRepository,
        setlistUpdater: SetlistUpdater
    ) {
        this.userRepository = userRepository
        this.setlistUpdater = setlistUpdater
    }

    public async refresh(userId: number) {
        const user = await this.userRepository.getUserById(userId)

        if (!user) {
            throw new Error(`User with ID ${userId} was not found`)
        }

        const setlistfmUsername = user.setlistfm_username

        const updatedSetlistIds = await this.setlistUpdater.runSingleUserUpdate(setlistfmUsername)

        await this.userRepository.deleteAttendedSetlistsForUser(userId)
        await this.userRepository.insertAttendedSetlistsForUser(userId, updatedSetlistIds)
    }
}