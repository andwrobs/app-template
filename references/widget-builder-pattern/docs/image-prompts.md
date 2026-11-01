# Image Prompts

Use the shared product rules for every screen. Generate separate, readable desktop images with the same visual system.

## Shared product rules

The application is called Widget Builder. Its example workspace manages documentation using saved queries for Broken links, Missing page tags, and Draft review queue.

Every widget references one saved query and its parameters. Metric counts rows, Table previews rows, and optional Launcher opens a results workspace. Opening a dashboard, adding a widget, changing layout, or saving configuration does not execute queries. Run and Run again are explicit actions.

Unrun is an em dash and Not run. Successful zero rows is 0. Results show their own parameter summary and last-run time. Parameters is visible in the widget header. Expansion reuses an available execution.

Use a neutral, polished product interface: restrained indigo accent, white cards, cool pale-gray background, graphite text, fine borders, modest rounding, readable tables, and compact controls. All example content concerns documentation pages, collections, links, tags, and review queues. Use the text and terminology supplied in each prompt.

## Main screens

Copy a complete prompt below to render that screen. Preserve the same navigation, typography, colors, controls, and example source definitions across the set.

### Dashboard

```text
Use case: ui-mockup. Generate a polished, flat desktop product screenshot for an application named "Widget Builder". It is a reusable dashboard editor for saved read-only queries. Use only documentation/content-management examples: broken links, pages missing tags, drafts awaiting review. The app uses predefined saved queries, a parameter form per query, and widgets that display results. Use a restrained indigo accent, white cards, cool off-white canvas, dark graphite text, crisp fine borders, 6px corners, clean sans-serif, readable 13–16px body text. Wide 1600x1100 composition. Moderate information density and excellent alignment. Left rail about 190px: a four-square symbol and "Widget Builder", then Dashboards, Saved queries, Schedules, Activity. No people names, organization names, personal identifiers, external URLs, real trademarks, decorative charts, hardware frames, perspective, annotations, or slide titles. Data is illustrative. Opening a dashboard does not execute any query. Completed values reflect prior manual runs. Label fresh query actions Run or Run again; keep Parameters visible. An unrun metric is an em dash with Not run, never zero. Do not add automatic refresh or Run all. Standard user experience without create/import query actions.
SCREEN A: DASHBOARD
Page title "Content overview"; small breadcrumb Dashboards; top right "Edit dashboard".
Top row three equally sized metric cards. Card 1: "Broken links", 128, "Matching links", parameter chips "Guides" and "404", "Last run 10:42 AM", actions Parameters, Run again, View results. Card 2: "Pages missing tags", 37, "Matching pages", chips Guides and Published, "Last run 10:39 AM", same controls. Card 3: "Drafts awaiting review", em dash, Not run, chip "All collections", Parameters and a visible Run button.
Below these, two equal-width table widgets. Left: "Pages missing tags", secondary "Saved query · Missing page tags", parameter chips Collection: Guides, Visibility: Published; actions Parameters, Run again and expand. Three columns Page / Collection / Updated. Five rows: Quick start / Guides / 2 days ago; Installation / Guides / 3 days ago; Keyboard shortcuts / Guides / 4 days ago; Search tips / Guides / 5 days ago; Troubleshooting / Guides / 6 days ago. Footer "Showing 5 of 37 rows · Last run 10:39 AM"; Open full results. Right: "Drafts awaiting review", secondary Saved query · Draft review queue; chip All collections; empty table area with Not run yet and Run to load results; clear Run button and Parameters in header. The two tables have stable equal heights.
Bottom two compact launcher cards under a small Saved queries label: "Broken links · Tutorials" and "Pages missing tags · Reference". Each shows its collection chip, a visible Parameters action, and "Open & run". These cards do not expand into tables.
Controls align neatly; card results belong to their own cards. Keep every label readable.
```

### Workbench

```text
Use case: ui-mockup. Generate a polished, flat desktop product screenshot for an application named "Widget Builder". It is a reusable dashboard editor for saved read-only queries. Use only documentation/content-management examples: broken links, pages missing tags, drafts awaiting review. The app uses predefined saved queries, a parameter form per query, and widgets that display results. Use a restrained indigo accent, white cards, cool off-white canvas, dark graphite text, crisp fine borders, 6px corners, clean sans-serif, readable 13–16px body text. Wide 1600x1100 composition. Moderate information density and excellent alignment. Left rail about 190px: a four-square symbol and "Widget Builder", then Dashboards, Saved queries, Schedules, Activity. No people names, organization names, personal identifiers, external URLs, real trademarks, decorative charts, hardware frames, perspective, annotations, or slide titles. Data is illustrative. Opening a dashboard does not execute any query. Completed values reflect prior manual runs. Label fresh query actions Run or Run again; keep Parameters visible. An unrun metric is an em dash with Not run, never zero. Do not add automatic refresh or Run all. Standard user experience without create/import query actions.
SCREEN B: WORKBENCH
Page title "Content workspace"; breadcrumb Dashboards; top right Edit dashboard. Subtitle "Select a saved query, then run it".
Top row three compact selector cards: Broken links / Guides · 404; Pages missing tags / Guides · Published; Drafts awaiting review / All collections. The Pages missing tags card is selected with indigo outline and a small Selected chip. Cards have explicit Open and Parameters buttons. No KPI numbers in selector cards.
Below, one large full-width results workspace titled "Pages missing tags", secondary "Saved query · Missing page tags", Parameters, Run again, and expand controls. Chips Collection: Guides and Visibility: Published. Status "Last run 10:39 AM · 37 rows".
Show Search results field, column selection control, and a legible seven-row table with columns Page / Path / Collection / Visibility / Updated. Use documentation pages Quick start, Installation, Keyboard shortcuts, Search tips, Troubleshooting, Navigation, Accessibility; local-looking relative paths /guides/quick-start, /guides/install and similar, not external URLs. All rows Collection Guides and Visibility Published. Updated values 2 to 8 days ago. Footer "Showing 1–7 of 37" and pagination. Small caption repeats "Results for Pages missing tags · Guides · Published". Do not embed result tables in the upper cards. Query selection alone does not execute; Run again is in the shared workspace.
```

