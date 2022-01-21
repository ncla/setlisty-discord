import { CommandInteraction, InteractionReplyOptions, MessageEmbed } from "discord.js";
import TypedException from "../helpers/exceptions";
import { AccountManager } from "../services/AccountManager";
import { onlyAvailableThroughGuildsConcern } from "../helpers/interaction_guards";

export class RefreshAccount {
    protected interaction: CommandInteraction
    protected accountManager: AccountManager;

    protected interactionGuards: Array<Function> = [
        onlyAvailableThroughGuildsConcern
        // TODO: rate limit guard
    ]

    private noSetlistFmAccountLinkedReply: string = `You have no setlist.fm account linked to your Discord account that we could refresh!`
    private successfulRefreshReply = `Scheduled task has been dispatched to update your profile with newest data from setlist.fm.\n` +
        `Your profile should update automatically soon!`

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
            await this.accountManager.scheduleRefreshForAccount(discordUserId)
            message = this.successfulRefreshReply
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
  