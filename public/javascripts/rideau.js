$(document).ready(function() {
	$('#Container').mixItUp();

	var elements = $('.zoomable-image');
	if (elements.length) Intense(elements);
});