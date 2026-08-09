const RESET_AFTER_MS=2500;

let musicTapCount=0;
let lastMusicTap=0;

function isMobileOnlineSummaryTarget(target:EventTarget|null){
  if(!(target instanceof Element))return false;
  const cell=target.closest(".mobile-game-summary > div");
  if(!cell)return false;
  const summary=cell.parentElement;
  if(!summary?.classList.contains("mobile-game-summary"))return false;
  return Array.from(summary.children).indexOf(cell)===2;
}

document.addEventListener("click",event=>{
  if(!isMobileOnlineSummaryTarget(event.target))return;
  const now=Date.now();
  musicTapCount=now-lastMusicTap>RESET_AFTER_MS?1:musicTapCount+1;
  lastMusicTap=now;
  if(musicTapCount<5)return;
  musicTapCount=0;
  document.querySelector<HTMLButtonElement>(".brand-secret")?.click();
});
