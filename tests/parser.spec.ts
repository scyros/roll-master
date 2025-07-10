import Parser from "../src/parser";
import fixtures from "./fixtures/parser.json";

describe("Parser", () => {
  describe("when parsing valid expressions", () => {
    it.each(fixtures)(
      "should parse $expression",
      ({ expression, tree: expectedTree }) => {
        const parser = new Parser();
        const tree = parser.parse(expression);
        expect(tree).toEqual(expectedTree);
      }
    );
  });

  describe("when parsing invalid expressions", () => {
    it.each([
      {
        expression: "1d6 * ",
        error: "Invalid expression. Incomplete expression.",
      },
      {
        expression: "1d6 *",
        error: "Invalid expression. Incomplete expression.",
      },
      {
        expression: "1(1+2)",
        error: "Invalid expression. Dangling parenthesis.",
      },
      {
        expression: "1d6(1+2)",
        error: "Invalid expression. Dangling parenthesis.",
      },
      {
        expression: "(1+2)2",
        error: "Invalid expression. Dangling number.",
      },
      {
        expression: "(1+2) 2",
        error: "Invalid expression. Dangling number.",
      },
      {
        expression: "1d6 + (2d6",
        error: "Invalid expression. Incomplete expression.",
      },
      {
        expression: "1d6 + (2d6+",
        error: "Invalid expression. Incomplete expression.",
      },
      {
        expression: "1d6 + (2d6+)",
        error: "Invalid expression. Incomplete expression.",
      },
      {
        expression: "1d6 + ()",
        error: "Invalid expression. Incomplete expression.",
      },
      {
        expression: "1d6 + (*2)",
        error: "Invalid expression. Incomplete expression.",
      },
      {
        expression: "(1+2) 1d6",
        error: "Invalid expression. Dangling roll.",
      },
      {
        expression: "(1+2)1d6",
        error: "Invalid expression. Dangling roll.",
      },
      {
        expression: "(1+2)d6",
        error: "Invalid expression. Dangling roll.",
      },
      {
        expression: "(1d6+2)1d6",
        error: "Invalid expression. Dangling roll.",
      },
      {
        expression: "(1d6+2))",
        error: "Invalid expression. Missing left parenthesis.",
      },
      {
        expression: "(1d6+2",
        error: "Invalid expression. Incomplete expression.",
      },
      {
        expression: "(1d6+",
        error: "Invalid expression. Incomplete expression.",
      },
      {
        expression: "(1d6+2*",
        error: "Invalid expression. Incomplete expression.",
      },
      {
        expression: "1d6 + 2)",
        error: "Invalid expression. Missing left parenthesis.",
      },
      {
        expression: "1d6)",
        error: "Invalid expression. Missing left parenthesis.",
      },
      {
        expression: "1d6 (2d6)",
        error: "Invalid expression. Dangling parenthesis.",
      },
      {
        expression: "1d6 + 2 1d6",
        error: "Invalid expression. Dangling roll.",
      },
      {
        expression: "1d6 + 2 5",
        error: "Invalid expression. Dangling number.",
      },
      { expression: ")1+2", error: "Invalid expression. Missing left parenthesis." },
      { expression: "(1+2", error: "Invalid expression. Incomplete expression." },
      { expression: "1+", error: "Invalid expression. Incomplete expression." },
      { expression: "(1+)*2", error: "Invalid expression. Incomplete expression." },
      { expression: "(1+2))", error: "Invalid expression. Missing left parenthesis." },
      { expression: "1d6+", error: "Invalid expression. Incomplete expression." },
      { expression: "(1d6)1d6", error: "Invalid expression. Dangling roll." },
      {
        expression: "((1+2)",
        error: "Invalid expression. Incomplete expression.",
      },
      { expression: "(1+2))", error: "Invalid expression. Missing left parenthesis." },
      { expression: "(1+)", error: "Invalid expression. Incomplete expression." },
    ])("should throw for $expression", ({ expression, error }) => {
      const parser = new Parser();
      expect(() => parser.parse(expression)).toThrow(error);
    });
  });
});
