import {Artist, SetlistInterface, SetlistOptions, Track, Venue} from '../types/setlist';
import dayjs from "dayjs";

export class Setlist implements SetlistInterface {
    // todo: all properties here are nullable, which is not true
    id!: string;
    date!: string;
    url!: string;
    artist!: Artist;
    tracks!: Array<Track>;
    venue!: Venue;
    event_id!: string;
    event_name!: string;
    note!: string;
    tour_name!: string;
    last_revision!: string;
    created_at!: string;
    updated_at!: string;

    // https://www.setlist.fm/guidelines#glVenues
    static COUNTRY_NAMES_THAT_USE_STATES = [
        'United States',
        'Canada'
    ]

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
            const isNewSet = setNumber != track.set_number

            text += `${isNewSet ? '\n' : ''}` + this.composeTrackString(track, isNewSet) + '\n'

            setNumber = track.set_number
        }

        return text
    }

    public getFullLocationText (): string {
        let parts = [
            this.event_name ?? this.venue.name,
            this.venue.cityname,
            this.composeStateNameString(this.venue),
            this.venue.countryname
        ]

        return parts.filter(text => {
            return text.length > 0
        }).join(', ')
    }

    public getDateText (): string {
        return `${dayjs(this.date).format('YYYY-MM-DD')}`
    }

    public getArtistTextForTitle(): string {
        return `${this.artist.artist_name} at`
    }

    public getSetlistTitle (): string {
        return `${this.getArtistTextForTitle()} ${this.getFullLocationText()} | ${this.getDateText()}`
    }

    public getAutocompleteChoiceTitle(): string {
        return `${this.getDateText()} – ${this.getFullLocationText()}`
    }

    private composeStateNameString(venue: Venue): string {
        if (Setlist.COUNTRY_NAMES_THAT_USE_STATES.indexOf(venue.countryname) !== -1) {
            return `${venue.statename}`
        }

        return ''
    }

    private composeTrackString(track: Track, isNewSet: boolean): string {
        let parts = [
            this.composeSetNameString(track, isNewSet),
            this.composeOrderNumberString(track),
            this.composeTapeIndicator(track),
            this.composeTrackNameString(track),
            this.composeCoverString(track),
            this.composeWithString(track),
            this.composeTrackNoteString(track),
        ]

        return parts.filter(text => {
            return text.length > 0
        }).join(' ')
    }

    private composeOrderNumberString(track: Track): string {
        return `${track.order_number + 1}.`
    }

    private composeTapeIndicator(track: Track): string {
        return track.tape ? '🖭' : ''
    }

    private composeTrackNameString(track: Track): string {
        return track.name === null ? this.composeTrackNameFromTrackNote(track) : `**${track.name}**`
    }

    private composeTrackNoteString(track: Track): string {
        let markupNote = ''

        if (track.name && track.note) {
            markupNote = `(*${track.note}*)`
        }

        return `${markupNote}`
    }

    private composeCoverString(track: Track): string {
        if (track.cover) {
            return `(${track.cover.name} cover)`
        }

        return ``
    }

    private composeWithString(track: Track): string {
        if (track.with) {
            return `(with ${track.with.name})`
        }

        return ``
    }

    private composeTrackNameFromTrackNote(track: Track): string {
        return `${track.note}`
    }

    private composeSetNameString(track: Track, isNewSet: boolean): string {
        if (track.set_name) {
            return `> ${track.set_name}\n`
        }

        if (!track.set_name && track.encore !== null && isNewSet) {
            return `> Encore ${track.encore === 1 ? '' : track.encore}\n`
        }

        return '';
    }
}