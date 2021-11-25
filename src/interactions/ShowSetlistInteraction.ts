import {CommandInteraction, InteractionReplyOptions, MessageEmbed} from "discord.js";
import SetlistFinder from "../services/SetlistFinder";
import {Setlist} from "../helpers/setlist";
import TypedException from "../helpers/TypedException";

function onlyAvailableThroughGuildsConcern(interaction: CommandInteraction) {
    if (interaction.inGuild() === false) {
        throw new InteractionGuardException('Sorry, this bot is not available through DMs')
    }
}

function mustContainStringParameter(name: string) {
    return (interaction: CommandInteraction) => {
        if (!interaction.options.getString(name)) {
            throw new InteractionGuardException('Missing query parameter')
        }
    }
}

export class InteractionGuardException extends TypedException {
    public options: InteractionReplyOptions;

    constructor(msg: string) {
        super(msg);

        this.options = {
            content: msg,
            ephemeral: true
        }
    }
}

export class ShowSetlistInteraction {
    protected interaction: CommandInteraction
    protected setlistFinder: SetlistFinder

    protected interactionGuards: Array<Function> = [
        onlyAvailableThroughGuildsConcern,
        mustContainStringParameter('query')
    ]

    constructor(interaction: CommandInteraction, setlistFinder: SetlistFinder) {
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
        if (err instanceof SetlistFinder.ArtistNotFoundException) {
            return 'No artist ID set in this server'
        } else if (err instanceof SetlistFinder.SetlistNotFoundException) {
            return 'No setlist was found!'
        } else {
            throw err
        }
    }

    private static buildSetlistReply(setlist: Setlist): InteractionReplyOptions {
        return {
            embeds: [
                new MessageEmbed()
                    .setTitle(setlist.getLocationAndDateText())
                    .setURL(setlist.url)
                    .setColor(0xff0000)
                    .setDescription(setlist.getTrackListText())
            ]
        }
    }
}
