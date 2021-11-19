import path from 'path';

export class Job {
    public readonly intervalSeconds: number;
    public readonly name: string;

    constructor(name: string, intervalSeconds: number) {
        this.name = name;
        this.intervalSeconds = intervalSeconds;
    }

    get path(): string {
        return path.join(__dirname, "../jobs", `${this.name}.js`)
    }
}

