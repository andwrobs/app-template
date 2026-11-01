# Dashboard & Widget Builder — Design Specification

## 1. Product model

A dashboard is a saved arrangement of widgets. A widget combines one source reference, saved parameters, a display type, presentation options, and layout placement.

A saved query is a registered, read-only operation with a parameter definition and a tabular result contract. Users select and configure these sources rather than authoring query text inside a widget.

An execution is separate from widget configuration. It captures the source revision, resolved input values, lifecycle, timestamps, and a retrievable result. Several widgets may reference the same query with different inputs.

Example sources:

| Source | Parameters | Result |
| --- | --- | --- |
| Broken links | Collection, response status, include archived | One row per matching link |
| Missing page tags | Collection, visibility | One row per matching page |
| Draft review queue | Collection, older than days, include archived | One row per draft awaiting review |

The first release uses one supported tabular result per source. If multiple result sets are later supported, widget configuration must identify the selected result set explicitly.

## 2. Navigation and permissions

Suggested navigation:

| Area | Purpose |
| --- | --- |
| Dashboards | View and personalize permitted dashboards |
| Saved queries | Browse available sources, inspect their inputs, and start executions |
| Schedules | Manage permitted recurring executions when the host supports scheduling |
| Activity | Inspect permitted execution and configuration events |

Source creation and import are privileged actions in Saved queries. They do not belong in the ordinary Add widget flow.

Use capability checks rather than treating a role name as universal authority.

| Capability | What it permits |
| --- | --- |
| View dashboard | Read a dashboard's authorized configuration |
| Edit dashboard | Add, configure, remove, and arrange widgets |
| Execute source | Run a particular saved query |
| Read result | Retrieve a particular execution's output |
| Schedule source | Create or change an authorized recurring execution |
| Manage source | Create/import a source or change its definition |
| Read activity | View authorized events |

A common assignment allows standard users to edit their personal dashboards and run/schedule available sources. Source authors receive Manage source separately. Dashboard edit rights alone do not confer execution, result, or source-management rights.

A shared dashboard must still enforce each viewer's source and result permissions.

## 3. Runtime layout options

### Monitoring dashboard — default

Each widget owns its result surface. A typical arrangement uses a top row of metrics, wider tables below, and optional compact launchers.

Use this when people compare several checks, revisit known queries, or keep multiple datasets visible. Clicking Run changes the corresponding widget. Opening a detailed view preserves that connection.

### Query workbench

A compact strip or list of saved-query selectors sits above one large results workspace. Opening a selector makes it active; Run executes it.

The workspace repeats the selected query title and parameters. Switching selection shows that selection's available result or its Not run state. Previous rows must never appear under another source's heading.

This layout suits sequential investigation, wider tables, and fewer simultaneous comparisons. It should remain visibly distinct from the monitoring dashboard.

### Saved-query list

A searchable list offers title, parameter summary, execution status, and Open or Run actions. It suits larger collections of presets with little need for an at-a-glance overview.

This can be part of Saved queries rather than a third dashboard mode. Avoid adding it solely for symmetry.

## 4. Widget catalogue

### Metric

A metric answers how many rows a saved query returned.

Content:
- Descriptive title and source identity.
- Large number after a successful execution.
- Short entity label when row semantics support it.
- Parameter summary.
- Last-run timestamp.
- Visible Parameters and Run / Run again actions.
- View results when the execution's rows are retained or retrievable.

Not run displays an em dash. A successful result containing zero rows displays 0. Missing values, errors, and loading must not be converted to zero.

Count the entire returned result or an authoritative service-provided total. Never count just the visible page and present that value as the complete result. If the service caps output, label the limitation: “1,000 rows returned · limit reached.” A one-row aggregate result is one returned row; selecting a scalar value is a separate future metric capability.

“Matching pages” is appropriate only when one row corresponds to a page. Use Rows returned when entity semantics are unclear.

View results reuses the execution. If a count-only operation did not retain rows, explain that another run is required before offering one. Do not fabricate trend arrows, percentage changes, thresholds, or live indicators.

### Table

A table offers a useful, bounded preview.

Header:
- Title and source identity on the left.
- Parameters, Run / Run again, Expand, and overflow actions on the right.
- Parameter summary below the title.

Body:
- Stable height across Not run, Running, Results, Empty, and Error.
- A small set of useful columns.
- A limited row preview with honest totals.
- Visible loading/status text without changing the widget's grid size.

Footer:
- “Showing 5 of 37 rows.”
- Last-run timestamp.
- Open full results.

Expanded results reuse the execution and provide the existing grid's richer capabilities: more columns, pagination, sorting, filtering, and export where supported. Distinguish filtering loaded rows from filtering the complete dataset. Local table filtering does not silently change another widget's count.

