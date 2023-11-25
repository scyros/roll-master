import Roll from "./roll";
import Tokenizer from "./tokenizer";

export type OPERATOR = "+" | "-" | "*";

export interface Expression {
  type: "EXPRESSION" | "ROLL" | "NUMBER";
  left?: Expression | null;
  right?: Expression | null;
  operator?: OPERATOR;
  value?: Roll | number | null;
  parent?: Expression | null;
}

export default class Parser {
  private tokenizer = new Tokenizer();
  private _tree: Expression = { type: "EXPRESSION" };
  private lastBranch: Expression | null = null;

  private get tree(): Expression | null {
    if (!this._tree) return null;
    return JSON.parse(
      JSON.stringify(this._tree, (k, v) =>
        k === "parent" ? undefined : v ?? undefined
      )
    );
  }

  private _isBranchReady(branch: Expression): boolean {
    if (branch.type !== "EXPRESSION") return false;
    if (!branch.right) return false;
    if (!branch.left) return false;
    if (!branch.operator) return false;
    return true;
  }

  private _parse_lparen() {
    let branch = this.lastBranch || this._tree;
    if (branch.type !== "EXPRESSION")
      throw new Error(
        `Invalid expression ${branch.type}. It should be an expression.`
      );
    branch.right = { type: "EXPRESSION" };
    branch.right.parent = branch;
    branch = branch.right;
    this.lastBranch = branch;
  }

  private _parse_rparen() {
    let branch: Expression | null = this.lastBranch || this._tree;
    if (branch.type !== "EXPRESSION")
      throw new Error(
        `Invalid expression ${branch.type}. It should be an expression.`
      );

    if (!branch.parent)
      throw new Error(`Invalid expression. Missing left parenthesis.`);
    if (!branch.right)
      throw new Error(`Invalid expression. Incomplete expression.`);

    if (branch.left || branch.operator) {
      branch = branch.parent || null;
      this.lastBranch = branch;
      return;
    }

    branch = branch.parent as Expression;
    if (!branch.right)
      throw new Error(`Invalid expression. Incomplete expression.`);
    Object.assign(branch, branch.right, { parent: undefined });
    this.lastBranch = branch;
  }

  private _parse_roll(token: { type: string; value: string }) {
    const branch = this.lastBranch || this._tree;
    if (this._isBranchReady(branch))
      throw new Error(`Invalid expression. Dangling roll.`);

    const roll = new Roll(token.value);
    branch.right = { type: "ROLL", value: roll };
    this.lastBranch = branch;
  }

  private _parse_number(token: { type: string; value: string }) {
    const branch = this.lastBranch || this._tree;
    if (this._isBranchReady(branch))
      throw new Error(`Invalid expression. Dangling number.`);

    branch.right = { type: "NUMBER", value: +token.value };
    this.lastBranch = branch;
  }

  private _parse_operator(token: { type: string; value: string }) {
    let branch = this.lastBranch;
    if (!branch) throw new Error(`Invalid expression. Missing branch.`);
    if (branch.type !== "EXPRESSION")
      throw new Error(`Invalid expression. It should be an expression.`);
    if (!branch.right)
      throw new Error(`Invalid expression. Incomplete expression.`);

    if (branch.left && branch.right) {
      if (["+", "-", ".."].includes(token.value)) {
        branch = {
          type: "EXPRESSION",
          operator: token.value as OPERATOR,
          left: { ...branch },
          right: undefined,
          value: undefined,
          parent: undefined,
        };
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        Object.assign(this.lastBranch!, branch);
      } else {
        branch.right = {
          type: "EXPRESSION",
          operator: token.value as OPERATOR,
          left: { ...branch.right },
        };
        this.lastBranch = branch.right;
      }
    } else {
      branch.operator = token.value as OPERATOR;
      branch.left = branch.right;
      branch.right = undefined;
    }
  }

  public parse(input: string) {
    this.tokenizer.init(input);
    this._tree = { type: "EXPRESSION" };
    this.lastBranch = this._tree;

    while (this.tokenizer.hasNext()) {
      const token = this.tokenizer.next();
      if (token.type === "IGNORE") continue;

      if (token.type === "LPAREN") {
        this._parse_lparen();
        continue;
      }

      if (token.type === "RPAREN") {
        this._parse_rparen();
        continue;
      }

      if (token.type === "ROLL") {
        this._parse_roll(token);
        continue;
      }

      if (token.type === "NUMBER") {
        this._parse_number(token);
        continue;
      }

      if (token.type === "OPERATOR") {
        this._parse_operator(token);
        continue;
      }
    }

    // Remove empty branches from parentheses
    if (this._tree.right && !this._tree.left && !this._tree.operator) {
      this._tree = this._tree.right ?? this._tree;
    }

    return this.tree;
  }
}
