import debug from "debug";
import Parser, { Expression } from "./parser";
import Roll, { isRollResult, RollOptions, RollResult } from "./roll";

const log = debug("roll-master:roller");

export interface RollerResult {
  result?: number;
  rolls?: RollResult[];
}

type NumberOperation = (a: number, b: number) => number;
type RepeatOperation = (
  a: Roll,
  b: number,
  options?: RollOptions
) => Promise<RollResult[]>;
const OPERATIONS: Record<string, NumberOperation | RepeatOperation> = {
  "+": (a: number, b: number) => +a + b,
  "-": (a: number, b: number) => +a - b,
  "*": (a: number, b: number) => +a * b,
  "..": (a: Roll, b: number, options?: RollOptions) =>
    Promise.all(
      Array.from(Array(b)).map((_, i) =>
        a.roll({ ...(options || {}), repetition: i })
      )
    ),
};

export default class Roller {
  private parser: Parser = new Parser();

  constructor(private options?: RollOptions) {}

  private async _handleExpression(
    expression: Expression,
    options?: RollOptions
  ): Promise<RollerResult> {
    const left = await this.traverse(expression.left as Expression, options);
    const right = await this.traverse(
      expression.right as Expression,
      options
    );
    const operator = expression.operator as keyof typeof OPERATIONS;
    const operation = OPERATIONS[operator];
    if (!operation) throw new Error("Invalid operator");

    if (operator === "..") {
      if (expression.left?.type !== "ROLL")
        throw new Error(`Invalid expression. It should be a roll result.`);
      const result = (operation as RepeatOperation)(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        Roll.fromJSON(expression.left!.value),
        right.result as number,
        options
      );
      return { rolls: await result };
    }

    const leftResult = this._getRollResult(left);
    const rightResult = this._getRollResult(right);
    const result = (operation as NumberOperation)(
      leftResult,
      rightResult
    ) as number;
    return {
      result,
      rolls: [...(left.rolls || []), ...(right.rolls || [])].filter(
        isRollResult
      ) as unknown as RollResult[],
    };
  }

  private async traverse(
    expression: Expression,
    options?: RollOptions
  ): Promise<RollerResult> {
    if (expression.type === "ROLL") {
      const roll = Roll.fromJSON(expression.value as Roll);
      return { rolls: [await roll.roll(options)] };
    }
    if (expression.type === "NUMBER")
      return { result: expression.value as number };
    if (expression.type === "EXPRESSION") {
      return this._handleExpression(expression, options);
    }
    throw new Error(`Invalid expression "${expression.type}"`);
  }

  public async roll(
    input: string,
    options?: RollOptions
  ): Promise<RollerResult> {
    log(`rolling "${input}"`);
    const now = Date.now();
    const tree = this.parser.parse(input);
    if (!tree) throw new Error("Invalid roll expression");

    const results = await this.traverse(tree, options || this.options);
    log(`rolled in ${Date.now() - now}ms`);
    return results;
  }

  private _getRollResult({ result, rolls }: RollerResult): number {
    return result ?? (rolls ? rolls.reduce((a, b) => a + b.sum, 0) : 0);
  }
}
