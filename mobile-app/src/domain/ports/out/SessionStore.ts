import type { BellaSession, ItemCarritoBella } from '../model/BellaModels';

export interface SessionStore {
  get(): BellaSession | null;
  save(session: BellaSession): void;
  clear(): void;
  getCart(): ItemCarritoBella[];
  saveCart(items: ItemCarritoBella[]): void;
}
