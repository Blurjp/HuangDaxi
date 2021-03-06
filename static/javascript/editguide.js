  var rendererOptions = {
              draggable: true,
              suppressMarkers: true
                          };
  var clickerPixel;

  var directionsDisplay = new google.maps.DirectionsRenderer(rendererOptions);
  var directionsService = new google.maps.DirectionsService();
  var map;
  var start;
  var end;
  var dragStartPos;
  
// map zoom and center  
  var mapZoom;
  var mapCenter;
  
//  polyline and marker store 
  var polylineGroup = [];
  var startMarkerGroup = [];
  var endMarkerGroup = [];
  var polylineMarkerGroup = [];
  var markerGroup = [];
  var wayptsMarkerGroup = [];
  
  var waypts = [];
  var infoWindow;
  var clickedOverlay;
  var markerMenuDiv;
  var markerMenu;
  var polylineMenuDiv;
  var polylineMenu;
  var mapDiv;
  var geocoder;
  var polyline;
  
  var createMarkerFlag = true;
  var selectedMarker;
  var selectedPolyline;
  
  var routeBounds = new google.maps.LatLngBounds();
  
  
  function initialize() {
    geocoder = new google.maps.Geocoder();
	var polyOptions = {
    strokeColor: '#000000',
    strokeOpacity: 1.0,
    strokeWeight: 3
    }
    polyline = new google.maps.Polyline(polyOptions);
	var _center = new google.maps.LatLng(34.3664951, -89.5192484);

    var myOptions = {
      zoom: 6,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      center: _center
    }
     map = new google.maps.Map(document.getElementById("map-canvas"), myOptions);
     directionsDisplay.setMap(map);
     infoWindow = new google.maps.InfoWindow();
     clickedOverlay = new google.maps.OverlayView();
     clickedOverlay.draw = function(){};
     clickedOverlay.setMap(map);


   // === create the context menu div ===           
    markerMenuDiv = document.createElement("div");
    
    markerMenuDiv.index = 1;               
    google.maps.event.addListener(map,"click",function(event) {    
    
      createMarker('normal',event.latLng);
                });   
                
    google.maps.event.addListener(map,"rightclick",function(event) {    
    markerMenuDiv.style.visibility = "hidden";
    // polylineMenuDiv.style.visibility = "hidden";
                });   
                
                
  // Create the DIV to hold the control and call the HomeControl() constructor
  // passing in this DIV.
  var markerControlDiv = document.createElement('DIV');
  var markerControl = new MarkerControl(markerControlDiv);

  markerControlDiv.index = 1;
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(markerControlDiv);   
  
    var homeControlDiv = document.createElement('DIV');
  var homeControl = new HomeControl(homeControlDiv);

  homeControlDiv.index = 2;
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(homeControlDiv);          
  SetSights();                                
  }
 

  
  /**
 * The HomeControl adds a control to the map that simply
 * returns the user to Chicago. This constructor takes
 * the control DIV as an argument.
 */

function MarkerControl(controlDiv) {

  // Set CSS styles for the DIV containing the control
  // Setting padding to 5 px will offset the control
  // from the edge of the map
  controlDiv.style.padding = '5px';

var oImg=document.createElement("img");
oImg.style.paddingLeft = '1px';
oImg.style.paddingRight = '1px';
oImg.setAttribute('src', '{{ static_url("images/normalTag.png") }}');
oImg.setAttribute('alt', 'na');
oImg.setAttribute('height', '24px');
oImg.setAttribute('width', '24px');
oImg.title = 'Drag and drop the marker to your map';

controlDiv.appendChild(oImg);

 // Setup the click event listeners: simply set the map to Chicago
  google.maps.event.addDomListener(oImg, 'dragstart', function() {
   var _latLng = clickedOverlay.getProjection().fromDivPixelToLatLng(oImg);
    createMarker('normal', _latLng);
    
  });
    


}
  
