interface IngredientEventPayload {
  id: number;
  email: string;
}

export class IngredientEvent {
  private id: number;
  private email: string;

  constructor(payload: IngredientEventPayload) {
    this.id = payload.id;
    this.email = payload.email;
  }

  toString(): string {
    return JSON.stringify(this.toJSON());
  }

  toJSON(): IngredientEventPayload {
    return {
      id: this.id,
      email: this.email,
    };
  }
}
