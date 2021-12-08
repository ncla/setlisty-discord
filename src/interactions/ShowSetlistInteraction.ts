import {CommandInteraction, InteractionReplyOptions} from "discord.js";
import SetlistFinder from "../services/SetlistFinder";
import {mustContainStringParameter, onlyAvailableThroughGuildsConcern} from "../helpers/interaction_guards";
import {ArtistNotFoundException, SetlistNotFoundException} from "../helpers/exceptions";
import BaseShowSetlistInteraction from "./base/BaseShowSetlistInteraction";

export class ShowSetlistInteraction extends BaseShowSetlistInteraction {
    protected interaction: CommandInteraction
    protected setlistFinder: SetlistFinder

    protected interactionGuards: Array<Function> = [
        onlyAvailableThroughGuildsConcern,
        mustContainStringParameter('query')
    ]

    constructor(interaction: CommandInteraction, setlistFinder: SetlistFinder) {
        super();
        this.interaction = interaction;
        this.setlistFinder = setlistFinder
    }

    protected async runInteractionGuards() {
        for (const guard of this.interactionGuards) {
            await guard(this.interaction)
        }
    }

    public async invoke() {
        await this.runInteractionGuards()
        return this.run()
    }

    private async run() {
        const reply = await this.buildReply()
        return this.interaction.reply(reply)
    }

    private async buildReply(): Promise<InteractionReplyOptions | string> {
        let setlist;

        try {
            setlist = await this.findSetlist(this.getQuery())
        } catch (err) {
            return ShowSetlistInteraction.getErrorMessage(err);
        }

        return ShowSetlistInteraction.buildSetlistReply(setlist)
    }

    private getQuery(): string {
        return this.interaction.options.getString('query') as string
    }

    private findSetlist(query: string) {
        return this.setlistFinder.invoke(this.interaction.guildId ?? '', query);
    }

    private static getErrorMessage(err: any): string {
        if (err instanceof ArtistNotFoundException) {
            return 'No artist ID set in this server'
        } else if (err instanceof SetlistNotFoundException) {
            return 'No setlist was found!'
        } else {
            throw err
        }
    }
}
