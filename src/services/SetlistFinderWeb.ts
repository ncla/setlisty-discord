import {SetlistFmWebSearchResultsParser} from "../parsers/SetlistFmWebSearchResults";
import {SetlistfmWebRequestClient} from "../request/SetlistFmWeb";
import TypedException from "../helpers/exceptions";

export class NoSetlistsFoundException extends TypedException {}

export default class SetlistFinderWeb {
    private setlistFmWebSearchResultsParser: SetlistFmWebSearchResultsParser;
    private setlistWebRequestor: SetlistfmWebRequestClient;

    public constructor(
        setlistWebRequestor: SetlistfmWebRequestClient,
        setlistFmWebSearchResultsParser: SetlistFmWebSearchResultsParser
    ) {
        this.setlistWebRequestor = setlistWebRequestor;
        this.setlistFmWebSearchResultsParser = setlistFmWebSearchResultsParser;
    }

    public async findSetlistIdThroughWebSearch(query: string): Promise<string> {
        const searchResults = await this.setlistWebRequestor.search(query)

        const setlistResults = this.setlistFmWebSearchResultsParser.parse(searchResults)

        if (setlistResults.length === 0) {
            throw new NoSetlistsFoundException()
        }

        return setlistResults[0].setlistId
    }
}