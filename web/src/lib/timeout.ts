/**
 * Settles like `promise`, or rejects after `ms` if it hasn't settled by then. The timer is cleared as soon as `promise`
 * settles, so a fast answer leaves no timer behind. Server pages use it so a hanging devnet RPC can't hold them up.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timed out after ${ms} ms`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
