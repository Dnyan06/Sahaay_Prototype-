// login, register and role dashboards (User, Employer, Doctor, Admin)
function afterAuth(r){
  save('sahaay_user',r.user);setAuthLinks();
  return loadMine().then(function(){loadJobs();loadPosts();refreshLearn();location.hash='#profile';if(location.hash=='#profile')showPage();});
}
$('regForm').onsubmit=function(e){
  e.preventDefault();
  if($('rPass').value!=$('rPass2').value){$('rErr').textContent='Passwords do not match.';return;}
  api('/api/register','POST',{name:$('rName').value,email:$('rEmail').value,password:$('rPass').value,
    role:document.querySelector('input[name=role]:checked').value,dis:$('rDis').value,skills:$('rSkills').value,loc:$('rLoc').value,phone:$('rPhone').value,education:$('rEdu').value,worktype:$('rWork').value})
  .then(afterAuth).catch(function(x){$('rErr').textContent=x.message;});
};
$('loginForm').onsubmit=function(e){
  e.preventDefault();
  api('/api/login','POST',{email:$('lEmail').value,password:$('lPass').value})
  .then(function(r){$('lErr').textContent='';return afterAuth(r);}).catch(function(x){$('lErr').textContent=x.message;});
};

var ROLE_TITLE={User:'My Profile',Employer:'Employer Dashboard',Doctor:'Doctor Dashboard',Admin:'Admin Dashboard'};
var SPECS=['Psychiatry','Physiotherapy','Audiology','General Medicine','Occupational Therapy','Speech Therapy','Ophthalmology'];
var STATUSES=['Submitted','Under review','Shortlisted','Selected','Rejected'];
function attr(s){return esc(s==null?'':s).replace(/"/g,'&quot;');}
function pill(s){return '<span class="tag st-'+esc(s).toLowerCase().replace(/\s/g,'')+'">'+esc(s)+'</span>';}
function stat(n,l){return '<div class="stat"><b>'+n+'</b><span>'+l+'</span></div>';}
function field(id,label,val,ph){return '<label>'+label+'<input id="'+id+'" value="'+attr(val)+'" placeholder="'+(ph||'')+'"></label>';}
function opts(list,cur){return list.map(function(x){return '<option'+(x==cur?' selected':'')+'>'+esc(x)+'</option>';}).join('');}
function box(t,h){return '<div class="card"><h3>'+t+'</h3>'+h+'</div>';}

function header(u){
  var ini=u.name.split(/\s+/).map(function(w){return w[0]||'';}).join('').slice(0,2).toUpperCase();
  var line=[u.loc,u.education].filter(Boolean).map(esc).join(' &middot; ');
  return '<div class="card pcard"><div class="avatar r-'+u.role+'" aria-hidden="true">'+esc(ini)+'</div><div><h2>'+esc(u.name)+' <span class="rolep r-'+u.role+'">'+esc(u.role)+'</span></h2><p>'+esc(u.email)+(u.phone?' &middot; '+esc(u.phone):'')+'</p>'+(line?'<p class="small">'+line+'</p>':'')+'</div></div>';
}
function editForm(u){
  var extra=u.role=='User'?'<div class="two">'+field('pEdu','Education',u.education)+field('pSkills','Skills (comma separated)',u.skills)+'</div>'+field('pDis','Accessibility preference (private, only you see it)',u.dis):'';
  return '<details class="card"><summary><b>Edit my details</b></summary><form id="profForm">'+field('pName','Full name',u.name)+'<div class="two">'+field('pPhone','Phone',u.phone)+field('pLoc','Location',u.loc)+'</div>'+extra+'<button class="btn">Save details</button></form></details>';
}
function renderProfile(){
  var u=currentUser();if(!u)return;
  $('profTitle').textContent=ROLE_TITLE[u.role]||'My Profile';
  $('profileView').innerHTML=header(u)+'<div id="dash"><p>Loading...</p></div>'+editForm(u);
  var fn={User:userDash,Employer:employerDash,Doctor:doctorDash,Admin:adminDash}[u.role]||userDash;
  fn(u);
}
function dash(html){var d=$('dash');if(d)d.innerHTML=html;}
function failDash(x){dash('<p class="err">'+esc(x.message)+'</p>');}

/* ----- user ----- */
function userDash(u){
  var apps=mine.apps.map(function(a){
    var j=jobs.filter(function(x){return x.id==a.job_id;})[0];
    return '<div class="rowc"><div><b>'+(j?esc(j.title):'Job')+'</b><small>'+(j?esc(j.company):'')+'</small></div>'+pill(a.status)+'</div>';}).join('')||'<p>No applications yet. <a href="#jobs">Browse jobs</a></p>';
  var appts=mine.appts.map(function(a){return '<div class="rowc"><div><b>'+esc(a.doctor)+'</b><small>'+esc(a.date)+'</small></div>'+pill(a.status)+'</div>';}).join('')||'<p>No appointments yet. <a href="#healthcare">Find a doctor</a></p>';
  var saved=jobs.filter(function(j){return mine.saved.indexOf(j.id)>=0;}).map(jobCard).join('')||'<p>No saved jobs yet.</p>';
  var done=Object.keys(mine.chapters).length;
  dash('<div class="stats2">'+stat(mine.saved.length,'Saved jobs')+stat(mine.apps.length,'Applications')+stat(mine.appts.length,'Appointments')+stat('&#128293; '+mine.streak,'Day streak')+stat(done,'Chapters played')+'</div>'+
    '<div class="grid2">'+box('My applications',apps)+box('My appointments',appts)+'</div>'+
    box('Keep learning','<p>Continue your sign language lessons and keep your streak going.</p><a class="btn" href="#sign">Go to Sign Language Centre</a>')+
    '<h3>Saved jobs</h3><div class="grid">'+saved+'</div>');
}

/* ----- employer ----- */
function employerDash(u){
  Promise.all([api('/api/employer/jobs'),api('/api/employer/applications')]).then(function(r){
    var js=r[0],ap=r[1],pending=js.filter(function(j){return j.status=='pending';}).length;
    var list=js.map(function(j){return '<div class="rowc"><div><b>'+esc(j.title)+'</b><small>'+esc(j.company)+' &middot; '+esc(j.loc)+' &middot; '+j.applicants+' applicants</small></div>'+pill(j.status)+'</div>';}).join('')||'<p>You have not posted any jobs yet.</p>';
    var rows=ap.map(function(a){
      return '<tr><td><b>'+esc(a.name)+'</b><br><small>'+esc(a.email)+'</small></td><td>'+esc(a.job)+'</td><td>'+esc(a.skills||'-')+'<br><small>'+esc(a.education||'')+'</small></td><td><select class="st" data-sel="app" data-job="'+a.job_id+'" data-user="'+a.user_id+'" aria-label="Status for '+attr(a.name)+'">'+opts(STATUSES,a.status)+'</select></td></tr>';}).join('');
    dash('<div class="stats2">'+stat(js.length,'Job postings')+stat(pending,'Waiting for approval')+stat(ap.length,'Applicants')+'</div>'+
      box('Post a new job','<p class="hint">New jobs are sent to an admin for approval before they appear on the Jobs page.</p><form id="jobForm">'+field('jTitle','Job title','')+'<div class="two">'+field('jCompany','Company',u.name)+field('jLoc','Location','','Mumbai, Remote...')+'</div><div class="two"><label>Work type<select id="jType">'+opts(['Full-Time','Part-Time','Remote','Hybrid'],'')+'</select></label>'+field('jPay','Yearly pay','','e.g. 3,00,000 - 4,50,000')+'</div>'+field('jSkills','Skills wanted','')+'<label>Description and accommodations<textarea id="jDesc"></textarea></label><button class="btn">Post job</button></form>')+
      '<div class="grid2">'+box('My job postings',list)+'</div>'+
      box('Applicants',rows?'<div style="overflow-x:auto"><table class="t"><tr><th>Applicant</th><th>Job</th><th>Skills</th><th>Status</th></tr>'+rows+'</table></div>':'<p>No applications yet.</p>'));
  }).catch(failDash);
}

/* ----- doctor ----- */
function doctorDash(u){
  api('/api/doctor/me').then(function(r){
    var d=r.doctor,ap=r.appointments,req=ap.filter(function(a){return a.status=='Requested';}).length,ok=ap.filter(function(a){return a.status=='Confirmed';}).length;
    var list=ap.map(function(a){
      return '<div class="rowc"><div><b>'+esc(a.patient)+'</b><small>'+esc(a.date)+'</small></div><div>'+pill(a.status)+(a.status=='Requested'?' <button class="mini" data-act="confirm" data-id="'+a.id+'">Confirm</button><button class="mini" data-act="decline" data-id="'+a.id+'">Decline</button>':'')+'</div></div>';}).join('')||'<p>No appointment requests yet.</p>';
    dash('<div class="stats2">'+stat(ap.length,'Appointments')+stat(req,'Waiting for you')+stat(ok,'Confirmed')+'</div>'+
      (d.svc?'':'<div class="note">Add your services below so patients can find you in the Healthcare Directory.</div><br>')+
      '<div class="grid2">'+box('My clinic profile','<form id="clinicForm">'+field('cName','Name',d.name)+'<label>Specialization<select id="cSpec">'+opts(SPECS,d.spec)+'</select></label><div class="two">'+field('cCity','City',d.city)+field('cPlace','Hospital / clinic',d.place)+'</div><label>Services offered<textarea id="cSvc">'+esc(d.svc)+'</textarea></label><button class="btn">Save clinic profile</button></form>')+box('Appointment requests',list)+'</div>');
  }).catch(failDash);
}

/* ----- admin ----- */
function adminDash(u){
  Promise.all([api('/api/admin/stats'),api('/api/admin/pending'),api('/api/admin/reports'),api('/api/admin/users')]).then(function(r){
    var s=r[0],pend=r[1],rep=r[2],us=r[3];
    var pl=pend.map(function(j){return '<div class="rowc"><div><b>'+esc(j.title)+'</b><small>'+esc(j.company)+' &middot; posted by '+esc(j.by)+'</small></div><div><button class="mini" data-act="approve" data-id="'+j.id+'">Approve</button><button class="mini" data-act="reject" data-id="'+j.id+'">Reject</button></div></div>';}).join('')||'<p>No jobs waiting for approval.</p>';
    var rl=rep.map(function(p){return '<div class="rowc"><div><b>'+esc(p.title)+'</b><small>by '+esc(p.by)+' &middot; reported '+p.reports+' time(s)</small></div><button class="mini" data-act="delpost" data-id="'+p.id+'">Delete post</button></div>';}).join('')||'<p>No reported posts.</p>';
    var ul=us.map(function(x){return '<tr><td>'+esc(x.name)+'</td><td>'+esc(x.email)+'</td><td><span class="rolep r-'+esc(x.role)+'">'+esc(x.role)+'</span></td></tr>';}).join('');
    dash('<div class="stats2">'+stat(s.users,'Users')+stat(s.employers,'Employers')+stat(s.doctors,'Doctors')+stat(s.jobs,'Live jobs')+stat(s.pending,'Jobs to approve')+stat(s.posts,'Community posts')+stat(s.reports,'Reports')+stat(s.applications,'Applications')+stat(s.appointments,'Appointments')+'</div>'+
      '<div class="grid2">'+box('Job approvals',pl)+box('Reported posts',rl)+'</div>'+box('All users','<div style="overflow-x:auto"><table class="t"><tr><th>Name</th><th>Email</th><th>Role</th></tr>'+ul+'</table></div>'));
  }).catch(failDash);
}

/* ----- actions (one listener for the whole dashboard) ----- */
$('profileView').addEventListener('click',function(e){
  var b=e.target.closest('[data-act]');if(!b)return;
  var a=b.dataset.act,id=b.dataset.id,p=null;
  if(a=='approve'||a=='reject')p=api('/api/admin/jobs/'+id+'/'+a,'POST').then(loadJobs);
  else if(a=='delpost'){if(!confirm('Delete this post and its comments?'))return;p=api('/api/admin/posts/'+id,'DELETE').then(loadPosts);}
  else if(a=='confirm'||a=='decline')p=api('/api/doctor/appointments/'+id,'PUT',{status:a=='confirm'?'Confirmed':'Declined'});
  if(p)p.then(renderProfile).catch(fail);
});
$('profileView').addEventListener('change',function(e){
  var s=e.target.closest('[data-sel]');if(!s)return;
  api('/api/employer/applications/'+s.dataset.job+'/'+s.dataset.user,'PUT',{status:s.value}).catch(fail);
});
$('profileView').addEventListener('submit',function(e){
  e.preventDefault();var f=e.target.id,v=function(i){return $(i).value;};
  if(f=='profForm'){
    var body={name:v('pName'),phone:v('pPhone'),loc:v('pLoc')};
    if($('pEdu')){body.education=v('pEdu');body.skills=v('pSkills');body.dis=v('pDis');}
    api('/api/me','PUT',body).then(function(r){save('sahaay_user',r.user);setAuthLinks();renderProfile();}).catch(fail);
  }else if(f=='jobForm'){
    api('/api/employer/jobs','POST',{title:v('jTitle'),company:v('jCompany'),loc:v('jLoc'),type:v('jType'),pay:v('jPay'),skills:v('jSkills'),desc:v('jDesc')})
    .then(function(){alert('Job sent to an admin for approval.');renderProfile();}).catch(fail);
  }else if(f=='clinicForm'){
    api('/api/doctor/me','PUT',{name:v('cName'),spec:v('cSpec'),city:v('cCity'),place:v('cPlace'),svc:v('cSvc')})
    .then(function(){loadDocs();renderProfile();}).catch(fail);
  }
});

// start-up: check the saved login in this browser, then load everything
function boot(){
  api('/api/me').then(function(d){
    if(d.user)save('sahaay_user',d.user);else localStorage.removeItem('sahaay_user');
    setAuthLinks();return loadMine();
  }).then(function(){loadJobs();loadDocs();loadPosts();loadSigns();loadPlaces();showPage();})
  .catch(function(){
    document.body.insertAdjacentHTML('afterbegin','<p class="err" style="text-align:center;margin:8px">Sahaay could not load its data. Try reloading the page.</p>');
    setAuthLinks();showPage();
  });
}
$('resetData').onclick=function(e){e.preventDefault();if(confirm('Erase all accounts and progress saved in this browser and restore the sample data?'))sahaayReset();};
boot();
