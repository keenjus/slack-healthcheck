import axios, { AxiosResponse } from 'axios';
import dotenv from 'dotenv-flow';

dotenv.config();

const healthcheckUrl = process.env.HEALTHCHECK_URL!;
const healthcheckTitle = (process.env.HEALTHCHECK_TITLE || healthcheckUrl)!;

const slackWebhookUrl = (process.env.SLACK_WEBHOOK)!;
const intervalSeconds: number = parseInt(process.env.HEALTCHECK_INTERVAL || (60 * 5).toString());

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

async function main() {
    if (!healthcheckUrl) throw new Error("HEALTHCHECK_URL undefined");
    if (!slackWebhookUrl) throw new Error("SLACK_WEBHOOK undefined");

    let lastStatus = Status.Online;

    const intervalMs = intervalSeconds * 1000;

    while (true) {
        const result = await healthcheck();

        if (result.status !== lastStatus) {
            await handle(result);
        }

        lastStatus = result.status;

        await sleep(intervalMs);
    }
}

async function handle(result: HealthCheckResult) {
    if (result.status === Status.Online) {
        await sendMessage(`${healthcheckTitle} is up!`);
    } else {
        await handleError(result);
    }
}

async function handleError(result: HealthCheckResult) {
    if (result.response) {
        await sendMessage(`${healthcheckTitle} has degraded! Status code: ${result.response.status}`);
    } else if (result.error) {
        await sendMessage(`${healthcheckTitle} is down! Error: ${result.error.message}`);
    } else {
        await sendMessage(`${healthcheckTitle} is down! Unhandled`);
    }
}

async function healthcheck(): Promise<HealthCheckResult> {
    try {
        const response = await axios.get(healthcheckUrl);
        log(`Status: ${response.status}`);

        const status = response.status >= 200 && response.status < 300 ? Status.Online : Status.Degraded;

        return { status, response };
    } catch (err) {
        log(`Error: ${err.message}`);
        return { status: Status.Offline, error: err };
    }
}

async function sendMessage(msg: string) {
    log(`Sending notification: "${msg}"`);
    try {
        const response = await axios.post(slackWebhookUrl, { "text": msg }, { headers: { "Content-Type": "application/json" } });
        log(`Webhook status code: ${response.status}`);
    } catch (err) {
        console.error(err);
    }
}

function log(msg: string) {
    const ts = new Date().toISOString();
    console.log(`${ts} - ${msg}`);
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(() => resolve(), ms));
}

main().catch(err => console.error(err));