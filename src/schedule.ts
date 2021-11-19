import {Job} from "./scheduler/job";
import {start as runScheduler} from "./scheduler/scheduler";

const jobs:Array<Job> = [
    new Job('update_setlists', 1),
    new Job('update_events', 5)
]

runScheduler(jobs);