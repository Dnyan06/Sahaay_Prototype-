// community module - posts, likes, comments and reports are stored in this browser by js/store.js
var posts=[];
function counts(p){return '<p class="counts">\u2764\ufe0f '+p.likes+' \u00b7 \ud83d\udcac '+p.comments.length+'</p>';}
function renderPosts(){
  var q=$('postQ').value.toLowerCase(),c=$('postCat').value,u=currentUser();
  $('postNote').innerHTML=u?'':'You need to <a href="#login">log in</a> to post, comment or like.';
  $('postForm').hidden=!u;
  var r=posts.filter(function(p){return (p.title+p.body).toLowerCase().indexOf(q)>=0&&(!c||p.cat==c);});
  $('postList').innerHTML=r.map(function(p){
    return '<div class="card"><span class="tag">'+esc(p.cat)+'</span><span class="small">by '+esc(p.by)+' \u00b7 '+dt(p.created)+'</span><h3>'+esc(p.title)+'</h3><p>'+esc(p.body)+'</p>'+counts(p)+
    (u?'<button class="mini" onclick="likePost('+p.id+')">Like</button><button class="mini" onclick="commentPost('+p.id+')">Comment</button><button class="mini" onclick="reportPost('+p.id+')">Report</button>':'')+
    p.comments.map(function(m){return '<div class="cm">'+esc(m)+'</div>';}).join('')+'</div>';}).join('')||'<p>No posts found.</p>';
}
function loadPosts(){
  api('/api/posts').then(function(d){
    posts=d;renderPosts();
    $('homePosts').innerHTML=d.slice(0,3).map(function(p){var t=p.body.length>80?p.body.slice(0,80).trim()+'\u2026':p.body;return '<div class="card"><span class="tag">'+esc(p.cat)+'</span><span class="small">by '+esc(p.by)+'</span><h3>'+esc(p.title)+'</h3><p>'+esc(t)+'</p>'+counts(p)+'</div>';}).join('');
  });
}
function needLogin(){if(currentUser())return false;alert('Please log in first.');location.hash='#login';return true;}
function likePost(id){if(needLogin())return;api('/api/posts/'+id+'/like','POST').then(loadPosts).catch(fail);}
function commentPost(id){if(needLogin())return;var t=prompt('Your comment:');if(t)api('/api/posts/'+id+'/comment','POST',{text:t}).then(loadPosts).catch(fail);}
function reportPost(id){if(needLogin())return;api('/api/posts/'+id+'/report','POST').then(function(){alert('Thanks, the post has been reported for review.');}).catch(fail);}
$('postForm').onsubmit=function(e){
  e.preventDefault();var f=this;
  api('/api/posts','POST',{title:$('postTitle').value,body:$('postBody').value,cat:$('postNewCat').value}).then(function(){f.reset();loadPosts();}).catch(fail);
};
$('postQ').oninput=renderPosts;$('postCat').onchange=renderPosts;
