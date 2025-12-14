declare module 'msgpack-lite' {
  export function encode(data: any): Uint8Array
  export function decode(data: ArrayBuffer | Uint8Array): any
}
