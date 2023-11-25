import Parser from "../src/parser";
import fixtures from "./fixtures/parser.json";

describe("Parser", () => {
  it.each(fixtures)(
    "should parse $expression",
    ({ expression, tree: expectedTree }) => {
      const parser = new Parser();
      const tree = parser.parse(expression);
      expect(tree).toEqual(expectedTree);
    }
  );
});
