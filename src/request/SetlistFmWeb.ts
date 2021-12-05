import axios, {AxiosInstance, AxiosRequestConfig, AxiosResponse} from 'axios';
import Config from "../config";

export class SetlistfmWebRequestClient {
    private axios: AxiosInstance;

    public constructor() {
        this.axios = axios.create({
            baseURL: Config.setlistfm.baseUrlWeb,
            timeout: 15000,
        })
    }

    public async search(query: string) {
        const requestConfig: AxiosRequestConfig = {
            params: {
                query
            }
        }

        return await this.axios.get(`search`, requestConfig)
    }
}
