import {CommandInteraction, InteractionReplyOptions} from "discord.js";
import SetlistUpdater from "../services/SetlistUpdater";
import {SetlistRepository} from "../repository/SetlistRepository";
import SetlistFinderWeb from "../services/SetlistFinderWeb";
import {mustContainStringParameter, onlyAvailableThroughGuildsConcern} from "../helpers/interaction_guards";
import {SetlistNotFoundException} from "../helpers/exceptions";
import BaseShowSetlistInteraction from "./base/BaseShowSetlistInteraction";

export class ShowAnySetlistInteraction extends BaseShowSetlistInteraction {
    protected interaction: CommandInteraction
    private setlistUpdator: SetlistUpdater;
    private setlistRepository: SetlistRepository;
    private setlistWebFinder: SetlistFinderWeb

    protected interactionGuards: Array<Function> = [
        onlyAvailableThroughGuildsConcern,
        mustContainStringParameter('query')
    ]

    constructor(
        interaction: CommandInteraction,
        setlistWebFinder: SetlistFinderWeb,
        setlistUpdator: SetlistUpdater,
        setlistRepository: SetlistRepository,
    ) {
        super();
        this.interaction = interaction;
        this.setlistWebFinder = setlistWebFinder
        this.setlistUpdator = setlistUpdator;
        this.setlistRepository = setlistRepository;
    }

    protected async runInteractionGuards() {
        for (const guard of this.interactionGuards) {
            await guard(this.interaction)
        }
    }

    public async invoke() {
        await this.runInteractionGuards()
        await this.run()
    }

    /**
     * TODO: Handle interaction when requestor and updator tasks may take longer than 3000ms
     */
    public async run() {
        const reply = await this.buildReply()
        return this.interaction.reply(reply)
    }

    private async buildReply(): Promise<InteractionReplyOptions | string> {
        let setlist

        try {
            // Hit setlist.fm web search
            const setlistId = await this.setlistWebFinder.findSetlistIdThroughWebSearch(this.getQuery())
            setlist = await this.getSetlist(setlistId)
        } catch (err) {
            if (err instanceof SetlistFinderWeb.NoSetlistsFoundException) {
                // TODO: Fancier replies
                return 'No search results were found!'
            } else if (err instanceof SetlistNotFoundException) {
                return 'No setlist was found!'
            } else {
                throw err
            }
        }

        return ShowAnySetlistInteraction.buildSetlistReply(setlist)
    }

    private async getSetlist(setlistId: string) {
        // On the off-chance that we do have that setlist in our database :-)
        let setlist = await this.setlistRepository.getSetlistById(setlistId)

        if (setlist) return setlist

        // Reuse the setlist updater and run for single setlist
        await this.setlistUpdator.runSingleSetlistUpdate(setlistId)

        // Try again
        setlist = await this.setlistRepository.getSetlistById(setlistId)

        if (!setlist) throw new SetlistNotFoundException()

        return setlist
    }

    private getQuery(): string {
        return this.interaction.options.getString('query') as string
    }
}