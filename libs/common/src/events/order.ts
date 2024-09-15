export class OrderCreatedEvent {
  constructor(private readonly id: number) {}

  toString(): string {
    return JSON.stringify(this.toJSON());
  }

  toJSON(): { id: number } {
    return {
      id: this.id,
    };
  }
}
