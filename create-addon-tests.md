# Create Addon Testing Examples

Generate a comprehensive `TESTING_EXAMPLES.md` for a CAW (Construct Addon Wizard) Construct 3 addon.

## Steps

1. **Read the addon source** to understand what needs to be tested:
   - `config.caw.js` — addon ID, name, properties, property types
   - `src/aces/` — every action, condition, expression, and trigger
   - `src/runtime/instance.js` — internal data model, state transitions, edge cases
   - Any existing `Guide.md` or `TESTING_EXAMPLES.md` for context and conventions

2. **Write `TESTING_EXAMPLES.md`** at the project root following the structure below. Every meaningful feature must have at least one test. Complex features need step-by-step multi-step tests.

---

## TESTING_EXAMPLES.md Structure

### Title and intro
One sentence: what this file is and what it covers.

---

### Layout Setup section
Before any tests, document the **minimum layer structure and object setup** needed to run all tests. Include:

- A description of the required object setup (sprites, behaviors, object names)
- A table of addon properties set in the Properties Bar for testing
  - Include which properties should be enabled for visibility (e.g. Debug Mode = checked)
- Any additional objects required (e.g. Keyboard, Text for debug output)
- A brief layout arrangement description (where to place objects)

---

### Tests (numbered sequentially)

Each test follows one of two formats:

#### Format A — Simple test (single action or feature)

```
## Test N - [Feature Name]

**Goal:** One sentence describing what this test verifies.

### Layer structure (only if different from the global setup)
[code block]

### Event sheet
[pseudocode block using Construct-style syntax]

**Expected:**
- Bullet list of observable outcomes (what the player/tester sees)
- Specific state values expected (e.g. CurrentScreen() = "Settings")

**Expressions/conditions to verify:**
[code block of expressions to put in a Text object or conditions to check]
```

#### Format B — Complex test (stateful, multi-step, or interaction-dependent)

```
## Test N - [Feature Name]

**Purpose:** One sentence describing what this test verifies.

### Layer structure (only if different from global)
[code block]

**Setup:**
[code block — actions to run at layout start before the test begins]

**Step 1 - [Description]:**
[code block — action(s) to trigger]
[code block — expected state immediately after]

**Step 2 - [Description]:**
[code block — action(s)]
[code block — expected state]

... (as many steps as needed)
```

Use Format B when:
- The test requires a specific sequence of actions to expose the behaviour
- The expected result depends on previous state (e.g. stack depth, saved values, stacked overrides)
- There are multiple distinct outcomes to verify (e.g. open → mid-animation → closed)

---

### Test Coverage Requirements

Write tests in this order, building complexity as you go:

1. **Basic setup** — Verify the addon initializes correctly with default properties. The simplest possible working test.
2. **Core feature (happy path)** — Test the addon's primary feature with standard usage.
3. **Each action** — At least one test per action. Group related actions into a single test when they interact.
4. **Each condition** — Verify every condition returns the correct boolean. Include inverted checks where applicable.
5. **Each expression** — Display all expression values in a Text object. Verify baseline values, then verify values change correctly after actions.
6. **Each trigger** — Verify each trigger fires at the correct moment with the correct expression values available inside it.
7. **State queries** — All expressions and conditions in a live debug text object; verify each returns the correct value.
8. **Configuration overrides** — Change properties at runtime via actions; verify expressions reflect the new values immediately.
9. **Enable/disable** — Disable the behavior/plugin and verify it stops affecting the game. Re-enable and verify it resumes.
10. **Input handling** — If the addon reads input, test ignore-input, simulate-input, and default-input-toggle features.
11. **Save/load** — Change state, save, reload, verify state is preserved.
12. **Edge cases** — Boundary values, rapid toggling, conflicting inputs, zero/negative parameters.
13. **C3 Debugger panel** (if `_getDebuggerProperties` is implemented) — Verify debugger fields show correct values at each step.
14. **Feature-specific tests** — One test per non-standard feature the addon introduces. Use Format B for these. Cover:
    - The normal / happy path
    - Edge cases (e.g. stacking multiple overrides and unwinding them in order)
    - The reset/clear action that undoes the feature

---

### Debugging Tips section (at the end)
4–6 bullet points covering:
- How to enable verbose logging (Debug Mode or equivalent property)
- How to use the C3 Debugger panel
- Common mistakes that look like bugs (name casing, missing dependencies, initialization order)
- How to recover from unexpected state (disable/re-enable, restart layout)

---

## Writing Style Rules

- **Event sheet pseudocode format** — use this consistently throughout:
  ```
  Event: [trigger or condition]
    Condition: [optional sub-condition]
    Action: [ActionName] -> "[param]", param2
    // comment explaining why the action is used or what to observe
  ```
- **Expected results use code blocks for expression values** and bullet points for visual/observable outcomes. Show the exact string or number the expression returns, not a description of it.
  ```
  // Verify:
  CurrentScreen()
  Expected: "Settings"
  ```
- **Step-by-step tests label each step clearly** (`Step 1 - Open PauseMenu:`) and show both the action and the expected state as separate code blocks.
- **Every condition and expression in the addon must appear** in at least one test's "Expressions/conditions to verify" section.
- **Stateful or multi-step interactions** must show the full sequence from initial value → change applied → change restored, with expected values at each step.
- **Test numbering is continuous** — never restart at 1 for a feature group. Tests 1–N cover the whole addon.
