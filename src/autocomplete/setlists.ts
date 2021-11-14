import {AutocompleteInteraction} from "discord.js";
import knexClient from "../helpers/knexClient";

export class AutocompleteSetlists {
    public interaction: AutocompleteInteraction

    public constructor(interaction: AutocompleteInteraction) {
        this.interaction = interaction
        this.invoke()
    }

    protected async invoke() {
        const userQuery = this.interaction.options.getString('query')

        console.log('Autocomplete search: ' + userQuery)

        // todo things are repeating here from ShowSetlist, refactor

        if (!this.interaction.inGuild()) {
            return await this.interaction.respond([]);
        }

        const artistDb = await knexClient('discord_guilds')
            .select('artist_id')
            .where({
                guild_id: this.interaction.guildId
            })
            .first()

        if (!artistDb) {
            return await this.interaction.respond([]);
        }

        const setlists = await knexClient('setlists')
            .select('id', 'searchable_full_name')
            .whereRaw('MATCH (searchable_full_name) AGAINST (?)', [userQuery])
            .where({
                artist_id: artistDb.artist_id
            })
            .limit(10)

        return await this.interaction.respond(setlists.map(value => {
            return {
                'name': value.searchable_full_name,
                'value': value.searchable_full_name
            }
        }) ?? [])
    }
}