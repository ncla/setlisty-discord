import SetlistUpdater from "./setlist-updater";
import {SetlistfmRequestClient} from "./request/SetlistFm";

let updater = new SetlistUpdater('9c9f1380-2516-4fc9-a3e6-f9f61941d090', new SetlistfmRequestClient());
updater.run()