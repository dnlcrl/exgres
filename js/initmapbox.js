var ge;

var app = {};

//this timer is used when toggling layers after a map style change
app.styleTimer = null;

styles = {
	'satellite': "mapbox://styles/dnlcrl/ciy5oqecp00472sqitnohq0rw",
	'hybrid': "mapbox://styles/dnlcrl/ciyjcpzmb00282spbin9wnwge",
	'outdoors': "mapbox://styles/dnlcrl/ciya6ykcx006x2sqea5852xc2",
	'light': "mapbox://styles/dnlcrl/ciy5r55xv004r2slsthz09mh7",
	'dark': "mapbox://styles/dnlcrl/ciy5rbyyh004i2sofxd7ka19s",
}

styleToLabelLayer = {
	'hybrid': 'waterway-label',
	'satellite': undefined,
	'light': 'water',
	'dark': 'waterway-label',
	'outdoors': 'poi-outdoor-features',

}

app.currentStyle = 'hybrid';
app.stylechanged = undefined;
app.center = [9.659, 45.676];

Number.prototype.toFixedDown = function(digits) {
    var re = new RegExp("(\\d+\\.\\d{" + digits + "})(\\d)"),
        m = this.toString().match(re);
    return m ? parseFloat(m[1]) : this.valueOf();
};

centers = {'sondrio': [ 9.878767, 46.169858 ],
			'lodi': [ 9.5037159, 45.3097228 ] ,
			'cremona':[ 10.022651, 45.133249 ], 
			'milano':[ 9.185924, 45.465422 ],
			'mantova': [ 10.791375, 45.156417 ], 
			'bergamo':[ 9.67727, 45.698264 ],
			'lecco':[ 9.39767, 45.85657 ] ,
			'pavia':[ 9.158207, 45.184725 ] ,
			'monza':[ 9.274449, 45.5845 ] ,
			'brescia':[ 10.211802, 45.541553 ],
			'como':[ 9.085176, 45.80806 ] ,
			'varese': [ 8.825058, 45.820599 ] };


app.currentGeojsonObjects = { 
};
    
//var ge_strade = false;
//var ge_abitati = true;

// google.load("earth", "1");
var bounds = [
    [8.55666,44.738], // Southwest coordinates
    [11.3539,46.5386]  // Northeast coordinates
];

