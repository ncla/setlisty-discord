export interface SetlistDbInterface {
    id: string,
    date: string,
    url: string,
    event_id: string|null,
    event_name: string|null,
    venue: string,
    venue_name: string,
    city_name: string,
    state_name?: string,
    country_name: string,
    note?: string,
    tour_name?: string,
    last_revision?: string,
    created_at?: string,
    updated_at?: string,
}

export interface Track {
    setlist_id: string,
    name: string|null,
    tape: boolean,
    set_number: number,
    note: string|null,
    order_number: number,
    set_name: string|null,
    encore: number|null,
    with: TrackArtist|null,
    cover: TrackArtist|null
}

export interface TrackArtist {
    mbid: string,
    tmid: string|null,
    name: string,
    sortName: string,
    disambiguation: string,
    url: string
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
    event_id: string|null,
    event_name: string|null,
    venue: Venue,
    tracks: Array<Track>,
    note: string,
    tour_name: string,
    last_revision?: string,
    created_at?: string,
    updated_at?: string,
}

export interface SetlistOptions {
    id: string,
    date: string,
    url: string,
    tracks: Array<Track>,
    venue: Venue,
    event_id: string|null,
    event_name: string|null,
    note: string|null,
    tour_name: string|null,
    last_revision?: string,
    created_at?: string,
    updated_at?: string,
}