function HomeControl(controlDiv) {

  // Set CSS styles for the DIV containing the control
  // Setting padding to 5 px will offset the control
  // from the edge of the map
  controlDiv.style.padding = '5px';

  // Set CSS for the control border
  var controlUI = document.createElement('DIV');
  controlUI.style.backgroundColor = 'white';
  controlUI.style.borderStyle = 'solid';
  controlUI.style.borderWidth = '2px';
  controlUI.style.cursor = 'pointer';
  controlUI.style.textAlign = 'center';
  controlUI.title = 'Drag and drop the marker to your map';
  controlDiv.appendChild(controlUI);

  
  var oImg=document.createElement("img");
  oImg.style.paddingLeft = '1px';
  oImg.style.paddingRight = '1px';
  oImg.setAttribute('src', '{{ static_url("images/model2.png") }}');
  oImg.setAttribute('alt', 'na');
  oImg.setAttribute('height', '24px');
  oImg.setAttribute('width', '24px');
  controlUI.appendChild(oImg);

  google.maps.event.addDomListener(oImg, 'dragstart', function() {
   var _latLng = clickedOverlay.getProjection().fromDivPixelToLatLng(oImg);
    createMarker('normal', _latLng);
    
  });

}
 
 Array.prototype.indexof = function(value){
var ctr = "";
for (var i=0; i < this.length; i++) {
// use === to check for Matches. ie., identical (===), ;
if (this[i] === value) {
return i;
}
}
return ctr;
}; 

 Array.prototype.removeAt = function(index){
     this.splice(index, 1);
}; 
  
 function MarkerWrapper(markerType, marker)
 {
     this.markerType = markerType;
     this.marker = marker;
 } 


  
 function MarkerMenu(contextMenu)
{
   // contextMenu.style.visibility="hidden";      
    contextMenu.style.background="#ffffff";      
    contextMenu.style.border="1px solid #8888FF";     
    // ===context menu HTML for varioys situations ===     
    
    contextMenu.innerHTML = '<a href="javascript:setasstart()"><div class="context">&nbsp;&nbsp;Set as Start&nbsp;&nbsp;<\/div><\/a>'
      + '<a href="javascript:setasdest()"><div class="context">&nbsp;&nbsp;Set as Dest&nbsp;&nbsp;<\/div><\/a>'   
       + '<a href="javascript:addaswaypoint()"><div class="context">&nbsp;&nbsp;Add as waypoint&nbsp;&nbsp;<\/div><\/a>' 
         + '<a href="javascript:DeleteMarker()"><div class="context">&nbsp;&nbsp;Delete Marker&nbsp;&nbsp;<\/div><\/a>' ;   
    
    var mapObject = document.getElementById("map-canvas");
    mapObject.appendChild(contextMenu);
}

 
 
 function PolylineMenu(contextMenu)
{
  // contextMenu.style.visibility="hidden";      
    contextMenu.style.background="#ffffff";      
    contextMenu.style.border="1px solid #8888FF";     
    // ===context menu HTML for varioys situations ===     
    
    contextMenu.innerHTML = '<a href="javascript:redline()"><div class="context">&nbsp;&nbsp;Set Red&nbsp;&nbsp;<\/div><\/a>'
      + '<a href="javascript:greenline()"><div class="context">&nbsp;&nbsp;Set Green&nbsp;&nbsp;<\/div><\/a>'   
       + '<a href="javascript:blueline()"><div class="context">&nbsp;&nbsp;Set Blue&nbsp;&nbsp;<\/div><\/a>' ;   
    
    var mapObject = document.getElementById("map-canvas");
    mapObject.appendChild(contextMenu);
}

 function DeleteMarker()
{
var markerIndex;

switch (selectedMarker.markerType)
{

    case 'polylinemarker':
        markerIndex = polylineMarkerGroup.indexof(selectedMarker.marker);
        polylineMarkerGroup.removeAt(markerIndex);
        break;
    case 'start':
        markerIndex = startMarkerGroup.indexof(selectedMarker.marker);
        startMarkerGroup.removeAt(markerIndex);
        break;
    case 'end':
        markerIndex = endMarkerGroup.indexof(selectedMarker.marker);
        endMarkerGroup.removeAt(markerIndex);
        break;
    case 'waypoint':
        markerIndex = wayptsMarkerGroup.indexof(selectedMarker.marker);
        wayptsMarkerGroup.removeAt(markerIndex);
        break;
    default:
        markerIndex = markerGroup.indexof(selectedMarker.marker);
        markerGroup.removeAt(markerIndex);
}

selectedMarker.marker.setMap(null);
markerMenuDiv.style.visibility = "hidden";
}

