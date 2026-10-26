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
import pg_logger


# Non-Python languages first hit these as a logging-only dummy before the
# real JSONP call to the cokapi backend. (P-Tutor: the telemetry routes
# viz_interaction.py / error_log.py / *_survey.py are gone; nothing calls them.)
@route('/web_exec_<name:re:.+>.py')
@route('/LIVE_exec_<name:re:.+>.py')
def dummy_ok(name=None):
    return 'OK'

# P-Tutor: the frontend labels the UI with the interpreter actually running
@route('/python_version.txt')
def python_version():
    import platform
    from bottle import response
    response.content_type = 'text/plain'
    return '.'.join(platform.python_version_tuple()[:2])  # e.g. '3.12'

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

  pg_logger.exec_script_str_local(request.query.user_script,
                                  request.query.raw_input_json,
                                  options['cumulative_mode'],
                                  options['heap_primitives'],
                                  json_finalizer)

  return out_s.getvalue()


if __name__ == "__main__":
    run(host='localhost', port=8003, reloader=True)
