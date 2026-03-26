import { useState, useEffect, useMemo, useCallback } from "react";

const SB_URL="https://pdvwndkhbpprxssevbfv.supabase.co";
const SB_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkdnduZGtoYnBwcnhzc2V2YmZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwOTE4NTgsImV4cCI6MjA4OTY2Nzg1OH0.1HmyUinQfWsubaIo0rAJaDpL_jtlt8xIq1o_ZSVN4OU";

async function db(path, opts={}) {
  const h={apikey:SB_KEY,Authorization:"Bearer "+SB_KEY,"Content-Type":"application/json"};
  if(opts.method==="PATCH"||opts.method==="POST") h["Prefer"]="return=representation";
  try {
    const r=await fetch(SB_URL+"/rest/v1/"+path,{...opts,headers:h});
    const t=await r.text();
    return t?JSON.parse(t):[];
  } catch(e){console.error("DB:",e);return null;}
}

const PH=[
"+5492302478883","+5492302576304","+5492302502183","+5492302558826",
"+5492302557959","+5492302545231","+5492302605157","+5491138783069",
"+5491136298101","+5493385463930","+5492302572958","+5492302614304",
"+5492954648869","+5492302696370","+5492954610690",
];

const LOGO='data:image/png;base64,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ReMceuhk1q9fR87OE41EOHjSwQDs2rWL7dt3AFBfX4fjOFx33XUAtLS00L1nD4OpFKeeeirf/OY3icVi2LaNYRj09/ezceNGmpqaqKysxLZtlFJEIhFyuRxr166ls7OT5uZmampqqKysJBKJDJu1phmp3G+ADcNIjpRA1lpz4okncu+991JWVsbJJ58cPmnvJiZbtmzhxhtvRGtNfX09pmnS1dXFuHHj+N3vfkd/fz/XX389HR0dOI5DWVkZb7/9NhUVFSxZsoR33nmH888/n507d1JfX49lWaRSKfr7+3nxxRd54403uPLrX0dpzY033siFF13Ejo4Orr32Gjo7O/nZz37Gaaedxje/+U2SySSrVq0iEolwww03sHLlSpRSfP/73yeTyVBTU8PSpUu55557OOuss7jhhhvYvXs3kUiEPXv2cP311/Pmm28yceJEurq6GBwcZOnSpYwfP558Ph8YaQEgpagBbw1ggNfesmljRqoxAaRSKVzXxXVdBgcHQz0mpSSfzzN37lzKy8upra1l2bJl/PSnP2XFihVMmDCBN998k3nz5jFz5kxeeeUVHn30Ufr7+7nzzjv58pe/jGVZTJ06laOOOgqAJUuW8OSTT/Lyyy9zxhln0N7ezvz586morMR1Xb590028+OILzD76aI466igOOeQQTjzxRLq6ulBK4TgOmUyGSDTC1VdfTV1dHY899hivv/465eXl7Nmzh8cffxyAp556is7OTkzTJB6P89BDD7F+/XpuueUWHnroIX784x8zdepUOjo6vE7NIv0tpcS2h3sRe0v2yJEkGCjRq0NX/gghyGQy4U3r6+vZvn07e/bs4Zvf/GbYnHHppZcihOD+++/nqquuoqWlhXPOOYf+/n4cxwl1YU1NDaZpsmbNGm666dtMmTKV7u7dABxzzDEMpFJce/U1pNPpENDBwcGStlfDMkkNDlJVVcXUqVPRWrNx40Zqamp4+umnGRgY4PTTT6e7u5vnnnuORCKB67pks16z5OrVq1mzZg2VlZXceuutTJw4kVwuVzx24amU6FghBMWLLkcFOJGIN+5PRqs4cipeVmWaJrt37+acc87h4osvZt26dYwZM4ZIJMLAwADHHnss8+bN4+2332bNmjVcf/31RCIRXNclWGcB8OUvf5m5c+eyfPlyaupqKK8oQwP9/f186UtfYv78+by2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';
const FH="'Oswald',sans-serif";

