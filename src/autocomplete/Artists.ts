import {AutocompleteInteraction} from "discord.js";
import axios, {AxiosResponse} from "axios";
import {MusicbrainzRequestClient} from "../request/Musicbrainz";

export class AutocompleteArtists {
    public interaction: AutocompleteInteraction
    private musicbrainzRequestClient: MusicbrainzRequestClient

    public constructor(interaction: AutocompleteInteraction, musicbrainzRequestClient: MusicbrainzRequestClient) {
        this.interaction = interaction
        this.musicbrainzRequestClient = musicbrainzRequestClient;
        this.invoke()
    }

    protected async invoke() {
        const userQuery = this.interaction.options.getString('name')

        if (userQuery === null || userQuery.length <= 2) {
            return await this.interaction.respond([]);
        }

        console.log('Autocomplete search: ' + userQuery)

        // todo things are repeating here

        if (!this.interaction.inGuild()) {
            return await this.interaction.respond([]);
        }

        const requestor = axios.create({
            timeout: 2500,
            headers: {
                'accept': 'application/json',
            }
        })

        let response: AxiosResponse;

        try {
            response = await this.musicbrainzRequestClient.searchArtists(userQuery)
        } catch (err) {
            return await this.interaction.respond([])
        }

        return await this.interaction.respond(response.data.artists.map((value: any) => {
            return {
                'name': `${value.name} ${value.disambiguation ? ' – ' + value.disambiguation : ''}`,
                'value': value.id
            }
        }) ?? [])
    }
}