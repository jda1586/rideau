$(document).ready(function() {
	$('#Container').mixItUp();
    
    var elements = $('.zoomable-image');
	console.log(elements);
	if (elements.length) Intense(elements);
	
	$(document).mousemove(function(e) {
		var height;
		if (document.body) {
			height = (document.body.clientHeight);
		} else {
			height = (window.innerHeight);
		}
		
		/*  console.log(e.pageY - $(window).scrollTop()); */
		if ((e.pageY - $(window).scrollTop()) < 150 /*|| (e.pageY - $(window).scrollTop()) > (height - 60)*/ ) { //The bottom limit is commented, uncomment to enable that functionality
			$('header').removeClass("hidden");
			$('#r-logo').addClass("hidden");
			//$('footer').removeClass("hidden"); //No longer used, footer is always visible
		} else {
			$('header').addClass("hidden");
			$('#r-logo').removeClass("hidden");
			//$('footer').addClass("hidden"); //No longer used, footer is always visible
		}
	});
});