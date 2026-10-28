# CodeTrace wishlist

Ideas for CodeTrace at UC Davis, roughly in priority order. Each entry is a
sketch of how it would be built, so it can be picked up later without
re-deriving the design.

## 1. Course data files for assignments

Let student programs read instructor-provided files (CSV, text) so
assignment code can be visualized as written, instead of being rewritten
around `io.StringIO`.

### Tracer: a restricted `open`, not `allow_all_modules`

`pg_logger.py` already has an `allow_all_modules` flag (upstream used it for
the Anaconda backend), but it lifts *everything*: `os`, `subprocess`,
`socket`, writable files. Not acceptable on a server students reach.
Instead, add a `data_dir` option; when it is set:

- the `open` builtin handed to student code becomes a wrapper that takes
  the **basename only** (reject `/`, `..`, absolute paths), joins it to
  `data_dir`, and opens read-only in text mode; any other mode raises
  "CodeTrace data files are read-only";
- `RLIMIT_NOFILE`, which upstream sets to 0 right before the student's
  code runs, becomes a small number (e.g. 8) so file handles exist at all;

### Server: where files live and how a run picks them

One directory per data set, e.g. `data/hw3/grades.csv`. The set name
travels with the request: the frontend adds `data=hw3` to the options it
already sends, and `bottle_server.py` maps it to `DATA_ROOT/hw3` after
checking it is a plain name that exists. `DATA_ROOT` comes from an
environment variable so the deployment can mount a read-only volume there.
Two small routes: `data/<set>/` (JSON listing) and `data/<set>/<file>`
(plain text) so students can look at what they are reading.

### Frontend: make it visible

`#data=hw3` in the URL (rides along in permalinks like `#code=`) and a line
under the editor: "Data files for hw3: grades.csv · roster.txt", each name
linking to the file. One link per assignment and the right files are just
there. Without `#data=`, nothing changes and `open()` still gives the
"not supported" message.

### Deployment hygiene

- Keep files small. The tracer records every step and the cap is 1,000
  executed lines, so a loop over a 5,000-row CSV stops a fifth of the way
  through. Dozens of rows, not thousands; or raise the cap for data runs
  and teach `#break`.
- Mount the data directory read-only in the container regardless of the
  wrapper, as a second line of defense.

### Open decision

One flat set per assignment (`data=hw3`), or one shared pool for the whole
course (no `data=` parameter at all)? The latter is simpler still.

## 2. Production server

`bottle_server.py` is a development server (no sandboxing, `reloader=True`).
Needed before the departmental host: a Dockerfile with a pinned Python,
gunicorn in front of bottle, nginx for static files, per-request CPU and
memory limits.

## 3. ECS 32A example programs

Replace Guo's generic Python examples in `example-code/python/` with ones
drawn from the course; wire them into `js/example-links.ts`.
