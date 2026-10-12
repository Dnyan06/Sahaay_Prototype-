// keyword based assistant (a real AI model can be added later - //FUTURE)
document.querySelectorAll('[data-bot]').forEach(function(a){a.onclick=function(e){e.preventDefault();$('bot').hidden=false;$('botIn').focus();};});
$('botX').onclick=function(){$('bot').hidden=true;};
function reply(t){
  t=t.toLowerCase();
  if(/job|work|career/.test(t))return ['I found '+jobs.length+' inclusive jobs. Opening the Jobs page.','#jobs'];
  if(/doctor|health|clinic|hospital/.test(t))return ['Opening the Healthcare Directory.','#healthcare'];
  if(/sign|learn|isl/.test(t))return ['Opening the Sign Language Centre.','#sign'];
  if(/community|post|support/.test(t))return ['Opening the Community.','#community'];
  if(/map|ramp|wheelchair/.test(t))return ['Opening the Accessibility Map.','#map'];
  return ['Sorry, I did not get that. Try: jobs, doctors, sign language, community or map.',null];
}
$('botForm').onsubmit=function(e){
  e.preventDefault();
  var t=$('botIn').value;if(!t)return;
  var r=reply(t);
  $('botMsgs').innerHTML+='<p class="um">'+esc(t)+'</p><p class="bm">'+r[0]+'</p>';
  $('botIn').value='';$('botMsgs').scrollTop=99999;
  if(r[1])location.hash=r[1];
};
