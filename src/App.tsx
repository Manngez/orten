import { useCallback,useEffect,useMemo,useRef,useState } from "react";
import Peer,{type DataConnection} from "peerjs";
import { useGame } from "./hooks/useGame";
import GameSetup,{PLAYER_COLORS} from "./components/GameSetup";
import GameBoard from "./components/GameBoard";
import CityInput from "./components/CityInput";
import StatsPanel from "./components/StatsPanel";
import type { Country,GameMode,GameState,NordicCountry } from "./types/game";
import { COUNTRY_META,UNLOCKABLE_COUNTRIES } from "./data/countryCatalog";

type OnlineRole="offline"|"host"|"guest";
type OnlineStatus="idle"|"connecting"|"connected"|"error";
type LobbyPlayer={id:string;name:string;connected:boolean;ready:boolean};
type WireGameState=Omit<GameState,"usedCityNames">&{usedCityNames:string[]};
type NetworkMessage=
  |{type:"JOIN";id:string;name:string}
  |{type:"READY";playerId:string}
  |{type:"IDENTITY";id:string}
  |{type:"LOBBY";players:LobbyPlayer[];country:Country}
  |{type:"STATE";state:WireGameState}
  |{type:"MOVE";cityName:string;playerId:string}
  |{type:"TIMER";seconds:number}
  |{type:"MUSIC";previewUrl:string;title:string}
  |{type:"LEAVE";playerId:string};

const normalizeCode=(value:string)=>value.trim().toLocaleLowerCase("sv-SE").normalize("NFD").replace(/\p{Diacritic}/gu,"").replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,"");
const roomPeerId=(code:string)=>`orten-${normalizeCode(code)}`;
const makeId=()=>`guest-${crypto.randomUUID?.()||Date.now().toString(36)}`;
const toWireState=(state:GameState):WireGameState=>({...state,usedCityNames:[...state.usedCityNames]});

function beep(){
  try{const C=window.AudioContext||(window as unknown as {webkitAudioContext:typeof AudioContext}).webkitAudioContext,c=new C(),o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.frequency.value=520;g.gain.setValueAtTime(.08,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+.18);o.start();o.stop(c.currentTime+.18)}catch{}
}

