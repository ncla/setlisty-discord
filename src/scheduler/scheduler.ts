import {execSync, spawnSync} from "child_process";
import {Job} from "./job";

export function start(jobs: Array<Job>) {
    while (true) {
        executeAllJobs(jobs);
        sleep(1);
    }
}

function sleep(seconds: number) {
    execSync(`sleep ${seconds}`)
}

function executeAllJobs(jobs: Array<any>) {
    const now = getTimestamp();
    for (const job of jobs) {
        executeJob(job, now)
    }
}

function getTimestamp() {
    return Math.floor(Date.now() / 1000);
}

function executeJob(job: Job, now: number) {
    if (now % job.intervalSeconds == 0) {
        spawnJob(job);
    }
}

function spawnJob(job: Job) {
    console.log(`Executing job ${job.name}`)
    spawnScript(job.path);
    console.log(`Finished job ${job.name}\n`)
}

function spawnScript(scriptPath: string) {
    spawnSync("node", [scriptPath], {
        stdio: 'inherit',
        encoding: 'utf-8'
    })
}
