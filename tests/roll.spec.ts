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

  describe("fromJSON", () => {
    it("should return a Roll instance from a valid JSON object", () => {
      const roll = Roll.fromJSON({ input: "1d6" });
      expect(roll).toBeInstanceOf(Roll);
      expect(roll.input).toBe("1d6");
    });

    it("should throw an error for an invalid JSON object", () => {
      expect(() => Roll.fromJSON({ foo: "bar" })).toThrow("Invalid JSON");
    });

    it("should throw an error for a null JSON object", () => {
      expect(() => Roll.fromJSON(null)).toThrow("Invalid JSON");
    });

    it("should throw an error for an undefined JSON object", () => {
      expect(() => Roll.fromJSON(undefined)).toThrow("Invalid JSON");
    });

    it("should throw an error for a non-object JSON object", () => {
      expect(() => Roll.fromJSON("1d6")).toThrow("Invalid JSON");
    });
  });

  describe("isRoll", () => {
    it("should return true for a Roll instance", () => {
      const roll = new Roll("1d6");
      expect(Roll.isRoll(roll)).toBe(true);
    });

    it("should return false for a non-Roll object", () => {
      expect(Roll.isRoll({ foo: "bar" })).toBe(false);
    });
  });
});
