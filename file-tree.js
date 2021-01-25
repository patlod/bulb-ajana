$('.ui.accordion').accordion({ exclusive: false });
$('.ui.buttons .button').on('click', function() {
  $(this).addClass('positive')
         .siblings()
         .removeClass('positive');
  $('.treemenu').toggleClass('boxed');
});