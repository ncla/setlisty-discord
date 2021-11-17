import {AutocompleteInteraction} from "discord.js";
import knexClient from "../helpers/knexClient";
import {getFullSetlistData} from "../helpers/setlist";

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

        if (userQuery === null || userQuery.length === 0) {
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

        const againstWithWildcard = `(${userQuery.split(' ').map(word => word + '*').join(' ')})`
        const againstNormal = `("${userQuery}")`

        const againstBinding = `${againstWithWildcard} ${againstNormal}`;

        const setlists = await knexClient('setlists')
            .select('id', 'searchable_full_name')
            .select(knexClient.raw('MATCH (searchable_full_name) AGAINST (? IN BOOLEAN MODE) as score', [againstBinding]))
            .where({
                artist_id: artistDb.artist_id
            })
            .having('score', '>', 0)
            .orderBy('score', 'desc')
            .limit(5)

        const transformToChoices = async (setlistDbRecord: any) => {
            const setlistObject = await getFullSetlistData(setlistDbRecord.id);

            return {
                'name': setlistObject.getAutocompleteChoiceTitle(),
                'value': `id:${setlistDbRecord.id}`
            }
        };

        const unresolvedPromises = setlists.map(itemDb => transformToChoices(itemDb));
        const results = await Promise.all(unresolvedPromises);

        return await this.interaction.respond(results ?? [])
    }
}