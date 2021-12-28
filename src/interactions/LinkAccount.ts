/**
 * /link-account
 * 
 * 1. string option to specify the username of their account
 * 2. say that we have found your profile
 * 2. if a userID is not included on their profile, we give instructions on what to do. when they have done it, ask them to redo this command (or maybe add a button that will rerun the interaction)
 * 3. fetch their profile again, see user ID, save.
 * 4. fetch the setlist data for gigs they have attended (do this already instead of later )
 * 5. if running the command again and user is linked, say so
 * 6. check if someone hasnt already set that username
 * 
 * reset attended gigs when re-linking an account
 */

import { CommandInteraction, MessageEmbed } from "discord.js";
import { UserRepository } from "src/repository/UserRepository";
import { SetlistfmAPIRequestClient } from "src/request/SetlistFmAPI";
import SetlistUpdater from "src/setlist-updater";
import { mustContainStringParameter, onlyAvailableThroughGuildsConcern } from "../helpers/interaction_guards";
// this is kinda poopy, request logic in discord command class
import axios from 'axios';

export class LinkAccount {
    protected interaction: CommandInteraction

    protected setlistFmApiRequestClient: SetlistfmAPIRequestClient
    protected userRepository: UserRepository;
    setlistUpdater: SetlistUpdater;

    protected interactionGuards: Array<Function> = [
        onlyAvailableThroughGuildsConcern,
        mustContainStringParameter('username')
    ]

    constructor(
        interaction: CommandInteraction,
        setlistFmApiRequestClient: SetlistfmAPIRequestClient,
        userRepository: UserRepository,
        setlistUpdater: SetlistUpdater
    ) {
        this.interaction = interaction;
        this.setlistFmApiRequestClient = setlistFmApiRequestClient
        this.userRepository = userRepository
        this.setlistUpdater = setlistUpdater
    }

    protected async runInteractionGuards() {
        for (const guard of this.interactionGuards) {
            await guard(this.interaction)
        }
    }

    public async invoke() {
        await this.runInteractionGuards()

        const username = this.interaction.options.getString('username') as string

        const discordUserId = this.interaction.user.id

        const isAlreadyLinked = await this.userRepository.getUserIdByDiscordUserId(discordUserId) !== undefined

        if (isAlreadyLinked) {
            return await this.replyAccountAlreadyLinkedToYou()
        }

        const existingSetlistfmLinkedAccount = await this.userRepository.getDiscordUserIdBySetlistfmUsername(username)
        const setlistfmAccountLinkedToSomeoneElse = existingSetlistfmLinkedAccount !== undefined && existingSetlistfmLinkedAccount.toString() !== discordUserId

        if (setlistfmAccountLinkedToSomeoneElse) {
            return await this.replyAccountAlreadyLinkedToSomeoneElse()
        }

        let response;

        try {
            response = await this.setlistFmApiRequestClient.fetchUser(username)
        } catch (err) {
            if (axios.isAxiosError(err) && err.response && err.response.status === 404) {
                console.log(1)
                return await this.replyAccountNotFound()
            }
        }

        if (response === undefined) {
            return await this.replyAccountNotFound()
        }

        const stringToLookFor = `discord:${discordUserId}`

        const stringExistsInAboutSection = response.data.about !== undefined && response.data.about.indexOf(stringToLookFor) !== -1

        if (stringExistsInAboutSection === false) {
            return await this.replyWithInstructions()
        }

        this.userRepository.upsertUser(discordUserId, username)

        // TODO: Move to jobs
        const updatedSetlistIds = await this.setlistUpdater.runSingleUserUpdate(username)
        console.log(updatedSetlistIds)

        const userDbId = await this.userRepository.getUserIdByDiscordUserId(discordUserId)

        if (userDbId === undefined) {
            return; // todo
        }

        await this.userRepository.insertAttendedSetlistsForUser(userDbId, updatedSetlistIds)

        return await this.replySuccess()
    }

    private async replyAccountAlreadyLinkedToSomeoneElse() {
        let messageEmbed = new MessageEmbed()
            .setColor('#3f92a6')
            .setDescription(`
                This setlist.fm username is already linked to another Discord account.
                Only one Discord account can be linked to a single setlist.fm account.
            `)

        await this.interaction.reply(
            {
                embeds: [
                    messageEmbed
                ],
            }
        )
    }

    private async replyAccountAlreadyLinkedToYou() {
        let messageEmbed = new MessageEmbed()
            .setColor('#3f92a6')
            .setDescription(`
                Your Discord account is already linked to a setlist.fm account.
                If you wish to unlink your account, please use the /unlink-account command.
            `)

        await this.interaction.reply(
            {
                embeds: [
                    messageEmbed
                ],
            }
        )
    }

    private async replyAccountNotFound() {
        let messageEmbed = new MessageEmbed()
            .setColor('#3f92a6')
            .setDescription(`
                No setlist.fm account was found with this username!
            `)

        await this.interaction.reply(
            {
                embeds: [
                    messageEmbed
                ],
            }
        )
    }

    private async replyWithInstructions() {
        // todo move out discord user id
        let messageEmbed = new MessageEmbed()
            .setColor('#3f92a6')
            .setDescription(`
                You have not linked your Discord account yet to your Setlist.fm profile. To link your account, please do the following steps:\n
                1. Log-in to your setlist.fm account <https://www.setlist.fm/signin>
                2. Navigate to "Settings" page of your profile <https://www.setlist.fm/settings>
                3. Scroll down to "About" section and copy paste this text anywhere in the "About" text box:
                \`\`\`discord:${this.interaction.user.id}\`\`\`
                5. Click the "Submit" button to save your changes.
                6. Re-run this command or press the "Verify" button of this message to verify your account link.
            `)

        await this.interaction.reply(
            {
                embeds: [
                    messageEmbed
                ],
            },
        )
    }

    private async replySuccess() {
        let messageEmbed = new MessageEmbed()
            .setColor('#3f92a6')
            .setDescription(`
                You have successfully linked your Discord account to your Setlist.fm profile.
            `)

        await this.interaction.reply(
            {
                embeds: [
                    messageEmbed
                ],
            }
        )
    }
}
 