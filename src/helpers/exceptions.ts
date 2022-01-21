import {InteractionReplyOptions} from "discord.js";

// https://javascript.info/custom-errors
export default class TypedException extends Error {
    constructor(message?: string) {
        super(message);
        this.name = this.constructor.name;
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