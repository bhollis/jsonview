// This used to use jQuery, but was rewritten in plan DOM for speed and to get rid of the jQuery dependency.
document.addEventListener('DOMContentLoaded', function() {
  "use strict";

  // Click handler for collapsing and expanding objects and arrays
  function collapse(evt) {
    var collapser = evt.target;

    while (collapser && (!collapser.classList || !collapser.classList.contains('collapser'))) {
      collapser = collapser.nextSibling;
    }
    if (!collapser || !collapser.classList || !collapser.classList.contains('collapser')) {
      return;
    }

    evt.stopPropagation();

    collapser.classList.toggle('collapsed');

    var collapsible = collapser;
    while (collapsible && (!collapsible.classList || !collapsible.classList.contains('collapsible'))) {
      collapsible = collapsible.nextSibling;
    }
    collapsible.classList.toggle('collapsed');
  }

  // collapse with event delegation
  document.addEventListener('click', collapse, false);
}, false);
