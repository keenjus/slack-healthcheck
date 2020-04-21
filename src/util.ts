export class Milliseconds {
    static fromSeconds(n: number) {
        return n * 1000;
    }

    static fromMinutes(n: number) {
        return n * 60 * 1000;
    }
}