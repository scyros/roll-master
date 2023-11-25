# Roll Master

Roll Master is a library that parses a string and rolls it to generate results.

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

Roll Master uses a special syntax to define a roll.

### Dices

To define dice rolls, we use the format `<count>d<sides>`. For example, `4d6` represents rolling four six-sided dice.

All rolls are sorted from smallest to largest by default. To sort them in the opposite order, you can use `s-`. Please note that you can only use one sort directive per dice definition.

To reroll, use `r<count>`. For example, `4d6r2` will roll four six-sided dice and reroll the two smallest ones. If you want to reroll the largest ones, use `r<count>s-`, which will sort the dice in the opposite order. For instance, you can use `4d6r2s-`.

To discard, use `!<count>`. For example, `4d6!2` will roll four six-sided dice and discard the two smallest ones. If you want to discard the largest ones, use `!<count>s-`. For instance, `4d6!2s-`.

You can combine the reroll and discard options. For example, `4d6r2!2` will roll four six-sided dice, reroll the two smallest values, and then discard the two smallest values remaining. Please keep in mind that you can only use one reroll directive per dice definition, and the same applies to discard.

You can group rolls using `..`. For example, `2d4..3` will roll two four-sided dice three times, returning an array of roll results instead of a single number. On the other hand, if you use `2d4*3`, the roller will sum the result of each roll and then multiply it by three. See below.

### Operations

To define operations, use the format `<expression><+-*><expression>`. For example, the expression `4d6+2` represents rolling four six-sided dice, summing up each result, and then adding 2 to the total.

The supported operations are addition (+), subtraction (-), and multiplication (*).

Multiplication takes precedence over any other operation. The remaining operations are of equal importance and are processed sequentially.

You can use parentheses to define blocks, like this: `(<expression>+(<expression>*<expression>))`, for example: `(4d6+3)*2`.
