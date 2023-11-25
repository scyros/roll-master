import Tokenizer, { Token } from "../src/tokenizer";
import fixtures from "./fixtures/tokenizer.json";

describe("Tokenizer", () => {
  it.each(fixtures)("should tokenize $expression", ({ expression, tokens }) => {
    const tokenizer = new Tokenizer();
    tokenizer.init(expression);
    const actual: Token[] = [];
    while (tokenizer.hasNext()) {
      actual.push(tokenizer.next());
    }
    expect(actual).toEqual(tokens);
  });
});
