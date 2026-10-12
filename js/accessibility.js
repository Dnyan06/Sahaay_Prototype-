// accessibility toolbar (font size, dark, contrast, read aloud)
var fs=load('sahaay_fs',100);
function applyA11y(){
  document.documentElement.style.setProperty('--fs',fs+'%');
  document.body.classList.toggle('dark',load('sahaay_dark',false));
  document.body.classList.toggle('contrast',load('sahaay_con',false));
}
$('a11yBtn').onclick=function(){$('a11yPanel').hidden=!$('a11yPanel').hidden;};
$('fPlus').onclick=function(){if(fs<130)fs+=5;save('sahaay_fs',fs);applyA11y();};
$('fMinus').onclick=function(){if(fs>85)fs-=5;save('sahaay_fs',fs);applyA11y();};
$('dark').onclick=function(){save('sahaay_dark',!load('sahaay_dark',false));applyA11y();};
$('contrast').onclick=function(){save('sahaay_con',!load('sahaay_con',false));applyA11y();};
$('speak').onclick=function(){
  if(!window.speechSynthesis){alert('Read aloud is not supported in this browser.');return;}
  speechSynthesis.cancel();
  var t=document.querySelector('.page.show').innerText;
  speechSynthesis.speak(new SpeechSynthesisUtterance(t));
};
applyA11y();

document.querySelectorAll('[data-a11y]').forEach(function(a){a.onclick=function(e){e.preventDefault();$('a11yPanel').hidden=false;};});
