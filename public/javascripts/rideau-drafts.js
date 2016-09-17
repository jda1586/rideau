//This code is used in the application but is unmaintainable, abide with the coding standards and then move the content to a maintainable file.


//Owner: Renato
elements = {
"class":[
	"hide-for-small-only"
	]
}
var cont = 1,
cont2 = 2,
cont3 = 7,
a = $( '.b').children(),
x = $( a).children(),
cls = elements[ 'class'][ 0];

$( '.change' ).click( function(){
	
	for( i = 0; i <= x.length; i++){ //pass for every tr
		console.log( "adelante");
		var j = $( x[ i]).children( );
		
		m = j[ cont];
		$( m).addClass( cls);	 //add hide clss
		m = j[ cont2];
		$( m).removeClass( cls);  // add show clss  
	}
	cont++;
	cont2++;
	cont3++;
	if ( cont > 7 ){
		cont = 1;
	}
	if( cont2 > 7 ){
		cont2 = 1;
	}
	if( cont3 > 7 ){
		cont3 = 1;
	}
	console.log("cont  es: " +cont);
	console.log("cont3 es: " +cont3);
	console.log("cont2 es: " +cont2);

});

$( '.change-back' ).click( function(){
	console.log("atras");
	for( i = 0; i <= x.length; i++){ //pass for every tr
		var j = $( x[ i]).children( );
		m = j[ cont];
		$( m).addClass( cls); //add hide
		m = j[ cont3];
		$( m).removeClass( cls); //remove hide
	}
	cont--;
	cont2--;
	cont3--;
	
	if ( cont <= 0 ){
		cont = 7;
	}
	if ( cont2 <= 0 ){
		cont2 = 7;
	}
	if( cont3 <= 0 ){
		cont3 = 7;
	}
	console.log("cont  es: " +cont);
	console.log("cont3 es: " +cont3);
	console.log("cont2 es: " +cont2);
});
