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

    public async fetchSetlist(setlistId: string): Promise<AxiosResponse<any>> {
        return await this.axios.get(`setlist/${setlistId}`)
    }

    public async fetchSetlistsPage(musicbrainzId: string, page?: number): Promise<AxiosResponse<any>> {
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

    public async fetchUser(username: string): Promise<AxiosResponse<any>> {
        return await this.axios.get(`user/${username}`)
    }

    public async fetchUserAttendedSetlists(userId: string, page?: number): Promise<AxiosResponse<any>> {
        const requestConfig: AxiosRequestConfig = {
            params: {
                p: page
            }
        }

        return await this.axios.get(`user/${userId}/attended`, requestConfig)
    }
}
