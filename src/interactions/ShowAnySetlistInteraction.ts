import {CommandInteraction, InteractionReplyOptions, MessageEmbed} from "discord.js";
import {SetlistfmWebRequestClient} from "../request/SetlistFmWeb";
import {SetlistFmWebSearchResultsParser} from "../parsers/SetlistFmWebSearchResults";
import SetlistUpdater from "../setlist-updater";
import {ShowSetlistInteraction} from "./ShowSetlistInteraction";
import {Setlist} from "../helpers/setlist";
import {SetlistRepository} from "../repository/SetlistRepository";

export class ShowAnySetlistInteraction {
    protected interaction: CommandInteraction

    protected interactionGuards: Array<Function> = [

    ]

    private setlistWebRequestor: SetlistfmWebRequestClient;
    private setlistUpdator: SetlistUpdater;
    private setlistRepository: SetlistRepository;

    constructor(interaction: CommandInteraction, setlistWebRequestor: SetlistfmWebRequestClient, setlistUpdator: SetlistUpdater, setlistRepository: SetlistRepository) {
        this.interaction = interaction;
        this.setlistWebRequestor = setlistWebRequestor;
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

        const query = this.interaction.options.getString('query')

        if (!query) return

        const searchResults = await this.setlistWebRequestor.search(query)

        const parser = new SetlistFmWebSearchResultsParser(searchResults).parse()

        if (!parser) return

        const firstSetlistId = parser[0].setlistId


        // const stUpdator = new SetlistUpdater()
        const epic = await this.setlistUpdator.runSingleSetlistUpdate(firstSetlistId)

        const setlist = await this.setlistRepository.getSetlistById(firstSetlistId)

        if (!setlist) return

        return this.interaction.reply(ShowAnySetlistInteraction.buildSetlistReply(setlist))

        // check if we have in db the setlist
        // if we do, return
        // if we dont, we fetch through API single setlist and insert it in the db (with artist entry)
        // then fetch the setlist like we normally would
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