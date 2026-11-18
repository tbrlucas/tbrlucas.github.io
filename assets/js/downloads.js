(() => {
  const list=document.getElementById("downloads-list"), search=document.getElementById("download-search"), platform=document.getElementById("download-platform"), count=document.getElementById("downloads-count"), empty=document.getElementById("downloads-empty");
  let items=[];
  const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const format=v=>window.TBRLucasFormatting?window.TBRLucasFormatting.render(v):"<p>"+esc(v)+"</p>";
  function render(){
    const q=search.value.trim().toLowerCase(), p=platform.value;
    const filtered=items.filter(item=>item.published===true&&(!p||item.platform===p)&&(!q||[item.title,item.description,item.platform,item.compatibility,item.version].join(" ").toLowerCase().includes(q)));
    count.textContent=filtered.length+(filtered.length===1?" download":" downloads"); empty.hidden=filtered.length!==0;
    list.innerHTML=filtered.map(item=>'<article class="download-card"><div class="download-card-top"><span class="download-platform">'+esc(item.platform)+'</span><span class="download-version">'+(item.version?"Version "+esc(item.version):"Application")+'</span></div><h2>'+esc(item.title)+'</h2><div class="download-description formatted-content">'+format(item.description)+'</div><div class="download-meta">'+(item.compatibility?'<p><strong>Compatibility:</strong> '+esc(item.compatibility)+'</p>':'')+(item.fileSize?'<p><strong>File size:</strong> '+esc(item.fileSize)+'</p>':'')+(item.fileType?'<p><strong>File:</strong> '+esc(item.fileType)+'</p>':'')+'</div><a class="btn download-more" href="/downloads/item.html?slug='+encodeURIComponent(item.slug)+'">See more <span aria-hidden="true">→</span></a></article>').join("");
  }
  search.addEventListener("input",render); platform.addEventListener("change",render);
  fetch("/assets/data/downloads.json?v=2",{cache:"no-store"}).then(r=>{if(!r.ok)throw new Error("Could not load downloads");return r.json();}).then(data=>{items=Array.isArray(data.downloads)?data.downloads:[];render();}).catch(()=>{count.textContent="Downloads could not be loaded.";list.innerHTML="<p class='post-empty'>Please try again later.</p>";});
})();