function init() {
	mapboxgl.accessToken = 'pk.eyJ1IjoiZG5sY3JsIiwiYSI6ImNpc3ZpeXpuYzAwMGcydG1uZnYwcjF6a20ifQ.haWicjVXwzcXqRMj3kdYMg';
	var map = new mapboxgl.Map({
		// attributionControl: false,
	    container: 'map3d', // container id
	    style: styles [app.currentStyle], //stylesheet location
	    center:  app.center, //[9.856441382762, 45.10320555826568], // starting position
	    zoom: 13, //9 // starting zoom
	    pitch: 60,
    	maxBounds: bounds // Sets bounds as max

    });
    setTimeout(function() {
      document.getElementById("coordinate").innerHTML = "9.68963, 45.70565";
    }, 10);


    app.map = map;
    map.on('mousemove', function (e) {
	    setTimeout(function() {
	      // alert(text);
	      var text = e.lngLat['lat'].toFixedDown(5) + ", " + e.lngLat['lng'].toFixedDown(5);

	      var divcoordinate = document.getElementById("coordinate");
	      divcoordinate.innerHTML = text;
	    }, 10);
	});

	// map.addControl(new mapboxgl.AttributionControl(), 'bottom-right');
	// document.getElementsByClassName('mapboxgl-ctrl-attrib')[0].innerHTML = '<a href="https://github.com/dnlcrl" target="_blank">© dnlcrl</a> ' + document.getElementsByClassName('mapboxgl-ctrl-attrib')[0].innerHTML

   	

	// When a click event occurs near a place, open a popup at the location of
	// the feature, with description HTML from its properties.
	app.map.on('click', function (e) {
	    if(app.popup){
	        app.popup._closeButton.click()
	    }
	    var features = map.queryRenderedFeatures(e.point, { layers: Object.keys( app.currentGeojsonObjects )});

	    if (!features.length) {
	        return;
	    }

	    feature = undefined;
	    for (var i = features.length - 1; i >= 0; i--) {
	    	if (features[i].properties.description !== undefined){
	    		feature = features[i];
	    		break;
	    	}
	    }

	    // var feature = features[features.length - 1];

	    // Populate the popup and set its coordinates
	    // based on the feature found.
	    n = feature.properties.name || feature.properties.Name || ''

	    d = feature.properties.description
	    if (d == 'null' && n == 'null') {return}
	    if (d == 'null') {d = ''}

	    app.popup = new mapboxgl.Popup()
	        .setLngLat(e.lngLat)
	        .setHTML('<div class="popup-title"><center><h4>' + n + '</h4></ center></div><div>' + d + '</div>')
	        .addTo(map);
	});

	// Use the same approach as above to indicate that the symbols are clickable
	// by changing the cursor style to 'pointer'.
	app.map.on('mousemove', function (e) {
	    var features = map.queryRenderedFeatures(e.point, { layers: Object.keys(app.currentGeojsonObjects) });
	    try{map.getCanvas().style.cursor = (features.length) ? 'pointer' : '';}
	    catch(e){map.getCanvas().style.cursor = '';}

	});

	map.on('load', function() {
		hide_corpi_santi();
		hide_idro();
		hide_designators();
		loadAnalisiLayer();
		loadInterventoLayer();
		//loadChieseLayer();
		//loadverdeLayers();
		//loadmobyLayers();
	});

	map.on("render", function() {
	  if(map.loaded()) {
	    stopspinner();
	  }
	});

	map.on("dataloading", function(){
		startspinner();
	});

	map.addControl(new mapboxgl.NavigationControl());
}

function startspinner(){
	if (app.spinner) {return}
	var opts = {
	 lines: 13 // The number of lines to draw
	, length: 28 // The length of each line
	, width: 14 // The line thickness
	, radius: 42 // The radius of the inner circle
	, scale: 0.15 // Scales overall size of the spinner
	, corners: 1 // Corner roundness (0..1)
	, color: '#000' // #rgb or #rrggbb or array of colors
	, opacity: 0.25 // Opacity of the lines
	, rotate: 0 // The rotation offset
	, direction: 1 // 1: clockwise, -1: counterclockwise
	, speed: 1 // Rounds per second
	, trail: 60 // Afterglow percentage
	, fps: 20 // Frames per second when using setTimeout() as a fallback for CSS
	, zIndex: 2e9 // The z-index (defaults to 2000000000)
	, className: 'spinner' // The CSS class to assign to the spinner
	, top: '3vh' // Top position relative to parent
	, left: '3vh' // Left position relative to parent
	, shadow: false // Whether to render a shadow
	, hwaccel: false // Whether to use hardware acceleration
	, position: 'relative' // Element positioning
	}
	var target = document.getElementsByClassName('mapboxgl-ctrl-top-left')[0];
	var spinner = new Spinner(opts).spin(target);
	app.spinner = spinner;
}

function stopspinner(){
	if (! app.spinner) {return}
	var parent = document.getElementsByClassName('mapboxgl-ctrl-top-left')[0];
	var child = document.getElementsByClassName("spinner")[0];
	parent.removeChild(child);
	app.spinner = undefined;	
}
function hideChieseLayer(){
	app.map.setLayoutProperty('bergamo_corpi_santi', 'visibility', 'none');

}
function hide_corpi_santi(){
	app.map.setLayoutProperty('bergamo-corpi-santi', 'visibility', 'none');

}
function hide_designators(){
	app.map.setLayoutProperty('bergamo-area-exgres-edprogettol', 'visibility', 'none');
}

function show_designators(){
	app.map.setLayoutProperty('bergamo-area-exgres-edprogettol', 'visibility', 'visible');
}

