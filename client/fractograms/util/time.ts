export class Timer {
    private isStopped = false;
    private elapsedMs = 0;

    private constructor(private startTimeMs: number | null) { }

    static newPaused(): Timer {
        return new Timer(null);
    }

    static newStarted(): Timer {
        const startTimeMs = performance.now();
        return new Timer(startTimeMs);
    }

    /** Starts or unpauses a timer. */
    start(): void {
        if (this.startTimeMs !== null) {
            return;
        }
        if (this.isStopped) {
            throw new Error('Cannot start a stopped timer');
        }
        this.startTimeMs = performance.now();
    }

    pause(): void {
        const now = performance.now();
        if (!this.startTimeMs) {
            return;
        }
        if (this.isStopped) {
            throw new Error('Cannot pause a stopped timer');
        }
        this.elapsedMs += now - this.startTimeMs;
        this.startTimeMs = null;
    }

    getElapsedMs(): number {
        let elapsedMs = this.elapsedMs;
        if (this.startTimeMs) {
            elapsedMs += performance.now() - this.startTimeMs;
        }
        return elapsedMs;
    }

    /** Stops a timer permanently. */
    stop(): void {
        this.pause();
        this.isStopped = true;
    }
}

export function msToHumanReadable(elapsedMs: number): string {
    return hmsToHumanReadable(msToHMS(elapsedMs));
}

interface HoursMinutesSeconds {
    hours: number; // integer
    minutes: number; // integer
    seconds: number; // floating point
}

const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = MS_PER_SECOND * 60;
const MS_PER_HOUR = MS_PER_MINUTE * 60;

function msToHMS(elapsedMs: number): HoursMinutesSeconds {
    const hours = Math.floor(elapsedMs / MS_PER_HOUR);
    elapsedMs -= hours * MS_PER_HOUR;
    const minutes = Math.floor(elapsedMs / MS_PER_MINUTE);
    elapsedMs -= minutes * MS_PER_MINUTE;
    return { hours, minutes, seconds: elapsedMs / MS_PER_SECOND };
}

function hmsToHumanReadable(hms: HoursMinutesSeconds): string {
    const chunks: string[] = [];
    if (hms.hours > 0) {
        chunks.push(`${hms.hours} hours`);
    }
    if (hms.minutes > 0 || chunks.length > 0) {
        chunks.push(`${hms.minutes} mins`);
    }
    chunks.push(hms.seconds.toFixed(0) + ' sec');
    return chunks.join(' ');
}