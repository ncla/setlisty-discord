import {CommandInteraction, InteractionReplyOptions, MessageEmbed} from "discord.js";
import SetlistFinder from "../services/SetlistFinder";
import {Setlist} from "../helpers/setlist";
import TypedException from "../helpers/TypedException";

async function onlyAvailableThroughGuildsConcern(interaction: CommandInteraction): Promise<InteractionReplyOptions | boolean> {
    if (interaction.inGuild() === false) {
        const options = <InteractionReplyOptions>{
            content: 'Sorry, this bot is not available through DMs',
            ephemeral: true
        }

        throw new InteractionGuardException(
            options.content ?? '',
            options
        )
    }

    return true
}

export class InteractionGuardException extends TypedException {
    public options: InteractionReplyOptions;

    constructor(msg: string, options: InteractionReplyOptions) {
        super(msg);

        this.options = options
    }
}

export class ShowSetlistInteraction {
    protected interaction: CommandInteraction
    protected setlistFinder: SetlistFinder

    protected interactionGuards: Array<Function> = [
        onlyAvailableThroughGuildsConcern
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

        const query = this.interaction.options.getString('query')

        if (!query) {
            return this.interaction.reply('Missing query parameter')
        }

        let setlist;

        try {
            setlist = await this.setlistFinder.invoke(this.interaction.guildId ?? '', query)
        } catch (err) {
            if (err instanceof SetlistFinder.ArtistNotFoundException) {
                return await this.interaction.reply('No artist ID set in this server')
            } else if (err instanceof SetlistFinder.SetlistNotFoundException) {
                return await this.interaction.reply('No setlist was found!')
            } else {
                throw err
            }
        }

        return this.interaction.reply(ShowSetlistInteraction.buildInteractionReply(setlist));
    }

    private static buildInteractionReply(setlist: Setlist): InteractionReplyOptions {
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
