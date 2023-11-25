/* eslint-disable @typescript-eslint/no-explicit-any */
import Roller from "../src/roller";
import fixtures from "./fixtures/roller.json";
import errorFixtures from "./fixtures/errors.json";

describe("Roller", () => {
  it.each(fixtures)(
    "should roll $expression",
    async ({
      expression,
      results,
      rolls,
    }: {
      expression: string;
      results: any;
      rolls: any;
    }) => {
      const rollSpy = jest.fn(
        async ({ index, repetition, roll }) => rolls[roll][repetition][index]
      );
      const roller = new Roller();
      const rolled = await roller.roll(expression, { roll: rollSpy });
      expect(rolled).toEqual(results);
    }
  );

  it.each(errorFixtures)(
    "should throw an error when rolling $expression",
    async ({ expression, message }) => {
      const roller = new Roller();
      await expect(roller.roll(expression)).rejects.toThrow(message);
    }
  );
});
