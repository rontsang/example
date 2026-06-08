# 🎨 UI Behaviors & Design System

To match modern web design standards and provide a premium user experience, the Nest Egg Optimizer utilizes dynamic layout scaling, precise slider geometries, and smooth interactive widgets.

---

## 1. Viewport Height Breakpoints

The input panel inside `app-userinput` utilizes a **`ResizeObserver`** to detect the element's actual container height and apply vertical scale compression classes:

| Class | Container Height | Spacing & Spans Adjustments |
| :--- | :--- | :--- |
| **`height-tall`** | $\ge 900\text{px}$ | Standard vertical flow. Form inputs occupy full row widths. |
| **`height-medium`** | $800\text{px} - 899\text{px}$ | TFSA and RRSP starting balance fields collapse side-by-side. |
| **`height-compact`** | $710\text{px} - 799\text{px}$ | Spacing compressed. Income and Spend fields collapse side-by-side. |
| **`height-short`** | $580\text{px} - 709\text{px}$ | All inputs side-by-side. Range sliders are hidden (`display: none`). |
| **`height-ultra-short`** | $< 580\text{px}$ | Maximum compression. Form uses `overflow-y: auto` vertical scrollbar. |

---

## 2. Slider Alignments & Track Extensions

To resolve the "floating thumb" issue at extreme boundaries (0% and 100%), the range slider utilizes precise horizontal and vertical geometries:

- **Negative Margins**: The input `#variance-slider` is styled with `width: calc(100% + 18px)` and horizontal margins of `-9px` to pull the active thumb's center exactly to `0px` and `W` of the track.
- **Track Extension**: The custom background track line spans exactly from `0%` to `100%` of the container width. The tick marks (Cash, Aggressive) are positioned at the extreme edges.
- **Vertical Centering (WebKit)**: Centering the WebKit thumb is achieved by setting the runnable track height to `6px` and adding `margin-top: -6px` on the `#variance-slider::-webkit-slider-thumb` class.

---

## 3. Probability Calculator Inline Layout

The Monte Carlo probability range calculator is styled as a unified inline sentence:
- **First Line**: `[Input Box]% chance of falling between` (uses `align-items: baseline` so the typeable number box and the text sit on the same horizontal baseline).
- **Second Line**: `[Low Return]% and [High Return]%` (in larger, bold white font for high scannability).
- **Zero Volatility Conditional**: When volatility is set to `0%`, the input hides and displays `100% chance of [RateOfReturn]%` to mathematically represent a deterministic return.

---

## 4. Chart Navigation Year-Clamp

The details panel under the line chart displays the withdrawal breakdown of the hovered year.
- **Clamp Boundaries**: Hovering and arrow navigation are locked to integer values.
- **Depletion Lock**: The navigation prevents user hover or arrow interaction from selecting years beyond the portfolio's precise depletion year (e.g. if the portfolio lasts 42.6 years, Year 43 is disabled and cannot be hovered or displayed).
