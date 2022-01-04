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

import { CommandInteraction, InteractionReplyOptions, MessageEmbed } from "discord.js";
import TypedException from "../helpers/exceptions";
import { AccountManager, MissingStringFromAboutSection } from "../services/AccountManager";
import { mustContainStringParameter, onlyAvailableThroughGuildsConcern } from "../helpers/interaction_guards";

export class LinkAccount {
    protected interaction: CommandInteraction
    protected accountManager: AccountManager;

    protected interactionGuards: Array<Function> = [
        onlyAvailableThroughGuildsConcern,
        mustContainStringParameter('username')
    ]

    private alreadyLinkedToThisUserReply = `Your Discord account is already linked to a setlist.fm account.\nIf you wish to unlink your account, please use the /unlink-account command.`
    private accountIsLinkedToSomeoneElseReply = `This setlist.fm username is already linked to another Discord account.\nOnly one Discord account can be linked to a single setlist.fm account.`
    private setlistFmAccountNotFoundReply = `No setlist.fm account was found with this username!`
    private successfulLinkReply = `You have successfully linked your Discord account to your Setlist.fm profile.`

    private exceptionReplyStrings: Record<string, string> = {
        'AlreadyLinkedToThisUser': this.alreadyLinkedToThisUserReply,
        'AccountIsLinkedToSomeoneElse': this.accountIsLinkedToSomeoneElseReply,
        'SetlistFmAccountNotFound': this.setlistFmAccountNotFoundReply,
    }

    constructor(
        interaction: CommandInteraction,
        accountManager: AccountManager,
    ) {
        this.interaction = interaction;
        this.accountManager = accountManager;
    }

    protected async runInteractionGuards() {
        for (const guard of this.interactionGuards) {
            await guard(this.interaction)
        }
    }

    public async invoke() {
        await this.runInteractionGuards()

        const reply = await this.buildReply()
        return this.interaction.reply(reply)
    }

    private getUsernameOptionValue() {
        return this.interaction.options.getString('username') as string
    }

    private getInteractionUserId() {
        return this.interaction.user.id
    }

    private async buildReply(): Promise<InteractionReplyOptions | string> {
        let message: string

        try {
            await this.accountManager.linkAccount(this.getInteractionUserId(), this.getUsernameOptionValue())
            message = this.successfulLinkReply
        } catch (err) {
            if (err instanceof TypedException && this.exceptionReplyStrings[err.name]) {
                message = this.exceptionReplyStrings[err.name]
            } else if (err instanceof MissingStringFromAboutSection) {
                message = this.buildInstructionsReply(this.getInteractionUserId())
            } else {
                throw err
            }
        }

        return this.buildInteractionReplyOptions(message)
    }

    private buildInteractionReplyOptions(message: string): InteractionReplyOptions {
        let messageEmbed = new MessageEmbed()
            .setColor('#3f92a6')
            .setDescription(message)

         return {
            embeds: [
                messageEmbed
            ],
            ephemeral: true
        }
    }

    private buildInstructionsReply(discordUserId: string) {
        return `You have not linked your Discord account yet to your Setlist.fm profile. To link your account, please do the following steps:\n\n1. Log-in to your setlist.fm account <https://www.setlist.fm/signin>\n2. Navigate to "Settings" page of your profile <https://www.setlist.fm/settings>\n3. Scroll down to "About" section and copy paste this text anywhere in the "About" text box:\n\`\`\`discord:${discordUserId}\`\`\`\n5. Click the "Submit" button to save your changes.\n6. Re-run this command or press the "Verify" button of this message to verify your account link.\n`
    }
}
 