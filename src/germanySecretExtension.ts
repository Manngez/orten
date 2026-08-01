const EVENT_NAME="orten-unlock-germany";

function addGermanyButton(){
  const menu=document.querySelector<HTMLElement>(".nordic-menu");
  if(!menu||menu.querySelector('[data-country="germany"]'))return;
  const closeButton=menu.querySelector<HTMLButtonElement>("button.text-button");
  const button=document.createElement("button");
  button.dataset.country="germany";
  button.innerHTML="<span>🇩🇪</span><b>Tyskland</b><small>Lås upp</small>";
  button.addEventListener("click",()=>{
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
    button.disabled=true;
    const small=button.querySelector("small");
    if(small)small.textContent="Aktiverat";
    window.setTimeout(()=>closeButton?.click(),250);
  });
  menu.insertBefore(button,closeButton);
}

const observer=new MutationObserver(addGermanyButton);
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener("DOMContentLoaded",addGermanyButton);
