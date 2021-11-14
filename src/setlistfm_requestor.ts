import axios, {AxiosInstance, AxiosRequestConfig, AxiosResponse} from 'axios';
import Config from "./config";

export class SetlistfmRequestor {
    private axios: AxiosInstance;

    public constructor() {
        this.axios = axios.create({
            baseURL: Config.setlistfm.baseURL,
            timeout: 15000,
            headers: {
                'accept': 'application/json',
                'x-api-key': Config.setlistfm.apiKey
            }
        })
    }

    public async fetchSetlistsPage(musicbrainzId: string, page?: number) {
        const requestConfig: AxiosRequestConfig = {
            params: {
                page
            }
        }
        console.log(requestConfig)
        return await this.axios.get(`artist/${musicbrainzId}/setlists`, requestConfig)
    }

    public async fetchArtistName(musicbrainzId: string): Promise<string> {
        const response = await this.axios.get(`artist/${musicbrainzId}`)

        return response.data.name
    }
}
