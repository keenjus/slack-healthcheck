export class Milliseconds {
    static fromSeconds(n: number) {
        return n * 1000;
    }

    static fromMinutes(n: number) {
        return n * 60 * 1000;
    }
}

export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(() => resolve(), ms));
}