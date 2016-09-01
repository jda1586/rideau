$(document).ready(function() {
	$('#Container').mixItUp();

	var elements = $('.zoomable-image');
	console.log(elements);
	if (elements.length) Intense(elements);
});