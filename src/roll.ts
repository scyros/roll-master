export enum Sort {
  Ascending = "ASC",
  Descending = "DESC",
}

export type Rolls = Record<
  string,
  { rerolled?: boolean; rolls: number[]; discarded?: boolean }
>;

/**
 * Represents the result of a roll.
 */
export interface RollResult {
  roll: string;
  rolls: Rolls;
  sum: number;
}

/**
 * Checks if a result is a RollResult.
 * @param result The result to check.
 * @returns True if the result is a RollResult, false otherwise.
 */
export function isRollResult(result: unknown): result is RollResult {
  return (
    typeof result === "object" &&
    result !== null &&
    "roll" in result &&
    "rolls" in result &&
    "sum" in result
  );
}

/**
 * Represents the options for a roll.
 */
export interface RollOptions {
  roll?: (options: {
    index: number;
    repetition: number;
    reroll: boolean;
    roll: string;
  }) => Promise<number>;
  repetition?: number;
}

export const ROLL_REGEX =
  /^(?<count>\d*)d(?<sides>\d+)(r(?<reroll>\d+)(s(?<reroll_sort>[+-]))?)?(!(?<discard>\d+)(s(?<discard_sort>[+-]))?)?/;

/**
 * The Roll class is responsible for parsing a dice expression and rolling the dice.
 */
export default class Roll {
  count: number;
  sides: number;
  reroll = 0;
  discard = 0;
  rerollSort: Sort = Sort.Ascending;
  discardSort: Sort = Sort.Ascending;

  constructor(readonly input: string) {
    const match = input.match(ROLL_REGEX);
    if (!match) throw new Error("Invalid dice expression");

    const count = match.groups?.count || "1";
    const sides = match.groups?.sides ?? "1";
    const reroll = match.groups?.reroll ?? "0";
    const discard = match.groups?.discard ?? "0";
    const rerollSort = match.groups?.reroll_sort ?? "+";
    const discardSort = match.groups?.discard_sort ?? "+";

    this.count = parseInt(count);
    this.sides = parseInt(sides);
    this.reroll = parseInt(reroll);
    this.discard = parseInt(discard);
    this.rerollSort = rerollSort === "+" ? Sort.Ascending : Sort.Descending;
    this.discardSort = discardSort === "+" ? Sort.Ascending : Sort.Descending;

    this._validate();
  }

  private _validate() {
    if (this.sides < 1) throw new Error("Sides must be greater than 0");
    if (this.reroll > this.count)
      throw new Error("Reroll must be less than or equal to count");
    if (this.discard > this.count)
      throw new Error("Discard must be less than or equal to count");
  }

  private _getSortedDiceIds(
    rolls: Rolls,
    threshold: number,
    sort: Sort
  ): string[] {
    return Object.keys(rolls)
      .map((key) => ({
        key,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        roll: rolls[key].rolls.at(-1)!,
      }))
      .sort((a, b) =>
        sort === Sort.Ascending ? a.roll - b.roll : b.roll - a.roll
      )
      .slice(0, threshold)
      .map(({ key }) => key)
      .sort();
  }

  private _getFinalRolls(rolls: Rolls) {
    return (
      Object.keys(rolls)
        .filter((key) => !rolls[key].discarded)
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        .map((key) => rolls[key].rolls.at(-1)!)
    );
  }

  private async _performRerolls(
    rolls: Rolls,
    roll: (options: {
      index: number;
      repetition: number;
      reroll: boolean;
      roll: string;
    }) => Promise<number>,
    repetition: number
  ) {
    if (this.reroll) {
      const toReroll = this._getSortedDiceIds(
        rolls,
        this.reroll,
        this.rerollSort
      );

      (await Promise.all(
        toReroll.map(async (diceId, i) => ({
          id: diceId,
          roll: await roll({
            index: i,
            repetition,
            reroll: true,
            roll: `d${this.sides}`,
          }),
        }))
      )).forEach(({ id, roll }) => {
        rolls[id] = {
          ...rolls[id],
          rerolled: true,
          rolls: [...rolls[id].rolls, roll],
        };
      });
    }
  }

  private _performDiscards(rolls: Rolls) {
    if (this.discard) {
      const toDiscard = this._getSortedDiceIds(
        rolls,
        this.discard,
        this.discardSort
      );

      toDiscard.forEach((diceId) => {
        rolls[diceId] = { ...rolls[diceId], discarded: true };
      });
    }
  }

  public async roll({
    roll = async () => Math.floor(Math.random() * this.sides) + 1,
    repetition = 0,
  }: RollOptions = {}): Promise<RollResult> {
    const rolls: Rolls = {};

    // Roll the initial dice
    (await Promise.all(
      Array.from(Array(this.count)).map((_, i) =>
        roll({ index: i, repetition, reroll: false, roll: `d${this.sides}` })
      )
    )).forEach((roll, i) => {
      rolls[`d${i}`] = { rolls: [roll] };
    });

    // Reroll the dice if necessary
    await this._performRerolls(rolls, roll, repetition);

    // Discard the dice if necessary
    this._performDiscards(rolls);

    // Sum the final rolls
    const sum = this._getFinalRolls(rolls).reduce((a, b) => a + b, 0);

    return {
      roll: `${this.count}d${this.sides}`,
      rolls,
      sum,
    };
  }

  toJSON() {
    return {
      input: this.input,
      count: this.count,
      sides: this.sides,
      reroll: this.reroll,
      discard: this.discard,
      rerollSort: this.rerollSort,
      discardSort: this.discardSort,
    };
  }

  static fromJSON(json: unknown): Roll {
    if (
      !json ||
      typeof json !== "object" ||
      !Object.hasOwnProperty.call(json, "input")
    )
      throw new Error("Invalid JSON");
    return new Roll((json as { input: string }).input);
  }

  static isRoll(roll: unknown): roll is Roll {
    return roll instanceof Roll;
  }
}
