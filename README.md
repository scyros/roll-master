![Tests](https://github.com/scyros/roll-master/actions/workflows/ci.yml/badge.svg)
![Node.js Version](https://img.shields.io/badge/node-18.x%20%7C%2020.x-brightgreen)

# Roll Master

Roll Master is a library that parses a string and rolls dice to generate results.

## Usage

```typescript
import Roller from 'roll-master';

async function rollAThing() {
  const roll = "4d6r2!2";
  const roller = new Roller();
  const result = await roller.roll(roll);
}
```

## Syntax

Roll Master uses a special syntax to define dice rolls.

### Dice

To define dice rolls, use the format `<count>d<sides>`. For example, `4d6` represents rolling four six-sided dice.

By default, all rolls are sorted from smallest to largest. To sort them in the opposite order, use `s-`. Please note that only one sort directive can be used per dice definition.

To reroll, use `r<count>`. For example, `4d6r2` will roll four six-sided dice and reroll the two smallest ones. To reroll the largest ones, use `r<count>s-`. For instance, `4d6r2s-` is valid.

To discard, use `!<count>`. For example, `4d6!2` will roll four six-sided dice and discard the two smallest ones. To discard the largest ones, use `!<count>s-`. For instance, `4d6!2s-` works.

Reroll and discard options can be combined. For example, `4d6r2!2` will roll four six-sided dice, reroll the two smallest values, and then discard the two smallest remaining values. Keep in mind that only one reroll and one discard directive can be used per dice definition.

Group rolls using `..`. For example, `2d4..3` will roll two four-sided dice three times, returning an array of roll results. Conversely, `2d4*3` will sum the result of each roll and then multiply it by three.

### Operations

To define operations, use the format `<expression><operation><expression>`. For example, `4d6+2` represents rolling four six-sided dice, summing the results, and then adding 2 to the total.

The supported operations are addition (+), subtraction (-), and multiplication (*).

Multiplication takes precedence over other operations. The remaining operations are of equal importance and are processed sequentially.

Use parentheses to define blocks, like `(<expression>+(<expression>*<expression>))`. For example, `(4d6+3)*2`.

### Structure of `results`

- **`results`**: This object contains the outcome of the dice roll.
  - **`rolls`**: An array of objects, each representing a single dice roll or a group of dice rolls.
    - **`roll`**: A string indicating the dice roll expression (e.g., `4d6`).
    - **`rolls`**: An object where each key (e.g., `d0`, `d1`) represents a die and its value is an object containing:
      - **`rolls`**: An array of numbers representing the outcomes of that particular die.
      - **`discarded`** (optional): A boolean indicating if the roll was discarded (e.g., `!2` in `4d6!2`).
      - **`rerolled`** (optional): A boolean indicating if the roll was rerolled (e.g., `r2` in `4d6r2`).
    - **`sum`**: The sum of all the dice rolls in this object.
  - **`result`** (optional): The final result after applying all operations.

### Examples

1. **Simple Roll (`4d6`)**:
   ```json
   {
     "roll": "4d6",
     "rolls": {
       "d0": {"rolls": [6]},
       "d1": {"rolls": [1]},
       "d2": {"rolls": [3]},
       "d3": {"rolls": [4]}
     },
     "sum": 14
   }
   ```

2. **Roll with Discard (`4d6!1`)**:
   ```json
   {
     "roll": "4d6",
     "rolls": {
       "d0": {"rolls": [6]},
       "d1": {"rolls": [1], "discarded": true},
       "d2": {"rolls": [3]},
       "d3": {"rolls": [4]}
     },
     "sum": 13
   }
   ```

3. **Roll with Reroll (`5d4r2`)**:
   ```json
   {
     "roll": "5d4",
     "rolls": {
       "d0": {"rolls": [4]},
       "d1": {"rolls": [

1, 4], "rerolled": true},
       "d2": {"rolls": [3]},
       "d3": {"rolls": [2, 1], "rerolled": true, "discarded": true},
       "d4": {"rolls": [4]}
     },
     "sum": 15
   }
   ```

### Interpretation

- Each roll within `results` details each die's roll and its outcome.
- The `discarded` and `rerolled` flags provide context on the final sum calculation, especially in complex expressions.
- The `result` key, when present, shows the final calculation after all operations have been applied.

Understanding this schema is crucial for interpreting the complex expressions of the Roll Master library.
