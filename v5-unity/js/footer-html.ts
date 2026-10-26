export var privacyAndEndingHTML = `

<p style="margin-top: 30px;"><b>About this site:</b> P-Tutor at UC Davis is a
free tool for UC Davis courses. It's offered as is, so please don't paste
anything private into it, and when you use it on assignments, follow your
course's academic integrity policy. Enjoy exploring how your code runs!</p>

<p style="margin-top: 25px;">P-Tutor is an independent fork of
<a href="https://pythontutor.com">Python Tutor</a>, the open-source project
created by <a href="http://www.pgbovine.net/">Philip Guo</a>, used under the
<a href="https://github.com/kstevensgrp/ucd-ptutor/blob/main/LICENSE.txt">MIT License</a>.
Thank you, Philip. Original code &copy; Philip Guo; updates &copy; 2026
K. A. Stevens, UC Davis.</p>`;


export var footerHtml = `
<p style="margin-top: 20px; margin-bottom: 30px;"><a href="https://github.com/pgbovine/OnlinePythonTutor/blob/master/unsupported-features.md" target="_blank">unsupported features</a> |
<a href="https://www.youtube.com/watch?v=80ztTXP90Vs&list=PLzV58Zm8FuBL2WxxZKGZ6j1dH8NKb_HYI&index=5" target="_blank">setting breakpoints</a> |
<a href="https://www.youtube.com/watch?v=Mxt9HZWgwAM&list=PLzV58Zm8FuBL2WxxZKGZ6j1dH8NKb_HYI&index=6" target="_blank">hiding variables</a> |
<a href="https://www.youtube.com/watch?v=JjGt95Te0wo&index=3&list=PLzV58Zm8FuBL2WxxZKGZ6j1dH8NKb_HYI" target="_blank">live programming</a>
</p>

<p>
  <button id="genUrlBtn" class="smallBtn" type="button">Generate permanent link</button> <input type="text" id="urlOutput" size="60"/>
(<a href="https://www.youtube.com/watch?v=h4q3UKdEFKE" target="_blank">video demo</a>)
</p>

<div id="embedLinkDiv">
<p>
  <button id="genEmbedBtn" class="smallBtn" type="button">Generate embed code</button> <input type="text" id="embedCodeOutput" size="60"/> (also supports https://)
</p>
</div>

<p style="margin-top: 25px;">
<a href="http://pythontutor.com/">Python Tutor</a> (<a href="https://github.com/pgbovine/OnlinePythonTutor">code on GitHub</a>) supports:

Python <a href="https://docs.python.org/3.6/">3.6</a> and <a
href="https://docs.python.org/2.7/">2.7</a> with limited imports
(__future__, abc, array, bisect, calendar,
cmath, collections, copy, datetime, decimal,
doctest, fractions, functools, hashlib, heapq,
io, itertools, json, locale, math,
operator, pickle, pprint, random, re,
string, time, types, unittest, StringIO (Python 2), typing (Python 3)),

Oracle Java 8 (implemented by <a href="https://github.com/daveagp">David Pritchard</a> and Will Gwozdz,
supports
<code><a href="http://introcs.cs.princeton.edu/java/stdlib/javadoc/StdIn.html">StdIn</a></code>, 
<code><a href="http://introcs.cs.princeton.edu/java/stdlib/javadoc/StdOut.html">StdOut</a></code>, 
most other <a href="http://introcs.cs.princeton.edu/java/stdlib"><tt>stdlib</tt> libraries</a>,
<a href="http://introcs.cs.princeton.edu/java/43stack/Stack.java.html"><tt>Stack</tt></a>,
<a href="http://introcs.cs.princeton.edu/java/43stack/Queue.java.html"><tt>Queue</tt></a>,
and <a href="http://introcs.cs.princeton.edu/java/44st/ST.java.html"><tt>ST</tt></a>.
To access built-in <tt>Stack</tt>/<tt>Queue</tt> classes, write:
<tt>import java.util.Stack;</tt> This won't work: <tt>import
java.util.*;</tt>),

JavaScript ES6 and TypeScript 1.4.1 (Node.js v6.0.0), Ruby 2 (MRI 2.2.2), C and C++ (gcc 4.8, C11/C++11, Valgrind Memcheck)</p>

` + privacyAndEndingHTML;


export var nullTraceErrorLst = [
  "Unknown error: The server is OVERLOADED or your code has UNSUPPORTED FEATURES.",
  "Try again later. This site is free with NO available technical support. [#NullTrace]"
];

export var unsupportedFeaturesStr = 'see <a target="_blank" href="https://github.com/pgbovine/OnlinePythonTutor/blob/master/unsupported-features.md">UNSUPPORTED FEATURES</a>';
