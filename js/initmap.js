var nuovo = [];
var mappa;
var localita = [];

function initmap() {
 localita[0] = new google.maps.LatLng(45.669571, 9.703631); //BERGAMO
 localita[1] = new google.maps.LatLng(49.4295387,2.0807123); //BEAUVAIS
 localita[2] = new google.maps.LatLng(52.207890, 0.121704); //CAMBRIDGE
 localita[3] = new google.maps.LatLng(50.410684, 4.443403); //CHARLEROI
 localita[4] = new google.maps.LatLng(41.9794005,2.8214264); //GIRONA
 localita[5] = new google.maps.LatLng(53.8654673,10.6865593); //LUBECCA
 localita[6] = new google.maps.LatLng(43.4623057,-3.8099803); //SANTANDER

	
	var styles = [
		{
		"stylers":[{ "invert_lightness": false }] 
		}
	];
	
	var myOptions = {
		zoom: 4,
		scrollwheel: false,
		center: localita[1],
		mapTypeId: google.maps.MapTypeId.SATELLITE,
		disableDefaultUI: false,
		panControl: true,
		zoomControl: true,
		mapTypeControl: false,
		scaleControl: true,
		streetViewControl: true,
		overviewMapControl: true,
		styles: styles
		};
		
		mappa = new google.maps.Map(document.getElementById('mapcanvas'), myOptions);
	  
	for( var i = 0, n = localita.length; i < n; ++i ){
		this["marker"+i] = new google.maps.Marker({   
			position: localita[i],
			map: mappa,
			title: "marker"+i,
			icon: '/pins/green_'+i+'.png',
		});
            google.maps.event.addListener(this["marker"+i], 'click', function() { 
               //alert("Mi chiamo " + this.title); 
                 $getdata = jQuery('div.contentswitch[data-clone="'+this.title+'"]');
                jQuery("#getswitch").empty().html($getdata.html());
                jQuery("#video-switch").attr("src","//www.youtube.com/embed/"+$getdata.attr("data-tube"));
            }); 
	} 
}