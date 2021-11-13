import axios, {AxiosInstance, AxiosRequestConfig, AxiosResponse} from 'axios';
const { musicbrainzApiKey } = require('../config.json');

const SETLISTFM_BASE_API_URL = 'https://api.setlist.fm/rest/1.0/'

export class SetlistfmRequestor {
    private axios: AxiosInstance;

    public constructor() {
        this.axios = axios.create({
            baseURL: SETLISTFM_BASE_API_URL,
            timeout: 15000,
            headers: {
                'accept': 'application/json',
                'x-api-key': musicbrainzApiKey
            }
        })
    }

    public async fetchSetlistsPage(artistId: string, page?: number) {
        const requestConfig: AxiosRequestConfig = {
            params: {
                page
            }
        }
        console.log(requestConfig)
        return await this.axios.get(`artist/${artistId}/setlists`, requestConfig);
    }
}
