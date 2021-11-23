import {CommandInteraction, InteractionReplyOptions, MessageEmbed} from "discord.js";
import SetlistFinder from "../services/SetlistFinder";
import {Setlist} from "../helpers/setlist";

async function onlyAvailableThroughGuildsConcern(interaction: CommandInteraction): Promise<InteractionReplyOptions | boolean> {
    // console.log(6, interaction.guildId)
    if (interaction.inGuild() === false) {
        // console.log(7)
        return {
            content: 'Sorry, this bot is not available through DMs',
            ephemeral: true
        }
    }

    return true
}

export class InteractionGuardException extends Error {
    public options: InteractionReplyOptions;

    constructor(msg: string, options: InteractionReplyOptions) {
        super(msg);

        // https://stackoverflow.com/questions/41102060/typescript-extending-error-class/
        Object.setPrototypeOf(this, InteractionGuardException.prototype);

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
            const interactionReplyOptions = await guard(this.interaction)

            // todo: how to check type if InteractionReplyOptions
            if (interactionReplyOptions !== true) {
                // console.log(4, interactionReplyOptions, interactionReplyOptions.content)
                throw new InteractionGuardException(interactionReplyOptions.content, interactionReplyOptions)
            }
        }
    }

    public async invoke() {
        // console.log(this.interaction)
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

// export async function anOptionIsRequired(interaction: CommandInteraction) {
//     const query = this.interaction.options.getString('query')
//
//     if (!query) {
//         return this.interaction.reply('Missing query parameter')
//     }
// }
