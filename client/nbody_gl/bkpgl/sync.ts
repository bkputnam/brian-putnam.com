export function sync(
    gl: WebGL2RenderingContext,
    timeoutMs = -1,
    pollIntervalMs = 0): Promise<{ numPolls: number, elapsedMs: number }> {
    // A GLbitfield specifying a bitwise combination of flags controlling the
    // behavior of the sync object. Must be 0 (exists for extensions only). 
    const fencSyncFlags = 0;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, fencSyncFlags);
    if (!sync) {
        return Promise.reject(new Error('Failed to create sync object'));
    }
    const startMs = performance.now();
    return new Promise((resolve, reject) => {
        let numPolls = 0;
        const poll = () => {
            numPolls++;
            // A GLbitfield specifying a bitwise combination of flags
            // controlling the flushing behavior.
            // May be gl.SYNC_FLUSH_COMMANDS_BIT. 
            const clientWaitSyncFlags = 0;
            // A GLint64 specifying a timeout (in nanoseconds) for which to wait
            // for the sync object to become signaled. Must not be larger
            // than gl.MAX_CLIENT_WAIT_TIMEOUT_WEBGL.
            const clientWaitSyncTimeout = 0;
            const status = gl.clientWaitSync(
                sync, clientWaitSyncFlags, clientWaitSyncTimeout);
            switch (status) {
                case gl.ALREADY_SIGNALED:
                case gl.CONDITION_SATISFIED:
                    resolve({
                        numPolls,
                        elapsedMs: performance.now() - startMs
                    });
                    return;
                case gl.WAIT_FAILED:
                    reject(new Error('WAIT_FAILED'));
                    return;
                default:
                    // If we get here, status is gl.TIMEOUT_EXPIRED, but that
                    //just refers to `clientWaitSyncTimeout = 0` above. Since
                    // we want to wait asynchronously instead of synchronously,
                    // we use custom logic based on the timeoutMs parameter
                    // instead.
                    const elapsedMs = performance.now() - startMs;
                    if (timeoutMs > 0 && elapsedMs > timeoutMs) {
                        reject(new Error('TIMEOUT_EXPIRED'));
                        return;
                    }
                    // Note: don't use `Promise.resolve().then(poll)` here or
                    // below; it seems to get into an infinite waiting loop.
                    // Presumably because the current JS event loop tick needs
                    // to finish before the `sync` object receives its signal
                    // from WebGL?
                    setTimeout(poll, pollIntervalMs);
            }
        };
        // Note: don't use `Promise.resolve().then(poll)`, see above
        setTimeout(poll, pollIntervalMs);
    });
}