function setasstart()
{
  
    if(selectedMarker.marker)
    {   
	start = selectedMarker;
    selectedMarker.markerType = 'start';
    selectedMarker.marker.setIcon('{{ static_url("images/start.png") }}');
    document.getElementById("startPosition").value = selectedMarker.marker.getPosition();
	//document.getElementById("startPlace").value = selectedMarker.marker.getPosition();
	
	codeLatLng('startPosition');
    ProcessSetMarker();
    }
    if(selectedPolyline)
    {
    selectedPolyline.setMap(null);
    }
    if(document.getElementById("endPosition").value != 'undefined' && document.getElementById("endPosition").value != '')
    {
   // alert("endpo: "+document.getElementById("endPosition").value);
    calcRoute(false);
   
    }
    markerMenuDiv.style.visibility = "hidden";
	
}

function addaswaypoint()
{

if(selectedMarker.marker)
    {   
    selectedMarker.markerType = 'waypoint';
    selectedMarker.marker.setIcon('{{ static_url("images/tag.png") }}');
    waypts.push({
            location: selectedMarker.marker.getPosition(),
            stopover:true});
  
     ProcessSetMarker();       
    }
    if(selectedPolyline)
    {
    selectedPolyline.setMap(null);
    }
    if(document.getElementById("startPosition").value!= 'undefined'  && document.getElementById("endPosition").value != 'undefined')
    {
    calcRoute(false);
    }
    markerMenuDiv.style.visibility = "hidden";
}

function setasdest()
{
   
    if(selectedMarker.marker)
    { 
    selectedMarker.markerType = 'end';  
    selectedMarker.marker.setIcon('{{ static_url("static/images/dest.png") }}');
    document.getElementById("endPosition").value = selectedMarker.marker.getPosition();
	//document.getElementById("endPlace").value = selectedMarker.marker.getPosition();
	
	codeLatLng('endPosition');
    ProcessSetMarker();       
    }
     if(selectedPolyline)
    {
    selectedPolyline.setMap(null);
    
    }
    if(document.getElementById("startPosition").value!= 'undefined')
    {
	
    calcRoute(false);
   
    }
    markerMenuDiv.style.visibility = "hidden";
}

function pushPath() {
  var path = polyline.getPath();
  var pathSize = path.getLength();
  //alert('push path');
  document.getElementById('startPosition').value = path.getAt(0).lat() + "," + path.getAt(0).lng();
  document.getElementById('endPosition').value = path.getAt(pathSize - 1).lat() + "," + path.getAt(pathSize - 1).lng();
	  
  // Update the text field to display the polyline encodings
  var encodeString = google.maps.geometry.encoding.encodePath(path);
  if (encodeString) {
  //	alert('encodeString');
      document.getElementById('encodedPolyline').value = encodeString;
  }
}

function fetchPath(){
	var encodingString;
	 
	if (document.getElementById('encodedPolyline').value != 'undefined' && document.getElementById('encodedPolyline').value != '') {
		encodingString = document.getElementById('encodedPolyline').value;
		alert(encodingString);
        var path = google.maps.geometry.encoding.decodePath(encodingString);
		
		
		document.getElementById('startPosition').value = path[0];
	    //alert('path:'+path[0]);
        document.getElementById('endPosition').value = path[path.length-1];
	
		//polyline.setPath(path);
		
		createMarker('start', path[0]);
		createMarker('end', path[path.length-1]);
		if(path.length>2)
		{
		for (var i = 1; i < path.length ; i++) {
		    createMarker('waypoint', path[i]);
		}
		}
		
	}
}

