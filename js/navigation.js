// shared helpers + page switching
function $(id){return document.getElementById(id);}
function load(key,def){try{var v=JSON.parse(localStorage.getItem(key));return v==null?def:v;}catch(e){return def;}}
function save(key,val){localStorage.setItem(key,JSON.stringify(val));}
function esc(s){var d=document.createElement('div');d.textContent=s;return d.innerHTML;}
function currentUser(){return load('sahaay_user',null);}
// api(path, method, body) is defined in js/store.js (browser-side data layer, no server needed)
function fail(e){alert(e.message);}

var pages=['home','about','services','jobs','healthcare','community','sign','map','login','register','profile'];
function showPage(){
  var p=location.hash.replace('#','')||'home';
  if(pages.indexOf(p)<0)p='home';
  if(p=='profile'&&!currentUser()){p='login';}
  pages.forEach(function(n){$(n).classList.toggle('show',n==p);});
  document.querySelectorAll('#nav a').forEach(function(a){a.classList.toggle('on',a.getAttribute('href')=='#'+p);});
  if(p=='profile')renderProfile();
  window.scrollTo(0,0);
}
function setAuthLinks(){
  var u=currentUser();
  $('authLinks').innerHTML=u?'<a href="#profile">'+esc(u.name.split(' ')[0])+'</a><a href="#" class="pill" id="logout">Logout</a>':'<a href="#login" class="pill">Login</a><a href="#register" class="fill">Register</a>';
  if(u)$('logout').onclick=function(e){e.preventDefault();api('/api/logout','POST').then(function(){localStorage.removeItem('sahaay_user');mine=emptyMine();setAuthLinks();loadJobs();loadPosts();refreshLearn();location.hash='#home';});};
}
window.addEventListener('hashchange',showPage);

function emptyMine(){return {saved:[],apps:[],learned:[],chapters:{},appts:[],days:[],streak:0,today:''};}
// show / hide password
document.addEventListener('click',function(e){
  var b=e.target.closest('.eye');if(!b)return;
  var i=$(b.dataset.t),show=i.type=='password';
  i.type=show?'text':'password';b.textContent=show?'Hide':'Show';
  b.setAttribute('aria-pressed',show);b.setAttribute('aria-label',show?'Hide password':'Show password');
});
