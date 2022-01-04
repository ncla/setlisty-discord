import { CommandInteraction } from "discord.js";
import { AccountManager } from "src/services/AccountManager";
import { onlyAvailableThroughGuildsConcern } from "../helpers/interaction_guards";
 
export class UnlinkAccount {
    protected interaction: CommandInteraction
    protected accountManager: AccountManager;

    protected interactionGuards: Array<Function> = [
        onlyAvailableThroughGuildsConcern
    ]

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

        this.accountManager.unlinkAccount(discordUserId)

        return this.interaction.reply('Account unlinked')
    }
}
  