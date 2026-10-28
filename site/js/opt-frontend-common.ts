// Python Tutor: https://github.com/pgbovine/OnlinePythonTutor/
// Copyright (C) Philip Guo (philip@pgbovine.net)
// LICENSE: https://github.com/pgbovine/OnlinePythonTutor/blob/master/LICENSE.txt

/* TODO

- we're always referring to top-level CSS selectors on the page; maybe
  use a this.domRoot pattern like in pytutor.ts?

*/

/// <reference path="_references.ts" />

// for TypeScript
declare var codeopticonUsername: string; // FIX later when porting Codeopticon
declare var codeopticonSession: string;  // FIX later when porting Codeopticon

require('./lib/jquery.ba-dotimeout.min.js');

// need to directly import the class for type checking to work
import {ExecutionVisualizer, assert, htmlspecialchars, setPythonVersionString} from './pytutor';
import {nullTraceErrorLst,unsupportedFeaturesStr} from './footer-html';


// the main event!
//
// NB: this still relies on global state such as localStorage and the
// browser URL hash string, so you still can't have more than one of these
// objects per page; should still be instantiated as a SINGLETON
export abstract class AbstractBaseFrontend {
  sessionUUID: string = generateUUID(); // remains constant throughout one page load ("session")
  userUUID: string; // remains constant for a particular "user" throughout multiple page loads (stored in localStorage on a particular browser)

  myVisualizer: ExecutionVisualizer;
  originFrontendJsFile: string; // "abstract" -- must override in subclass

  // a cache where each element is a pair:
  // [appState, cached execution trace]
  // that way, if you execute the same code with the same settings again and
  // get a cache hit, then there's no need to make a server call
  traceCache = [];

  // 'edit' or 'display'. also support 'visualize' for backward
  // compatibility (same as 'display')
  appMode: string = 'edit';

  // inputted by user for raw_input / mouse_input events
  rawInputLst: string[] = [];

  // CodeTrace: course data set selected by #data=<set> in the URL. Sent to
  // the backend as the "data" option so student code can open() its files;
  // undefined means upstream behavior (open() is not supported).
  dataSet: string = undefined;

  isExecutingCode: boolean = false;

  // CodeTrace: upstream kept a diff_match_patch log of every edit here
  // (deltaObj / curCode / dmp) and sent it with each execution. Removed.

  num414Tries = 0;

  // note that we use '2' and '3' instead of 'py2' and 'py3' due to legacy reasons
  langSettingToBackendScript = {
    // backend scripts to execute (Python 2 and 3 variants, if available)
    // make two copies of ../web_exec.py and give them the following names,
    // then change the first line (starting with #!) to the proper version
    // of the Python interpreter (i.e., Python 2 or Python 3).
    // Note that your hosting provider might have stringent rules for what
    // kind of scripts are allowed to execute. For instance, my provider
    // (Webfaction) seems to let scripts execute only if permissions are
    // something like:
    // -rwxr-xr-x 1 pgbovine pgbovine 2.5K Jul  5 22:46 web_exec_py2.py*
    // (most notably, only the owner of the file should have write
    //  permissions)
    '2': 'web_exec_py2.py',
    '3': 'web_exec_py3.py',

  };

  // CodeTrace: upstream also mapped js/ts/java/ruby/c/cpp/py3anaconda to JSONP
  // endpoints on cokapi.com (plus two raw-IP backup servers). Only Python
  // runs here, on this server, so those are gone. opt-live.ts still reads
  // this map, hence the nulls.
  langSettingToJsonpEndpoint = {
    '2':    null,
    '3':    null,
  };

  abstract executeCode(forceStartingInstr?: number, forceRawInputLst?: string[]) : any;
  abstract finishSuccessfulExecution() : any; // called by executeCodeAndCreateViz
  abstract handleUncaughtException(trace: any[]) : any; // called by executeCodeAndCreateViz

