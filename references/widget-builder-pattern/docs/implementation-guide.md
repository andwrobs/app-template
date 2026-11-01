# Implementation Guide

## Architecture

Separate the source catalogue, dashboard configuration, edit session, and execution store. Give each concern a clear owner.

| Concern | Owns | Does not own |
| --- | --- | --- |
| Source catalogue | Source identity, revision, schema, capabilities, result columns | Widget placement |
| Dashboard store | Saved widget definitions and responsive layouts | Running requests or result rows |
| Edit session | Draft configuration, undo history, validation, save conflicts | The server's execution lifecycle |
| Execution store | Attempts, exact inputs, run identifiers, authorized result handles | Saved widget defaults |
| Renderer registry | Compatible display components and presentation validation | Source authorization |
| Canvas adapter | Grid placement, drag/resize events, constraints | Query execution |
| Source adapter | Describe, execute, retrieve, and optionally cancel | Dashboard layout |

The reference contracts are in [contracts.ts](../reference/contracts.ts). They define boundaries without choosing a state-management or form library.

## React composition

Suggested components:

| Component | Responsibility |
| --- | --- |
| DashboardPage | Load configuration, resolve capabilities, select view/edit mode |
| DashboardToolbar | Title, dashboard selection, Edit, Save, Cancel |
| DashboardCanvas | Adapt layout data to the grid engine |
| WidgetFrame | Shared heading, parameter summary, status, and actions |
| WidgetRenderer | Select the registered Metric, Table, or Launcher component |
| MetricWidget | Present a valid count and result action |
| TableWidget | Render a bounded preview |
| LauncherWidget | Open an execution workspace |
| WidgetConfigurationPanel | Edit a widget draft and manage preview |
| ParameterForm | Render source-defined fields and validation |
| RunParametersPanel | Hold transient inputs and explicit defaults choice |
| ExpandedResultsView | Present the selected execution's larger grid |
| QueryWorkbench | Coordinate selectors and one result workspace |

WidgetFrame handles common behavior so each renderer does not independently implement permissions, timestamps, errors, and parameter editing.

Keep state close to its lifetime. A form draft can remain local to its panel. Shared execution records belong in a store/cache. Saved configuration comes from persistent application data.

## Source and renderer registries

A source adapter describes its parameter schema and supported tabular result. The initial source kind is a saved query. Future adapters can fit the same contract without expanding the first-release UI.

A renderer registry declares:
- Widget kind.
- Human-readable name and description.
- Compatible result capabilities.
- Default and minimum sizes.
- Presentation validation.
- Configuration controls.
- Rendering component.

Do not infer compatibility from a source title or sample values. For example, a count widget requires defined row-count semantics; a chart would require declared fields and aggregation rules.

The registry is intentionally small. Plugin discovery, executable user extensions, and arbitrary runtime code are separate product decisions.

## Schema-driven parameters

A parameter definition should express stable keys, labels, types, requiredness, help text, defaults, constraints, and static or authorized lookup options.

Handle:
- Text, numbers, booleans, dates, single choice, and multiple choice.
- Required versus optional values.
- Null versus an empty string versus an omitted field.
- Dependent fields and invalidated choices.
- Asynchronous option lookup and its own loading/error states.
- Server validation after client validation.
- Schema revisions and compatibility.

The source service owns parameter meaning. The client must not guess a default simply to make a form valid. Normalize values according to the schema, including date/time semantics.

Separate saved parameters, the open form draft, and the exact execution snapshot. Render result chips from the execution snapshot whenever a result is visible.

## Executing a widget

1. Resolve the widget and the current source definition.
2. Check discover/execute capability.
3. Validate and normalize the selected parameters.
4. Resolve relative inputs.
5. Allocate a client request identifier and associate it with the widget instance.
6. Send one execution request through the adapter.
7. Store the server execution identifier and status.
8. Accept updates only if they still belong to the widget's active attempt.
9. Store the successful execution snapshot and result handle.
10. Render count/table data using that snapshot.

A stable widget identifier connects layout items, configuration, and active attempts. Do not use a render position or array index as identity.

