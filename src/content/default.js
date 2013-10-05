// This used to use jQuery, but was rewritten in plan DOM for speed and to get rid of the jQuery dependency.
document.addEventListener('DOMContentLoaded', function() {
  // Click handler for collapsing and expanding objects and arrays
  function collapse(evt) {
    var collapser = evt.target;
   
    var target = collapser.parentNode.getElementsByClassName('collapsible');
    
    if ( ! target.length ) {
      return;
    }
    
    target = target[0];

    if ( target.style.display == 'none' ) {
      var ellipsis = target.parentNode.getElementsByClassName('ellipsis')[0];
      target.parentNode.removeChild(ellipsis);
      target.style.display = '';
      collapser.innerHTML = '-';
    } else {
      target.style.display = 'none';
      
      var ellipsis = document.createElement('span');
      ellipsis.className = 'ellipsis';
      ellipsis.innerHTML = ' &hellip; ';
      target.parentNode.insertBefore(ellipsis, target);
      collapser.innerHTML = '+';
    }
  }
  
  function addCollapser(item) {
    // This mainly filters out the root object (which shouldn't be collapsible)
    if ( item.nodeName != 'LI' ) {
      return;
    }
    
    var collapser = document.createElement('div');
    collapser.className = 'collapser';
    collapser.innerHTML = '-';
    collapser.addEventListener('click', collapse, false);
    item.insertBefore(collapser, item.firstChild);
  }

  function hasClassName(ele,cls) {
    return ele.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)'));
  }

  function addClassName(ele,cls) {
    if (!hasClassName(ele,cls)) ele.className += " " + cls;
  }

  function removeClassName(ele,cls) {
    if (hasClassName(ele, cls)) {
        var reg = new RegExp('(\\s|^)' + cls + '(\\s|$)');
        ele.className = ele.className.replace(reg, ' ');
    }
  }
  function highlightBrackets(brack) {
    var toMatch = brack.className.split(" ");
    var brackData = {
        "direction": toMatch[0],
        "directionOpposite": ("left" == toMatch[0]) ? "right" : "left",
        "type": toMatch[1],
        "bracketID": brack.getAttribute('bracketid')
    };
    var toSearchQuery = "." + brackData.directionOpposite + "." + brackData.type + "[bracketid='" + brackData.bracketID + "']";
    console.log(toSearchQuery);
    var otherBrack = document.querySelector(toSearchQuery);
    if(hasClassName(brack, 'light')) {
      removeClassName(brack, 'light');
      removeClassName(otherBrack, 'light');
    } else {
      addClassName(brack, 'light');
      addClassName(otherBrack, 'light');
    }
  }
  var items = document.getElementsByClassName('collapsible');
  for( var i = 0; i < items.length; i++ ) {
    addCollapser(items[i].parentNode);
  }

  var left_sel = document.getElementsByClassName('left');
  var right_sel = document.getElementsByClassName('right');
  if( left_sel.length != right_sel.length ) console.log('There was an error while counting left & right brackets');
  else {
    var brackets_length = left_sel.length || right_sel.length;
    for( var i = 0; i < brackets_length; i++ ) {
        left_sel[i].addEventListener('click', function() {
            highlightBrackets(this);
        }, false);
        right_sel[i].addEventListener('click', function() {
            highlightBrackets(this);
        }, false);
    }
  }
}, false);
