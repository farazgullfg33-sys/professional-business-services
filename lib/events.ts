export type AdminEvent = { type: "created" | "updated"; entity: "client" | "invoice" | "service" };

type Listener = (event: AdminEvent) => void;

class AdminEventBus {
  private listeners = new Set<Listener>();

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(event: AdminEvent) {
    for (const listener of Array.from(this.listeners)) listener(event);
  }
}

const globalForEvents = globalThis as unknown as { adminEventBus?: AdminEventBus };

export const adminEventBus = globalForEvents.adminEventBus ?? new AdminEventBus();

if (process.env.NODE_ENV !== "production") {
  globalForEvents.adminEventBus = adminEventBus;
}
