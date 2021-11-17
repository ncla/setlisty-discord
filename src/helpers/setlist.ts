import knexClient from "./knexClient";
import {SetlistDbInterface, SetlistInterface, SetlistOptions, Track, Venue} from '../types/setlist';
import { map } from 'lodash';
import dayjs from "dayjs";

export async function getFullSetlistData(setlistId: string) {
    let setlist = await knexClient<SetlistDbInterface>('setlists').where({id: setlistId}).first()

    if (!setlist) {
        throw Error('Setlist not found')
    }

    let venue = JSON.parse(setlist.venue)

    let venueObj = <Venue> {
        name: venue.name,
        cityname: venue.city.name,
        statename: venue.city.state,
        countryname: venue.city.country.name
    }

    let tracksDb = await knexClient<Track>('setlist_tracks')
        .where({setlist_id: setlistId})
        .orderBy('order_number', 'asc')

    return new Setlist(<SetlistOptions>{ id: setlist.id, date: setlist.date, url: setlist.url, tracks: tracksDb, venue: venueObj })
}

export async function getFullSetlistDataArray(setlistIds: Array<string>) {
    return await Promise.all(map(setlistIds, (setlistId) => {
        return getFullSetlistData(setlistId)
    }))
}

export class Setlist implements SetlistInterface {
    id!: string;
    date!: string;
    url!: string;
    tracks!: Array<Track>;
    venue!: Venue;

    public constructor (opts: SetlistOptions) {
        Object.assign(this, opts);
    }

    public getTrackListText (): string {
        if (this.tracks.length === 0) {
            return 'No tracks available for this setlist'
        }

        let text = ''
        let setNumber = 0

        for (const track of this.tracks) {
            const newline = setNumber != track.set_number

            text +=
                `${newline ? '\n' : ''}` +
                `${track.order_number + 1}. ${track.tape ? '🖭' : ''} **${track.name}** `
                + `${track.note ? ` (*${track.note}*)` : ''}\n`
            setNumber = track.set_number
        }

        return text
    }

    public getFullLocationText (): string {
        return `${this.venue.name}, ${this.venue.cityname},${this.venue.statename ? ` ${this.venue.statename},` :''} ${this.venue.countryname}`
    }

    public getDateText (): string {
        return `${dayjs(this.date).format('YYYY-MM-DD')}`
    }

    public getLocationAndDateText (): string {
        return `${this.getFullLocationText()} | ${this.getDateText()}`
    }

    public getAutocompleteChoiceTitle(): string {
        return `${this.getDateText()} – ${this.getFullLocationText()}`
    }
}

export async function findOrInsertArtist(musicbrainzId: string): Promise<number> {
    const artist = await knexClient('artists').where({musicbrainz_id: musicbrainzId}).select(['id']).first()

    if (artist) {
        return artist.id
    }

    const inserted = await knexClient('artists').insert({
        musicbrainz_id: musicbrainzId,
        artist_name: 'Muse' // todo
    })

    return inserted[0]
}