# Risk Model

## Initial constraints

- Equities/ETF only.
- Long-only.
- No options.
- No crypto.
- No shorts.
- No deliberate leverage.
- No extended hours.
- No overnight operation in first operating model.

## Defaults

| Limit                      | Default |
| -------------------------- | ------: |
| Max position percent       |      25 |
| Max total exposure percent |     100 |
| Max risk per trade percent |    0.50 |
| Max daily loss percent     |       2 |
| Max open positions         |       8 |

These are editable safety defaults, not investment advice.

## RiskCheck contract

```ts
type RiskCheck = {
  code: string;
  severity: "info" | "warning" | "block";
  passed: boolean;
  message: string;
  value?: string;
  limit?: string;
};
```
