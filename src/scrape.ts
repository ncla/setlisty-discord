import SetlistUpdater from "./setlist-updater";
import {SetlistfmAPIRequestClient} from "./request/SetlistFmAPI";
import knexClient from "./helpers/knexClient";
import {ArtistRepository} from "./repository/ArtistRepository";
import { SetlistRepository } from "./repository/SetlistRepository";
import { TrackRepository } from "./repository/TrackRepository";

let updater = new SetlistUpdater(
    new SetlistfmAPIRequestClient(),
    new ArtistRepository(knexClient),
    new SetlistRepository(knexClient),
    new TrackRepository(knexClient)
);
updater.runArtistUpdate('9c9f1380-2516-4fc9-a3e6-f9f61941d090')