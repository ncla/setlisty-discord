import {SetlistInterface, SetlistOptions, Track, Venue} from '../types/setlist';
import dayjs from "dayjs";

export class Setlist implements SetlistInterface {
    id!: string;
    date!: string;
    url!: string;
    tracks!: Array<Track>;
    venue!: Venue;
    event_id!: string;
    event_name!: string;

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
                this.composeTrackNameString(track)
                + this.composeTrackNoteString(track) + '\n'
            setNumber = track.set_number
        }

        return text
    }

    public getFullLocationText (): string {
        return `${this.event_name ?? this.venue.name}, ${this.venue.cityname},${this.venue.statename ? ` ${this.venue.statename},` :''} ${this.venue.countryname}`
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

    private composeTrackNameString(track: Track): string {
        return `${track.order_number + 1}. ${track.tape ? '🖭' : ''} ${track.name === null ? this.composeTrackNameFromTrackNote(track) : `**${track.name}**`} `
    }

    private composeTrackNoteString(track: Track): string {
        let markupNote = ''

        if (track.name && track.note) {
            markupNote = `(*${track.note}*)`
        }

        return `${markupNote}`
    }

    private composeTrackNameFromTrackNote(track: Track): string {
        return `${track.note}`
    }
}