export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const toSnake = (s: string) =>
  s.replace(/[A-Z]/g, l => `_${l.toLowerCase()}`);