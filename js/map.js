// accessibility map - a hand-made SVG map (no map library). Places come from js/seed.js via js/store.js.
var places=[],selected=null,here=null,FULL={x:66,y:-38,w:33,h:32},vb={x:66,y:-38,w:33,h:32};
var FEATURES=[['ramp','Ramp'],['lift','Elevator'],['wash','Accessible washroom'],['sign','Sign language support'],['park','Parking']];

function setView(){$('mapSvg').setAttribute('viewBox',vb.x+' '+vb.y+' '+vb.w+' '+vb.h);drawMap();}
function zoom(f){
  var w=vb.w*f;
  if(w>=FULL.w){vb={x:FULL.x,y:FULL.y,w:FULL.w,h:FULL.h};}
  else{w=Math.max(w,6);var cx=vb.x+vb.w/2,cy=vb.y+vb.h/2;vb={x:cx-w/2,y:cy-w*.97/2,w:w,h:w*.97};}
  setView();
}
// does the place pass the city + feature filters?
function passes(p){
  var c=$('mapCity').value;
  if(c&&p.city!=c)return false;
  return Array.prototype.every.call(document.querySelectorAll('[data-f]:checked'),function(b){return p[b.dataset.f]=='Yes';});
}
// distance in km (haversine formula)
function km(p){
  var r=Math.PI/180,a=Math.sin((p.lat-here.lat)*r/2),b=Math.sin((p.lng-here.lng)*r/2);
  var h=a*a+Math.cos(here.lat*r)*Math.cos(p.lat*r)*b*b;
  return Math.round(12742*Math.asin(Math.sqrt(h)));
}
function drawMap(){
  var rank={green:0,yellow:1,red:2},g='';
  places.forEach(function(p){
    g+='<circle class="mp p-'+p.s+(passes(p)?'':' dim')+(selected==p.id?' sel':'')+'" cx="'+p.lng+'" cy="'+(-p.lat)+'" r="'+(vb.w/70)+'" tabindex="0" role="button" aria-label="'+p.n+', '+p.city+', '+p.s+'" data-id="'+p.id+'"><title>'+p.n+' ('+p.city+')</title></circle>';
    if(selected==p.id)g+='<text class="lbl" style="font-size:'+(vb.w/38)+'px" x="'+(p.lng+vb.w/50)+'" y="'+(-p.lat-vb.w/60)+'">'+p.n+'</text>';
  });
  if(here)g+='<circle cx="'+here.lng+'" cy="'+(-here.lat)+'" r="'+(vb.w/90)+'" fill="#2563eb" stroke="#fff" stroke-width=".1"><title>You are here</title></circle>';
  $('pins').innerHTML=g;
  var list=places.filter(passes).sort(function(a,b){return here?km(a)-km(b):rank[a.s]-rank[b.s];});
  $('mapList').innerHTML=list.map(function(p){
    return '<button class="mini row" data-id="'+p.id+'"><span class="dot p-'+p.s+'"></span><b>'+p.n+'</b> - '+p.city+(here?' ('+km(p)+' km)':'')+'</button>';}).join('')||'<p>No place matches these filters.</p>';
}
function choose(id){
  selected=id;
  var p=places.filter(function(x){return x.id==id;})[0];
  vb={x:p.lng-6,y:-p.lat-5.8,w:12,h:11.6};
  var n=FEATURES.filter(function(f){return p[f[0]]=='Yes';}).length;
  $('mapDetail').innerHTML='<h3>'+p.n+' ('+p.city+')</h3><p>'+n+' of 5 features available. Status: <b>'+p.s+'</b></p><p>'+
    FEATURES.map(function(f){var y=p[f[0]]=='Yes';return '<span class="tag '+(y?'ok':'')+'">'+(y?'&#10003; ':'&#10007; ')+f[1]+(p[f[0]]=='Limited'?' (limited)':'')+'</span>';}).join(' ')+
    '</p><a href="https://www.google.com/maps/search/?api=1&query='+p.lat+','+p.lng+'" target="_blank" rel="noopener">Open in Google Maps</a>';
  setView();
}
function pick(e){var t=e.target.closest('[data-id]');if(t)choose(+t.dataset.id);}
$('pins').onclick=pick;$('mapList').onclick=pick;
$('pins').onkeydown=function(e){if(e.key=='Enter'||e.key==' '){e.preventDefault();pick(e);}};
$('zIn').onclick=function(){zoom(.6);};$('zOut').onclick=function(){zoom(1/.6);};
$('zReset').onclick=function(){vb={x:FULL.x,y:FULL.y,w:FULL.w,h:FULL.h};selected=null;setView();};
$('mapCity').onchange=drawMap;
document.querySelectorAll('[data-f]').forEach(function(b){b.onchange=drawMap;});
$('nearBtn').onclick=function(){
  if(!navigator.geolocation){alert('Location is not supported in this browser.');return;}
  navigator.geolocation.getCurrentPosition(function(pos){here={lat:pos.coords.latitude,lng:pos.coords.longitude};drawMap();},
    function(){alert('Location was not allowed. Allow it in the browser to sort places by distance.');});
};
function loadPlaces(){
  api('/api/places').then(function(d){
    d.forEach(function(p){p.n=esc(p.n);p.city=esc(p.city);});places=d;var cities=[];
    d.forEach(function(p){if(cities.indexOf(p.city)<0)cities.push(p.city);});
    $('mapCity').innerHTML='<option value="">All cities</option>'+cities.sort().map(function(c){return '<option>'+c+'</option>';}).join('');
    drawMap();
  });
}
