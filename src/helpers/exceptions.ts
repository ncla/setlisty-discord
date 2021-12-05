import {InteractionReplyOptions} from "discord.js";

export default class TypedException extends Error {
    // https://stackoverflow.com/questions/41102060/typescript-extending-error-class
    // Use this class instead of the classic "Error" to fix exception type assertions
    get name() {
        return this.constructor.name
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

export class SetlistNotFoundException extends TypedException {}
export class ArtistNotFoundException extends TypedException {}