const fmtD=function(u){try{return new Date(u).toLocaleString("es-AR",{timeZone:"America/Argentina/Buenos_Aires",weekday:"short",day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}catch(e){return""}};
const isPast=function(u){return new Date(u)<new Date()};
function calcP(ph,pa,ah,aa){var pR=ph>pa?"H":ph<pa?"A":"D",aR=ah>aa?"H":ah<aa?"A":"D";var r=0,e=0,g=0;if(pR===aR){r=2;if(ph===ah&&pa===aa)e=3;else{if(ph===ah)g++;if(pa===aa)g++;}}else{if(ph===ah)g++;if(pa===aa)g++;}return{r:r,e:e,g:g,t:r+e+g};}

function Fl(props){
  var t=props.t;var sz=props.size||28;
  if(!t||!t.flag_url)return <div style={{width:sz,height:Math.round(sz*.66),background:"#1f2d42",borderRadius:3,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:7,color:"#6b7a94",flexShrink:0}}>TBD</div>;
  return <img src={t.flag_url} alt={t.code||""} style={{width:sz,height:Math.round(sz*.66),objectFit:"cover",borderRadius:3,border:"1px solid rgba(255,255,255,0.12)",display:"block",flexShrink:0}}/>;
}

function SaveIcon(){return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;}
function SearchIcon(props){return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={props.on?"#fff":"#6b7a94"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;}
function Toast(props){return <div style={{position:"fixed",bottom:20,left:"50%",transform:"translateX(-50%)",background:"#22c55e",color:"#fff",padding:"8px 20px",borderRadius:50,fontSize:12,fontWeight:600,zIndex:999,boxShadow:"0 4px 16px rgba(0,0,0,.5)",whiteSpace:"nowrap"}}>{props.m}</div>;}

export default function App(){
  var _s=useState,_e=useEffect,_m=useMemo,_c=useCallback;
  var s1=_s("login"),vw=s1[0],setVw=s1[1];
  var s2=_s(null),me=s2[0],setMe=s2[1];
  var s3=_s([]),teams=s3[0],setTeams=s3[1];
  var s4=_s([]),matches=s4[0],setMatches=s4[1];
  var s5=_s([]),players=s5[0],setPlayers=s5[1];
  var s6=_s([]),preds=s6[0],setPreds=s6[1];
  var s7=_s(""),toast=s7[0],setToast=s7[1];
  var s8=_s("all"),sg=s8[0],setSg=s8[1];
  var s9=_s({}),ed=s9[0],setEd=s9[1];
  var s10=_s(false),ok=s10[0],setOk=s10[1];
  var s11=_s(""),lp=s11[0],setLp=s11[1];
  var s12=_s(""),rn2=s12[0],setRn2=s12[1];
  var s13=_s(""),rp2=s13[0],setRp2=s13[1];
  var s14=_s(""),cp=s14[0],setCp=s14[1];
  var s15=_s(null),exp=s15[0],setExp=s15[1];
  var s16=_s(""),errMsg=s16[0],setErrMsg=s16[1];
  var s17=_s(""),loginPin=s17[0],setLoginPin=s17[1];
  var s18=_s(""),regPin=s18[0],setRegPin=s18[1];

  var fl=function(m){setToast(m);setTimeout(function(){setToast("")},2500)};

  var load=_c(async function(){
    var res=await Promise.all([
      db("teams?order=group_id,name"),
      db("matches?order=match_number"),
      db("players?order=name"),
      db("predictions"),
    ]);
    if(!res[0]||!res[1]){setErrMsg("Error cargando datos. Reintentá.");return;}
    setTeams(res[0]||[]);setMatches(res[1]||[]);setPlayers(res[2]||[]);setPreds(res[3]||[]);
    setErrMsg("");setOk(true);
    var sid=localStorage.getItem("prode_sid");
    if(sid&&res[2]){var p=(res[2]||[]).find(function(x){return x.id===sid});if(p){setMe(p);setVw("home");}}
  },[]);

  _e(function(){load()},[load]);

  var T=function(id){return teams.find(function(t){return t.id===id})||{name:"TBD",code:"?",flag_url:null}};
  var GROUPS=_m(function(){var gs=[];teams.forEach(function(t){if(gs.indexOf(t.group_id)===-1)gs.push(t.group_id)});return gs.sort()},[teams]);

  var doLogin=async function(){
    var ph=lp.trim();if(!ph)return fl("Ingresá teléfono");
    var pin=loginPin.trim();if(!pin||pin.length<4)return fl("Ingresá tu PIN (4 dígitos)");
    var p=players.find(function(x){return x.phone===ph});
    if(!p)return fl("Teléfono no registrado");
    if(!p.pin)return fl("Todavía no te registraste. Tocá Registrate.");
    if(p.pin!==pin)return fl("PIN incorrecto");
    setMe(p);localStorage.setItem("prode_sid",p.id);setVw("home");
  };
  var doReg=async function(){
    var nm=rn2.trim(),ph=rp2.trim(),pin=regPin.trim();
    if(!nm||!ph||!pin)return fl("Completá nombre, teléfono y PIN");
    if(pin.length<4)return fl("El PIN debe tener al menos 4 dígitos");
    if(PH.indexOf(ph)===-1)return fl("Número no autorizado");
    var existing=players.find(function(x){return x.phone===ph});
    if(existing&&existing.pin)return fl("Ya registrado. Usá Entrar.");
    if(existing){await db("players?id=eq."+existing.id,{method:"PATCH",body:JSON.stringify({name:nm,pin:pin})});var updated=Object.assign({},existing,{name:nm,pin:pin});setMe(updated);localStorage.setItem("prode_sid",updated.id);await load();setVw("home");fl("¡Bienvenido!");return;}
    var r=await db("players",{method:"POST",body:JSON.stringify({name:nm,phone:ph,pin:pin})});
    if(r&&r[0]){setMe(r[0]);localStorage.setItem("prode_sid",r[0].id);await load();setVw("home");fl("¡Bienvenido!");}
    else fl("Error al registrar");
  };
  var doOut=function(){setMe(null);localStorage.removeItem("prode_sid");setVw("login")};

  var firstKick=_m(function(){if(!matches.length)return null;return matches.reduce(function(a,b){return b.kickoff_at<a?b.kickoff_at:a},matches[0].kickoff_at)},[matches]);
  var canCh=firstKick&&!isPast(firstKick);
  var doChamp=async function(){
    if(!cp)return;
    await db("players?id=eq."+me.id,{method:"PATCH",body:JSON.stringify({champion_pick:cp,champion_pick_at:new Date().toISOString()})});
    setMe(Object.assign({},me,{champion_pick:cp}));fl("🏆 Campeón guardado");await load();
  };

  var myP=_m(function(){if(!me)return{};var m={};preds.filter(function(p){return p.player_id===me.id}).forEach(function(p){m[p.match_id]=p});return m},[preds,me]);

  var doEd=function(mid,f,v){setEd(function(p){var n=Object.assign({},p);n[mid]=Object.assign({},n[mid]||{});n[mid][f]=Math.max(0,Math.min(20,parseInt(v)||0));return n})};
  var doSave=async function(mid){
    var e=ed[mid];if(!e||e.h==null||e.a==null)return fl("Completá ambos goles");
    var m=matches.find(function(x){return x.id===mid});if(isPast(m.kickoff_at))return fl("Partido ya empezó");
    var existing=myP[mid];
    if(existing){await db("predictions?id=eq."+existing.id,{method:"PATCH",body:JSON.stringify({predicted_home_goals:e.h,predicted_away_goals:e.a})});}
    else{await db("predictions",{method:"POST",body:JSON.stringify({player_id:me.id,match_id:mid,predicted_home_goals:e.h,predicted_away_goals:e.a})});}
    fl("✅ Guardado");setEd(function(p){var n=Object.assign({},p);delete n[mid];return n});await load();
  };

  var stand=_m(function(){
    var done=matches.filter(function(m){return m.home_goals!=null});
    return players.map(function(p){
      var pp=preds.filter(function(x){return x.player_id===p.id});
      var t=0,r=0,e=0,g=0;
      done.forEach(function(m){
        var pr=pp.find(function(x){return x.match_id===m.id});if(!pr)return;
        var pts=calcP(pr.predicted_home_goals,pr.predicted_away_goals,m.home_goals,m.away_goals);
        t+=pts.t;if(pts.r)r++;if(pts.e)e++;if(pts.g&&!pts.e)g++;
      });
      return Object.assign({},p,{t:t,r:r,e:e,g:g});
    }).sort(function(a,b){return b.t-a.t||b.e-a.e||a.name.localeCompare(b.name)});
  },[players,preds,matches]);

  var gm=_m(function(){var o={};matches.filter(function(m){return m.phase==="groups"}).forEach(function(m){if(!o[m.group_id])o[m.group_id]=[];o[m.group_id].push(m)});return o},[matches]);
  var finM=_m(function(){return matches.filter(function(m){return m.home_goals!=null}).sort(function(a,b){return b.match_number-a.match_number})},[matches]);

  var renderMatch=function(m,showSave){
    var ht=T(m.team_home_id),at=T(m.team_away_id);
    var pr=myP[m.id];var e=ed[m.id]||{};var lk=isPast(m.kickoff_at);var dn=m.home_goals!=null;
    var pt=null;if(dn&&pr)pt=calcP(pr.predicted_home_goals,pr.predicted_away_goals,m.home_goals,m.away_goals);
    return(
      <div key={m.id} style={{background:dn?"#1a2235":"#131927",borderRadius:10,padding:"10px 12px",marginBottom:7,border:pt&&pt.e?"2px solid #d4af37":pt&&pt.r?"2px solid #2d7af6":"1px solid #1f2d42",position:"relative"}}>
        {pt&&pt.e>0?<div style={{position:"absolute",top:0,right:0,background:"#d4af37",color:"#000",fontSize:8,fontWeight:800,padding:"1px 8px",borderRadius:"0 10px 0 8px"}}>EXACTO +{pt.t}</div>:null}
        {pt&&!pt.e&&pt.r>0?<div style={{position:"absolute",top:0,right:0,background:"#2d7af6",color:"#fff",fontSize:8,fontWeight:800,padding:"1px 8px",borderRadius:"0 10px 0 8px"}}>RESULTADO +{pt.t}</div>:null}
        {pt&&!pt.r&&pt.g>0?<div style={{position:"absolute",top:0,right:0,background:"#4a5568",color:"#fff",fontSize:8,fontWeight:800,padding:"1px 8px",borderRadius:"0 10px 0 8px"}}>PARCIAL +{pt.t}</div>:null}
        <div style={{fontSize:9,color:"#6b7a94",marginBottom:6,display:"flex",justifyContent:"space-between"}}><span>#{m.match_number} · Grupo {m.group_id} · {m.city}</span><span>{fmtD(m.kickoff_at)}</span></div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <div style={{display:"flex",alignItems:"center",gap:5,flex:1,justifyContent:"flex-end",minWidth:0}}><span style={{fontSize:12,fontWeight:600,textAlign:"right",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ht.name}</span><Fl t={ht} size={28}/></div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",minWidth:70}}>
            {dn?<div style={{display:"flex",gap:5,alignItems:"center"}}><span style={{fontSize:20,fontWeight:800,fontFamily:FH}}>{m.home_goals}</span><span style={{fontSize:12,color:"#6b7a94"}}>-</span><span style={{fontSize:20,fontWeight:800,fontFamily:FH}}>{m.away_goals}</span></div>
            :lk?(pr?<div style={{display:"flex",gap:4,opacity:.65,alignItems:"center",background:"#1a2235",padding:"3px 8px",borderRadius:5}}><span style={{fontSize:15,fontWeight:700,fontFamily:FH}}>{pr.predicted_home_goals}</span><span style={{fontSize:10,color:"#6b7a94"}}>-</span><span style={{fontSize:15,fontWeight:700,fontFamily:FH}}>{pr.predicted_away_goals}</span><span style={{fontSize:9}}>🔒</span></div>:<span style={{fontSize:9,color:"#6b7a94",fontStyle:"italic"}}>Sin pron. 🔒</span>)
            :<div style={{display:"flex",alignItems:"center",gap:3}}><input type="number" min={0} max={20} value={e.h!=null?e.h:(pr?pr.predicted_home_goals:"")} onChange={function(x){doEd(m.id,"h",x.target.value)}} style={ni} placeholder="-"/><span style={{fontWeight:700,color:"#6b7a94",fontSize:12}}>-</span><input type="number" min={0} max={20} value={e.a!=null?e.a:(pr?pr.predicted_away_goals:"")} onChange={function(x){doEd(m.id,"a",x.target.value)}} style={ni} placeholder="-"/></div>}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:5,flex:1,minWidth:0}}><Fl t={at} size={28}/><span style={{fontSize:12,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{at.name}</span></div>
          {showSave&&!dn&&!lk?<button onClick={function(){doSave(m.id)}} title="Guardar" style={{background:"#22c55e",border:"none",borderRadius:6,cursor:"pointer",padding:"5px 8px",display:"flex",alignItems:"center",flexShrink:0,marginLeft:2}}><SaveIcon/></button>:null}
        </div>
        {dn&&pr?<div style={{fontSize:9,color:"#4ade80",textAlign:"center",marginTop:3}}>Tu pronóstico: {pr.predicted_home_goals} - {pr.predicted_away_goals}</div>:null}
      </div>
    );
  };

  var renderResult=function(m){
    if(m.home_goals==null)return null;
    var ht=T(m.team_home_id),at=T(m.team_away_id);var isE=exp===m.id;
    var ppData=players.map(function(p){
      var pr=preds.find(function(x){return x.player_id===p.id&&x.match_id===m.id});
      if(!pr)return Object.assign({},p,{pr:null,pt:null});
      return Object.assign({},p,{pr:pr,pt:calcP(pr.predicted_home_goals,pr.predicted_away_goals,m.home_goals,m.away_goals)});
    }).sort(function(a,b){return(b.pt?b.pt.t:0)-(a.pt?a.pt.t:0)});
    return(
      <div key={m.id} style={{background:"#131927",borderRadius:10,marginBottom:8,border:"1px solid #1f2d42",overflow:"hidden"}}>
        <div style={{padding:"10px 12px",display:"flex",alignItems:"center",gap:6}}>
          <div style={{display:"flex",alignItems:"center",gap:5,flex:1,justifyContent:"flex-end",minWidth:0}}><span style={{fontSize:12,fontWeight:600,textAlign:"right",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ht.name}</span><Fl t={ht} size={26}/></div>
          <div style={{display:"flex",gap:5,alignItems:"center",minWidth:60,justifyContent:"center"}}><span style={{fontSize:20,fontWeight:800,fontFamily:FH}}>{m.home_goals}</span><span style={{fontSize:12,color:"#6b7a94"}}>-</span><span style={{fontSize:20,fontWeight:800,fontFamily:FH}}>{m.away_goals}</span></div>
          <div style={{display:"flex",alignItems:"center",gap:5,flex:1,minWidth:0}}><Fl t={at} size={26}/><span style={{fontSize:12,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{at.name}</span></div>
          <button onClick={function(){setExp(isE?null:m.id)}} style={{background:isE?"#2d7af6":"#1a2235",border:"none",borderRadius:6,cursor:"pointer",padding:"5px 7px",flexShrink:0,display:"flex",alignItems:"center"}}><SearchIcon on={isE}/></button>
        </div>
        <div style={{fontSize:8,color:"#6b7a94",padding:"0 12px 6px",marginTop:-4}}>#{m.match_number} · Grupo {m.group_id} · {fmtD(m.kickoff_at)}</div>
        {isE?<div style={{borderTop:"1px solid #1f2d42",padding:"8px 12px",background:"#0d1117"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 60px 50px",gap:4,marginBottom:4}}><span style={{fontSize:9,fontWeight:700,color:"#6b7a94"}}>JUGADOR</span><span style={{fontSize:9,fontWeight:700,color:"#6b7a94",textAlign:"center"}}>PRON.</span><span style={{fontSize:9,fontWeight:700,color:"#6b7a94",textAlign:"center"}}>PTS</span></div>
          {ppData.map(function(p){return <div key={p.id} style={{display:"grid",gridTemplateColumns:"1fr 60px 50px",gap:4,padding:"4px 0",borderBottom:"1px solid #1a2235",alignItems:"center"}}>
            <span style={{fontSize:11,fontWeight:p.id===(me?me.id:null)?700:400,color:p.id===(me?me.id:null)?"#2d7af6":"#e8ecf4"}}>{p.name}</span>
            <span style={{fontSize:11,textAlign:"center",color:p.pr?"#e8ecf4":"#4a5568",fontFamily:FH,fontWeight:600}}>{p.pr?p.pr.predicted_home_goals+" - "+p.pr.predicted_away_goals:"—"}</span>
            <span style={{textAlign:"center",fontSize:12,fontWeight:800,fontFamily:FH,color:p.pt?(p.pt.e?"#d4af37":p.pt.r?"#2d7af6":p.pt.g?"#9ca3af":"#4a5568"):"#4a5568"}}>{p.pt?(p.pt.t>0?"+"+p.pt.t:"0"):"—"}</span>
          </div>})}
        </div>:null}
      </div>
    );
  };

  if(errMsg)return(<div style={rt}><style>{CSS}</style><div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:32,textAlign:"center"}}><div style={{fontSize:48,marginBottom:16}}>⚠️</div><p style={{color:"#6b7a94",fontSize:14,marginBottom:16}}>{errMsg}</p><button onClick={function(){setErrMsg("");load()}} style={{padding:"10px 30px",background:"#2d7af6",border:"none",borderRadius:7,color:"#fff",fontWeight:700,cursor:"pointer"}}>Reintentar</button></div></div>);

  if(!ok)return(<div style={rt}><style>{CSS}</style><div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",gap:14}}><img src={LOGO} alt="Leyendas" style={{width:70,height:70,objectFit:"contain"}}/><p style={{color:"#6b7a94",fontSize:13}}>Cargando Prode Leyendas 2026...</p></div></div>);

  if(vw==="login"||vw==="register")return(
    <div style={rt}><style>{CSS}</style>
    <div style={{maxWidth:340,margin:"0 auto",padding:"50px 20px"}}>
      <div style={{textAlign:"center",marginBottom:24}}>
        <img src={LOGO} alt="Leyendas" style={{width:90,height:90,borderRadius:12,marginBottom:8,objectFit:"contain"}}/>
        <h1 style={{fontFamily:FH,fontSize:28,fontWeight:900,background:"linear-gradient(135deg,#d4af37,#2d7af6)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>PRODE LEYENDAS</h1>
        <p style={{fontFamily:FH,fontSize:18,color:"#d4af37",letterSpacing:5}}>2026</p>
        <p style={{fontSize:11,color:"#6b7a94",marginTop:4}}>Mundial USA · México · Canadá</p>
      </div>
      {vw==="login"?(<div>
        <label style={lb}>Tu teléfono (con código de país)</label>
        <input type="tel" value={lp} onChange={function(e){setLp(e.target.value)}} placeholder="+549..." style={fi}/>
        <label style={{fontSize:10,fontWeight:600,color:"#6b7a94",display:"block",marginBottom:4,marginTop:10}}>Tu PIN</label>
        <input type="password" inputMode="numeric" maxLength={6} value={loginPin} onChange={function(e){setLoginPin(e.target.value.replace(/\D/g,""))}} placeholder="4 dígitos" style={fi} onKeyDown={function(e){if(e.key==="Enter")doLogin()}}/>
        <button onClick={doLogin} style={pb}>Entrar</button>
        <p style={{textAlign:"center",marginTop:14,fontSize:12,color:"#6b7a94"}}>¿Primera vez? <span onClick={function(){setVw("register")}} style={{color:"#2d7af6",cursor:"pointer",fontWeight:700}}>Registrate</span></p>
      </div>):(<div>
        <label style={lb}>Tu nombre</label>
        <input value={rn2} onChange={function(e){setRn2(e.target.value)}} placeholder="Ej: Juan" style={fi}/>
        <label style={{fontSize:10,fontWeight:600,color:"#6b7a94",display:"block",marginBottom:4,marginTop:10}}>Tu teléfono</label>
        <input type="tel" value={rp2} onChange={function(e){setRp2(e.target.value)}} placeholder="+549..." style={fi}/>
        <label style={{fontSize:10,fontWeight:600,color:"#6b7a94",display:"block",marginBottom:4,marginTop:10}}>Elegí un PIN (4 dígitos mínimo)</label>
        <input type="password" inputMode="numeric" maxLength={6} value={regPin} onChange={function(e){setRegPin(e.target.value.replace(/\D/g,""))}} placeholder="Ej: 1234" style={fi}/>
        <button onClick={doReg} style={pb}>Registrarme</button>
        <p style={{textAlign:"center",marginTop:14,fontSize:12,color:"#6b7a94"}}>¿Cuenta? <span onClick={function(){setVw("login")}} style={{color:"#2d7af6",cursor:"pointer",fontWeight:700}}>Entrá</span></p>
      </div>)}
    </div>{toast?<Toast m={toast}/>:null}</div>
  );

  var predCount=Object.keys(myP).length;
  var finCount=finM.length;
  var mySt=stand.find(function(x){return x.id===(me?me.id:null)});

  return(
    <div style={rt}><style>{CSS}</style>
    <header style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",borderBottom:"1px solid #1f2d42",background:"rgba(10,14,23,.96)",position:"sticky",top:0,zIndex:50}}>
      <div style={{display:"flex",alignItems:"center",gap:7}}><img src={LOGO} alt="Leyendas" style={{width:32,height:32,borderRadius:4,objectFit:"contain"}}/><div><div style={{fontFamily:FH,fontSize:16,fontWeight:800,color:"#d4af37",lineHeight:1}}>PRODE LEYENDAS 2026</div><div style={{fontSize:9,color:"#6b7a94"}}>{me?me.name:""}</div></div></div>
      <button onClick={doOut} style={{background:"none",border:"1px solid #1f2d42",color:"#6b7a94",fontSize:10,cursor:"pointer",padding:"3px 10px",borderRadius:5}}>Salir</button>
    </header>
    <nav style={{display:"flex",gap:2,padding:"5px 8px",borderBottom:"1px solid #1f2d42",overflowX:"auto",background:"#0a0e17"}}>
      {[["home","🏠 Inicio"],["pred","🔮 Pronósticos"],["results","📊 Resultados"],["stand","🏆 Tabla"],["rules","📋 Reglas"]].map(function(x){return <button key={x[0]} onClick={function(){setVw(x[0])}} style={{background:vw===x[0]?"#131927":"none",border:"none",color:vw===x[0]?"#d4af37":"#6b7a94",fontSize:11,padding:"7px 9px",cursor:"pointer",borderRadius:6,fontWeight:vw===x[0]?700:400,whiteSpace:"nowrap"}}>{x[1]}</button>})}
    </nav>
    <main style={{padding:"10px 12px 80px",maxWidth:620,margin:"0 auto",width:"100%"}}>

    {vw==="home"?<div>
      <div style={cd}><div style={ct}>🏆 ELEGÍ AL CAMPEÓN</div>
        {canCh?<div>
          {me&&me.champion_pick?<div style={{textAlign:"center",marginBottom:10}}><div style={{fontSize:12,color:"#6b7a94",marginBottom:4}}>Tu elección actual:</div><div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><span style={{fontSize:22,fontWeight:800,fontFamily:FH,color:"#d4af37"}}>{me.champion_pick}</span></div><div style={{fontSize:9,color:"#6b7a94",marginTop:4}}>Podés cambiarlo hasta el 1° partido</div></div>:null}
          <div style={{fontSize:11,color:"#6b7a94",marginBottom:6}}>+10 pts si acertás. {me&&me.champion_pick?"Cambiá tu elección:":"Elegí antes del 1° partido:"}</div>
          <select value={cp} onChange={function(e){setCp(e.target.value)}} style={fi}><option value="">Seleccioná...</option>{teams.slice().sort(function(a,b){return a.name.localeCompare(b.name)}).map(function(t){return <option key={t.id} value={t.name}>{t.name}</option>})}</select>
          <button onClick={doChamp} style={{width:"100%",padding:"11px",background:cp?"linear-gradient(135deg,#2d7af6,#1d5bbf)":"#1f2d42",border:"none",borderRadius:7,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",marginTop:12}}>{me&&me.champion_pick?"Cambiar Campeón":"Confirmar Campeón"}</button>
        </div>
        :me&&me.champion_pick?<div style={{textAlign:"center"}}><div style={{fontSize:12,color:"#6b7a94",marginBottom:6}}>Tu elección:</div><div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><span style={{fontSize:22,fontWeight:800,fontFamily:FH,color:"#d4af37"}}>{me.champion_pick}</span></div><div style={{fontSize:9,color:"#ef4444",marginTop:4}}>🔒 Plazo cerrado</div></div>
        :<div style={{fontSize:11,color:"#6b7a94",textAlign:"center"}}>Plazo terminado - no elegiste campeón</div>}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7,marginBottom:12}}>
        <div style={cd}><div style={{textAlign:"center"}}><div style={{fontSize:20}}>⚽</div><div style={{fontSize:18,fontWeight:800,fontFamily:FH,color:"#d4af37"}}>{finCount}/{matches.length}</div><div style={{fontSize:9,color:"#6b7a94"}}>Jugados</div></div></div>
        <div style={cd}><div style={{textAlign:"center"}}><div style={{fontSize:20}}>🔮</div><div style={{fontSize:18,fontWeight:800,fontFamily:FH,color:"#d4af37"}}>{predCount}</div><div style={{fontSize:9,color:"#6b7a94"}}>Pronósticos</div></div></div>
        <div style={cd}><div style={{textAlign:"center"}}><div style={{fontSize:20}}>⭐</div><div style={{fontSize:18,fontWeight:800,fontFamily:FH,color:"#d4af37"}}>{mySt?mySt.t:0}</div><div style={{fontSize:9,color:"#6b7a94"}}>Mis puntos</div></div></div>
      </div>
      <div style={cd}><div style={ct}>🏆 CLASIFICACIÓN</div>
        {stand.slice(0,5).map(function(x,i){return <div key={x.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:i<Math.min(4,stand.length-1)?"1px solid #1f2d42":"none"}}><div style={{display:"flex",alignItems:"center",gap:7}}><span style={{fontSize:14,fontWeight:800,fontFamily:FH,color:i===0?"#d4af37":"#6b7a94",width:22}}>{i+1}°</span><span style={{fontSize:12,fontWeight:x.id===(me?me.id:null)?700:400,color:x.id===(me?me.id:null)?"#2d7af6":"#e8ecf4"}}>{x.name}</span></div><span style={{fontSize:14,fontWeight:800,fontFamily:FH,color:"#d4af37"}}>{x.t}</span></div>})}
      </div>
      <div style={cd}><div style={ct}>📅 PRÓXIMOS SIN PRONÓSTICO</div>
        {matches.filter(function(m){return !isPast(m.kickoff_at)&&!myP[m.id]}).sort(function(a,b){return new Date(a.kickoff_at)-new Date(b.kickoff_at)}).slice(0,4).map(function(m){return renderMatch(m,true)})}
        {matches.filter(function(m){return !isPast(m.kickoff_at)&&!myP[m.id]}).length===0?<p style={{fontSize:11,color:"#4ade80",textAlign:"center"}}>¡Todos pronosticados!</p>:null}
      </div>
    </div>:null}

    {vw==="pred"?<div>
      <div style={{fontFamily:FH,fontSize:18,fontWeight:800,margin:"14px 0 10px"}}>🔮 Pronósticos</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:3,marginBottom:12}}>
        <button onClick={function(){setSg("all")}} style={sg==="all"?cpA:cpN}>Todos</button>
        {GROUPS.map(function(g){return <button key={g} onClick={function(){setSg(g)}} style={sg===g?cpA:cpN}>{g}</button>})}
      </div>
      {(sg==="all"?GROUPS:GROUPS.filter(function(g){return g===sg})).map(function(g){return <div key={g} style={{marginBottom:18}}>
        <div style={{fontFamily:FH,fontSize:13,fontWeight:800,color:"#d4af37",marginBottom:7,borderBottom:"2px solid #d4af37",paddingBottom:4,display:"flex",justifyContent:"space-between",alignItems:"center"}}><span>GRUPO {g}</span><div style={{display:"flex",gap:4}}>{teams.filter(function(t){return t.group_id===g}).map(function(t){return <Fl key={t.id} t={t} size={18}/>})}</div></div>
        {(gm[g]||[]).map(function(m){return renderMatch(m,true)})}
      </div>})}
    </div>:null}

    {vw==="results"?<div>
      <div style={{fontFamily:FH,fontSize:18,fontWeight:800,margin:"14px 0 10px"}}>📊 Resultados</div>
      {finM.length===0?<div style={{background:"#131927",borderRadius:10,padding:30,border:"1px solid #1f2d42",textAlign:"center"}}><div style={{fontSize:40,marginBottom:10}}>📺</div><div style={{color:"#6b7a94",fontSize:13}}>Aún no hay partidos finalizados.</div><div style={{color:"#4a5568",fontSize:11,marginTop:6}}>Los resultados se cargan en vivo durante el mundial.</div></div>:finM.map(function(m){return renderResult(m)})}
      <div style={{background:"#131927",borderRadius:10,padding:10,marginTop:8,border:"1px solid #1f2d42"}}><div style={{fontSize:10,color:"#6b7a94",textAlign:"center"}}>🔍 Tocá la lupa para ver pronósticos y puntos de todos</div></div>
    </div>:null}

    {vw==="stand"?<div>
      <div style={{fontFamily:FH,fontSize:18,fontWeight:800,margin:"14px 0 10px"}}>🏆 Tabla de Posiciones</div>
      <div style={{background:"#131927",borderRadius:10,border:"1px solid #1f2d42",overflow:"hidden"}}>
        <div style={{display:"grid",gridTemplateColumns:"28px 1fr 44px 34px 34px 34px",padding:"7px 8px",background:"#1a2235",fontWeight:700,fontSize:9,color:"#6b7a94",gap:3}}><span>#</span><span>Jugador</span><span style={{textAlign:"center"}}>PTS</span><span style={{textAlign:"center"}}>RES</span><span style={{textAlign:"center"}}>EXA</span><span style={{textAlign:"center"}}>GOL</span></div>
        {stand.map(function(x,i){return <div key={x.id} style={{display:"grid",gridTemplateColumns:"28px 1fr 44px 34px 34px 34px",padding:"7px 8px",borderBottom:"1px solid #1f2d42",background:x.id===(me?me.id:null)?"rgba(212,175,55,.06)":"transparent",gap:3}}>
          <span style={{fontWeight:800,fontFamily:FH,color:i<3?"#d4af37":"#6b7a94",fontSize:13}}>{i+1}</span>
          <div style={{display:"flex",alignItems:"center",gap:4,overflow:"hidden"}}><span style={{fontSize:12,fontWeight:x.id===(me?me.id:null)?700:400,color:x.id===(me?me.id:null)?"#2d7af6":"#e8ecf4"}}>{x.name}</span>{x.champion_pick?<span style={{fontSize:8,color:"#6b7a94"}}>🏆</span>:null}</div>
          <span style={{textAlign:"center",fontWeight:800,fontFamily:FH,fontSize:15,color:"#d4af37"}}>{x.t}</span><span style={{textAlign:"center",fontSize:11,color:"#2d7af6"}}>{x.r}</span><span style={{textAlign:"center",fontSize:11,color:"#d4af37"}}>{x.e}</span><span style={{textAlign:"center",fontSize:11,color:"#6b7a94"}}>{x.g}</span>
        </div>})}
      </div>
      <div style={{marginTop:8,padding:"6px 10px",background:"#131927",borderRadius:6,fontSize:9,color:"#6b7a94"}}>PTS=Puntos · RES=Resultados · EXA=Exactos · GOL=Gol parcial</div>
    </div>:null}

    {vw==="rules"?<div>
      <div style={{fontFamily:FH,fontSize:18,fontWeight:800,margin:"14px 0 10px"}}>📋 Reglas</div>
      <div style={cd}><div style={ct}>PUNTOS</div>
        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}><span style={{background:"#2d7af6",color:"#fff",fontWeight:800,fontFamily:FH,fontSize:14,minWidth:40,textAlign:"center",padding:"2px 5px",borderRadius:5}}>+2</span><span style={{fontSize:12,flex:1}}>Acertar resultado</span></div>
        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}><span style={{background:"#d4af37",color:"#000",fontWeight:800,fontFamily:FH,fontSize:14,minWidth:40,textAlign:"center",padding:"2px 5px",borderRadius:5}}>+3</span><span style={{fontSize:12,flex:1}}>Bonus exacto (ambos goles)</span></div>
        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}><span style={{background:"#4a5568",color:"#fff",fontWeight:800,fontFamily:FH,fontSize:14,minWidth:40,textAlign:"center",padding:"2px 5px",borderRadius:5}}>+1</span><span style={{fontSize:12,flex:1}}>Goles de un equipo (sin exacto)</span></div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}><span style={{background:"#d4af37",color:"#000",fontWeight:800,fontFamily:FH,fontSize:14,minWidth:40,textAlign:"center",padding:"2px 5px",borderRadius:5}}>+10</span><span style={{fontSize:12,flex:1}}>Acertar campeón</span></div>
      </div>
      <div style={cd}><div style={ct}>EJEMPLO</div>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10,padding:"6px 10px",background:"#1a2235",borderRadius:8}}><span style={{fontWeight:700}}>Argentina 2 - 1 Argelia</span></div>
        <div style={{fontSize:11,color:"#6b7a94",lineHeight:1.8}}>✅ <strong style={{color:"#e8ecf4"}}>2-1</strong> = <strong style={{color:"#d4af37"}}>5 pts</strong> · ✅ <strong style={{color:"#e8ecf4"}}>3-0</strong> = <strong style={{color:"#2d7af6"}}>2 pts</strong> · ✅ <strong style={{color:"#e8ecf4"}}>2-0</strong> = <strong style={{color:"#2d7af6"}}>3 pts</strong> · ❌ <strong style={{color:"#e8ecf4"}}>1-1</strong> = 1 pt · ❌ <strong style={{color:"#e8ecf4"}}>0-2</strong> = 0</div>
      </div>
      <div style={cd}><div style={ct}>PLAZOS</div>
        <div style={{fontSize:11,color:"#6b7a94",lineHeight:1.8}}>🏆 Campeón: hasta inicio 1° partido<br/>⚽ Pronósticos: hasta inicio de cada partido (hora ARG)<br/>🔓 Eliminatorias: se habilitan al terminar la fase previa</div>
      </div>
    </div>:null}

    </main>
    {toast?<Toast m={toast}/>:null}
    </div>
  );
}

