# Course data files

One directory per data set; student programs opened with
`visualize.html#data=<set>` (or `live.html#data=<set>`) can read the files
in that set with `open('name.txt')`, read-only. The server lists them under
the editor and serves them at `data/<set>/<file>` so students can look at
what they are reading.

- `ecs32a/` — the files used in ECS 32A's file-reading exercises.

Rules enforced by the server (`bottle_server.py`) and the tracer
(`pg_logger.py`):

- set and file names: letters, digits, `_ . -`; no leading dot, no paths;
- `open()` in student code takes a bare file name and read modes only
  (`'r'`, `'rt'`, `'rb'`); anything else raises an error that names the
  available files;
- a deployment can keep the sets elsewhere by setting
  `CODETRACE_DATA_ROOT`; mount that directory read-only as well.

Keep files small: the tracer records every executed line and stops after
1,000 of them, so a loop over a long file is cut off early.