  constructor(params: any = {}) {
    // CodeTrace: ask the server which Python it runs and label the UI with it,
    // instead of upstream's hard-coded "Python 3.6".
    $.get('python_version.txt', (v) => {
      v = String(v).trim();
      if (/^\d+\.\d+/.test(v)) {
        setPythonVersionString(v);
        $('#pythonVersionSelector option[value="3"]').text('Python ' + v);
      }
    }, 'text');

    // CodeTrace: upstream generated a persistent per-browser UUID
    // (localStorage 'opt_uuid') for usage research. We don't track users.
    this.userUUID = undefined;

    // register a generic AJAX error handler
    $(document).ajaxError((evt, jqxhr, settings, exception) => {
      if (this.ignoreAjaxError(settings)) {
        return; // early return!
      }

      // On my server ...

      // This jqxhr.responseText might mean the URL is too long, since the error
      // message returned by the server is something like this in nginx:
      //
      //   <html>
      //   <head><title>414 Request-URI Too Large</title></head>
      //   <body bgcolor="white">
      //   <center><h1>414 Request-URI Too Large</h1></center>
      //   <hr><center>nginx</center>
      //   </body>
      //   </html>
      //
      // Note that you'll probably need to customize this check for your server.
      if (jqxhr && jqxhr.responseText && jqxhr.responseText.indexOf('414') >= 0) {
        // ok this is an UBER UBER hack. If this happens just once, then
        // force click the "Visualize Execution" button again and re-try.
        // why? what's the difference the second time around? the diffs_json
        // parameter (derived from deltaObj) will be *empty* the second time
        // around since it gets reset on every execution. if diffs_json is
        // HUGE, then that might force the URL to be too big without your
        // code necessarily being too big, so give it a second shot with an
        // empty diffs_json. if it STILL fails, then display the error
        // message and give up.
        if (this.num414Tries === 0) {
          this.num414Tries++;
          $("#executeBtn").click();
        } else {
          this.setFronendError(["Server error! Your code might be too long for this tool. Shorten your code and re-try. [#CodeTooLong]"]);
          this.num414Tries = 0; // reset this to 0 AFTER setFronendError so that in setFronendError we can know that it's a 414 error (super hacky!)
        }
      } else {
        this.setFronendError(
                        ["Server error! Your code might have an INFINITE LOOP or be running for too long.",
                         "The server may also be OVERLOADED. Or you're behind a FIREWALL that blocks access.",
                         "Try again later. This site is free with NO technical support. [#UnknownServerError]"]);
      }
      this.doneExecutingCode();
    });

    this.clearFrontendError();
    $("#embedLinkDiv").hide();
    $("#executeBtn")
      .attr('disabled', false)
      .click(this.executeCodeFromScratch.bind(this));
  }

  ignoreAjaxError(settings) {return false;} // subclasses should override

  // empty stub so that our code doesn't crash.
  // TODO: override this with a version in codeopticon-learner.js if needed
  logEventCodeopticon(obj) { } // NOP

  getAppState() {return {};} // NOP -- subclasses need to override

  setFronendError(lines, ignoreLog=false) {
    $("#frontendErrorOutput").html(lines.map(htmlspecialchars).join('<br/>') +
                                   (ignoreLog ? '' : '<p/>(' + unsupportedFeaturesStr + ')'));

    // CodeTrace: upstream also POSTed the error + code to error_log.py; removed.
  }

  clearFrontendError() {
    $("#frontendErrorOutput").html('');
  }