A runnable table is a Table widget in its initial state. It is not a separate catalogue entry.

### Launcher — optional

A launcher stores a query and parameter preset in a compact card.

It shows a title, short parameter summary, Parameters, and Open & run. The action opens the expanded results surface and starts an execution using the displayed inputs. If required inputs are missing, it opens the form and waits for an explicit Run.

The launcher never unexpectedly expands into a table. In the workbench variant, use Open to select a source and Run in the shared workspace. The labels distinguish selection from execution.

## 5. Parameters and configuration

Keep Parameters visible in the widget header. An unlabeled settings icon or overflow-only placement makes a frequent action harder to discover.

The summary describes the inputs associated with the visible result. For example:

Collection: Guides · Visibility: Published

Long summaries can show the most useful values and a “+2 parameters” affordance. Full values remain available in the drawer. Empty, default, and all-values choices must have clear labels.

### Runtime parameter drawer

1. Heading: Parameters — Pages missing tags.
2. Identify the selected widget and source.
3. Generate fields from the source's current parameter definition.
4. Show labels, requiredness, help text, allowed values, defaults, and validation.
5. Treat changed inputs as values for this run.
6. For users who can edit the widget, offer an unchecked Save as widget defaults option.
7. Footer: Cancel and Run.

Run validates the form and starts one execution. If saving defaults was requested, persist them independently of execution success. Report a save failure separately and do not imply the defaults were stored. The implementation must define its ordering explicitly; the reference flow validates, saves requested defaults, then executes.

Cancel discards the form draft. Merely typing into the form does not change saved defaults or relabel visible results.

### Widget configuration drawer

Configure widget changes the source reference, saved defaults, display kind, title, and table presentation. Save updates configuration without executing.

Changing the source loads its parameter schema and clears incompatible values. Retain a value only when its key and semantics remain compatible. Validate the complete result before adding or saving.

### Source definition changes

If a new source revision changes required inputs, removes an allowed value, or changes result columns, validate affected widgets again. Mark incompatible widgets Needs configuration. Do not run with silently reinterpreted values.

Runtime parameter edits never modify another widget, a schedule, or the source definition itself.

### Relative inputs

For inputs such as Last seven days, resolve the concrete time range at execution. The execution records those resolved values, so its displayed result and provenance remain meaningful later.

## 6. Execution and result lifecycle

Dashboard entry is configuration retrieval, not source execution. Opening a drawer, resizing a widget, applying a layout, saving configuration, and expanding an available result do not run queries.

| State | Presentation | Action |
| --- | --- | --- |
| Not run | Em dash or neutral empty table; Not run | Run |
| Needs configuration | Missing or changed input identified | Set parameters |
| Queued | Stable body; Queued text | Prevent duplicate submission |
| Running, no matching prior result | Loading indicator and Running | Cancel only if supported |
| Running again, same inputs | Prior result remains visible with its original timestamp and Running status | Prevent duplicate submission |
| Succeeded with rows | Count/table, exact inputs, last-run time | Run again; View results |
| Succeeded with zero rows | 0 or No rows matched these parameters | Parameters; Run again |
| Failed | Useful error and retry action | Retry |
| Canceled | Cancellation confirmed by the execution service | Run again |
| Failed with a prior result | Clearly identify the failed attempt and previous result | Retry; View previous results |
| Unavailable | Source or result is inaccessible; no retained data exposed | Reconfigure/remove where permitted |

Never invent percentage progress when the source only reports Running.

For changed-parameter executions, show a fresh loading state. If prior output remains accessible, keep it separately labeled with the original parameters. Do not place new parameter chips over old rows.

Canceling a network request does not prove the server stopped the query. Display Canceled only when the execution service confirms cancellation; otherwise describe the observable state accurately.

### Result retention

The baseline can retain results for the current session. Without an available result, show Not run.

Persistent results are an optional capability. Reuse requires matching source revision, resolved parameters, selected result set, and applicable access context. Check current authorization again. Preserve each result's timestamp; do not imply every widget is equally current.

A scheduled execution can supply a widget only if its result is retained, compatible, and authorized. A schedule's existence alone proves none of those conditions.

### Concurrent work

Execute only the requested widget. Disable accidental duplicate submissions while its run is active. Bound execution concurrency when explicit batch actions are introduced.

A slow response for older inputs must not overwrite a newer result. Widget removal or source changes invalidate the corresponding pending UI update. A completed background execution may remain in Activity without being rendered into an unrelated widget.

Equivalent Metric and Table widgets may share an authorized execution if the service contract supports it. Similar titles are not sufficient to establish equivalence.

## 7. Dashboard editing

View mode:
- Dashboard title/selector and Edit dashboard.
- Stable arrangement without drag or resize handles.
- Runtime Parameters and Run actions.