function showChieseLayer(){
	app.map.setLayoutProperty('bergamo_corpi_santi', 'visibility', 'visible');
}
function show_corpi_santi(){
	app.map.setLayoutProperty('bergamo-corpi-santi', 'visibility', 'visible');

}



function showIdroLayer(){

	for (var i = 4; i >= 1; i--)
		app.map.setLayoutProperty('idro' + i.toString(), 'visibility', 'visible');
}
function hide_idro(){
	for (var i = 4; i >= 1; i--)
		app.map.setLayoutProperty('idro' + i.toString(), 'visibility', 'none');
}

function showMobyLayer(){

    files = ['1-atb-fermate-bus', 
    		 '2-atb-fermate-bus', 
    		 '21-stazioni', 
    		 '4-layer1', 
    		 '5-evay', 
    		 '6-layer2', 
    		 '7-atb1', 
    		 '8-atb10', 
    		 '9-atb11', 
    		 '10-atb2', 
    		 '11-atb21', 
    		 '12-atb28', 
    		 '13-atb3', 
    		 '14-atb5', 
    		 '15-atb6', 
    		 '16-atb7', 
    		 '17-atb8', 
    		 '18-atb9', 
    		 '19-ciclabili', 
    		 '20-ferrovia'];
	for (var i = files.length - 1; i >= 0; i--) {
        name = 'moby' + files[i];
		app.map.setLayoutProperty(name, 'visibility', 'visible');
	}
}
function hideMobyLayer(){
    files = ['1-atb-fermate-bus', 
    		 '2-atb-fermate-bus', 
    		 '21-stazioni', 
    		 '4-layer1', 
    		 '5-evay', 
    		 '6-layer2', 
    		 '7-atb1', 
    		 '8-atb10', 
    		 '9-atb11', 
    		 '10-atb2', 
    		 '11-atb21', 
    		 '12-atb28', 
    		 '13-atb3', 
    		 '14-atb5', 
    		 '15-atb6', 
    		 '16-atb7', 
    		 '17-atb8', 
    		 '18-atb9', 
    		 '19-ciclabili', 
    		 '20-ferrovia'];
	for (var i = files.length - 1; i >= 0; i--) {
        name = 'moby' + files[i];
		app.map.setLayoutProperty(name, 'visibility', 'none');
	}
}

function showVerdeLayer(){

	for (var i = 5; i >= 1; i--)
		app.map.setLayoutProperty('verde' + i.toString(), 'visibility', 'visible');
}
function hide_verde(){
	for (var i = 5; i >= 1; i--)
		app.map.setLayoutProperty('verde' + i.toString(), 'visibility', 'none');
}

function toggleEdifici(file) {
	map = app.map;
	var GeojsonCheckbox = document.getElementById('geojson-bergamo_buildings-check');
	if (GeojsonCheckbox.checked && !app.currentGeojsonObjects['buildings0']){
		loadEdifici();
	}
	else{
		for (var fnum = 0; fnum < 6; fnum++) {
	    	var clickedLayer = 'buildings' + fnum.toString()
	    	var visibility = map.getLayoutProperty(clickedLayer, "visibility");

		    if (visibility !== 'none') {
		        map.setLayoutProperty(clickedLayer, 'visibility', 'none');
		        this.className = '';
		    } else {
		        this.className = 'active';
		        map.setLayoutProperty(clickedLayer, 'visibility', 'visible');

		    }
	    }
	}
}

function toggleGeojson(file) {
	if (file.search('buildings') > -1) {
		toggleEdifici(file);
		return;
	}

	var GeojsonCheckbox = document.getElementById('Geojson-' + file + '-check');

	if (file.includes('verde')) {
		file = 'verde1'
	}
	if (file.includes('moby')) {
		file = 'moby1-atb-fermate-bus'
	}
	if (GeojsonCheckbox.checked && !app.currentGeojsonObjects[file])
		loadGeojson(file);
	else{
		toggleLayer(file);	
	}
}

