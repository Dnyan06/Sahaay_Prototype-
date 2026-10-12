// jobs module (sample data)
var jobs=[],mine;

mine=emptyMine();
function money(j){return '\u20b9'+j.pay.replace(' - ',' - \u20b9')+' / year';}
function dt(x){return new Date(x).toLocaleDateString('en-IN',{timeZone:'UTC'});}
function jobCard(j){
  var saved=mine.saved.indexOf(j.id)>=0;
  return '<div class="card"><span class="tag">'+esc(j.type)+'</span><span class="small">'+dt(j.created)+'</span><h3>'+esc(j.title)+'</h3><p class="muted">'+esc(j.company)+' \u00b7 '+esc(j.loc)+'</p><p>'+esc(j.desc)+'</p>'+
  '<p class="money">'+money(j)+' <span class="tag ok right">\u267f Accommodations</span></p>'+
  (canApply()?'<button class="mini" onclick="saveJob('+j.id+')">'+(saved?'Saved':'Save')+'</button><button class="mini" onclick="applyJob('+j.id+')">Apply</button>':'')+'</div>';
}
function homeJob(j){return '<div class="card"><span class="tag">'+esc(j.type.replace('-',' '))+'</span><span class="small">'+esc(j.loc)+'</span><h3>'+esc(j.title)+'</h3><p class="muted">'+esc(j.company)+'</p><p class="money">'+money(j)+'</p></div>';}
function renderJobs(){
  var q=$('jobQ').value.toLowerCase(),t=$('jobType').value,l=$('jobLoc').value.toLowerCase();
  var r=jobs.filter(function(j){
    var txt=(j.title+j.company+j.skills).toLowerCase();
    return txt.indexOf(q)>=0&&(!t||j.type==t)&&j.loc.toLowerCase().indexOf(l)>=0;});
  $('jobCount').innerHTML='<b>'+r.length+'</b> jobs found';
  $('jobList').innerHTML=r.length?r.map(jobCard).join(''):'<p>No jobs match. Try clearing the filters.</p>';
}
function canApply(){var u=currentUser();return !u||u.role=='User';}
function saveJob(id){
  if(!currentUser()){alert('Please log in to save jobs.');location.hash='#login';return;}
  api('/api/jobs/'+id+'/save','POST').then(function(r){mine=r.mine;renderJobs();if(location.hash=='#profile')renderProfile();}).catch(fail);
}
function applyJob(id){
  if(!currentUser()){alert('Please log in to apply.');location.hash='#login';return;}
  api('/api/jobs/'+id+'/apply','POST').then(function(r){mine=r.mine;alert('Application submitted!');if(location.hash=='#profile')renderProfile();}).catch(fail);
}
$('jobBtn').onclick=renderJobs;$('jobQ').oninput=renderJobs;$('jobType').onchange=renderJobs;$('jobLoc').oninput=renderJobs;
function loadJobs(){api('/api/jobs').then(function(d){jobs=d;renderJobs();$('homeJobs').innerHTML=jobs.slice(0,3).map(homeJob).join('');});}
function loadMine(){
  if(!currentUser()){mine=emptyMine();return Promise.resolve();}
  return api('/api/my').then(function(d){mine=d;});
}
