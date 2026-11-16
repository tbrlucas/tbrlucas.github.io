(function(){
"use strict";
var root=document.documentElement;
var params=new URLSearchParams(location.search);
var forced=params.get("event");
var now=new Date(),month=now.getMonth()+1,day=now.getDate();
var eventName="off";
if(forced==="xmas"||forced==="newyear"||forced==="off") eventName=forced;
else if((month===12&&day>=1&&day<=26)) eventName="xmas";
else if((month===12&&day>=27)||(month===1&&day<=2)) eventName="newyear";
if(eventName==="off") return;
var bodyClass=eventName==="xmas"?"seasonal-xmas":"seasonal-newyear";
document.body.classList.add(bodyClass);
var host=document.createElement("section");
host.id="seasonal-event";
host.setAttribute("aria-label",eventName==="xmas"?"Happy Christmas seasonal event":"Happy New Year seasonal event");
var title=eventName==="xmas"?"HAPPY XMAS":"HAPPY NEW YEAR";
var subtitle=eventName==="xmas"?"A little more wonder. A little more magic. Let the season glow.":"One year ends. Another begins. Welcome to a brand-new chapter.";
host.innerHTML='<div class="event-orb one"></div><div class="event-orb two"></div><canvas id="seasonal-event-canvas" aria-hidden="true"></canvas><div class="event-inner"><p class="event-kicker">TBRLUCAS PRESENTS · SEASONAL SPECIAL</p><h1 class="event-title">'+title+'</h1><p class="event-subtitle">'+subtitle+'</p><span class="event-ribbon">'+(eventName==="xmas"?"THE CHRISTMAS EDITION":"THE MIDNIGHT EDITION")+'</span></div>';
var header=document.querySelector(".site-header");
if(header) header.insertAdjacentElement("afterend",host); else document.body.insertBefore(host,document.body.firstChild);
if(eventName==="xmas"){
 var count=window.matchMedia("(prefers-reduced-motion: reduce)").matches?0:48;
 for(var i=0;i<count;i++){var flake=document.createElement("span");flake.className="seasonal-snow";flake.textContent=i%5===0?"✧":"❄";flake.style.left=(Math.random()*100)+"vw";flake.style.fontSize=(9+Math.random()*15)+"px";flake.style.opacity=(.35+Math.random()*.6);flake.style.animationDuration=(8+Math.random()*13)+"s";flake.style.animationDelay=(-Math.random()*18)+"s";flake.style.setProperty("--drift",(Math.random()*100-50)+"px");document.body.appendChild(flake);}
}else{
 var canvas=document.getElementById("seasonal-event-canvas"),ctx=canvas.getContext("2d"),particles=[],rockets=[],w=0,h=0,raf=0;
 var reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
 function resize(){var rect=host.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);w=Math.max(1,rect.width);h=Math.max(1,rect.height);canvas.width=w*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);}
 function burst(x,y){var hue=35+Math.random()*35;for(var n=0;n<34;n++){var a=Math.PI*2*n/34+Math.random()*.12,s=1.1+Math.random()*3.2;particles.push({x:x,y:y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:45+Math.random()*28,max:73,hue:hue});}}
 function frame(){ctx.clearRect(0,0,w,h);if(Math.random()<.045)burst(w*(.12+Math.random()*.76),h*(.12+Math.random()*.62));for(var i=particles.length-1;i>=0;i--){var p=particles[i];p.x+=p.vx;p.y+=p.vy;p.vy+=.025;p.vx*=.99;p.life--;ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle="hsl("+p.hue+" 90% 70%)";ctx.shadowBlur=10;ctx.shadowColor=ctx.fillStyle;ctx.fillRect(p.x,p.y,2.4,2.4);if(p.life<=0)particles.splice(i,1);}ctx.globalAlpha=1;ctx.shadowBlur=0;raf=requestAnimationFrame(frame);}
 resize();window.addEventListener("resize",resize,{passive:true});if(!reduce)frame();
}
window.TBRLucasSeasonal={active:eventName,set:function(name){if(["xmas","newyear","off"].indexOf(name)<0)return false;var url=new URL(location.href);if(name==="off")url.searchParams.set("event","off");else url.searchParams.set("event",name);location.href=url.href;return true;}};
})();