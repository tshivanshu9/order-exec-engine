export enum OrderStatus {
  PENDING = 'pending',
  ROUTING = 'routing',
  BUILDING = 'building',
  SUBMITTED = 'submitted',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
}

export enum DexType {
  RAYDIUM = 'raydium',
  METEORA = 'meteora',
}

export enum SocketEventType {
  SNAPSHOT = 'snapshot',
  EVENT = 'event',
}
