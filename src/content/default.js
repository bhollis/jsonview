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
    } else {
      target.style.display = 'none';
      
      var ellipsis = document.createElement('span');
      ellipsis.className = 'ellipsis';
      ellipsis.innerHTML = ' &hellip; ';
      target.parentNode.insertBefore(ellipsis, target);
    }
    
    collapser.innerHTML = ( collapser.innerHTML == '-' ) ? '+' : '-';
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
  
  var items = document.getElementsByClassName('collapsible');
  for( var i = 0; i < items.length; i++) {
    addCollapser(items[i].parentNode);
  }
}, false);
