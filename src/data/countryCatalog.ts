import type { NordicCountry } from "../types/game";

export type CountryMeta={flag:string;name:string;anthem:string;color:string};

/** Gemensam presentation för samtliga spelbara europeiska länder. */
export const COUNTRY_META:Record<NordicCountry,CountryMeta>={
  sweden:{flag:"🇸🇪",name:"Sverige",anthem:"",color:"#3b7f78"},
  norway:{flag:"🇳🇴",name:"Norge",anthem:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Norway%20(National%20Anthem).ogg",color:"#ff4268"},
  finland:{flag:"🇫🇮",name:"Finland",anthem:"https://upload.wikimedia.org/wikipedia/commons/6/61/United_States_Navy_Band_-_Maamme.ogg",color:"#27d9ff"},
  denmark:{flag:"🇩🇰",name:"Danmark",anthem:"https://commons.wikimedia.org/wiki/Special:Redirect/file/United%20States%20Navy%20Band%20-%20Der%20er%20et%20yndigt%20land.ogg",color:"#ffffff"},
  germany:{flag:"🇩🇪",name:"Tyskland",anthem:"https://commons.wikimedia.org/wiki/Special:Redirect/file/German_national_anthem_performed_by_the_United_States_Navy_Band.ogg",color:"#f4c542"},
  netherlands:{flag:"🇳🇱",name:"Nederländerna",anthem:"https://commons.wikimedia.org/wiki/Special:Redirect/file/United_States_Navy_Band_-_Het_Wilhelmus.ogg",color:"#ff8c42"},
  belgium:{flag:"🇧🇪",name:"Belgien",anthem:"https://commons.wikimedia.org/wiki/Special:Redirect/file/La_Brabanconne.oga",color:"#ffd447"},
  luxembourg:{flag:"🇱🇺",name:"Luxemburg",anthem:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Ons_Heemecht.ogg",color:"#70d6ff"},
  france:{flag:"🇫🇷",name:"Frankrike",anthem:"https://commons.wikimedia.org/wiki/Special:Redirect/file/La_Marseillaise.ogg",color:"#7aa2ff"},
  estonia:{flag:"🇪🇪",name:"Estland",anthem:"https://commons.wikimedia.org/wiki/Special:Redirect/file/United_States_Navy_Band_-_Mu_isamaa%2C_mu_%C3%B5nn_ja_r%C3%B5%C3%B5m.ogg",color:"#4895ef"},
  latvia:{flag:"🇱🇻",name:"Lettland",anthem:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Latvian_National_Anthem.ogg",color:"#b56576"},
  lithuania:{flag:"🇱🇹",name:"Litauen",anthem:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Tauti%C5%A1ka_giesm%C4%97_instrumental.oga",color:"#80b918"},
  poland:{flag:"🇵🇱",name:"Polen",anthem:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Mazurek_Dabrowskiego.ogg",color:"#ff5d8f"},
  switzerland:{flag:"🇨🇭",name:"Schweiz",anthem:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Swiss_Psalm.ogg",color:"#ff595e"},
  austria:{flag:"🇦🇹",name:"Österrike",anthem:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Land_der_Berge_Land_am_Strome_instrumental.ogg",color:"#ef476f"},
  hungary:{flag:"🇭🇺",name:"Ungern",anthem:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Hungarian_national_anthem%2C_instrumental.ogg",color:"#06d6a0"},
  italy:{flag:"🇮🇹",name:"Italien",anthem:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Italian_national_anthem.ogg",color:"#52b788"},
  spain:{flag:"🇪🇸",name:"Spanien",anthem:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Marcha_Real-Royal_March_by_US_Navy_Band.ogg",color:"#ffb703"},
  albania:{flag:"🇦🇱",name:"Albanien",anthem:"",color:"#e63946"},andorra:{flag:"🇦🇩",name:"Andorra",anthem:"",color:"#f4a261"},
  armenia:{flag:"🇦🇲",name:"Armenien",anthem:"",color:"#ff9f1c"},azerbaijan:{flag:"🇦🇿",name:"Azerbajdzjan",anthem:"",color:"#00b4d8"},
  belarus:{flag:"🇧🇾",name:"Belarus",anthem:"",color:"#e76f51"},bosniaHerzegovina:{flag:"🇧🇦",name:"Bosnien och Hercegovina",anthem:"",color:"#4361ee"},
  bulgaria:{flag:"🇧🇬",name:"Bulgarien",anthem:"",color:"#2a9d8f"},croatia:{flag:"🇭🇷",name:"Kroatien",anthem:"",color:"#f94144"},
  cyprus:{flag:"🇨🇾",name:"Cypern",anthem:"",color:"#e9c46a"},czechia:{flag:"🇨🇿",name:"Tjeckien",anthem:"",color:"#577590"},
  georgia:{flag:"🇬🇪",name:"Georgien",anthem:"",color:"#ff6b6b"},greece:{flag:"🇬🇷",name:"Grekland",anthem:"",color:"#4cc9f0"},
  iceland:{flag:"🇮🇸",name:"Island",anthem:"",color:"#90e0ef"},ireland:{flag:"🇮🇪",name:"Irland",anthem:"",color:"#43aa8b"},
  kosovo:{flag:"🇽🇰",name:"Kosovo",anthem:"",color:"#3a86ff"},liechtenstein:{flag:"🇱🇮",name:"Liechtenstein",anthem:"",color:"#9b5de5"},
  malta:{flag:"🇲🇹",name:"Malta",anthem:"",color:"#f15bb5"},moldova:{flag:"🇲🇩",name:"Moldavien",anthem:"",color:"#fee440"},
  monaco:{flag:"🇲🇨",name:"Monaco",anthem:"",color:"#ff477e"},montenegro:{flag:"🇲🇪",name:"Montenegro",anthem:"",color:"#d00000"},
  northMacedonia:{flag:"🇲🇰",name:"Nordmakedonien",anthem:"",color:"#ffba08"},portugal:{flag:"🇵🇹",name:"Portugal",anthem:"",color:"#38b000"},
  romania:{flag:"🇷🇴",name:"Rumänien",anthem:"",color:"#ffca3a"},russia:{flag:"🇷🇺",name:"Ryssland (Europa)",anthem:"",color:"#9d4edd"},
  sanMarino:{flag:"🇸🇲",name:"San Marino",anthem:"",color:"#48cae4"},serbia:{flag:"🇷🇸",name:"Serbien",anthem:"",color:"#c1121f"},
  slovakia:{flag:"🇸🇰",name:"Slovakien",anthem:"",color:"#00bbf9"},slovenia:{flag:"🇸🇮",name:"Slovenien",anthem:"",color:"#00f5d4"},
  turkey:{flag:"🇹🇷",name:"Turkiet",anthem:"",color:"#ef233c"},ukraine:{flag:"🇺🇦",name:"Ukraina",anthem:"",color:"#ffd60a"},
  unitedKingdom:{flag:"🇬🇧",name:"Storbritannien",anthem:"",color:"#8338ec"},vaticanCity:{flag:"🇻🇦",name:"Vatikanstaten",anthem:"",color:"#ffdd00"}
};

export const UNLOCKABLE_COUNTRIES=(Object.keys(COUNTRY_META) as NordicCountry[]).filter((country):country is Exclude<NordicCountry,"sweden">=>country!=="sweden");
