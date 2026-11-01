# Acceptance Scenarios

These scenarios describe observable behavior to review in a working implementation.

## Execution

1. Open a dashboard with six widgets. It retrieves configuration and any permitted retained results; it starts zero query executions.
2. Run one widget. Exactly that widget's selected source executes once.
3. Activate Run repeatedly while a request is pending. Duplicate execution is prevented.
4. Change parameters and start a newer run before an older response arrives. The older response never overwrites the newer selection.
5. Remove a widget while its run is pending. Its completion never appears inside a different widget.
6. Open an available result, expand a table, or fetch another result page. No duplicate query execution occurs.
7. A result expires. The UI explains the expiry and offers an explicit new run.
8. A server cancellation capability is absent. The UI does not promise that closing a view stops the server job.

## Metrics and tables

9. An unrun metric shows an em dash and Not run.
10. A successful zero-row result shows 0 or No rows matched these parameters.
11. A failed run never displays a false zero.
12. Five visible rows from a 37-row result produce Showing 5 of 37 rows, not a metric of 5.
13. A capped response clearly indicates the limit instead of claiming an exact complete total.
14. A scalar aggregate is not mistaken for the row count.
15. A local preview filter is described as local; it does not imply that the entire dataset was filtered.
16. A count-only result without retained rows does not pretend to support an execution-free table drilldown.

## Parameters

17. Open Parameters. It shows the selected source's schema and the widget's saved inputs.
18. Edit Collection in the form without submitting. Visible prior results retain their original parameter summary.
19. Cancel the form. Saved defaults remain unchanged.
20. Run without Save as widget defaults selected. This attempt uses the new values; widget defaults remain unchanged.
21. Run with Save as widget defaults selected. Successful configuration persistence is confirmed separately from execution success.
22. Default persistence fails. The UI does not claim the widget was saved or silently continue the reference save-then-run flow.
23. A required field is missing. The form identifies the field and blocks submission.
24. A dependent choice becomes invalid. It is cleared or flagged before execution.
25. A relative date input resolves at execution. The result retains the concrete range.
26. A source revision changes required inputs. The widget shows Needs configuration.
27. A parameter change affects only the intended widget. Other widgets and schedules remain unchanged.

## Builder

28. Add a widget without running its preview. No query executes.
29. Run preview, then add the widget. Adding causes no second automatic execution.
30. Change preview inputs. The previous preview is no longer presented as current.
31. Resize a widget or apply a preset. No source executes.
32. Load table rows. Widget dimensions and neighboring positions remain stable.
33. Use a compact preset with a wide table. Minimum-size rules remain enforced.
34. Undo a layout operation. Widget IDs, source references, and saved parameters remain intact.
35. Cancel an edit session. The committed dashboard is restored.
36. Saving fails. The draft and its unsaved-change status remain available.
37. A concurrent editor saves first. Revision conflict handling preserves the local draft.
38. A small-screen layout is derived. It does not overwrite the committed desktop arrangement.

## Permissions and workbench

39. A user can edit a dashboard but lacks source execution access. Editing does not grant that access.
40. Source management controls appear only for the corresponding capability.
41. A dashboard is shared. Another viewer cannot retrieve an unauthorized retained result.
42. Access is removed. Cached result rows are not left visible through the normal authorized UI path.
43. Select another workbench query. The workspace displays its own result or Not run.
44. Open a selector in the workbench. Selection alone does not execute a query.
45. Use a launcher. Its explicit Open & run action opens the result workspace and executes, or requests missing inputs.

## Accessibility

46. Add, configure, run, expand, move, resize, and remove widgets using the keyboard.
47. Close a panel. Focus returns to the appropriate trigger or next logical control.
48. Run completes or fails. Assistive technology receives a useful status update.
49. Open a non-modal side panel. The canvas remains reachable.
50. Open a modal overlay. Focus follows the modal interaction model.