function redline()
{
if(selectedPolyline)
{
selectedPolyline.setOptions({

 strokeColor:'#FF0000'
}
)
}
polylineMenuDiv.style.visibility = "hidden";
}

function greenline()
{
if(selectedPolyline)
{
selectedPolyline.setOptions(
{

 strokeColor:'#00FF00'
}
)
}
polylineMenuDiv.style.visibility = "hidden";
}

function blueline()
{
if(selectedPolyline)
{
selectedPolyline.setOptions(
{
strokeColor:'#0000FF'
}
)
}
polylineMenuDiv.style.visibility = "hidden";
}

function updateTag(address, marker)
{
//alert('updateTag'); 
    var myHtml = '<strong>'+address+'</strong><br/>';
    infoWindow.setContent(myHtml);
    infoWindow.open(map, marker);
} 


  
  function reverseGeocodePosition(pos, task, marker) 
{  
geocoder.geocode({latLng: pos}, function(responses, status)
{
if (status == google.maps.GeocoderStatus.OK) 
    {
        if(responses && responses.length > 0)
        {
        task(responses[0].formatted_address, marker);
        }
    }

else {
        alert("Geocoder failed due to: " + status);
     }
}
);
 }

function codeLatLng(name) {
    var input = document.getElementById(name).value;
	
	var temp = input.substring(1, input.length-1);
	
    var latlngStr = temp.split(",",2);
    var lat = parseFloat(latlngStr[0]);
    var lng = parseFloat(latlngStr[1]);
    var latlng = new google.maps.LatLng(lat, lng);
	
    geocoder.geocode({'latLng': latlng}, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        if (results[1]) {
		  tempName = name.replace(/Position/,"Place");
          document.getElementById(tempName).value = results[1].formatted_address;
        }
      } else {
        alert("Geocoder failed due to: " + status);
      }
    });
  }
 

  function codeAddress(address_id) {
   // var address = document.getElementById(address_id).value;
    
    geocoder.geocode( { 'address': address_id}, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) 
      {
       map.setCenter(results[0].geometry.location);        
       
       return results[0].geometry.location;
        }

     else {
        alert("Geocode was not successful for the following reason: " + status);
        return null;
      }
     }); 
  
  }

  function calcRoute(createMarkerFlag) {
  	
	var polyOptions = {
      strokeColor: '#000000',
      strokeOpacity: 1.0,
      strokeWeight: 3
    }
    var poly = new google.maps.Polyline(polyOptions);
	var _path = poly.getPath();
	
     polyline = new google.maps.Polyline({
       path:[],
       strokeColor: '#FF0000',
       strokeWeight: 5
       });
	   
    //alert("calcRoute");
    var startPos = document.getElementById("startPosition").value;
    var endPos = document.getElementById("endPosition").value;
   
    if(createMarkerFlag == true)
    {
    createMarker('start',startPos);
    createMarker('end',endPos);
    }
    
    var dragPosition = startPos;
    
    var checkboxArray = document.getElementById("wayPoints");
    for (var i = 0; i < checkboxArray.length; i++) {
      if (checkboxArray.options[i].selected == true) {
        waypts.push({
            location:checkboxArray[i].value,
            stopover:true});
      }
    }

    var request = {
        origin: startPos, 
        destination: endPos,
        waypoints: waypts,
        optimizeWaypoints: true,
        travelMode: google.maps.DirectionsTravelMode.DRIVING
    };
	
	
    directionsService.route(request, function(response, status) {
      if (status == google.maps.DirectionsStatus.OK) {
        
        var route = response.routes[0];
        path = route.overview_path;
        
        var legs = route.legs;                                      
        for (i=0;i<legs.length;i++) {                                    
        var steps = legs[i].steps;                                         
        for (j=0;j<steps.length;j++) {                  
        var nextSegment = steps[j].path;
       
        for (k=0;k<nextSegment.length;k++) {                                                      
        polyline.getPath().push(nextSegment[k]);                                                       
        routeBounds.extend(nextSegment[k]);                                                   
        }   
        }
		}                       

         
         polyline.setMap(map);
		 var path = polyline.getPath();
		 var temp = startPos.substring(1, startPos.length-2);
		 var a = temp.split(', ')[0];
		// alert(a);
		 var b = temp.split(', ')[1];
		// alert(b);
		 var _start = new google.maps.LatLng(a, b);
		 
		 
		 temp = endPos.substring(1, endPos.length-2);
		 a = temp.split(', ')[0];
	//	 alert(a);
		 b = temp.split(', ')[1];
	//	 alert(b);
		 
		 var _end = new google.maps.LatLng(a, b);
		 
		 _path.push(_start);
		 //_path.push()
		 _path.push(_end);
		 var encodeString = google.maps.geometry.encoding.encodePath(path);
		 //var encodeString = google.maps.geometry.encoding.encodePath(path);
		 
		 
		 document.getElementById('encodedPolyline').value = encodeString;
		// alert(encodeString);
		
        map.fitBounds(routeBounds);
        polylineGroup.push(polyline);
        selectedPolyline = polyline;
      
      
       // === set listener for polyline marker ===   
        polylineMenuDiv = document.createElement("div");    
        polylineMenuDiv.index = 1;     
        var dragMarker = createMarker('polylinemarker',dragPosition);
                      
        google.maps.event.addListener(polyline,'rightclick', function(event){
        //dragMarker.visible = false;
		alert("addListener");
        polylineMenuDiv.style.position = "absolute";
        var pixel =  clickedOverlay.getProjection().fromLatLngToContainerPixel(event.latLng);     
                    polylineMenuDiv.style.top = pixel.y+ 'px';
                    polylineMenuDiv.style.left = pixel.x+ 'px';
                  
                   
       // markerMenuDiv.innerHTML = mapContextHtml;       
        if(polylineMenuDiv.style.visibility == "visible") 
        { 
       // alert("hidden");
        polylineMenuDiv.style.visibility = "hidden";  
        }
        else
        {
      //  alert("visible");
        polylineMenuDiv.style.visibility = "visible";  
        }
        polylineMenu = new PolylineMenu(polylineMenuDiv);
         //     alert('right'); 
        });

       google.maps.event.addListener(polyline,'mousemove', function(event){
       
       dragMarker.visible = true;
       dragMarker.setPosition(event.latLng);
  
        });
      

        // begin to drag the marker
         google.maps.event.addListener(dragMarker,'drag', function(event){
         polyline.setMap(null);
        dragMarker.visible = true;
    
        });
        
        
        // end the drag of marker
        google.maps.event.addListener(dragMarker,'dragend', function(event){
        
        waypts.push({
        location:event.latLng ,stopover:true });
        calcRoute(false);
        dragMarker.visible = false;
        });

      }
  
    });

  }
  
  function addMarkers() {
       
        var bounds = map.getBounds();
        var southWest = bounds.getSouthWest();
        var northEast = bounds.getNorthEast();
        var lngSpan = northEast.lng() - southWest.lng();
        var latSpan = northEast.lat() - southWest.lat();
      

        var latLng = new google.maps.LatLng(southWest.lat() + latSpan * Math.random(),
                                              southWest.lng() + lngSpan * Math.random());
        createMarker('normal',latLng);
        
      }
      
   function createPolylineMarker(latLng)
     {
        var marker = new google.maps.Marker({
            position: latLng,
            map: map,
            icon: 'node.gif'
          });
		  
		 marker.setIcon('{{ static_url("images/node.gif") }}');
         marker.setDraggable(true);
          //var username = document.getElementById("username").value;
          google.maps.event.addListener(marker, 'click', function() {
            var myHtml = '<strong>' + '{{current_user["username"]}}' + '</strong><br/>';
            infoWindow.setContent(myHtml);
            infoWindow.open(map, marker);
          });
          
          
      
        google.maps.event.addListener(marker, 'rightclick', function(){
       
        selectedMarker = new MarkerWrapper('polylinemarker',marker);
         
       
        markerMenuDiv.style.position = "absolute";
      
        var pixel = marker.getPosition();  
        markerMenuDiv.style.top = pixel.y+ 'px';
        markerMenuDiv.style.left = pixel.x+ 'px';
                  
        if(markerMenuDiv.style.visibility == "visible") 
        { 
            markerMenuDiv.style.visibility = "hidden";  
        }
        else
        {
        //alert("visible");
        markerMenuDiv.style.visibility = "visible";  
        }
        markerMenu = new MarkerMenu(markerMenuDiv);
         });
         
         return marker;
     }
      
      function createMarker(markerType, latLng) {
       //  alert(latLng);
         var marker = new google.maps.Marker({
            position: latLng,
            map: map
            
          });
          marker.setDraggable(true);
          marker.setIcon('{{ static_url("images/start.png") }}');
		  switch (markerType) {
		 	case 'start':
			
		 		marker.setIcon('{{ static_url("images/start.png") }}');
		 		break;
			case 'end': 
			
		 		marker.setIcon('{{ static_url("images/dest.png") }}');
		 		break;
			case 'waypoint': 
			
		 		marker.setIcon('{{ static_url("images/waypoint.png") }}');
		 		break;
				
			case 'polylinemarker': 
			
		 		marker.setIcon('{{ static_url("images/node.gif") }}');
		 		break;
				
		    default:
			    marker.setIcon('{{ static_url("images/dest.png") }}');
		 		break;
		 }
		 
		 
          google.maps.event.addListener(marker, 'click', function() {
            var myHtml = '<strong>' + '{{current_user["username"]}}' + '</strong><br/>';
            infoWindow.setContent(myHtml);
            infoWindow.open(map, marker);
          });
         google.maps.event.addListener(marker, 'dragstart', function(event){
         dragStartPos = event.latLng;
       
        });
       
      
        google.maps.event.addListener(marker, 'rightclick', function(event){
       
        selectedMarker = new MarkerWrapper(markerType, marker);
        // selectedMarker.setVisible(false);
        markerMenuDiv.style.position = "absolute";
        
        var pixel =  clickedOverlay.getProjection().fromLatLngToContainerPixel(marker.getPosition());     
        markerMenuDiv.style.top = pixel.y+ 'px';
        markerMenuDiv.style.left = pixel.x+ 'px';
                  
                   
       // markerMenuDiv.innerHTML = mapContextHtml;       
        if(markerMenuDiv.style.visibility == "visible") 
        { 
        //alert("hidden");
        markerMenuDiv.style.visibility = "hidden";  
        }
        else
        {
        //alert("visible");
        markerMenuDiv.style.visibility = "visible";  
        }
        markerMenu = new MarkerMenu(markerMenuDiv);
         });

		
         
         return marker;
        }
        
        function MarkerWarpper(markerType, marker)
        {
          this.markerType = markerType;
          this.marker = marker;
        }
        
        function ProcessSetMarker()
        {
            switch (selectedMarker.markerType)
        {
            case 'start':
			
             startMarkerGroup.push(selectedMarker.marker);
             
                break;
            case 'end':
			
             endMarkerGroup.push(selectedMarker.marker);
           
                break;
            case 'waypoint':
             wayptsMarkerGroup.push(selectedMarker.marker);
             
             google.maps.event.addListener(selectedMarker.marker, 'dragend', function(){
             var _waypointMarker = {
            location: dragStartPos,
            stopover:true};
            
        
              var _index;
              for (var i=0; i < waypts.length; i++) 
		     {

             if (waypts[i].location === dragStartPos) {
                 _index = i;
                }
             }
            
           
                 if(_index>=0)
                 {
                 selectedPolyline.setMap(null);
                    waypts.removeAt(_index);
                    waypts.push({
                    location: selectedMarker.marker.getPosition(),
                    stopover:true});
                    calcRoute(false);
                  
                 }
             });
                break;
            case 'polylinemarker':
             polylineMarkerGroup.push(selectedMarker.marker);
             marker.setIcon('{{ static_url("images/node.gif") }}');
                break;
            default:
             markerGroup.push(selectedMarker.marker);
			 break;
        }
		//alert('finish process');
        }
        
      google.maps.event.addDomListener(window, 'load', initialize);
	
	/*  Set map hover effect   */
	  $(document).ready(function(){
	  	var panel = $('#photoBarContent'); 
		var panel2 = $('#photoBarBg'); 
		var panel3 = $('#tripBarContent'); 
		var panel4 = $('#tripBarBg'); 

      $('#map-canvas').mouseenter(function(){
	  	clearTimeout($(this).data('timeoutId'));
		clearTimeout($('#photoBarBg').data('timeoutId'));
		clearTimeout($('#tripBarBg').data('timeoutId'));
        panel.show();
	    panel2.show();
		panel3.show();
	    panel4.show();
	 //  panel.fadein('slow');
	 //  panel2.fadein('slow');
       });
	   
	    $('#photoBarBg').mouseenter(function(){
	  	clearTimeout($('#map-canvas').data('timeoutId'));
		clearTimeout($(this).data('timeoutId'));
       });
	   
	    $('#photoBarContent').mouseenter(function(){
	  	clearTimeout($('#map-canvas').data('timeoutId'));
		clearTimeout($('#photoBarBg').data('timeoutId'));
		clearTimeout($('#tripBarBg').data('timeoutId'));
       });
	   
	   $('#tripBarBg').mouseenter(function(){
	  	clearTimeout($('#map-canvas').data('timeoutId'));
		clearTimeout($(this).data('timeoutId'));
       });
	   
	    $('#tripBarContent').mouseenter(function(){
	  	clearTimeout($('#map-canvas').data('timeoutId'));
		clearTimeout($('#photoBarBg').data('timeoutId'));
		clearTimeout($('#tripBarBg').data('timeoutId'));
       });
	   
	
	   
	    $('#photoBarBg').mouseleave(function(){
	  	var timeoutId = setTimeout(function(){ panel.hide(); panel2.hide();panel3.hide(); panel4.hide();}, 650);
		$(this).data('timeoutId', timeoutId); 
       });
	   
	  $('#map-canvas').mouseleave(function(){
	  var timeoutId = setTimeout(function(){ panel.hide(); panel2.hide();panel3.hide(); panel4.hide();}, 650);
      $(this).data('timeoutId', timeoutId); 
       });
	   
	    $('#tripBarBg').mouseleave(function(){
	  	var timeoutId = setTimeout(function(){ panel.hide(); panel2.hide();panel3.hide(); panel4.hide();}, 650);
		$(this).data('timeoutId', timeoutId); 
       });
});

