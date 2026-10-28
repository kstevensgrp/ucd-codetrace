# Lightweight OPT server that works on both Python 2 and 3

# NOTE that this is meant only for testing and not deployment, since
# there is no sandboxing

# to invoke, run 'python bottle_server.py'
# and visit http://localhost:8080/index.html
#
# external dependencies: bottle
#
# easy_install pip
# pip install bottle

from bottle import route, get, request, run, template, static_file
try:
    import StringIO # NB: don't use cStringIO since it doesn't support unicode!!!
except:
    import io as StringIO # py3
import json
import os
import re
import pg_logger

# CodeTrace: course data files. One directory per data set under DATA_ROOT
# (data/<set>/<file>); the frontend sends the set name as the "data" option
# and student code can then open() files in that set read-only.
# DATA_ROOT defaults to the repository's data/ directory; a deployment can
# point it at a read-only volume instead.
DATA_ROOT = os.path.realpath(os.environ.get(
    'CODETRACE_DATA_ROOT', os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data')))
DATA_SET_RE = re.compile(r'^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$')
DATA_FILE_RE = re.compile(r'^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$')

def data_set_dir(name):
    """Directory for data set `name`, or None if the name is bad or missing."""
    if not name or not DATA_SET_RE.match(name) or '..' in name:
        return None
    d = os.path.realpath(os.path.join(DATA_ROOT, name))
    if os.path.dirname(d) != DATA_ROOT or not os.path.isdir(d):
        return None
    return d

def data_set_files(d):
    return sorted(n for n in os.listdir(d)
                  if DATA_FILE_RE.match(n) and os.path.isfile(os.path.join(d, n)))


# Non-Python languages first hit these as a logging-only dummy before the
# real JSONP call to the cokapi backend. (CodeTrace: the telemetry routes
# viz_interaction.py / error_log.py / *_survey.py are gone; nothing calls them.)
@route('/web_exec_<name:re:.+>.py')
@route('/LIVE_exec_<name:re:.+>.py')
def dummy_ok(name=None):
    return 'OK'

# CodeTrace: the frontend labels the UI with the interpreter actually running
@route('/python_version.txt')
def python_version():
    import platform
    from bottle import response
    response.content_type = 'text/plain'
    return '.'.join(platform.python_version_tuple()[:2])  # e.g. '3.12'

# CodeTrace: the bare hostname lands on the visualizer (index.html is a
# symlink to visualize.html for static hosts; this covers "/")
@route('/')
def root():
    return static_file('visualize.html', root='.')

# CodeTrace: data-set listing (JSON) and the files themselves (plain text),
# so students can see what their program is reading. Registered before the
# static catch-all below so these take priority.
@route('/data/<name>/')
@route('/data/<name>')
def data_listing(name):
    from bottle import response, abort
    d = data_set_dir(name)
    if d is None:
        abort(404, 'No data set named %r' % name)
    response.content_type = 'application/json'
    files = [{'name': n, 'size': os.path.getsize(os.path.join(d, n))} for n in data_set_files(d)]
    return json.dumps({'set': name, 'files': files})

@route('/data/<name>/<fname>')
def data_file(name, fname):
    from bottle import abort
    d = data_set_dir(name)
    if d is None or not DATA_FILE_RE.match(fname) or fname not in data_set_files(d):
        abort(404, 'No such data file')
    return static_file(fname, root=d, mimetype='text/plain; charset=utf-8')

@route('/<filepath:path>')
def index(filepath):
    return static_file(filepath, root='.')


# Note that this will run either Python 2 or 3, depending on which
# version of Python you used to start the server, REGARDLESS of which
# route was taken:
@route('/web_exec_py2.py')
@route('/web_exec_py3.py')
@route('/LIVE_exec_py2.py')
@route('/LIVE_exec_py3.py')
def get_py_exec():
  out_s = StringIO.StringIO()

  def json_finalizer(input_code, output_trace):
    ret = dict(code=input_code, trace=output_trace)
    json_output = json.dumps(ret, indent=None)
    out_s.write(json_output)

  options = json.loads(request.query.options_json)

  # CodeTrace: resolve the requested data set to a directory on this server;
  # the client never names a path. An unknown set is reported in the trace
  # so the student sees it where errors normally appear.
  data_dir = None
  data_set = options.get('data')
  if data_set:
    data_dir = data_set_dir(data_set)
    if data_dir is None:
      return json.dumps({'code': request.query.user_script,
                         'trace': [{'event': 'uncaught_exception', 'line': 1,
                                    'exception_msg': 'CodeTrace: no data set named %r on this server'
                                                     % data_set}]})

  pg_logger.exec_script_str_local(request.query.user_script,
                                  request.query.raw_input_json,
                                  options['cumulative_mode'],
                                  options['heap_primitives'],
                                  json_finalizer,
                                  data_dir=data_dir)

  return out_s.getvalue()


if __name__ == "__main__":
    run(host='localhost', port=8003, reloader=True)
