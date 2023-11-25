import Roll from "../src/roll";
import fixtures from "./fixtures/roll.json";

describe("Roll", () => {
  it.each(fixtures)(
    "should roll $expression",
    async ({ expression, results, rolls }) => {
      const rollSpy = jest.fn(async ({ index }) => rolls[index]);
      const roll = new Roll(expression);
      const rolled = await roll.roll({ roll: rollSpy });
      expect(rolled).toEqual(results);
    }
  );
});
