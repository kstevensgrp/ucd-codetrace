# P-Tutor at UC Davis

P-Tutor at UC Davis — a fork of the final open-source release (2020) of Python Tutor by Philip Guo, for stepping through code execution, with access to course data files. MIT licensed.

**P-Tutor at UC Davis** is a program visualizer used in UC Davis computer science courses. Paste in code, run it, and step forward and backward through execution while watching variables, objects, references, and stack frames change. It is a fork of the final open-source release (v5, MIT license, 2020) of Philip Guo's [Python Tutor](https://pythontutor.com), adapted to run on a modern Python, carry UC Davis branding, and let student programs read instructor-provided data files. The "P" is Python today and Programming once more languages are turned on.

## Layout

- `v5-unity/` — the code this project runs: TypeScript/webpack frontend (prebuilt bundles in `build/`), Python tracer (`pg_logger.py`, `pg_encoder.py`), and `bottle_server.py` for local development.
- `v3/`, `v1-v2/` — earlier generations, kept for history.
- `v4-cokapi/` — upstream's Node service for the Java/C/C++/JavaScript/Ruby backends (not used here yet).

## Quick start (Python visualizer only)

```sh
cd v5-unity
pip install bottle
python3 bottle_server.py        # then open http://localhost:8003/visualize.html
```

`bottle_server.py` is a development server with no sandboxing; do not expose it directly.

## Attribution

Original work Copyright (C) Philip Guo, released under the MIT License (see `LICENSE.txt`). The upstream repository, `pgbovine/OnlinePythonTutor`, was removed from GitHub in 2020; this history was recovered from the `loongyowl/OnlinePythonTutor` fork. Python Tutor is Philip Guo's project and name; P-Tutor is not affiliated with or endorsed by it.