Edit mode:
- Editing and Unsaved changes indicators.
- Cancel and Save dashboard.
- Add widget, Layout, and Undo.
- Visible header drag handles and corner resize handles.
- A draft isolated from the saved dashboard.
- Explicit source previews through the configuration drawer.

Save dashboard commits validated configuration and layout. Cancel discards the draft. A save error leaves the draft intact. Concurrent edits require a revision check and a recoverable conflict state.

Removing a widget removes its dashboard configuration; it does not delete the source or unrelated execution history. Duplication copies configuration and receives a new widget identifier. It does not execute or automatically claim another user's result.

### Add widget

Choose saved query → set parameters → choose display → adjust presentation → add.

Use one progressive drawer. The source comes first because it determines parameters and compatible displays. The selector contains sources the user is permitted to discover and execute.

Required sections:
1. Saved query: searchable name and description.
2. Parameters: schema-driven fields.
3. Display: Metric / Table / optional Launcher.
4. Presentation: title, relevant columns/density, and initial size.
5. Preview: static structure, plus a separate Run preview action.

Metric and Table require valid saved defaults in the first release. A future prompt-at-run option may relax that deliberately.

Preview results are labeled Preview and belong to the current draft source/inputs. Changing execution inputs invalidates a preview. Changing only the title or width does not. Adding a widget never causes a second automatic run. Reusing a compatible preview as the initial result can be supported explicitly.

## 8. Layout and responsive behavior

Use a 12-column desktop grid with consistent gaps. Sizes are product choices.

| Kind | Default width | Minimum guidance |
| --- | --- | --- |
| Metric | 4 columns | 3 when content remains readable |
| Table | 6, 8, or 12 columns | Usually 6; allow 4 only for an explicitly narrow preview |
| Launcher | 4 or 6 columns | Enough width for title, parameters, and action |

Initial presets:
- One column.
- Halves.
- Thirds for compact widgets.
- Two-thirds plus one-third.
- Metrics plus a full-width table.

Presets arrange existing widget instances; they do not change their kinds or source definitions. Honor minimum widths and make layout changes undoable. If a preset cannot fit a widget, place it on a compatible row and explain the resulting placement.

Do not add a rigid row model unless the product needs one. A regular grid with constrained sizes covers the initial experience.

Adding a widget uses a predictable available position. Dragging shows a placement preview. Movement and resizing use explicit handles so table selection, form inputs, and runtime actions remain reliable.

Result arrival does not change widget dimensions. Scroll within a bounded table body or open the expanded surface. Avoid shrinking wide tables until they become unusable.

At smaller breakpoints, stack widgets in a logical order. Persist intentional desktop/mobile layouts separately if users can customize them. An automatically derived narrow layout must not overwrite the saved desktop layout.

Provide controls to move and resize widgets without dragging. Small-screen users should still be able to run queries and read expanded results even if complex layout editing is optimized for larger displays.

## 9. Accessibility and feedback

Use native buttons and labeled form fields. Icons supplement clear accessible names. Loading and completion updates should be available through appropriate status announcements without repeatedly interrupting reading.

Expose a keyboard route for widget movement, size changes, and overflow actions. Keep focus stable when a widget moves. After removal, place focus on a sensible adjacent control.

Treat a desktop configuration drawer as a non-modal side panel when the canvas remains interactive. Do not mark that panel modal or trap focus in it. If an overlay blocks the rest of the interface, use a modal dialog with contained focus, Escape handling, and focus return. The [WAI-ARIA dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) defines the modal behavior.

Use text and icons as well as color for selected, running, failed, and unavailable states. Preserve contrast and readable density.

## 10. Activity and persistence boundaries

Persist dashboard configuration separately from result data. Retained results belong in storage designed for their access and retention rules.

Record relevant events such as execution requested/completed, dashboard saved, widget added/removed, and source definition changed. Audit details should follow the host's data policy and avoid broad exposure of sensitive parameter values.

Server-side checks remain authoritative for source discovery, execution, scheduling, result retrieval, and configuration changes. A client-side capability flag only controls presentation.

## 11. First release and extensions

First release:
- Metric and Table.
- Explicit Run / Run again.
- Source-driven parameters with clear defaults behavior.
- Inline results and expansion.
- Honest lifecycle states.
- Dashboard edit drafts.
- Constrained dragging/resizing and useful presets.
- Accessible controls and server authorization.

Optional extensions:
- Launcher.
- Workbench layout.
- Authorized persistent or scheduled results.
- Explicit bounded Run selected.
- Dashboard-level filters with declared per-source mappings.
- More renderers with defined source compatibility.
- Scalar metrics, charts, and historical comparisons supported by real data.

Keep each extension explicit. A new display type should not quietly introduce new execution or permission semantics.