If the user starts a newer attempt, removes the widget, or changes its source, a late response from the previous attempt must not overwrite current UI state. Preserve completed executions in history where appropriate.

If saved defaults are requested from the runtime panel, perform their validated revision-checked update before the run. A configuration-save failure remains distinct from an execution failure.

## Cache and request identity

A reusable result identity includes:
- Source identifier and exact revision.
- Result-set identity when applicable.
- Canonical resolved parameter values.
- Authorized access scope as established by the server.
- Relevant execution semantics such as row limit.

Do not use widget title, display kind, or object-reference equality as execution identity. Normalize objects deterministically; do not reorder arrays unless the source declares order irrelevant.

A client fingerprint supports matching and deduplication. It is not an authorization boundary. The service must validate access whenever a result is retrieved.

A count-only execution may not contain table rows. A table execution with a trustworthy total may serve a metric. Reuse follows capabilities, not optimistic assumptions.

Expanding results fetches pages from the same execution when needed. Fetching another page is not a new source execution. If the result has expired, present the expiry and request a new explicit run.

## State model

Use separate concepts for the active attempt and the last successful snapshot. A single nullable data value cannot distinguish Not run, zero rows, error, or refreshing.

The typed model supports:
- Unrun.
- Needs configuration.
- Queued or running.
- Succeeded.
- Failed.
- Unavailable.

A running/failed state may reference a previous success. Whether it remains visible depends on parameter identity and the UI labeling rules in the specification.

Keep preview attempts separate from runtime attempts. A preview belongs to a configuration draft, not automatically to the saved widget.

## Layout integration

[React Grid Layout](https://github.com/react-grid-layout/react-grid-layout) provides draggable/resizable placement and responsive breakpoints. Adapt the reference layout model at the component boundary and check the installed version's API when implementing.

The application owns:
- Stable widget IDs.
- Default sizes and minimum constraints.
- Breakpoint-specific layouts.
- View/edit mode.
- Committed and draft layouts.
- Preset application and undo.
- Keyboard move/resize actions.

The grid owns placement interactions. It must not call source execution functions.

During dragging, use transient layout updates for smooth feedback. Commit draft history entries at meaningful interaction boundaries rather than adding an undo step for every pointer move.

Presets are pure transformations over layout data plus widget constraints. They preserve source configuration and widget IDs. Deterministic placement helps produce predictable undo and persistence behavior.

## Editing and persistence

Create the edit draft from the committed dashboard and retain its server revision. Update the draft while arranging/configuring widgets.

On Save:
1. Validate all widget and layout records.
2. Submit the complete intended change or a well-defined patch.
3. Include the expected revision.
4. On success, adopt the returned configuration and revision.
5. On conflict, preserve the draft and offer a deliberate reconciliation path.
6. On failure, keep the draft editable.

On Cancel, discard the draft and restore the committed configuration. Deleting a widget from a draft must not permanently remove a current runtime record until the product's save/removal semantics are satisfied.

Results are separate from the configuration payload. Do not serialize a result table into dashboard layout JSON.

## Accessibility implementation

Expose native control semantics and a complete keyboard path. The [WAI-ARIA keyboard guidance](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/) explains why custom composite interfaces need intentional keyboard behavior.

Provide Move left/right/up/down and size presets through a menu or equivalent controls. Return focus to the triggering widget when a panel closes. Announce meaningful run completion or failure once, not on every polling update.

Use an ordinary side-panel focus model when the canvas stays usable. Use the [modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) only when the rest of the interface is blocked.

## Incremental implementation

1. Establish source, configuration, execution, and layout contracts.
2. Implement one Table widget with explicit Run and accurate lifecycle states.
3. Add the source-driven parameter form and snapshot-safe summaries.
4. Add Metric using the same execution/result semantics.
5. Add expanded results without duplicate execution.
6. Add edit drafts, add/remove/configure, and persistence.
7. Introduce grid dragging/resizing and explicit presets.
8. Add keyboard alternatives and narrow-screen behavior.
9. Add optional Launcher or workbench only when required.
10. Exercise the [acceptance scenarios](acceptance-scenarios.md).

This order establishes correct state and data behavior before richer layout interactions.

