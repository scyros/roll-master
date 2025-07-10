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

  it("should throw an error for an invalid expression type", async () => {
    const roller = new Roller();
    (roller as any).parser.parse = () => ({ type: "INVALID" });
    await expect(roller.roll("1+1")).rejects.toThrow(
      'Invalid expression "INVALID"'
    );
  });

  describe("zero-result edge cases", () => {
    it("should return 0 for simple numeric subtraction resulting in zero", async () => {
      const roller = new Roller();
      const rolled = await roller.roll("1-1");
      expect(rolled.result).toBe(0);
      expect(rolled.rolls).toEqual([]);
    });
    it("should handle mixed operations producing zero correctly", async () => {
      const roller = new Roller();
      const rolled = await roller.roll("1-1+2");
      expect(rolled.result).toBe(2);
    });
    it("should handle dice multiplied by zero correctly", async () => {
      const rollSpy = jest.fn(async () => 4);
      const roller = new Roller();
      await expect(
        roller.roll("1d6*0", { roll: rollSpy })
      ).resolves.toHaveProperty("result", 0);
    });

    describe("discard-all edge cases", () => {
      it("should allow discarding all dice for a single die", async () => {
        const rollSpy = jest.fn(async () => 3);
        const roller = new Roller();
        const rolled = await roller.roll("1d6!1", { roll: rollSpy });
        expect(rolled.rolls).toHaveLength(1);
        expect(rolled.rolls![0].sum).toBe(0);
      });
      it("should allow discarding all dice for multiple dice", async () => {
        const rollSpy = jest.fn(async () => 5);
        const roller = new Roller();
        const rolled = await roller.roll("4d6!4", { roll: rollSpy });
        expect(rolled.rolls).toHaveLength(1);
        expect(rolled.rolls![0].sum).toBe(0);
      });
    });
  });
});