  // parsing the URL query string hash
  getQueryStringOptions() {
    var ril = $.bbq.getState('rawInputLstJSON');
    var testCasesLstJSON = $.bbq.getState('testCasesJSON');
    // note that any of these can be 'undefined'
    return {preseededCode: $.bbq.getState('code'),
            preseededCurInstr: Number($.bbq.getState('curInstr')),
            verticalStack: $.bbq.getState('verticalStack'),
            appMode: $.bbq.getState('mode'),
            py: $.bbq.getState('py'),
            cumulative: $.bbq.getState('cumulative'),
            heapPrimitives: $.bbq.getState('heapPrimitives'),
            textReferences: $.bbq.getState('textReferences'),
            rawInputLst: ril ? $.parseJSON(ril) : undefined,
            demoMode: $.bbq.getState('demo'), // is 'demo mode' on? if so, hide a lot of excess stuff
            codcastFile: $.bbq.getState('codcast'), // load a codcast file created using ../recorder.html
            dataSet: $.bbq.getState('data'), // CodeTrace: course data set
            codeopticonSession: $.bbq.getState('cosession'),
            codeopticonUsername: $.bbq.getState('couser'),
            testCasesLst: testCasesLstJSON ? $.parseJSON(testCasesLstJSON) : undefined
            };
  }

  redrawConnectors() {
    if (this.myVisualizer &&
        (this.appMode == 'display' ||
         this.appMode == 'visualize' /* deprecated */)) {
      this.myVisualizer.redrawConnectors();
    }
  }

  getBaseBackendOptionsObj() {
    var ret = {cumulative_mode: ($('#cumulativeModeSelector').val() == 'true'),
               heap_primitives: ($('#heapPrimitivesSelector').val() == 'true'),
               show_only_outputs: false, // necessary for legacy reasons, ergh!
               origin: this.originFrontendJsFile};
    if (this.dataSet) {
      (ret as any).data = this.dataSet; // CodeTrace
    }
    return ret;
  }

  // CodeTrace: show which data files the selected set offers, each linked
  // to the plain-text file, in #dataFilesPane under the code editor.
  showDataFiles() {
    var pane = $('#dataFilesPane');
    if (!this.dataSet) {
      pane.hide();
      return;
    }
    var setName = this.dataSet;
    var esc = (s) => $('<div/>').text(s).html();
    pane.show().html('Data files for ' + esc(setName) + ': loading ...');
    $.getJSON('data/' + encodeURIComponent(setName) + '/', (res) => {
      if (!res.files || res.files.length == 0) {
        pane.html('Data files for ' + esc(setName) + ': none');
        return;
      }
      var links = res.files.map((f) =>
        '<a target="_blank" href="data/' + encodeURIComponent(setName) + '/' +
        encodeURIComponent(f.name) + '">' + esc(f.name) + '</a>');
      pane.html('Data files for ' + esc(setName) + ', open with <code>open(\'' +
                esc(res.files[0].name) + '\')</code>: ' + links.join(' &middot; '));
    }).fail(() => {
      pane.html('No data set named ' + esc(setName) + ' on this server.');
    });
  }

  getBaseFrontendOptionsObj() {
    var ret = {// tricky: selector 'true' and 'false' values are strings!
                disableHeapNesting: (($('#heapPrimitivesSelector').val() == 'true') ||
                                     ($('#heapPrimitivesSelector').val() == 'nevernest')),
                textualMemoryLabels: ($('#textualMemoryLabelsSelector').val() == 'true'),
                executeCodeWithRawInputFunc: this.executeCodeWithRawInput.bind(this),

                // always use the same visualizer ID for all
                // instantiated ExecutionVisualizer objects,
                // so that they can sync properly across
                // multiple clients using TogetherJS in shared sessions.
                // this shouldn't lead to problems since only ONE
                // ExecutionVisualizer will be shown at a time
                visualizerIdOverride: '1',
                updateOutputCallback: this.updateOutputCallbackFunc.bind(this),
                startingInstruction: 0,
              };
    return ret;
  }

  updateOutputCallbackFunc() {
    $('#urlOutput,#urlOutputShortened,#embedCodeOutput').val('');
  }

  executeCodeFromScratch() {
    this.rawInputLst = []; // reset!
    this.executeCode();
  }

  executeCodeWithRawInput(rawInputStr, curInstr) {
    this.rawInputLst.push(rawInputStr);
    this.executeCode(curInstr);
  }