function loadExGresLabelLayer(){
	map = app.map
	file = 'bergamo_area_exgres_edprogettol'
	path = 'geojson/' + file + '.geojson';
	if (app.currentGeojsonObjects[file] == true){
		return
	}
	map.addSource(file, {
	    'type': 'geojson',
	    'data': path
	});

		
	map.addLayer({
        'id': file,
        'type': 'symbol',
        "layout": {
            // "icon-image": symbol + "-15",
            "icon-allow-overlap": true,
            "text-field": '{name}',
            "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
            "text-size": 11,
            "text-transform": "uppercase"

            // "text-letter-spacing": 0.05,
            // "text-offset": [0, 1.5]
                },

        'source': file
	});

	app.currentGeojsonObjects[file] = true;
}

function loadverdeLayers(){
	map = app.map
	file = 'verde'
	colors = ["#448800", "#448800", "#448800", "#94DC6D", "#005600"];
	types = ["fill", "fill", "fill", "fill", "fill"];
	opacities = [1,1,1, 0.5,0.5];
	for (var i = 5; i >= 1; i--) {
		//Things[i]
		path = 'https://unibg-gislab.github.io/datasets/masterplan_exgres/' + file + i.toString() + '.geojson';

		map.addSource( file + i.toString(), {
		    'type': 'geojson',
		    'data': path
		});

		map.addLayer({
	        'id': file + i.toString(),
	        'type': types[i-1],
	        "paint": {
	        	"fill-color": colors[i-1],
	        	"fill-opacity": opacities[i-1],
	            // "icon-image": symbol + "-15",
	            //"icon-allow-overlap": true,
	            // "text-field": '{name}',
	            // "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
	            // "text-size": 11,
	            // "text-transform": "uppercase",
	            // "text-offset": [0, 0.6],
	            // "text-anchor": "top",
	            //"icon-image": "religious-christian-15",

	            // "text-letter-spacing": 0.05,
	            // "text-offset": [0, 1.5]
	                },

	        'source': file + i.toString()
		}, 'idro1');
		app.currentGeojsonObjects[file + i.toString()] = true;
	}

	
}

