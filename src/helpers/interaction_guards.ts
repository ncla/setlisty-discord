import {CommandInteraction} from "discord.js";
import {InteractionGuardException} from "../helpers/exceptions";

export function onlyAvailableThroughGuildsConcern(interaction: CommandInteraction) {
    if (interaction.inGuild() === false) {
        throw new InteractionGuardException('Sorry, this bot is not available through DMs')
    }
}

export function mustContainStringParameter(name: string) {
    return (interaction: CommandInteraction) => {
        if (!interaction.options.getString(name)) {
            throw new InteractionGuardException('Missing query parameter')
        }
    }
}