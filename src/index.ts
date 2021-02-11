import axios, { AxiosResponse } from 'axios';
import dotenv from 'dotenv-flow';

import { Milliseconds } from './util';
import { log, logError } from './util/log';

dotenv.config();

const healthcheckUrl = process.env.HEALTHCHECK_URL!;
const healthcheckTitle = (process.env.HEALTHCHECK_TITLE || healthcheckUrl)!;

const slackWebhookUrl = (process.env.SLACK_WEBHOOK)!;

const intervalMs: number = process.env.HEALTHCHECK_INTERVAL
    ? Milliseconds.fromSeconds(parseInt(process.env.HEALTHCHECK_INTERVAL))
    : Milliseconds.fromMinutes(5);

const graceMs: number = process.env.HEALTHCHECK_GRACE
    ? Milliseconds.fromSeconds(parseInt(process.env.HEALTHCHECK_GRACE))
    : Milliseconds.fromMinutes(15);

enum Status {
    Online,
    Degraded,
    Offline
}

interface HealthCheckResult {
    status: Status;
    response?: AxiosResponse;
    error?: Error;
}

function printConfiguration() {
    const configuration =
        '---Configuration---\n' +
        `URL: ${healthcheckUrl}\n` +
        `TITLE: ${healthcheckTitle}\n` +
        `WEBHOOK: ${slackWebhookUrl}\n` +
        `INTERVAL: ${intervalMs}ms\n` +
        `GRACE: ${graceMs}ms\n`;

    console.log(configuration);
}

async function main() {
    if (!healthcheckUrl) throw new Error('HEALTHCHECK_URL undefined');
    if (!slackWebhookUrl) throw new Error('SLACK_WEBHOOK undefined');

    printConfiguration();

    let lastStatus = Status.Online;

    while (true) {
        const result = await healthcheck();

        if (result.status !== lastStatus && await graceCheck(result.status)) {
            await handle(result);
            lastStatus = result.status;
        }

        await sleep(intervalMs);
    }
}

async function graceCheck(status: Status) {
    log('Performing grace check');

    // We want to see when the application is online immediately.
    // So we skip the grace check here.
    if (status === Status.Online) {
        return true;
    }

    await sleep(graceMs);
    return (await healthcheck()).status === status;
}

async function handle(result: HealthCheckResult) {
    if (result.status === Status.Online) {
        await sendMessage(`${healthcheckTitle} is online!`);
    } else if (result.response) {
        await sendMessage(`${healthcheckTitle} has degraded! Status code: ${result.response.status}`);
    } else if (result.error) {
        await sendMessage(`${healthcheckTitle} is offline! Error: ${result.error.message}`);
    } else {
        await sendMessage(`${healthcheckTitle} is offline! Unhandled`);
    }
}

async function healthcheck(): Promise<HealthCheckResult> {
    try {
        const response = await axios.get(healthcheckUrl);
        log(`Status: ${response.status}`);

        const status = response.status >= 200 && response.status < 300
            ? Status.Online
            : Status.Degraded;

        return { status, response };
    } catch (err) {
        logError(err);
        return { status: Status.Offline, error: err };
    }
}

async function sendMessage(msg: string) {
    log(`Sending notification: '${msg}'`);
    try {
        const response = await axios.post(slackWebhookUrl, { 'text': msg }, { headers: { 'Content-Type': 'application/json' } });
        log(`Slack webhook status code: ${response.status}`);
    } catch (err) {
        logError(err);
    }
}

export function sleep(ms: number) {
    return new Promise<void>(resolve => setTimeout(() => resolve(), ms));
}

main().catch(err => console.error(err));
