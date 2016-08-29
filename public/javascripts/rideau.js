$(document).ready(function() {
	$('#Container').mixItUp();
    
    var elements = document.querySelectorAll('.demo-image');
    Intense(elements);
	
	$(document).mousemove(function(e) {
		if (document.body) {
			var height = (document.body.clientHeight);
		} else {
			var height = (window.innerHeight);
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