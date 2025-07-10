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

  it("should throw an error when there are no more tokens", () => {
    const tokenizer = new Tokenizer();
    tokenizer.init("1d6");
    while (tokenizer.hasNext()) {
      tokenizer.next();
    }
    expect(() => tokenizer.next()).toThrow("No more tokens");
  });
});
