import { ROLL_REGEX } from "./roll";

/**
 * Represents a token.
 */
export interface Token {
  type: string;
  value: string;
  position: number | null;
}

const Spec: [RegExp, string][] = [
  // Ignore
  [/^\s+/, "IGNORE"],
  [/^;/, "IGNORE"],
  [/^,/, "IGNORE"],
  [/^#.*/, "IGNORE"],

  // Parenthesis
  [/^\(/, "LPAREN"],
  [/^\)/, "RPAREN"],

  // ROLL
  [ROLL_REGEX, "ROLL"],

  // Operators
  [/^[*+-]/, "OPERATOR"], // *, +, - : Multiply, Add, Subtract
  [/^\.\./, "OPERATOR"], // .. : Repeat

  // Numbers
  [/^(\d+)/, "NUMBER"],
];

/**
 * The Tokenizer class is responsible for breaking a string into tokens.
 */
export default class Tokenizer {
  private cursor = 0;
  private input = "";

  public init(input: string) {
    this.cursor = 0;
    this.input = input;
  }

  public hasNext(): boolean {
    return this.cursor < this.input.length;
  }

  public next(): Token {
    if (!this.hasNext()) throw new RangeError("No more tokens");

    const input = this.input.slice(this.cursor);
    for (const [regex, type] of Spec) {
      const match = input.match(regex);
      if (match) {
        const value = match[0];
        this.cursor += value.length;
        return { type, value, position: this.cursor - value.length + 1 };
      }
    }
    throw new SyntaxError(`Unexpected token at ${this.cursor} (${input})`);
  }
}
