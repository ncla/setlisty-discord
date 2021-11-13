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
    setlist_id: string,
    name: string,
    tape: boolean,
    set_number: number,
    note: string,
    order_number: number
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