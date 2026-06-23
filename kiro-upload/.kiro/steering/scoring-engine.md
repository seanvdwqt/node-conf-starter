# Scoring Engine Standards

## Rule Interface

Every scoring rule must implement the `ScoringRule` interface:

```typescript
interface ScoringRule {
  name: string;
  weight: number;
  evaluate(candidate: CandidateContext, request: RequestContext): RuleResult;
}
```

## Adding a New Rule

1. Create a file in `server/src/scoring/rules/` with a factory function: `createXxxRule(weight: number): ScoringRule`
2. The `evaluate` method must return `{ score: 0–100, explanation: string, exclude?: boolean, flag?: string }`
3. Register the rule in `server/src/scoring/engine.ts` (add to `allRules` array)
4. Add a default weight in `server/src/scoring/config.ts` (ensure weights still sum to 1.0)
5. Add a natural-language description in `server/src/scoring/explanation.ts` (`RULE_DESCRIPTIONS` map)

## Configuration

Default weights in `config.ts`:
- skillMatch: 0.30
- proficiency: 0.15
- experience: 0.10
- availability: 0.20
- workload: 0.10
- urgency: 0.15

Thresholds:
- workloadHigh: 80%
- minMandatorySkills: 1

## Fault Tolerance

- Each rule invocation is wrapped in try-catch
- A failing rule is excluded from the score (logged), remaining rules still produce valid output
- The engine never crashes due to a single rule failure

## Invariants

- Scores are always clamped to 0–100
- Mandatory skills matched > 0 (otherwise excluded)
- Available candidates always score higher on availability than partially_available
- High urgency: available candidates rank above partially_available regardless of score
- Equal scores: tiebreak by capacityFree descending