function loadmobyLayers(){
	map = app.map
    files = ['1-atb-fermate-bus', 
    		 '2-atb-fermate-bus', 
    		 '21-stazioni', 
    		 '4-layer1', 
    		 '5-evay', 
    		 '6-layer2', 
    		 '7-atb1', 
    		 '8-atb10', 
    		 '9-atb11', 
    		 '10-atb2', 
    		 '11-atb21', 
    		 '12-atb28', 
    		 '13-atb3', 
    		 '14-atb5', 
    		 '15-atb6', 
    		 '16-atb7', 
    		 '17-atb8', 
    		 '18-atb9', 
    		 '19-ciclabili', 
    		 '20-ferrovia'];

	//colors = ["#448800", "#448800", "#448800", "#94DC6D", "#005600"]//;
    types = ["symbol",
    		 "symbol",
    		 "symbol", 
    		 "line", 
    		 "symbol",  
    		 "line",
    		 "line",  
    		 "line",
    		 "line",  
    		 "line",
    		 "line",  
    		 "line",
    		 "line",  
    		 "line",
    		 "line",  
    		 "line",
    		 "line",  
    		 "line",
    		 "line", 
    		 "line" ];

    layouts = [
    {
    	"icon-image": "bus-15",
    	//"icon-allow-overlap": true
    },
    {
    	"icon-image": "bus-15",
    	//"icon-allow-overlap": true
    },
    {
    	"icon-image": "bicycle-share-15"
    },
    {
    	
    },
    {
    	"icon-image": "car-15",
    	//"icon-allow-overlap": true
    },
    {

    }, {}, {},  {}, {},  {}, {}, {}, {}, {}, {}, {}, { }, { },
    {
    	
    }]

    paints = [ { }, { }, { },
    {
    	"line-color": "#00FF7F",
    	"line-width": 2
    	
    }, { },
    {
    	"line-color": "#00FF7F",
    	"line-width": 2

    },
    {
    	"line-color": "#00AAFF",
    	"line-width": 2
    },
    {
    	"line-color": "#00AAFF",
    	"line-width": 2
    },
    {
    	"line-color": "#00AAFF",
    	"line-width": 2
    },
    {
    	"line-color": "#00AAFF",
    	"line-width": 2
    },
    {
    	"line-color": "#00AAFF",
    	"line-width": 2
    },
    {
    	"line-color": "#00AAFF",
    	"line-width": 2
    },
    {
    	"line-color": "#00AAFF",
    	"line-width": 2
    },
    {
    	"line-color": "#00AAFF",
    	"line-width": 2
    },
    {
    	"line-color": "#00AAFF",
    	"line-width": 2
    },
    {
    	"line-color": "#00AAFF",
    	"line-width": 2
    },
    {
    	"line-color": "#00AAFF",
    	"line-width": 2
    },
    {
    	"line-color": "#00AAFF",
    	"line-width": 2
    },
    {
    	"line-color": "#005500",
    	"line-width": 2
    }, 
    { 
    	"line-color": "#000",
    	"line-width": 5
    } ]
    		

	opacities = [1,1,1, 0.5,0.5];

	for (var i = files.length - 1; i >= 0; i--) {
        name = 'moby' + files[i];
		path = 'https://unibg-gislab.github.io/datasets/masterplan_exgres/' + name + '.geojson';

		map.addSource(name, {
		    'type': 'geojson',
		    'data': path
		});

		map.addLayer({
	        'id': name,
	        'type': types[i],
	        "paint": paints[i],
	        "layout": layouts[i],//{
	        	//"fill-color": colors[i-1],
	        	//"fill-opacity": opacities[i-1],
	            // "icon-image": symbol + "-15",
	            //"icon-allow-overlap": true,
	            // "text-field": '{name}',
	            // "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
	            // "text-size": 11,
	            // "text-transform": "uppercase",
	            // "text-offset": [0, 0.6],
	            // "text-anchor": "top",
	            //"icon-image": "religious-christian-15",

	            // "text-letter-spacing": 0.05,
	            // "text-offset": [0, 1.5]
	                //},

	        'source': name
		});
		app.currentGeojsonObjects[name] = true;
	}
}

function loadERPLayer(){
	map = app.map
	file = 'bergamo_ERP'
	path = 'https://unibg-gislab.github.io/datasets/masterplan_exgres/' + file + '.geojson';

	map.addSource(file, {
    'type': 'geojson',
    'data': path
	});

	
	map.addLayer({
        'id': file,
        'type': 'fill-extrusion',
        'source': file,
        'paint': {
            // See the Mapbox Style Spec for details on property functions
            // https://www.mapbox.com/mapbox-gl-style-spec/#types-function
            'fill-extrusion-color': {
                // Get the fill-color from the source 'color' property.
                'property': 'color',
                'type': 'identity'
            },
            'fill-extrusion-height': {
                // Get fill-extrude-height from the source 'height' property.
                'property': 'height',
                'type': 'identity'
            },
            'fill-extrusion-base': {
                // Get fill-extrude-base from the source 'base_height' property.
                'property': 'base_height',
                'type': 'identity'
            },
            // Make extrusions slightly opaque for see through indoor walls.
	            'fill-extrusion-opacity': 1
	    }
	});

	app.currentGeojsonObjects[file] = true;
}


function loadChieseLayer(){
	map = app.map
	file = 'bergamo_corpi_santi'
	path = 'https://unibg-gislab.github.io/datasets/masterplan_exgres/' + file + '.geojson';

	map.addSource(file, {
	    'type': 'geojson',
	    'data': path
	});

		
	map.addLayer({
        'id': file,
        'type': 'symbol',
        "layout": {
            // "icon-image": symbol + "-15",
            "icon-allow-overlap": true,
            // "text-field": '{name}',
            // "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
            // "text-size": 11,
            // "text-transform": "uppercase",
            // "text-offset": [0, 0.6],
            // "text-anchor": "top",
            "icon-image": "religious-christian-15",

            // "text-letter-spacing": 0.05,
            // "text-offset": [0, 1.5]
                },

        'source': file
	});

	app.currentGeojsonObjects[file] = true;
}

