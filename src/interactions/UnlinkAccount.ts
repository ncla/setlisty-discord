import { CommandInteraction, InteractionReplyOptions, MessageEmbed } from "discord.js";
import TypedException from "../helpers/exceptions";
import { AccountManager } from "../services/AccountManager";
import { onlyAvailableThroughGuildsConcern } from "../helpers/interaction_guards";
 
export class UnlinkAccount {
    protected interaction: CommandInteraction
    protected accountManager: AccountManager;

    protected interactionGuards: Array<Function> = [
        onlyAvailableThroughGuildsConcern
    ]

    private noSetlistFmAccountLinkedReply: string = `You have no setlist.fm account to unlink from your Discord account!`
    private successfulUnlinkReply = `You have successfully unlinked your Discord account from your Setlist.fm profile.`

    private exceptionReplyStrings: Record<string, string> = {
        'NoSetlistfmAccountLinked': this.noSetlistFmAccountLinkedReply
    }

    constructor(
        interaction: CommandInteraction,
        accountManager: AccountManager
    ) {
        this.interaction = interaction;
        this.accountManager = accountManager
    }

    protected async runInteractionGuards() {
        for (const guard of this.interactionGuards) {
            await guard(this.interaction)
        }
    }

    public async invoke() {
        await this.runInteractionGuards()

        const discordUserId = this.interaction.user.id

        let message;

        try {
            await this.accountManager.unlinkAccount(discordUserId)
            message = this.successfulUnlinkReply
        } catch (err) {
            if (err instanceof TypedException && this.exceptionReplyStrings[err.name]) {
                message = this.exceptionReplyStrings[err.name]
             } else {
                throw err
            }
        }

        return this.interaction.reply(this.buildInteractionReplyOptions(message))
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
}
  