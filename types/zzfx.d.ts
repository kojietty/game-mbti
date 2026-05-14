declare module "zzfx" {
  export function zzfx(...args: number[]): AudioBufferSourceNode | undefined;
  export function zzfxV(volume: number): void;
}