  startExecutingCode(startingInstruction=0) {
    $('#executeBtn').html("Please wait ... executing (takes up to 10 seconds)");
    $('#executeBtn').attr('disabled', true);
    this.isExecutingCode = true;
  }

  doneExecutingCode() {
    $('#executeBtn').html("Visualize Execution");
    $('#executeBtn').attr('disabled', false);
    this.isExecutingCode = false;
  }

  // execute codeToExec and create a new ExecutionVisualizer
  // object with outputDiv as its DOM parent
  executeCodeAndCreateViz(codeToExec,
                          pyState,
                          backendOptionsObj, frontendOptionsObj,
                          outputDiv) {
    var vizCallback = (dataFromBackend) => {
      var trace = dataFromBackend.trace;
      // don't enter visualize mode if there are killer errors:
      if (!trace ||
          (trace.length == 0) ||
          (trace[trace.length - 1].event == 'uncaught_exception')) {
        this.handleUncaughtException(trace);

        if (trace.length == 1) {
          this.setFronendError([trace[0].exception_msg]);
        } else if (trace.length > 0 && trace[trace.length - 1].exception_msg) {
          this.setFronendError([trace[trace.length - 1].exception_msg]);
        } else {
          this.setFronendError(nullTraceErrorLst);
        }
      } else {
        // fail-soft to prevent running off of the end of trace
        if (frontendOptionsObj.startingInstruction >= trace.length) {
          frontendOptionsObj.startingInstruction = 0;
        }

        if (frontendOptionsObj.runTestCaseCallback) {
          // hacky! DO NOT actually create a visualization! instead call:
          frontendOptionsObj.runTestCaseCallback(trace);
        } else {
          // success!
          this.myVisualizer = new ExecutionVisualizer(outputDiv, dataFromBackend, frontendOptionsObj);
          // SUPER HACK -- slip in backendOptionsObj as an extra field
          // NB: why do we do this? for more detailed logging?
          (this.myVisualizer as any).backendOptionsObj = backendOptionsObj;
          this.finishSuccessfulExecution(); // TODO: should we also run this if we're calling runTestCaseCallback?
        }
      }
    }

    this.executeCodeAndRunCallback(codeToExec,
                                   pyState,
                                   backendOptionsObj, frontendOptionsObj,
                                   vizCallback.bind(this));
  }

  // execute code and call the execCallback function when the server
  // returns data via Ajax
  executeCodeAndRunCallback(codeToExec,
                            pyState,
                            backendOptionsObj, frontendOptionsObj,
                            execCallback) {
      var callbackWrapper = (dataFromBackend) => {
        this.clearFrontendError(); // clear old errors first; execCallback may put in a new error:

        execCallback(dataFromBackend); // call the main event first

        // run this at the VERY END after all the dust has settled
        this.doneExecutingCode(); // rain or shine, we're done executing!
        // tricky hacky reset
        this.num414Tries = 0;
      };

      var backendScript = this.langSettingToBackendScript[pyState];
      assert(backendScript);

      if (!backendScript) {
        this.setFronendError(["Server configuration error: No backend script"]);
        return;
      }

      this.clearFrontendError();
      this.startExecutingCode(frontendOptionsObj.startingInstruction);

      frontendOptionsObj.lang = pyState;
      // kludgy exceptions
      if (pyState === '2') {
        frontendOptionsObj.lang = 'py2';
      } else if (pyState === '3') {
        frontendOptionsObj.lang = 'py3';
      } else if (pyState === 'java') {
        // TODO: should we still keep this exceptional case?
        frontendOptionsObj.disableHeapNesting = true; // never nest Java objects, seems like a good default
      }

      // CodeTrace: upstream serialized per-keystroke edit deltas (deltaObj)
      // into diffs_json here; keystroke capture is removed.

      // if we can find a matching cache entry, then use it!!!
      if (this.traceCache) {
        var appState = this.getAppState();
        var cachedTrace = this.traceCacheGet(appState);
        if (cachedTrace) {
          //console.log("CACHE HIT!", appState);
          callbackWrapper({code: (appState as any).code, trace: cachedTrace});
          return; // return early without going to the server at all!
        }
      }

      // everything below here is an ajax (async) call to the server ...
      {
        // for Python 2 or 3, directly execute backendScript
        assert (pyState === '2' || pyState === '3');
        $.get(backendScript,
              {user_script : codeToExec,
               raw_input_json: this.rawInputLst.length > 0 ? JSON.stringify(this.rawInputLst) : '',
               options_json: JSON.stringify(backendOptionsObj)},
               callbackWrapper, "json");
      }
  }


