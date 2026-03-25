# Design System — Ngày Lành Tháng Tốt

**Source:** Figma Make code output (ported to `app/components/ui/`)

---

## Make UI Components (`app/components/ui/`)

Moved from Make as-is except dependency-driven fixes (react-day-picker `Chevron`, recharts/tooltip typings, `react-resizable-panels` v4 `Group`/`Separator`).

| Component | File | Notes |
| --- | --- | --- |
| Accordion | `accordion.tsx` | Radix accordion + chevron |
| Alert | `alert.tsx` | Status messaging |
| Alert dialog | `alert-dialog.tsx` | Confirm flows |
| Aspect ratio | `aspect-ratio.tsx` | Media framing |
| Avatar | `avatar.tsx` | User avatar |
| Badge | `badge.tsx` | Labels, counts |
| Breadcrumb | `breadcrumb.tsx` | Nav trail |
| Button | `button.tsx` | CVA variants + sizes |
| Calendar | `calendar.tsx` | DayPicker + nav chevrons |
| Card | `card.tsx` | Content sections |
| Carousel | `carousel.tsx` | Embla carousel |
| Chart | `chart.tsx` | Recharts wrappers + tooltip/legend |
| Checkbox | `checkbox.tsx` | Boolean input |
| Collapsible | `collapsible.tsx` | Disclosure |
| Command | `command.tsx` | Cmdk palette |
| Context menu | `context-menu.tsx` | Right-click menus |
| Dialog | `dialog.tsx` | Modal |
| Drawer | `drawer.tsx` | Vaul drawer |
| Dropdown menu | `dropdown-menu.tsx` | Menus |
| Form | `form.tsx` | react-hook-form helpers |
| Hover card | `hover-card.tsx` | Popover preview |
| Input | `input.tsx` | Text input |
| Input OTP | `input-otp.tsx` | OTP fields |
| Label | `label.tsx` | Form labels |
| Menubar | `menubar.tsx` | App menubar |
| Navigation menu | `navigation-menu.tsx` | Site nav |
| Pagination | `pagination.tsx` | Paged lists |
| Popover | `popover.tsx` | Floating content |
| Progress | `progress.tsx` | Progress bar |
| Radio group | `radio-group.tsx` | Single choice |
| Resizable | `resizable.tsx` | Panel split (v4 Group/Separator) |
| Scroll area | `scroll-area.tsx` | Scroll container |
| Select | `select.tsx` | Native-style select |
| Separator | `separator.tsx` | Divider |
| Sheet | `sheet.tsx` | Side sheet |
| Sidebar | `sidebar.tsx` | App sidebar shell |
| Skeleton | `skeleton.tsx` | Loading placeholder |
| Slider | `slider.tsx` | Range |
| Sonner / Toaster | `sonner.tsx` | Toast (theme light) |
| Switch | `switch.tsx` | Toggle |
| Table | `table.tsx` | Data table |
| Tabs | `tabs.tsx` | Tabbed UI |
| Textarea | `textarea.tsx` | Multiline |
| Toggle | `toggle.tsx` | Icon toggle |
| Toggle group | `toggle-group.tsx` | Segmented control |
| Tooltip | `tooltip.tsx` | Hover hints |
| Utils | `utils.ts` | `cn()` |

## Additional shared components (Foundation)

| Component | File | Purpose |
| --- | --- | --- |
| `EmptyState` | `app/components/EmptyState.tsx` | Empty lists / no data |
| `ErrorBanner` | `app/components/ErrorBanner.tsx` | Error surface |
| `SkeletonCard` | `app/components/SkeletonCard.tsx` | Card-shaped loading |

## Brand tokens (Make `theme.css` → `app/theme.css`)

| Token | Role | Source |
| --- | --- | --- |
| `--primary` | Gold accent / CTA | EDS §5 Gold `oklch(0.73 0.12 85)` |
| `--background` | Parchment page | EDS warm gray-parchment |
| `--foreground` | Ink text | EDS |
| `--surface` / `--surface-foreground` | Dark cards | EDS forest / cream |
| `--destructive` / `--danger` | Hung / errors | EDS đỏ đô |
| `--success` | Cát / positive | EDS |
| Radii | `--radius`, `--radius-md`, … | Make |

Font stacks: `--font-lora`, `--font-noto`, `--font-ibm-mono` in `@theme inline`; global headings use Lora in `theme.css` `@layer base`.