$(".comment form").live("submit",function(a){a.preventDefault();var c=$(this).parents("li.feed"),
a=c.find(".commentBody"),e=c.data("feedId"),b=a.val();a.val("");$.post(URI+"overview/comment",{id:e,comment:b},function(a){a.status=="ok"&&c.find(".comment.post").before(a.html)},"json")});
$("li.end ul.BUTTON li").click(function(){if(!a.loading)a.loading=!0,$.post(URI+"overview/loadMore",{activity_filter:$("#activity_filter").val(),skip:a.skip,date:$(" li.date:last p").text()},function(d){if(d.status=="ok")d.html==""?$("li.end").remove():$("li.end").before(d.html),a.skip+=a.limit,a.loading=!1},"json")});
$("a.comment").live("click",function(a){a.preventDefault();$(this).parents("li.feed").find("ul.comment_list").show().find(".commentBody").focus()});

$(document).ready(function() {   
$('input.manage_member').click(function(e) { 
        e.preventDefault();  
        $('#manage_member_dropdown').show();
		 $.getJSON('/getfriends', function(response) {
        ShowResultInDropList(response);
        });
		$('#mask6').show();
		

});

$('input.member_input').focus(function() {
   $('.friend_dropdown_list ul').empty();
   
});

$('input.member_input').keyup(function() {
   $.getJSON('/realtime_searchpeople/'+this.value, function(response) {
        ShowResultInDropList(response);
        });
});

function ShowResultInDropList(response)
{
	$('.friend_dropdown_list ul').empty();
	//alert(response);
	var _object = JSON.parse(response);
	//alert(_object.length);
	 for (var i = 0; i < _object.length; i++)
	{
	$('.friend_dropdown_list ul').append(
     '<li><a href="/addusertotrip/'+_object[i]['slug']+'"><span><img class="picture medium" alt='+_object[i]['username']+' src='+_object[i]['picture']+'></span><span class="user_name">'+_object[i]["username"]+'</span></a></li>'
    );	
	}
}

$('#mask6').click(function(e) { 
        e.preventDefault();  
        $('#manage_member_dropdown').hide();
		$('#mask6').hide();
});

  $('.post-button').click(function(e) { 
        e.preventDefault();  
        var id = $('#typeId').val();
		var type = $('#type').val();
		//alert(id);
		var content  = $('.feedBody').val();
		//alert(content);
		var xsrf = $('input[name=_xsrf]').val();
		//alert(xsrf);
		var message = {"content": content, "id":id , "_xsrf":xsrf, "type":type};
		//alert(jQuery.parseJSON(message));
		//$('.feedsUI li').last().before('<li class="feed item">'+content+'</li>');
		//$('.feedBody').val('');
		$.postJSON('/postfeed', message, function(response){PostFeedResponse(response)}, "text");	
});

  $('.post-comment-button').click(function(e) { 
        e.preventDefault();  
		var type = $('#type').val();
        var feed_id = $(this).parent('.feed').attr('data-feedid');
		alert(feed_id);
		var content  = $('.commentBody').val();
		alert(content);
		var xsrf = $('input[name=_xsrf]').val();
		alert(xsrf);
		var message = {"content": content, "feed_id":feed_id , "_xsrf":xsrf, "type":type};
		//alert(jQuery.parseJSON(message));
		
		$.postJSON('/postcomment', message, function(response){PostCommentResponse(response)}, "text");	
});



function PostCommentResponse(response){
	alert('post');
	response = JSON.parse(data);
	alert(response.username);
	var node = '<li class="comment item" data-commentid="' + _object['id'] + '"><a href="#"><img alt="' + _object['from']['username'] + '" src="' + _object['from']['picture'] + '" title="' + _object['from']['username'] + '" class="picture medium"></a>' + _object['body'] + '</li><div class="body"><p class="message"><a class="name" href="">' + _object['from']['username'] + '</a> ' + $('.commentBody').val() + '</p><p class="timestamp"> <a class="remove_comment" href="#">Delete</a></p></div>';
	$('.comment_list li').first().before(node);
	$('.commentBody').val('');
}

function PostFeedResponse(response){
	if (response != '') {
		var _object = JSON.parse(response);
		var node = '<li class="feed item left" data-feedid="' + _object['id'] + '"><div class="left"><img alt="' + _object['from']['username'] + '" src="' + _object['from']['picture'] + '" title="' + _object['from']['username'] + '" class="picture medium"></div><div class="right"><p class="message">' + _object['body'] + '</p><p class="details"><span class="timestamp">' + _object['date'] + '</span>  · <a class="comment" href="#">Comment</a></p></div></li>';
		$('.feedsUI li').first().before(node);
		
	}
	$('.feedBody').val('');
}

    $('.remove_comment').click(function(){
		var message = {"comment_id": $(this).parent('.feed').attr('data-feedid')};
		message._xsrf = getCookie("_xsrf");
		$.postJSON('/deletecomment', message, null, "text");	
	})
});


