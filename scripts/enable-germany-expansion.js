import fs from "node:fs";

const path = new URL("../src/App.tsx", import.meta.url);
let source = fs.readFileSync(path, "utf8");

const denmarkMeta = '  denmark:{flag:"🇩🇰",name:"Danmark",anthem:"https://commons.wikimedia.org/wiki/Special:Redirect/file/United%20States%20Navy%20Band%20-%20Der%20er%20et%20yndigt%20land.ogg",color:"#fff"}';
const germanyMeta = '  germany:{flag:"🇩🇪",name:"Tyskland",anthem:"https://commons.wikimedia.org/wiki/Special:Redirect/file/German_national_anthem_performed_by_the_United_States_Navy_Band.ogg",color:"#f4c542"}';

if (!source.includes("germany:{flag:")) {
  source = source.replace(denmarkMeta, `${denmarkMeta},\n${germanyMeta}`);
}

source = source.replace(
  '(["finland","norway","denmark"] as const)',
  '(["finland","norway","denmark","germany"] as const)'
);

fs.writeFileSync(path, source);
