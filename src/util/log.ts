export function log(msg: string) {
    const ts = new Date().toISOString();
    console.log(`${ts} - ${msg}`);
}

export function logError(error: Error) {
    const ts = new Date().toISOString();
    console.error(`${ts} - ERROR: ${error.message}`);
}
