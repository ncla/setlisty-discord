export interface SetlistDbInterface {
    id: string,
    date: string,
    url: string,
    venue: string,
    venue_name: string,
    city_name: string,
    state_name?: string,
    country_name: string
}

export interface Track {
    id: string,
    name: string,
    tape: boolean,
    encore: number,
    note: string,
    order_nr_in_set: number,
    order_nr_overall: number
}

export type Venue = {
    name: string,
    cityname: string,
    statename: string|null,
    countryname: string
}

export type SetlistInterface = {
    id: string,
    date: string,
    url: string,
    venue: Venue,
    tracks: Array<Track>
}

export interface SetlistOptions {
    id: string,
    date: string,
    url: string,
    tracks: Array<Track>,
    venue: Venue
}