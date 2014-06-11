// This used to use jQuery, but was rewritten in plan DOM for speed and to get rid of the jQuery dependency.
document.addEventListener('DOMContentLoaded', function() {
  "use strict";

  // Click handler for collapsing and expanding objects and arrays
  function collapse(evt) {
    var collapser = evt.target;

    var clickeds = document.querySelectorAll('.clicked');
    for(var i=0; i<clickeds.length; i++){
      clickeds[i].classList.toggle('clicked');
    }
    for(var node = collapser; node.parentNode; node = node.parentNode){
      if(node.classList){
        node.classList.toggle('clicked');
      } 
    }

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

  /*
   * Collapses the whole json using keyboard
   * TODO: Add a navigator support for each of the elements
   */
  function collapseAll(evt) {
    var inputList;

    if (evt.keyCode === 37) {  // Collapses the json on left arrow key up
      inputList = document.querySelectorAll('.collapsible, .collapser');
      for (var i = 0; i < inputList.length; i++) {
        if (inputList[i].parentNode.id != 'json') {
          inputList[i].classList.add('collapsed');
        }
      }
    } else if (evt.keyCode === 39) { // Expands the json on right arrow key up
      inputList = document.querySelectorAll('.collapsed');
      for (var i = 0; i < inputList.length; i++) {
        inputList[i].classList.remove('collapsed');
      }
    }
  }

  // collapse with event delegation
  document.addEventListener('click', collapse, false);
  document.addEventListener('keyup', collapseAll, false);
}, false);
