import {Job} from "./scheduler/job";
import {start as runScheduler, sleep} from "./scheduler/scheduler";
import Config from './config';

const startupDelayToAvoidCPUSpike = Config.environment == "production" ? 30 : 0;

const jobs:Array<Job> = [
    new Job('update_setlists', 1),
    new Job('update_users', 1),
    new Job('update_events', 5)
]

sleep(startupDelayToAvoidCPUSpike);
runScheduler(jobs);