  // manage traceCache

  // return whether two states match, except don't worry about mode or curInstr
  static appStateEqForCache(s1, s2) {
    // NB: this isn't always true if we're recording and replaying
    // in different frontend files ...
    //assert(s1.origin == s2.origin); // sanity check!
    return (s1.code == s2.code &&
            s1.data == s2.data && // CodeTrace
            s1.cumulative == s2.cumulative &&
            s1.heapPrimitives == s1.heapPrimitives &&
            s1.textReferences == s2.textReferences &&
            s1.py == s2.py &&
            s1.rawInputLstJSON == s2.rawInputLstJSON);
  }

  // SILENTLY fail without doing anything if the current app state is
  // already in the cache
  traceCacheAdd() {
    // should only be called if you currently have a working trace;
    // otherwise it's useless
    assert(this.myVisualizer && this.myVisualizer.curTrace);
    var appState = this.getAppState();

    // make sure nothing in the cache currently matches appState
    for (var i = 0; i < this.traceCache.length; i++) {
      var e = this.traceCache[i];
      if (AbstractBaseFrontend.appStateEqForCache(e[0], appState)) {
        console.warn("traceCacheAdd silently failed, entry already in cache");
        return;
      }
    }

    this.traceCache.push([appState, this.myVisualizer.curTrace]);
    console.log('traceCacheAdd', this.traceCache);
  }

  traceCacheGet(appState) {
    for (var i = 0; i < this.traceCache.length; i++) {
      var e = this.traceCache[i];
      if (AbstractBaseFrontend.appStateEqForCache(e[0], appState)) {
        return e[1];
      }
    }
    return null;
  }

  traceCacheClear() {
    this.traceCache = [];
  }

  setSurveyHTML() {
    // CodeTrace: upstream's "short user survey" (a Google Form keyed by
    // userUUID) is gone. Kept as a no-op because every page entry point
    // calls it; the #surveyPane div stays empty.
    $('#surveyPane').empty();
  }
} // END class AbstractBaseFrontend


// removed donation link on 2019-03-26
//    Keep this tool free by making a <a style="font-size: 10pt; font-weight: bold;" href="http://pgbovine.net/support.htm" target="_blank">small donation</a> (PayPal, Patreon, credit/debit card)


// (CodeTrace: archive of upstream survey wordings v8-v14 removed; see git history.)


// misc utilities:

// From http://stackoverflow.com/a/8809472
export function generateUUID(){
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x7|0x8)).toString(16);
    });
    return uuid;
};

// Adapted from http://diveintohtml5.info/storage.html
export function supports_html5_storage() {
  try {
    if ('localStorage' in window && window['localStorage'] !== null) {
      // From: http://stackoverflow.com/questions/21159301/
      // Safari before v11, in Private Browsing Mode, looks like it supports localStorage but all calls to
      // setItem throw QuotaExceededError.  Making these calls in the try block will detect that situation
      // with the catch below, returning false.
      localStorage.setItem('_localStorage_test', '1');
      localStorage.removeItem('_localStorage_test');
      return true;
    }
    else {
      return false;
    }
  } catch (e) {
    return false;
  }
}
