const syncPrankPanelVisibility=()=>{
  const panel=document.getElementById("orten-prank-host");
  if(!panel)return;
  const gameRunning=Boolean(document.querySelector(".game-shell"));
  panel.style.display=gameRunning?"none":"";
};

const observer=new MutationObserver(syncPrankPanelVisibility);
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener("popstate",syncPrankPanelVisibility);
queueMicrotask(syncPrankPanelVisibility);
