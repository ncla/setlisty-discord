import Bree from 'bree';
import Graceful from '@ladjs/graceful';
import Config from './config';
import path from "path";

const startupDelayToAvoidCPUSpike = Config.environment == "production" ? '30s' : false;

const bree = new Bree({
    root: path.join(__dirname, "jobs"),
    jobs: [
        {
            name: 'update_setlists',
            timeout: startupDelayToAvoidCPUSpike,
            interval: '1s'
        },
        {
            name: 'update_events',
            timeout: startupDelayToAvoidCPUSpike,
            interval: '5s'
        },
    ]
});

const graceful = new Graceful({ brees: [bree] });
graceful.listen();

bree.start();