function loadAnalisiLayer(){
	map = app.map
	file = 'analisi'
	path = 'https://unibg-gislab.github.io/datasets/masterplan_exgres/' + file + '.geojson';
	if (app.currentGeojsonObjects[file] == true){
		return
	}
	map.addSource(file, {
	    'type': 'geojson',
	    'data': path
	});

		
	map.addLayer({
        'id': file + 'h',
        'type': 'symbol',
        "layout": {
            // "icon-image": symbol + "-15",
            "icon-allow-overlap": true,
            // "text-field": '{name}',
            // "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
            // "text-size": 11,
            // "text-transform": "uppercase",
            // "text-offset": [0, 0.6],
            // "text-anchor": "top",
            "icon-image": "information-15",

            // "text-letter-spacing": 0.05,
            // "text-offset": [0, 1.5]
                },

        'source': file
	});

	app.currentGeojsonObjects[file] = true;
}

function loadInterventoLayer(){
	map = app.map
	file = 'intervento'
	path = 'https://unibg-gislab.github.io/datasets/masterplan_exgres/' + file + '.geojson';
	if (app.currentGeojsonObjects[file] == true){
		return
	}
	map.addSource(file, {
	    'type': 'geojson',
	    'data': path
	});

		
	map.addLayer({
        'id': file + 'h',
        'type': 'symbol',
        "layout": {
            // "icon-image": symbol + "-15",
            "icon-allow-overlap": true,
            // "text-field": '{name}',
            // "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
            // "text-size": 11,
            // "text-transform": "uppercase",
            // "text-offset": [0, 0.6],
            // "text-anchor": "top",
            "icon-image": "information-15",

            // "text-letter-spacing": 0.05,
            // "text-offset": [0, 1.5]
                },

        'source': file
	});

	app.currentGeojsonObjects[file] = true;
}



function loadGeojson(file) {

	var path = '';
	if (file.includes('exgres')) {
		path = 'https://unibg-gislab.github.io/datasets/masterplan_exgres/' + file + '.geojson'
		if (file.includes('progetto')) {
			show_designators();	
		}
	}
	else if (file.includes('dismesso') || file.includes('obsoleto'))
	{
		path = 'https://unibg-gislab.github.io/datasets/obsoleto_dismesso_3D/' + file + '.geojson'; 
		// try{
		// 	//flyTo(centers[file.split('_')[0]]);
		// }
		// catch(err)
		// 	{}
	}
	else{
		if (file.includes('corpi_santi')) {
			show_corpi_santi()
			loadChieseLayer()
			return
		}
		if (file.includes('idro')) {
			showIdroLayer()
			return
		}
		if (file.includes('ERP')) {
			loadERPLayer()
			return
		}
		if (file.includes('verde')) {
			loadverdeLayers();
			return
		}
		if (file.includes('moby')) {
			loadmobyLayers();
			return
		}
	}
	map = app.map;
	if (!linkCheck(path)){
		alert('Work In Progress!\nGoogle ha terminato il supporto alle API di Google Earth, stiamo lavorando per rendere la piattaforma nuovamente funzionante quanto prima.')
		document.getElementById('Geojson-' + file + '-check').checked = '';
		return
	}

	map.addSource(file, {
    'type': 'geojson',
    'data': path
	});

	
	map.addLayer({
        'id': file,
        'type': 'fill-extrusion',
        'source': file,
        'paint': {
            // See the Mapbox Style Spec for details on property functions
            // https://www.mapbox.com/mapbox-gl-style-spec/#types-function
            'fill-extrusion-color': {
                // Get the fill-color from the source 'color' property.
                'property': 'color',
                'type': 'identity'
            },
            'fill-extrusion-height': {
                // Get fill-extrude-height from the source 'height' property.
                'property': 'height',
                'type': 'identity'
            },
            'fill-extrusion-base': {
                // Get fill-extrude-base from the source 'base_height' property.
                'property': 'base_height',
                'type': 'identity'
            },
            // Make extrusions slightly opaque for see through indoor walls.
	            'fill-extrusion-opacity': 1
	    }
	}, 'intervento');

	app.currentGeojsonObjects[file] = true;
}

