import { connect } from 'node:net';

export type ScanResult = 'clean' | 'infected' | 'unscanned' | 'error';

/**
 * ClamAV over clamd's INSTREAM protocol (SPEC 6). Without CLAMAV_HOST the file is marked
 * 'unscanned' so moderators can see it was not checked; production sets the host.
 */
export function scan(
  data: Uint8Array,
  target: { host: string; port: number } | null,
): Promise<ScanResult> {
  if (!target) return Promise.resolve('unscanned');
  return new Promise((resolve) => {
    const socket = connect(target.port, target.host);
    let reply = '';
    const done = (r: ScanResult) => {
      socket.destroy();
      resolve(r);
    };
    socket.setTimeout(60_000, () => done('error'));
    socket.on('error', () => done('error'));
    socket.on('data', (chunk) => (reply += chunk.toString('utf8')));
    socket.on('end', () =>
      done(/FOUND/.test(reply) ? 'infected' : /OK\0?\s*$/.test(reply) ? 'clean' : 'error'),
    );
    socket.on('connect', () => {
      socket.write('zINSTREAM\0');
      const CHUNK = 64 * 1024;
      for (let i = 0; i < data.length; i += CHUNK) {
        const part = data.subarray(i, i + CHUNK);
        const len = Buffer.alloc(4);
        len.writeUInt32BE(part.length);
        socket.write(len);
        socket.write(part);
      }
      socket.write(Buffer.alloc(4));
    });
  });
}