### Builder

```text
Use case: ui-mockup. Generate a polished, flat desktop product screenshot for an application named "Widget Builder". It is a reusable dashboard editor for saved read-only queries. Use only documentation/content-management examples: broken links, pages missing tags, drafts awaiting review. The app uses predefined saved queries, a parameter form per query, and widgets that display results. Use a restrained indigo accent, white cards, cool off-white canvas, dark graphite text, crisp fine borders, 6px corners, clean sans-serif, readable 13–16px body text. Wide 1600x1100 composition. Moderate information density and excellent alignment. Left rail about 190px: a four-square symbol and "Widget Builder", then Dashboards, Saved queries, Schedules, Activity. No people names, organization names, personal identifiers, external URLs, real trademarks, decorative charts, hardware frames, perspective, annotations, or slide titles. Data is illustrative. Opening a dashboard does not execute any query. Completed values reflect prior manual runs. Label fresh query actions Run or Run again; keep Parameters visible. An unrun metric is an em dash with Not run, never zero. Do not add automatic refresh or Run all. Standard user experience without create/import query actions.
SCREEN C: BUILDER
Page title "Content overview", Editing badge, Unsaved changes, Cancel and Save dashboard. Toolbar Add widget, Layout, Undo. At left an editable twelve-column grid with three small metric cards showing Broken links 128, Pages missing tags 37, and Drafts awaiting review em dash / Not run; then a wide table with documentation page rows. Small drag handles in headers, resize corners, subtle alignment grid. Caption "Drag handles to move". The Layout popover is open with miniature options One column, Halves, Thirds, 2/3 + 1/3, Metrics + table.
At right a generous non-modal drawer, approximately 420px, titled Add widget. A clear vertical form:
1 · Saved query
searchable selector value Broken links, helper Choose a query you can run.
2 · Parameters
Collection dropdown Guides.
Response status dropdown 404.
Include archived checkbox OFF.
3 · Display
three cards Metric / Table / Launcher, Metric selected. Metric description Count rows.
Title input Broken links.
Preview with title Broken links, em dash, Preview not run.
An outlined Run preview button and text "Adding a widget does not run its query".
Sticky bottom footer Cancel / Add widget.
Preserve comfortable spacing and legibility. Save dashboard commits the layout; Add widget adds a card to the draft. No query runs automatically during setup.
```

## Interaction detail: runtime parameters

Create a desktop Widget Builder screenshot with Content overview visible behind a right-side non-modal panel.

The selected widget is Pages missing tags. Its existing table displays Collection: Guides, Visibility: Published, Last run 10:39 AM.

The panel heading is Parameters — Pages missing tags. Show a source label Saved query · Missing page tags. Its Collection dropdown is being changed to Tutorials, while Visibility remains Published. Show an unchecked Save as widget defaults checkbox. Footer Cancel and Run.

The table behind the panel must retain its original Guides parameter label until the new execution succeeds. Typing into the form changes no existing result. The panel is visually anchored to the selected widget and uses the same indigo/white interface as the main screens.

## Interaction detail: state comparison

Create a compact component specification board for the same Pages missing tags widget, using four equally sized cards in a two-by-two arrangement. Label the examples Not run, Running again, Empty result, and Failed attempt.

Not run: em dash, Not run, Run.
Running again: previous value 37 remains visible, Last run 10:39 AM, Running status and disabled duplicate action.
Empty result: 0, No pages matched these parameters, Parameters and Run again.
Failed attempt: Run failed; a visible Retry action; if the previous value 37 appears, label it Previous result · 10:39 AM.

Use the same parameter summary Collection: Guides · Visibility: Published on all four. These are states of one widget type, not different widget types.

## Interaction detail: narrow layout

Create a narrow-screen view of Content overview. Stack metric and table widgets in logical order. Keep Parameters and Run reachable. Show a readable table preview and an Open full results action. Use a full-screen result surface for many columns.

Do not imply that the narrow arrangement overwrites the user's desktop layout. Preserve source/result identity, state labels, and explicit execution behavior.