var CSS='@import url("https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700;800&family=Source+Sans+3:wght@300;400;600;700&display=swap");*{box-sizing:border-box;margin:0;padding:0}body{background:#0a0e17;color:#e8ecf4;font-family:"Source Sans 3",sans-serif}input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none}input[type=number]{-moz-appearance:textfield}';
var rt={minHeight:"100vh",background:"#0a0e17",color:"#e8ecf4",fontFamily:"'Source Sans 3',sans-serif"};
var cd={background:"#131927",borderRadius:10,padding:14,marginBottom:10,border:"1px solid #1f2d42"};
var ct={fontFamily:"'Oswald',sans-serif",fontSize:12,fontWeight:700,color:"#d4af37",marginBottom:10,textTransform:"uppercase",letterSpacing:.8};
var lb={fontSize:10,fontWeight:600,color:"#6b7a94",display:"block",marginBottom:4};
var fi={width:"100%",padding:"10px 11px",background:"#131927",border:"1px solid #1f2d42",borderRadius:7,color:"#e8ecf4",fontSize:13,outline:"none"};
var pb={width:"100%",padding:"11px",background:"linear-gradient(135deg,#2d7af6,#1d5bbf)",border:"none",borderRadius:7,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",marginTop:12};
var ni={width:36,height:32,textAlign:"center",fontSize:15,fontWeight:700,background:"#0a0e17",border:"2px solid #1f2d42",borderRadius:5,color:"#e8ecf4",fontFamily:"'Oswald',sans-serif",outline:"none"};
var cpN={background:"#131927",border:"1px solid #1f2d42",color:"#6b7a94",padding:"4px 9px",borderRadius:5,fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"'Oswald',sans-serif"};
var cpA={background:"#d4af37",color:"#000",borderColor:"#d4af37",padding:"4px 9px",borderRadius:5,fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"'Oswald',sans-serif",border:"1px solid #d4af37"};
