/**
 * /link-account
 * 
 * 1. string option to specify the username of their account
 * 2. say that we have found your profile
 * 2. if a userID is not included on their profile, we give instructions on what to do. when they have done it, ask them to redo this command (or maybe add a button that will rerun the interaction)
 * 3. fetch their profile again, see user ID, save.
 * 4. fetch the setlist data for gigs they have attended (do this already instead of later )
 * 5. if running the command again and user is linked, say so
 */

import { CommandInteraction, MessageEmbed } from "discord.js";
import { SetlistfmAPIRequestClient } from "src/request/SetlistFmAPI";
import { mustContainStringParameter, onlyAvailableThroughGuildsConcern } from "../helpers/interaction_guards";
 
export class LinkAccount {
    protected interaction: CommandInteraction

    protected setlistFmApiRequestClient: SetlistfmAPIRequestClient

    protected interactionGuards: Array<Function> = [
        onlyAvailableThroughGuildsConcern,
        mustContainStringParameter('username')
    ]

    constructor(
        interaction: CommandInteraction,
        setlistFmApiRequestClient: SetlistfmAPIRequestClient
    ) {
        this.interaction = interaction;
        this.setlistFmApiRequestClient = setlistFmApiRequestClient
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

        const response = await this.setlistFmApiRequestClient.fetchUser(username)

        // todo: no user found

        console.log(response.data)

        const stringToLookFor = `discord:${discordUserId}`

        const stringExistsInAboutSection = response.data.about && response.data.about.indexOf(stringToLookFor) !== -1

        console.log(stringExistsInAboutSection)

        if (!stringExistsInAboutSection) {
            await this.replyWithInstructions()
        }
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
                // components: [
                //     new MessageActionRow()
                //         .addComponents(
                //             new MessageButton()
                //                 .setLabel('View')
                //                 .setURL(setlist.url)
                //                 .setStyle(MessageButtonStyles.LINK),
                //             new MessageButton()
                //                 .setLabel('Edit')
                //                 .setURL(`https://www.setlist.fm/edit?setlist=${setlist.id}&step=song`)
                //                 .setStyle(MessageButtonStyles.LINK)
                //         )
                // ]
            }
        )
    }
}
 