type DevSong={title:string;artist:string};
const DEV_SONGS:DevSong[]=[{title:"Dancing Queen",artist:"ABBA"},{title:"Wake Me Up",artist:"Avicii"},{title:"The Look",artist:"Roxette"},{title:"The Final Countdown",artist:"Europe"},{title:"Dancing on My Own",artist:"Robyn"}];
let remoteAudioElement:HTMLAudioElement|null=null;
async function primeRemoteAudioPlayback(){
  remoteAudioElement??=new Audio();
  remoteAudioElement.src="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=";
  remoteAudioElement.muted=true;
  try{await remoteAudioElement.play();remoteAudioElement.pause();remoteAudioElement.currentTime=0}catch{}finally{remoteAudioElement.muted=false}
}
function normalizeSong(value:string){return value.toLocaleLowerCase("sv").normalize("NFD").replace(/\p{Diacritic}/gu,"").replace(/[^a-z0-9]/g,"")}
type AppleTrack={trackId?:number;trackName?:string;artistName?:string;previewUrl?:string;artworkUrl60?:string;trackViewUrl?:string};
function searchAppleWithJsonp(query:string):Promise<AppleTrack[]>{
  return new Promise((resolve,reject)=>{const callback=`ortenApple${Date.now()}${Math.random().toString(36).slice(2)}`,script=document.createElement("script"),timer=window.setTimeout(()=>finish(null),8000),target=window as unknown as Record<string,unknown>;function finish(results:AppleTrack[]|null){window.clearTimeout(timer);script.remove();delete target[callback];results?resolve(results):reject(new Error("Apple-sökningen svarade inte"))}target[callback]=(data:{results?:AppleTrack[]})=>finish(data.results??[]);script.onerror=()=>finish(null);script.src=`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=12&country=SE&callback=${callback}`;document.head.appendChild(script)});
}
async function searchApple(query:string){
  let results:AppleTrack[]=[];
  try{const response=await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=12&country=SE`);if(response.ok)results=((await response.json()) as {results?:AppleTrack[]}).results??[]}catch{results=await searchAppleWithJsonp(query)}
  if(!results.length)results=await searchAppleWithJsonp(query);
  return results.filter(track=>track.previewUrl&&track.trackName&&track.artistName);
}
async function resolveApplePreview(song:DevSong){
  const results=await searchApple(`${song.artist} ${song.title}`);
  const wantedTitle=normalizeSong(song.title),wantedArtist=normalizeSong(song.artist);
  const matches=results.filter(result=>result.previewUrl&&normalizeSong(result.trackName??"").includes(wantedTitle)&&normalizeSong(result.artistName??"").includes(wantedArtist));
  return (matches.find(result=>normalizeSong(result.trackName??"")===wantedTitle)??matches[0])?.previewUrl??null;
}
function playRemotePreview(url:string){remoteAudioElement??=new Audio();remoteAudioElement.src=url;remoteAudioElement.currentTime=0;void remoteAudioElement.play()}

export default function App(){
  const game=useGame(),{state}=game;
  const [stats,setStats]=useState(false),[sound,setSound]=useState(()=>localStorage.getItem("blindkarta_sound")!=="off"),[left,setLeft]=useState(15),[showGameResult,setShowGameResult]=useState(true);
  const [showOnline,setShowOnline]=useState(false),[role,setRole]=useState<OnlineRole>("offline"),[status,setStatus]=useState<OnlineStatus>("idle");
  const [name,setName]=useState(""),[room,setRoom]=useState(""),[error,setError]=useState(""),[playerId,setPlayerId]=useState("");
  const [lobby,setLobby]=useState<LobbyPlayer[]>([]),[onlineMode,setOnlineMode]=useState<GameMode>("classic"),[pending,setPending]=useState(false);
  const [onlineCountry,setOnlineCountry]=useState<Country>("sweden");
  const [logoTaps,setLogoTaps]=useState(0),[devMenu,setDevMenu]=useState(false),[devMusicStatus,setDevMusicStatus]=useState(""),[devMusicLoading,setDevMusicLoading]=useState(false);
  const [devSearch,setDevSearch]=useState(""),[devResults,setDevResults]=useState<AppleTrack[]>([]);
  const [nordicMenu,setNordicMenu]=useState(false),[arrivalCountry,setArrivalCountry]=useState<Exclude<NordicCountry,"sweden">|null>(null);
  const [showOrnskoldsvikEgg,setShowOrnskoldsvikEgg]=useState(false),[showSkellefteaPlayer,setShowSkellefteaPlayer]=useState(false);
  const peerRef=useRef<Peer|null>(null),hostRef=useRef<DataConnection|null>(null),guestsRef=useRef<DataConnection[]>([]);
  const idsRef=useRef(new Map<DataConnection,string>()),stateRef=useRef(state),lobbyRef=useRef(lobby),placeCityRef=useRef(game.placeCity),countryRef=useRef(onlineCountry);
  const currentPlayerTapsRef=useRef(0),previousUnlockedRef=useRef(state.unlockedCountries),lastSaikTurnRef=useRef(-1),lastSkellefteaVisualTurnRef=useRef(-1),lastOrnskoldsvikTurnRef=useRef(-1);
  stateRef.current=state;lobbyRef.current=lobby;placeCityRef.current=game.placeCity;countryRef.current=onlineCountry;

  const broadcast=useCallback((message:NetworkMessage)=>guestsRef.current.forEach(c=>c.open&&c.send(message)),[]);
  const startRoomMusic=async(song:DevSong)=>{if(role!=="host"||devMusicLoading)return;setDevMusicLoading(true);setDevMusicStatus("Hämtar förhandslyssning…");try{const previewUrl=await resolveApplePreview(song);if(!previewUrl){setDevMusicStatus("Ingen förhandslyssning hittades.");return}broadcast({type:"MUSIC",previewUrl,title:`${song.artist} – ${song.title}`});setDevMusicStatus(`Spelar på deltagarnas enheter: ${song.title}`)}catch{setDevMusicStatus("Kunde inte hämta låten. Försök igen.")}finally{setDevMusicLoading(false)}};
  const runDevSearch=async()=>{const query=devSearch.trim();if(!query||devMusicLoading)return;setDevMusicLoading(true);setDevMusicStatus("Söker i Apple Music…");setDevResults([]);try{const results=await searchApple(query),unique=results.filter((track,index,list)=>list.findIndex(other=>(other.trackId&&other.trackId===track.trackId)||(`${other.artistName}-${other.trackName}`===`${track.artistName}-${track.trackName}`))===index).slice(0,5);setDevResults(unique);setDevMusicStatus(unique.length?`${unique.length} låtar hittades.`:"Inga låtar med förhandslyssning hittades.")}catch{setDevMusicStatus("Sökningen misslyckades. Försök igen.")}finally{setDevMusicLoading(false)}};
  const playSearchResult=(track:AppleTrack)=>{if(role!=="host"||!track.previewUrl)return;broadcast({type:"MUSIC",previewUrl:track.previewUrl,title:`${track.artistName} – ${track.trackName}`});setDevMusicStatus(`Spelar på deltagarnas enheter: ${track.trackName}`)};
  const setAndBroadcastLobby=useCallback((next:LobbyPlayer[])=>{lobbyRef.current=next;setLobby(next);broadcast({type:"LOBBY",players:next,country:countryRef.current})},[broadcast]);
  const stopNetwork=useCallback(()=>{hostRef.current?.close();hostRef.current=null;guestsRef.current.forEach(c=>c.close());guestsRef.current=[];idsRef.current.clear();peerRef.current?.destroy();peerRef.current=null},[]);
  const leaveOnline=useCallback(()=>{if(role==="guest"&&hostRef.current?.open)hostRef.current.send({type:"LEAVE",playerId} satisfies NetworkMessage);stopNetwork();setRole("offline");setStatus("idle");setLobby([]);setShowOnline(false);setPending(false);setError("");game.resetGame()},[game,playerId,role,stopNetwork]);

  const attachGuest=useCallback((connection:DataConnection)=>{
    guestsRef.current=[...guestsRef.current,connection];
    connection.on("open",()=>{connection.send({type:"LOBBY",players:lobbyRef.current,country:countryRef.current} satisfies NetworkMessage);connection.send({type:"STATE",state:toWireState(stateRef.current)} satisfies NetworkMessage)});
    connection.on("data",raw=>{
      const message=raw as NetworkMessage;
      if(message.type==="JOIN"&&typeof message.id==="string"&&typeof message.name==="string"){
        idsRef.current.set(connection,message.id);
        const existing=lobbyRef.current.find(p=>p.id===message.id);
        const next=existing?lobbyRef.current.map(p=>p.id===message.id?{...p,name:message.name,connected:true}:p):[...lobbyRef.current,{id:message.id,name:message.name,connected:true,ready:false}];
        setAndBroadcastLobby(next);connection.send({type:"IDENTITY",id:message.id} satisfies NetworkMessage);connection.send({type:"STATE",state:toWireState(stateRef.current)} satisfies NetworkMessage);return;
      }
      const authenticated=idsRef.current.get(connection);
      if(!authenticated)return;
      if(message.type==="MOVE"&&message.playerId===authenticated){
        const current=lobbyRef.current[stateRef.current.currentPlayerIndex]?.id;
        if(current===authenticated)void placeCityRef.current(message.cityName);
      }
      if(message.type==="LEAVE"&&message.playerId===authenticated)setAndBroadcastLobby(lobbyRef.current.map(p=>p.id===authenticated?{...p,connected:false}:p));
      if(message.type==="READY"&&message.playerId===authenticated)setAndBroadcastLobby(lobbyRef.current.map(p=>p.id===authenticated?{...p,connected:true,ready:true}:p));
    });
    const detach=()=>{const id=idsRef.current.get(connection);guestsRef.current=guestsRef.current.filter(c=>c!==connection);idsRef.current.delete(connection);if(id)setAndBroadcastLobby(lobbyRef.current.map(p=>p.id===id?{...p,connected:false,ready:false}:p))};
    connection.on("close",detach);connection.on("error",detach);
  },[setAndBroadcastLobby]);

  const createRoom=()=>{
    void primeRemoteAudioPlayback();
    const code=normalizeCode(room);if(!name.trim()||!code){setError("Skriv namn och rumskod.");return}
    stopNetwork();game.resetGame();setRole("host");setPlayerId("host");setStatus("connecting");setError("");
    const players=[{id:"host",name:name.trim(),connected:true,ready:true}];setLobby(players);lobbyRef.current=players;
    const peer=new Peer(roomPeerId(code));peerRef.current=peer;
    peer.on("open",()=>setStatus("connected"));peer.on("connection",attachGuest);peer.on("error",e=>{setStatus("error");setError(e.type==="unavailable-id"?"Rumskoden används redan.":e.message)});
  };
  const joinRoom=()=>{
    void primeRemoteAudioPlayback();
    const code=normalizeCode(room);if(!name.trim()||!code){setError("Skriv namn och rumskod.");return}
    stopNetwork();game.resetGame();setRole("guest");setStatus("connecting");setError("");
    const id=localStorage.getItem(`orten-player-${code}`)||makeId();localStorage.setItem(`orten-player-${code}`,id);setPlayerId(id);
    const peer=new Peer();peerRef.current=peer;
    peer.on("open",()=>{const connection=peer.connect(roomPeerId(code),{reliable:true});hostRef.current=connection;connection.on("open",()=>{setStatus("connected");connection.send({type:"JOIN",id,name:name.trim()} satisfies NetworkMessage)});connection.on("data",raw=>{const message=raw as NetworkMessage;if(message.type==="LOBBY"){setLobby(message.players);setOnlineCountry(message.country)}if(message.type==="IDENTITY")setPlayerId(message.id);if(message.type==="STATE"){game.setRemoteState({...message.state,usedCityNames:new Set(message.state.usedCityNames)});setPending(false)}if(message.type==="TIMER")setLeft(message.seconds);if(message.type==="MUSIC"&&typeof message.previewUrl==="string"&&localStorage.getItem("blindkarta_sound")!=="off")playRemotePreview(message.previewUrl)});connection.on("close",()=>{setStatus("error");setError("Anslutningen bröts. Gå tillbaka och anslut igen.")});connection.on("error",()=>setStatus("error"))});
    peer.on("error",()=>{setStatus("error");setError("Kunde inte ansluta till rummet.")});
  };

  useEffect(()=>{
    const latest=state.placedCities.at(-1);
    if(!latest||normalizeSong(latest.city.name)!=="skelleftea"||lastSaikTurnRef.current===latest.turnNumber)return;
    lastSaikTurnRef.current=latest.turnNumber;
    if(role==="guest")return;
    void (async()=>{
      try{
        const tracks=await searchApple("Skellefteå AIK");
        if(!tracks.length)return;
        const track=tracks[Math.floor(Math.random()*tracks.length)];
        if(!track.previewUrl)return;
        const title=`${track.artistName??"Skellefteå AIK"} – ${track.trackName??"Easter egg"}`;
        if(sound)playRemotePreview(track.previewUrl);
        if(role==="host")broadcast({type:"MUSIC",previewUrl:track.previewUrl,title});
      }catch{}
    })();
  },[broadcast,role,sound,state.placedCities]);
  useEffect(()=>{
    const latest=state.placedCities.at(-1);
    if(!latest||normalizeSong(latest.city.name)!=="skelleftea"||lastSkellefteaVisualTurnRef.current===latest.turnNumber)return;
    lastSkellefteaVisualTurnRef.current=latest.turnNumber;setShowSkellefteaPlayer(true);
    const timer=window.setTimeout(()=>setShowSkellefteaPlayer(false),10000);
    return()=>window.clearTimeout(timer);
  },[state.placedCities]);
  useEffect(()=>{
    const latest=state.placedCities.at(-1);
    if(!latest||normalizeSong(latest.city.name)!=="ornskoldsvik"||lastOrnskoldsvikTurnRef.current===latest.turnNumber)return;
    lastOrnskoldsvikTurnRef.current=latest.turnNumber;setShowOrnskoldsvikEgg(true);
    const timer=window.setTimeout(()=>setShowOrnskoldsvikEgg(false),10000);
    return()=>window.clearTimeout(timer);
  },[state.placedCities]);
  useEffect(()=>{
    if(state.phase==="setup")return;
    window.scrollTo(0,0);
    document.documentElement.scrollTop=0;
    document.body.scrollTop=0;
  },[state.phase]);
  useEffect(()=>{
    if(!nordicMenu)return;
    window.scrollTo(0,0);
    const previous=document.body.style.overflow;
    document.body.style.overflow="hidden";
    return()=>{document.body.style.overflow=previous};
  },[nordicMenu]);
  useEffect(()=>{localStorage.setItem("blindkarta_sound",sound?"on":"off")},[sound]);
  useEffect(()=>{setLeft(15)},[state.currentPlayerIndex,state.phase]);
  useEffect(()=>{if(state.phase==="gameover")setShowGameResult(!state.crossingLines);else setShowGameResult(true)},[state.phase,state.crossingLines]);
  useEffect(()=>{if(role!=="host"||status!=="connected")return;broadcast({type:"STATE",state:toWireState(state)})},[broadcast,role,state,status]);
  useEffect(()=>{const added=state.unlockedCountries.find(country=>!previousUnlockedRef.current.includes(country));previousUnlockedRef.current=state.unlockedCountries;if(added&&added!=="sweden"){setArrivalCountry(added);const timer=window.setTimeout(()=>setArrivalCountry(null),10000);return()=>window.clearTimeout(timer)}},[state.unlockedCountries]);
  useEffect(()=>{if(state.phase!=="playing"||state.mode!=="blitz"||role==="guest")return;const t=setInterval(()=>setLeft(v=>{const next=v<=1?15:v-1;if(role==="host")broadcast({type:"TIMER",seconds:next});if(v<=1)game.eliminateOnTimeout();return next}),1000);return()=>clearInterval(t)},[broadcast,game.eliminateOnTimeout,role,state.currentPlayerIndex,state.mode,state.phase]);
  useEffect(()=>()=>stopNetwork(),[stopNetwork]);

  const counts=useMemo(()=>state.players.map((_,i)=>state.placedCities.filter(p=>p.playerIndex===i).length),[state.players,state.placedCities]);
  const currentOnlineId=lobby[state.currentPlayerIndex]?.id;
  const isMyTurn=role==="offline"||currentOnlineId===playerId;
  const currentConnected=role==="offline"||lobby[state.currentPlayerIndex]?.connected===true;
  const submit=async(cityName:string)=>{
    if(role==="guest"){
      if(!isMyTurn||pending||!hostRef.current?.open)return{success:false,message:"Vänta tills det är din tur."};
      setPending(true);hostRef.current.send({type:"MOVE",cityName,playerId} satisfies NetworkMessage);return{success:true};
    }
    const result=await game.placeCity(cityName);if(result.success&&sound)beep();return result;
  };
  const tapCurrentPlayer=()=>{if(role==="guest")return;currentPlayerTapsRef.current++;if(currentPlayerTapsRef.current<10)return;currentPlayerTapsRef.current=0;setNordicMenu(true)};
  const activateCountry=(country:Exclude<NordicCountry,"sweden">)=>{if(country===state.country||state.unlockedCountries.includes(country))return;const meta=COUNTRY_META[country];if(meta.anthem){if(role==="offline")playRemotePreview(meta.anthem);else broadcast({type:"MUSIC",previewUrl:meta.anthem,title:`${meta.name} – nationalsång`})}game.unlockCountry(country);setNordicMenu(false)};
  const activateAllCountries=()=>{game.unlockCountries(UNLOCKABLE_COUNTRIES);setNordicMenu(false)};

  if(state.phase==="setup"){
    if(showOnline)return <OnlineLobby role={role} status={status} name={name} room={room} error={error} lobby={lobby} mode={onlineMode} country={onlineCountry} playerId={playerId} onName={setName} onRoom={setRoom} onMode={setOnlineMode} onCountry={country=>{setOnlineCountry(country);if(role==="host")broadcast({type:"LOBBY",players:lobbyRef.current,country})}} onCreate={createRoom} onJoin={joinRoom} onReady={()=>{if(role!=="guest"||!hostRef.current?.open)return;void primeRemoteAudioPlayback().then(()=>hostRef.current?.send({type:"READY",playerId} satisfies NetworkMessage))}} onBack={leaveOnline} onStart={()=>role==="host"&&lobby.length>=2&&lobby.every(p=>p.connected&&p.ready)&&game.startGame(lobby.map(p=>p.name),onlineMode,onlineCountry)}/>;
    return <><GameSetup onStart={game.startGame} onStats={()=>setStats(true)} onOnline={()=>setShowOnline(true)}/>{stats&&<StatsPanel onClose={()=>setStats(false)}/>}</>;
  }

  return <main className="game-shell">
    <header className="topbar"><button className="brand compact brand-secret" onClick={()=>{if(role!=="host")return;const taps=logoTaps+1;setLogoTaps(taps);if(taps>=5){setDevMenu(true);setLogoTaps(0)}}}><span className="brand-mark">O</span><span>ORTEN <b>{role==="offline"?"2.0":"ONLINE"}</b></span></button><div className="top-actions">{role!=="offline"&&<span className={`connection-pill ${status}`}>{status==="connected"?`RUM ${room.toUpperCase()}`:"ANSLUTER…"}</span>}<span className={`mode-pill ${state.mode}`}>{state.mode==="blitz"?"BLITZ · 15 S":"KLASSISK"}</span><button aria-label="Ljud av eller på" onClick={()=>setSound(v=>!v)}>{sound?"♪":"×"}</button><button onClick={()=>confirm("Avsluta matchen?")&&(role==="offline"?game.resetGame():leaveOnline())}>↗</button></div></header>
    <section className="play-layout">
      <aside className="status-panel">
        <div className="turn-label">Tur {state.placedCities.length+1} · {game.activeCount} kvar</div>
        <div className="current-player secret-trigger" onPointerDown={event=>event.preventDefault()} onClick={tapCurrentPlayer}><span style={{background:PLAYER_COLORS[state.currentPlayerIndex]}}>{state.currentPlayerIndex+1}</span><div><small>{isMyTurn?"DIN TUR":"NU SPELAR"}</small><h2>{game.currentPlayer}</h2></div>{state.mode==="blitz"&&<div className={`timer ${left<=5?"danger":""}`}><b>{left}</b><small>SEK</small></div>}</div>
        {state.mode==="blitz"&&<div className="timer-track"><i style={{width:`${left/15*100}%`}}/></div>}
        {!currentConnected&&<p className="connection-warning">Spelet väntar på att {game.currentPlayer} återansluter.</p>}
        <div className="scoreboard">{state.players.map((p,i)=><div key={p} className={`${i===state.currentPlayerIndex?"active":""} ${state.eliminated[i]?"out":""}`}><span style={{background:PLAYER_COLORS[i]}}>{i+1}</span><b>{p}</b><small>{counts[i]} orter</small><strong>{state.scores[i]||0} p</strong></div>)}</div>
        <section className="city-history"><div className="city-history-title"><b>VALDA ORTER</b><span>{state.placedCities.length}</span></div>{state.placedCities.length===0?<p>Inga orter valda ännu</p>:<ol>{state.placedCities.map((placed,index)=><li key={`${placed.turnNumber}-${placed.city.name}`} className={index===state.placedCities.length-1?"latest":""}><i style={{background:PLAYER_COLORS[placed.playerIndex]}}/><span>{placed.turnNumber}</span><b>{placed.city.name}</b><small>{state.players[placed.playerIndex]}</small></li>)}</ol>}</section>
        <div className="desktop-input"><CityInput country={state.country} unlockedCountries={state.unlockedCountries} usedCityNames={state.usedCityNames} onPlaceCity={submit} disabled={!isMyTurn||pending||!currentConnected}/></div>
        {role!=="guest"&&<button className="undo" disabled={!game.canUndo} onClick={game.undoLastMove}>↶ Ångra senaste drag</button>}
      </aside>
      <section className="map-wrap"><GameBoard state={state}/><div className="map-caption"><span><i/> Senaste ort</span><strong>{state.placedCities.at(-1)?.city.name||"Väntar på första orten"}</strong></div></section>
      <div className="mobile-input"><CityInput country={state.country} unlockedCountries={state.unlockedCountries} usedCityNames={state.usedCityNames} onPlaceCity={submit} disabled={!isMyTurn||pending||!currentConnected}/></div>
    </section>
    {arrivalCountry&&<div className="country-arrival" style={{borderColor:COUNTRY_META[arrivalCountry].color,color:COUNTRY_META[arrivalCountry].color}}>{COUNTRY_META[arrivalCountry].flag} {COUNTRY_META[arrivalCountry].name.toLocaleUpperCase("sv")} HAR ANSLUTIT</div>}
    {showSkellefteaPlayer&&<img className="skelleftea-player-egg" src="./skelleftea-player.png" alt="Tecknad Björklöven-spelare"/>}
    {showOrnskoldsvikEgg&&<div className="ornskoldsvik-egg" role="dialog" aria-label="Hemligt hockeymotiv"><button onClick={()=>setShowOrnskoldsvikEgg(false)} aria-label="Stäng">×</button><img src="./ornskoldsvik-easter-egg.webp" alt="En sur Modo-spelare går ner i en källare medan en glad Björklöven-spelare går upp"/><div><b>ÖRNSKÖLDSVIK HITTAD</b><span>Olika riktningar i hockeylivet…</span><i/></div></div>}
    {nordicMenu&&<div className="modal-backdrop nordic-secret"><section className="nordic-menu"><p>HEMLIG MENY</p><h2>Aktivera ett land</h2><button disabled={UNLOCKABLE_COUNTRIES.every(country=>state.unlockedCountries.includes(country))} onClick={activateAllCountries}><span>🌍</span><b>Alla länder</b><small>Aktivera alla</small></button>{UNLOCKABLE_COUNTRIES.map(country=>{const meta=COUNTRY_META[country],active=country===state.country||state.unlockedCountries.includes(country);return <button key={country} disabled={active} onClick={()=>activateCountry(country)}><span>{meta.flag}</span><b>{meta.name}</b><small>{active?"Aktiverat":"Lås upp"}</small></button>})}<button className="text-button" onClick={()=>setNordicMenu(false)}>Stäng</button></section></div>}
    {state.lastElimination&&state.phase==="playing"&&<button className="elimination" onClick={game.clearLastElimination}><b>LINJEKORSNING</b><span>{state.lastElimination.playerName} är utslagen</span><small>Tryck för att stänga</small></button>}
    {state.phase==="gameover"&&state.crossingLines&&!showGameResult&&<div className="crossing-reveal"><b>LINJEKORSNING</b><span>De två röda linjerna korsades här</span><button onClick={()=>setShowGameResult(true)}>Visa resultat →</button></div>}
    {state.phase==="gameover"&&showGameResult&&<div className="modal-backdrop"><section className="result-card"><div className="trophy">★</div><p>MATCHEN ÄR AVGJORD</p><h1>{state.winner}</h1><h2>vinner ORTEN!</h2><div className="result-scores">{state.players.slice().sort((a,b)=>state.scores[state.players.indexOf(b)]-state.scores[state.players.indexOf(a)]).map(p=>{const i=state.players.indexOf(p);return <div key={p}><span style={{background:PLAYER_COLORS[i]}}>{i+1}</span><b>{p}</b><strong>{state.scores[i]} p</strong></div>})}</div>{state.crossingLines&&<button className="show-crossing" onClick={()=>setShowGameResult(false)}>Visa korsningen på kartan</button>}<button className="primary" onClick={role==="offline"?game.resetGame:leaveOnline}>Ny match <span>→</span></button></section></div>}
    {devMenu&&role==="host"&&<div className="dev-menu"><b>UTVECKLARLÄGE · SPELA PÅ DELTAGARNAS MOBILER</b><form className="dev-search" onSubmit={event=>{event.preventDefault();void runDevSearch()}}><input aria-label="Sök artist eller låt" value={devSearch} onChange={event=>setDevSearch(event.target.value)} placeholder="Sök artist eller låt…"/><button disabled={devMusicLoading||!devSearch.trim()} type="submit">Sök</button></form>{devResults.length>0&&<div className="dev-results">{devResults.map((track,index)=><button key={track.trackId??`${track.artistName}-${track.trackName}-${index}`} onClick={()=>playSearchResult(track)}><span>♫</span><span><strong>{track.trackName}</strong><small>{track.artistName}</small></span></button>)}</div>}<em>SNABBVAL</em>{DEV_SONGS.map(song=><button disabled={devMusicLoading} key={`${song.artist}-${song.title}`} onClick={()=>void startRoomMusic(song)}>♫ {song.artist} – {song.title}</button>)}{devMusicStatus&&<small>{devMusicStatus}</small>}<a href="https://music.apple.com/se/search" target="_blank" rel="noreferrer">Förhandslyssning via Apple Music ↗</a><button className="dev-close" onClick={()=>setDevMenu(false)}>Stäng</button></div>}
    {stats&&<StatsPanel onClose={()=>setStats(false)}/>}
  </main>
}

function OnlineLobby({role,status,name,room,error,lobby,mode,country,playerId,onName,onRoom,onMode,onCountry,onCreate,onJoin,onReady,onBack,onStart}:{role:OnlineRole;status:OnlineStatus;name:string;room:string;error:string;lobby:LobbyPlayer[];mode:GameMode;country:Country;playerId:string;onName:(v:string)=>void;onRoom:(v:string)=>void;onMode:(v:GameMode)=>void;onCountry:(v:Country)=>void;onCreate:()=>void;onJoin:()=>void;onReady:()=>void;onBack:()=>void;onStart:()=>void}){
  const ready=lobby.length>=2&&lobby.every(p=>p.connected&&p.ready),me=lobby.find(p=>p.id===playerId);
  return <main className="online-shell"><section className="online-card"><div className="brand"><span className="brand-mark">O</span><span>ORTEN <b>ONLINE</b></span></div>{role==="offline"?<><p className="eyebrow">Spela på flera enheter</p><h1>Skapa eller anslut</h1><label>DITT NAMN<input value={name} onChange={e=>onName(e.target.value.slice(0,18))} placeholder="Exempel: Anna"/></label><label>RUMSKOD<input value={room} onChange={e=>onRoom(e.target.value.slice(0,24))} placeholder="Exempel: fredag"/></label><div className="online-actions"><button onClick={onCreate}>Skapa rum</button><button onClick={onJoin}>Gå med</button></div></>:<><p className="eyebrow">{status==="connected"?"Ansluten":"Ansluter…"}</p><h1>Rum {room.toUpperCase()}</h1>{role==="host"?<div className="country-grid online-country"><button className={country==="sweden"?"selected":""} onClick={()=>onCountry("sweden")}>🇸🇪 Sverige</button><button className={country==="norway"?"selected":""} onClick={()=>onCountry("norway")}>🇳🇴 Norge</button></div>:<p className="country-label">{country==="norway"?"🇳🇴 Norge":"🇸🇪 Sverige"}</p>}<div className="lobby-list">{lobby.map(p=><div key={p.id}><i className={p.connected?"online":""}/><b>{p.name}</b><span>{p.id==="host"?"Spelledare":!p.connected?"Frånkopplad":p.ready?"Redo":"Väntar"}</span></div>)}</div>{role==="host"&&<><div className="mode-grid compact"><button className={mode==="classic"?"selected":""} onClick={()=>onMode("classic")}><strong>Klassisk</strong></button><button className={mode==="blitz"?"selected blitz":""} onClick={()=>onMode("blitz")}><strong>Blitz · 15 s</strong></button></div><button className="primary" disabled={!ready} onClick={onStart}>{ready?"Starta matchen":"Väntar på spelare"}<span>→</span></button></>}{role==="guest"&&(me?.ready?<p className="waiting-copy ready">✓ Redo. Väntar på spelledaren.</p>:<button className="primary audio-ready" onClick={onReady}>Jag är redo</button>)}</>}{error&&<p className="error">{error}</p>}<button className="text-button" onClick={onBack}>← Tillbaka</button></section></main>
}