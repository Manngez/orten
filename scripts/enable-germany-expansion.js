import fs from "node:fs";

const path=new URL("../src/App.tsx",import.meta.url);
let source=fs.readFileSync(path,"utf8");
const denmarkMeta='  denmark:{flag:"🇩🇰",name:"Danmark",anthem:"https://commons.wikimedia.org/wiki/Special:Redirect/file/United%20States%20Navy%20Band%20-%20Der%20er%20et%20yndigt%20land.ogg",color:"#fff"}';
const additions=[
  '  germany:{flag:"🇩🇪",name:"Tyskland",anthem:"https://commons.wikimedia.org/wiki/Special:Redirect/file/German_national_anthem_performed_by_the_United_States_Navy_Band.ogg",color:"#f4c542"}',
  '  netherlands:{flag:"🇳🇱",name:"Nederländerna",anthem:"https://commons.wikimedia.org/wiki/Special:Redirect/file/United_States_Navy_Band_-_Het_Wilhelmus.ogg",color:"#ff8c42"}',
  '  belgium:{flag:"🇧🇪",name:"Belgien",anthem:"https://commons.wikimedia.org/wiki/Special:Redirect/file/La_Brabanconne.oga",color:"#ffd447"}',
  '  luxembourg:{flag:"🇱🇺",name:"Luxemburg",anthem:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Ons_Heemecht.ogg",color:"#70d6ff"}',
  '  france:{flag:"🇫🇷",name:"Frankrike",anthem:"https://commons.wikimedia.org/wiki/Special:Redirect/file/La_Marseillaise.ogg",color:"#7aa2ff"}'
];
if(!source.includes("netherlands:{flag:"))source=source.replace(denmarkMeta,`${denmarkMeta},\n${additions.join(",\n")}`);
source=source.replace(/\(\["finland","norway","denmark"(?:,"germany")?\] as const\)/,'(["finland","norway","denmark","germany","netherlands","belgium","luxembourg","france"] as const)');
fs.writeFileSync(path,source);
