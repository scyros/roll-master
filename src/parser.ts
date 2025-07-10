import debug from "debug";
import Roll from "./roll";
import Tokenizer from "./tokenizer";

const log = debug("roll-master:parser");

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

  private _deepCopy(expression: Expression): Expression {
    const newExpression: Expression = { type: expression.type };
    if (expression.left) {
      newExpression.left = this._deepCopy(expression.left);
    }
    if (expression.right) {
      newExpression.right = this._deepCopy(expression.right);
    }
    if (expression.operator) {
      newExpression.operator = expression.operator;
    }
    if (expression.value) {
      newExpression.value = expression.value;
    }
    return newExpression;
  }

  private get tree(): Expression | null {
    if (!this._tree) return null;
    return this._deepCopy(this._tree);
  }

  private _parse_lparen() {
    const branch = this.lastBranch || this._tree;
    if (branch.type !== "EXPRESSION")
      throw new Error(
        `Invalid expression ${branch.type}. It should be an expression.`
      );
    if (branch.right)
      throw new Error(`Invalid expression. Dangling parenthesis.`);
    branch.right = { type: "EXPRESSION" };
    branch.right.parent = branch;
    this.lastBranch = branch.right;
  }

  private _parse_rparen() {
    const branch: Expression | null = this.lastBranch || this._tree;
    if (branch.type !== "EXPRESSION")
      throw new Error(
        `Invalid expression ${branch.type}. It should be an expression.`
      );

    if (!branch.parent)
      throw new Error(`Invalid expression. Missing left parenthesis.`);
    if (!branch.right)
      throw new Error(`Invalid expression. Incomplete expression.`);

    // If this group contains an operator or left side, it's not a simple group: just step up
    if (branch.left || branch.operator) {
      const parent = branch.parent;
      this.lastBranch = parent;
      return;
    }

    // Simple parenthesis around a single expression: unwrap it
    const parent = branch.parent as Expression;
    const inner = branch.right;
    if (!inner) throw new Error(`Invalid expression. Incomplete expression.`);
    // Replace the group node in its parent with the inner expression
    inner.parent = parent;
    if (parent.right === branch) {
      parent.right = inner;
    }
    // Continue parsing onto the parent
    this.lastBranch = parent;
  }

  private _parse_roll(token: { type: string; value: string }) {
    const branch = this.lastBranch || this._tree;
    if (branch.right) throw new Error(`Invalid expression. Dangling roll.`);

    const roll = new Roll(token.value);
    branch.right = { type: "ROLL", value: roll };
    this.lastBranch = branch;
  }

  private _parse_number(token: { type: string; value: string }) {
    const branch = this.lastBranch || this._tree;
    if (branch.right) throw new Error(`Invalid expression. Dangling number.`);

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

  private tokenHandlers: Record<string, (token?: any) => void> = {
    LPAREN: () => this._parse_lparen(),
    RPAREN: () => this._parse_rparen(),
    ROLL: (token) => this._parse_roll(token),
    NUMBER: (token) => this._parse_number(token),
    OPERATOR: (token) => this._parse_operator(token),
  };

  public parse(input: string) {
    log(`parsing "${input}"`);
    const now = Date.now();
    this.tokenizer.init(input);
    this._tree = { type: "EXPRESSION" };
    this.lastBranch = this._tree;

    while (this.tokenizer.hasNext()) {
      const token = this.tokenizer.next();
      const handler = this.tokenHandlers[token.type];
      if (handler) {
        handler(token);
      }
    }

    // Remove empty branches from parentheses
    if (this._tree.right && !this._tree.left && !this._tree.operator) {
      this._tree = this._tree.right ?? this._tree;
    }

    if (this.lastBranch?.parent) {
      throw new Error("Invalid expression. Incomplete expression.");
    }

    if (this.lastBranch?.operator && !this.lastBranch?.right) {
      throw new Error("Invalid expression. Incomplete expression.");
    }

    const tree = this.tree;
    log(`parsed in ${Date.now() - now}ms`);
    return tree;
  }
}