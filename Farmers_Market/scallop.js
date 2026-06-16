/*
 * scallop.js — draws the wavy scalloped border around the menu.
 *
 * Usage: include <script src="scallop.js"></script> on a page that has a
 * container with id="frame" (position: relative). The script injects its own
 * styles, creates an SVG layer inside that container, and redraws the border
 * to fit whenever the container changes size.
 *
 * Tweakables (see CONFIG below): border color, stroke thickness, bump size.
 */
(function () {
  "use strict";

  var CONFIG = {
    frameSelector: "#frame",   // container the border wraps
    contentSelector: ".menu",  // element whose padding sets the border inset
    color: "var(--green, #456D31)",
    strokeMin: 7,  strokeMax: 11,  strokeScale: 0.0135, // thickness vs. width
    bumpMin: 13,   bumpMax: 22,    bumpScale: 0.42       // scallop radius vs. padding
  };

  // Inject the styling the border layer needs.
  var style = document.createElement("style");
  style.textContent =
    ".scallop{position:absolute;inset:0;width:100%;height:100%;" +
    "overflow:visible;pointer-events:none;z-index:0;}" +
    ".scallop path{fill:none;stroke:" + CONFIG.color +
    ";stroke-linecap:round;stroke-linejoin:round;}";
  document.head.appendChild(style);

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function buildPath(W, H, m, r) {
    var xL = m, xR = W - m, yT = m, yB = H - m;
    var wE = xR - xL, hE = yB - yT;
    var nH = Math.max(2, Math.round(wE / (2 * r)));
    var nV = Math.max(2, Math.round(hE / (2 * r)));
    var raH = wE / (2 * nH), raV = hE / (2 * nV);
    var d = "M " + xL + " " + yT, k;
    // top: left -> right
    for (k = 0; k < nH; k++) d += " A " + raH + " " + raH + " 0 0 1 " + (xL + raH * 2 * (k + 1)) + " " + yT;
    // right: top -> bottom
    for (k = 0; k < nV; k++) d += " A " + raV + " " + raV + " 0 0 1 " + xR + " " + (yT + raV * 2 * (k + 1));
    // bottom: right -> left
    for (k = 0; k < nH; k++) d += " A " + raH + " " + raH + " 0 0 1 " + (xR - raH * 2 * (k + 1)) + " " + yB;
    // left: bottom -> top
    for (k = 0; k < nV; k++) d += " A " + raV + " " + raV + " 0 0 1 " + xL + " " + (yB - raV * 2 * (k + 1));
    return d + " Z";
  }

  function init() {
    var frame = document.querySelector(CONFIG.frameSelector);
    if (!frame) return;
    var content = frame.querySelector(CONFIG.contentSelector) || frame;

    // Create the SVG layer once, as the first child of the frame.
    var NS = "http://www.w3.org/2000/svg";
    var svg = frame.querySelector("svg.scallop");
    if (!svg) {
      svg = document.createElementNS(NS, "svg");
      svg.setAttribute("class", "scallop");
      svg.setAttribute("preserveAspectRatio", "none");
      svg.appendChild(document.createElementNS(NS, "path"));
      frame.insertBefore(svg, frame.firstChild);
    }
    var path = svg.querySelector("path");

    function draw() {
      var W = frame.clientWidth, H = frame.clientHeight;
      if (!W || !H) return;
      var P  = parseFloat(getComputedStyle(content).paddingLeft) || 40;
      var sw = clamp(W * CONFIG.strokeScale, CONFIG.strokeMin, CONFIG.strokeMax);
      var r  = clamp(P * CONFIG.bumpScale,   CONFIG.bumpMin,   CONFIG.bumpMax);
      var m  = r + sw / 2 + 3;
      svg.setAttribute("viewBox", "0 0 " + W + " " + H);
      path.setAttribute("d", buildPath(W, H, m, r));
      path.setAttribute("stroke-width", sw);
    }

    if ("ResizeObserver" in window) new ResizeObserver(draw).observe(frame);
    window.addEventListener("resize", draw);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
    draw();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
