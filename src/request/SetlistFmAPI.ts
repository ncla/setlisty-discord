import axios, {AxiosInstance, AxiosRequestConfig, AxiosResponse} from 'axios';
import Config from "../config";

export class SetlistfmAPIRequestClient {
    private axios: AxiosInstance;

    public constructor() {
        this.axios = axios.create({
            baseURL: Config.setlistfm.baseUrlApi,
            timeout: 15000,
            headers: {
                'accept': 'application/json',
                'x-api-key': Config.setlistfm.apiKey
            }
        })
    }

    public async fetchSetlist(setlistId: string) {
        return await this.axios.get(`setlist/${setlistId}`)
    }

    public async fetchSetlistsPage(musicbrainzId: string, page?: number) {
        const requestConfig: AxiosRequestConfig = {
            params: {
                p: page
            }
        }

        return await this.axios.get(`artist/${musicbrainzId}/setlists`, requestConfig)
    }

    public async fetchArtistName(musicbrainzId: string): Promise<string> {
        const response = await this.axios.get(`artist/${musicbrainzId}`)

        return response.data.name
    }
}
