// healthcare module - data comes from js/store.js
var docs=[];
function renderDocs(){
  var q=$('docQ').value.toLowerCase(),s=$('docSpec').value,l=$('docLoc').value.toLowerCase();
  var r=docs.filter(function(d){
    return (d.name+d.place+d.svc).toLowerCase().indexOf(q)>=0&&(!s||d.spec==s)&&d.city.toLowerCase().indexOf(l)>=0;});
  $('docCount').innerHTML='<b>'+r.length+'</b> doctors found';
  $('docList').innerHTML=r.map(function(d){
    return '<div class="card"><span class="tag">'+esc(d.spec)+'</span>'+esc(d.city)+'<h3>'+esc(d.name)+'</h3><p>'+esc(d.place)+'</p><p>'+esc(d.svc)+'</p><span class="tag ok">Accessible Care</span><br><br><button class="mini" onclick="book('+d.id+')">Book appointment</button></div>';}).join('')||'<p>No doctors found.</p>';
}
function book(id){
  if(!currentUser()){alert('Please log in to book an appointment.');location.hash='#login';return;}
  if(currentUser().role!='User'){alert('Only user accounts can book appointments.');return;}
  var date=prompt('Enter your preferred date (e.g. 10/10/2026):');
  if(!date)return;
  api('/api/doctors/'+id+'/book','POST',{date:date}).then(function(){alert('Appointment request sent for '+date+'.');}).catch(fail);
}
function loadDocs(){
  api('/api/doctors').then(function(d){
    docs=d;var specs=[];
    d.forEach(function(x){if(specs.indexOf(x.spec)<0)specs.push(x.spec);});
    $('docSpec').innerHTML='<option value="">All specializations</option>'+specs.map(function(s){return '<option>'+s+'</option>';}).join('');
    renderDocs();
  });
}
$('docBtn').onclick=renderDocs;$('docQ').oninput=renderDocs;$('docSpec').onchange=renderDocs;$('docLoc').oninput=renderDocs;
