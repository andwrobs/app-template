# UI inventory

Provenance for `src/lib/ui`. The lockfile doesn't cover copied registry source.

Source: `https://ui.shadcn.com/r/styles/aria-nova/<name>.json`, generated with the
pinned CLI (shadcn 4.21.0) in a scratch copy and merged by hand. License: shadcn/ui
MIT. Hash: the first 16 hex characters of the item JSON's SHA-256.

Coverage, 2026-09-27: the aria-nova registry serves 53 items. All are installed
except `drawer`, which imports `@base-ui/react`; use `sheet` (Aria Modal) instead. The
docs list `data-table`, `date-picker`, `menubar`, `navigation-menu`, `toast`, and
`typography` without aria-nova items; `data-table` is a pattern (see `/examples/table`)
and `sonner` covers toasts.

## Changes applied to every file

- `cn` comes from `~/lib/ui/utils`. Registry items list the npm package `cn`
  (shadcn-ui/cn, a clsx + tailwind-merge replacement); it isn't installed. Adopting it
  is MAINT-02's call.
- `"use client"` removed; Biome-formatted.
- `biome.json` turns off four rules for `src/lib/ui` because registry markup trips them
  on purpose: `a11y/useSemanticElements` (`role="group"` on divs),
  `a11y/useFocusableInteractive` (breadcrumb's current-page span),
  `a11y/useAriaPropsForRole` (input-otp's separator), and `suspicious/noArrayIndexKey`
  (slider thumbs, calendar weeks, chart items).

## Components

| Component | Hash | Registry deps | npm deps (license) | Local changes |
| --- | --- | --- | --- | --- |
| accordion | `4c2eaadab1b4cf94` | | | none |
| alert | `abde9afc67734891` | | | none |
| alert-dialog | `d3a8878939f475f1` | button | | unused import removed |
| aspect-ratio | `c2262c25e989b0dd` | | | none; plain div |
| avatar | `4a6ae4e530d5b661` | | | none; plain HTML image and fallback |
| badge | `4a6f5d7176426546` | | | none |
| breadcrumb | `1cc174c92c91f994` | | | none |
| button | `529af5230f35e3e1` | | | none |
| button-group | `4ae09ed81ef04a42` | separator | | none |
| calendar | `43d91ce35f8b424a` | button, select | | none |
| card | `81d1bd6c3ac2e110` | | | none; plain HTML |
| carousel | `cb8c457d16b0daeb` | button | embla-carousel-react 8.6.0 (MIT) | none; Embla, not Aria |
| chart | `908cdcf5601f2f1d` | card | recharts 3.8.0 (MIT) | lint suppression on the generated `<style>` |
| checkbox | `ecef10651dbbd65e` | | | Minus icon and styles for indeterminate; adds `CheckboxField` and `CheckboxButton` (Aria 1.21) for labeled form checkboxes |
| collapsible | `333aa5f691ab1fff` | | | none |
| combobox | `d8565bd17fa3c5a0` | button, input-group | | none |
| command | `90963642f1186421` | dialog, input-group | | none. `CommandDialog` is only the modal; put `Command` inside it for filtering |
| context-menu | `32d577e4d54e228f` | | | none |
| dialog | `94ba621dca86e795` | button | | none |
| direction | `2650169104a38579` | | | none |
| dropdown-menu | `6866624306e7e638` | | | none |
| empty | `16e2394e171f16c5` | | | none |
| field | `17e4b3dce8cc2874` | label, separator | | `FieldDescription` and `FieldError` render Aria `Text` slots so Aria fields link them; `FieldError` dedupes by message; exports `fieldVariants` |
| hover-card | `3f17b7f5be66b067` | | | none |
| input | `6f03c2888bfd10c7` | | | none |
| input-group | `c3e580222a1b8200` | button, input, textarea | | lint suppression on the addon's click-to-focus |
| input-otp | `c0eeee00ff9f5262` | | input-otp 1.5.0 (MIT) | none; not Aria |
| item | `cee44b725cb1aaf8` | separator | | none |
| kbd | `5625eb9b56a4f9b0` | | | none |
| label | `65092b58f34f5dcd` | | | unused React import removed |
| native-select | `a574e6efc4cec63d` | | | none; native `<select>` |
| pagination | `d5968105e2d49310` | button | | redundant `role="navigation"` removed |
| popover | `b7516f7ae48c24f5` | | | none |
| progress | `940d2a2207703f3c` | | | none |
| radio-group | `f9908946cb69e727` | | | none |
| resizable | `b5d2537956072880` | | react-resizable-panels 4.14.1 (MIT) | none; not Aria |
| scroll-area | `72306ebcb29dbce3` | | | none; native scrollbars |
| select | `ff74d66b282f4cf6` | input-group | | trigger shows the Select root's `data-invalid`; upstream styles only `aria-invalid`, which Aria doesn't set on the trigger |
| separator | `f12db4109c12fafd` | | | none |
| sheet | `e3bd358ce790d337` | button | | none |
| sidebar | `d0fc2ac3889d65bc` | button, input, separator, sheet, skeleton, tooltip, use-mobile | | stable state setter dropped from two hook dependency lists; lint suppression on the cookie that stores the open state |
| skeleton | `47103251bf6a7f68` | | | none |
| slider | `ddfccff43753a6e1` | | | none |
| sonner | `491bf53222845843` | | sonner 2.0.8 (MIT) | takes `theme` as a prop instead of reading `next-themes`, which isn't installed; `lib/app` passes the app theme |
| spinner | `2eb6c57feacfd22f` | | | none |
| switch | `c6405559b84513b1` | | | none |
| table | `0182629352047581` | | | none |
| tabs | `d0cbf78c376d396a` | | | none |
| textarea | `23cc22e83ef2cb04` | | | none |
| toggle | `f4f048f6a2f22dff` | | | none |
| toggle-group | `c65aa998e70a1267` | toggle | | none. Items take `id`, not the docs' `value` |
| tooltip | `6b76fc659a78eb57` | | | none |
| text-field | local | field | | Not in the registry: Aria `TextField` with the Field layout |

`use-mobile.ts` arrives with sidebar. `Checkbox`, `Switch`, and `RadioGroupItem` render
their children inside the control, so label them with a separate `Label htmlFor`, or
use `CheckboxField` for form checkboxes.

## Refresh

Regenerate in a scratch copy, compare hashes, and diff each changed file against
`src/lib/ui` with the local changes above in mind. Never overwrite in bulk.
