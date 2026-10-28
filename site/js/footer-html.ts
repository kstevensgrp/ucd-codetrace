export var privacyAndEndingHTML = `

<p style="margin-top: 30px;"><b>About this site:</b> CodeTrace at UC Davis is a
free tool for UC Davis courses. It's offered as is, so please don't paste
anything private into it, and when you use it on assignments, follow your
course's academic integrity policy. Enjoy exploring how your code runs!</p>

<p style="margin-top: 25px;">CodeTrace is an independent fork of
<a href="https://pythontutor.com">Python Tutor</a>, the open-source project
created by <a href="http://www.pgbovine.net/">Philip Guo</a>, used under the
<a href="https://github.com/kstevensgrp/ucd-codetrace/blob/main/LICENSE.txt">MIT License</a>.
Thank you, Philip. Original code &copy; Philip Guo; updates &copy; 2026
K. A. Stevens, UC Davis.</p>`;


export var footerHtml = `

<p>
  <button id="genUrlBtn" class="smallBtn" type="button">Generate permanent link</button> <input type="text" id="urlOutput" size="60"/>
</p>

<div id="embedLinkDiv">
<p>
  <button id="genEmbedBtn" class="smallBtn" type="button">Generate embed code</button> <input type="text" id="embedCodeOutput" size="60"/> (also supports https://)
</p>
</div>

<p style="margin-top: 25px;"><b>What it runs:</b> Python 3 (currently 3.12),
with the standard library modules students use most: __future__, abc, array, bisect,
calendar, cmath, collections, copy, csv, datetime, decimal, doctest, fractions, functools,
hashlib, heapq, io, itertools, json, locale, math, operator, pickle, pprint, random, re,
statistics, string, time, types, typing, unittest. Other imports aren't available, and
<code>open()</code> reads only the course data files listed under the editor when a
page is opened with a <code>#data=</code> link.</p>

` + privacyAndEndingHTML;


export var nullTraceErrorLst = [
  "Unknown error: The server is OVERLOADED or your code has UNSUPPORTED FEATURES.",
  "Try again later. This site is free with NO available technical support. [#NullTrace]"
];

export var unsupportedFeaturesStr = 'see <a target="_blank" href="https://github.com/kstevensgrp/ucd-codetrace/blob/main/unsupported-features.md">UNSUPPORTED FEATURES</a>';
