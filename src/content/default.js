$(function() {
  $('li:has(.obj, .array)').prepend(
    $('<div/>')
      .addClass('collapser')
      .text('-').click(function() {
        var self = $(this);
        var target = self.nextAll('.obj, .array');
        target.toggle();
        
        if (!target.is(':visible')) {
          target.before($('<span/>').addClass('ellipsis').html(' &hellip; '));
        } else {
          self.parent().find('.ellipsis').remove();
        }
        self.text( self.text() == '-' ? '+' : '-');
      })
  );
});
