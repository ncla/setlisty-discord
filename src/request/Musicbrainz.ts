import axios, {AxiosInstance, AxiosRequestConfig, AxiosResponse} from 'axios';
import Config from "../config";

export class MusicbrainzRequestClient {
    private axios: AxiosInstance;

    public constructor() {
        this.axios = axios.create({
            baseURL: Config.musicbrainz.baseURL,
            timeout: 1500,
            headers: {
                'accept': 'application/json',
            }
        })
    }

    public async searchArtists(query: string) {
        const requestConfig: AxiosRequestConfig = {
            params: {
                query: query,
                limit: 5
            }
        }

        return await this.axios.get(`artist`, requestConfig)
    }
}