function toggleLayer(file){
	map = app.map;
    var clickedLayer = file
    if (file.includes('idro')) {
    	file = 'idro1'
    }
    if (file.includes('verde')) {
    	file = 'verde1'
    }
    if (file.includes('moby')) {
    	file = 'moby1-atb-fermate-bus'
    }
    var visibility = map.getLayoutProperty(file, "visibility");

    if (visibility !== 'none') {

    	if (file.includes('corpi_santi')) {
    		hide_corpi_santi()
    		hideChieseLayer()
    		return
    	}
    	if (file.includes('idro')) {
    		hide_idro()
    		return
    	}
    	if (file.includes('verde')) {
    		hide_verde()
    		return
    	}
	    if (file.includes('moby')) {
	    	hideMobyLayer()
	    	return;
	    }

    	if (file.includes('exgres')&& file.includes('progetto')) {
			hide_designators();
		}
        map.setLayoutProperty(file, 'visibility', 'none');
        this.className = '';
    } else {
    	if (file.includes('corpi_santi')) {
    		show_corpi_santi()
    		showChieseLayer()
    		return
    	}
    	if (file.includes('idro')) {
    		showIdroLayer()
    		return
    	}
    	if (file.includes('verde')) {
    		showVerdeLayer()
    		return
    	}
	    if (file.includes('moby')) {
	    	showMobyLayer()
	    	return;
	    }

    	if (file.includes('exgres') && file.includes('progetto')) {
			show_designators();
		}
        this.className = 'active';
        map.setLayoutProperty(file, 'visibility', 'visible');

	    //flyTo(centers[file.split('_')[0]]);
    }

}

function linkCheck(url)
{
    var http = new XMLHttpRequest();
    http.open('HEAD', url);
    http.send();
    return http.status!=404;
}

function flyTo(coordinates){
	if(app.stylechanged){
		return
	}
    if(app.popup){
        app.popup._closeButton.click()
    }
	app.map.flyTo({
        center: coordinates,
        zoom: 13, //9 // starting zoom
	    pitch: 60,
	    bearing: 0
    });
}

function toggleStrade() {
	sat = "mapbox://styles/dnlcrl/ciy5oqecp00472sqitnohq0rw"

// else

}

function startStyleTimer(){
	app.styleTimer = setInterval(addCheckedLayers, 500);
}

// function addCheckedLayers(){
// 	var l = app.map.style.getLayer("confini-comunali");
// 	if (l !== undefined && app.map != undefined) {
// 			clearInterval(app.styleTimer);
// 			toggleConfini();
// 			// addBuildings();
// 			for (var file in app.layersToRecover){
// 				if (!file.includes('buildings') || file.includes('0')) {
// 					toggleGeojson(file);
// 				}

// 			}
// 			app.stylechanged = undefined
// 	}
// }

function toggleConfini() {

	map = app.map
	var l = map.style.getLayer("confini-comunali");

	if (!document.getElementById('confini_comunali-check').checked) {
		l.layout.visibility = "none"
	}
	else{
	l.layout.visibility = "visible"
	}
	map._render();
}// JavaScript Document


// var layerList = document.getElementById('menustyle');
// var inputs = layerList.getElementsByTagName('input');

// function switchLayer(layer) {
//     var layerId = layer.target.id;
//     app.map.setStyle(styles[layerId]);
//     // 'mapbox://styles/mapbox/' + layerId + '-v9');
    
//     app.styleTimer = setInterval(addCheckedLayers, 500);
//     app.layersToRecover = app.currentGeojsonObjects 
//     app.currentGeojsonObjects = {}
//     app.currentStyle = layerId
//     app.stylechanged = true
// }

// for (var i = 0; i < inputs.length; i++) {
//     inputs[i].onclick = switchLayer;
// }

