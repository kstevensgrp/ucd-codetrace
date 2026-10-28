# CodeTrace at UC Davis

CodeTrace at UC Davis — a fork of the final open-source release (2020) of Python Tutor by Philip Guo, for stepping through code execution, with access to course data files. MIT licensed.

**CodeTrace at UC Davis** is a program visualizer used in UC Davis computer science courses. Paste in code, run it, and step forward and backward through execution while watching variables, objects, references, and stack frames change. It is a fork of the final open-source release (v5, MIT license, 2020) of Philip Guo's [Python Tutor](https://pythontutor.com), adapted to run on a modern Python, carry UC Davis branding, and let student programs read instructor-provided data files.

## Layout

- `site/` — the code this project runs: TypeScript/webpack frontend (prebuilt bundles in `build/`), Python tracer (`pg_logger.py`, `pg_encoder.py`), and `bottle_server.py` for local development.

## Setup

The local environment is defined in `environment.yml`: a conda environment named `codetrace` with Python pinned to the version student code runs under, plus the packages in `site/requirements.txt`. From the repository root:

```sh
conda env create -f environment.yml
conda activate codetrace
```

After pulling changes to `environment.yml` or `site/requirements.txt`, bring the environment up to date with:

```sh
conda env update -f environment.yml --prune
```

Without conda, any Python 3.12 works: `python3 -m venv .venv && source .venv/bin/activate && pip install -r site/requirements.txt`.

## Course data files

Student code can read instructor-provided files when the page is opened with
a data set in the URL, e.g. `visualize.html#data=ecs32a`. The files live in
`data/<set>/` (see `data/README.md`); the page lists them under the editor
and `open('song.txt')` reads them read-only. Without `#data=`, `open()` is
unsupported as in Python Tutor.

## Running locally

```sh
conda activate codetrace
cd site
python bottle_server.py        # then open http://localhost:8003/
```

The server reloads itself when Python files change; HTML and CSS changes show on a browser reload.

`bottle_server.py` is a development server with no sandboxing; do not expose it directly.

## Attribution
Original work Copyright (C) Philip Guo, released under the MIT License (see `LICENSE.txt`). Changes Copyright (c) 2026 The Regents of the University of California, under the same license. The upstream repository, `pgbovine/OnlinePythonTutor`, was removed from GitHub in 2020; this history was recovered from the `loongyowl/OnlinePythonTutor` fork. Python Tutor is Philip Guo's project and name; CodeTrace is an independent fork and is not affiliated with or endorsed by it.
