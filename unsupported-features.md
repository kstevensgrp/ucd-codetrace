# Unsupported features

CodeTrace runs your program inside a tracer that records every step so it can
be replayed, so it deliberately supports less than a normal Python
interpreter. If something below bites you, the usual fix is to simplify the
program: the tool is for understanding how code runs, not for running
real workloads.

## Limits on what a program can do

- **Imports are limited** to these standard library modules: `__future__`,
  abc, array, bisect, calendar, cmath, collections, copy, datetime, decimal,
  doctest, fractions, functools, hashlib, heapq, io, itertools, json, locale,
  math, operator, pickle, pprint, random, re, string, time, types, typing,
  unittest. Anything else (including NumPy, pandas, requests) raises
  `ImportError`.
- **No file access, except course data files**: `open()` raises an error
  unless the page was opened with a data set (`#data=<set>` in the URL),
  in which case the files in that set can be read with `open('name.txt')`
  but not written. Use `io.StringIO` to simulate any other file in memory.
- **No networking, threads, subprocesses, or `sys.exit()`**-style tricks.
- **Execution is capped** at 1,000 executed lines, a few seconds of CPU
  time, and about 200 MB of memory. An infinite loop simply stops at the
  cap. You can place a `#break` comment on a line to stop tracing early.
- **`input()`** works: the tool prompts you and re-runs the program with
  your answers. Mixing `input()` with `random` can behave oddly because
  the random seed is fixed to make runs repeatable.
- **`id()` and `is`** on numbers and strings won't necessarily match
  CPython on your own machine; those are implementation details and not
  something to rely on anyway.
- Printing to `stderr` may not show up; use ordinary `print()`.
- Very long strings or large data structures are truncated in the display.

## Things the visualizer can't show

- **Steps inside a single line.** Each step is one line of code; you can't
  watch sub-expressions evaluate within a line. Split a complex expression
  into several lines with temporary variables if you want to see the
  intermediate values.
- Command-line arguments (`sys.argv`); hard-code the values instead.
- Non-ASCII text mostly works but can render oddly in some places.
- Mobile phones: the layout needs a laptop-sized screen.

## FAQ

### Why are numbers and strings drawn inside the frames instead of on the heap?

In Python every value is an object on the heap, but drawing an arrow for
every number and string would clutter the picture, so by default
"primitives" (numbers, strings, booleans, `None`) are shown inline in the
frame that holds them. Because primitives are immutable, this doesn't
change how the program behaves.

If you want the fully faithful picture, change the dropdown under the
editor from *inline primitives* to *render all objects on the heap*. Pairing
it with *use text labels for references* keeps the arrow count manageable.
