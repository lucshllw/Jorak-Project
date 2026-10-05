export type EndingPhase='ready'|'playing'|'finishing'|'celestial'|'returning';
export function endingTransition(state:EndingPhase,event:'play'|'ended'|'present'|'repeat',loop=false):EndingPhase{
  if(event==='play'&&(state==='ready'||state==='returning'))return 'playing';
  if(event==='ended'&&state==='playing'&&!loop)return 'finishing';
  if(event==='present'&&state==='finishing')return 'celestial';
  if(event==='repeat'&&state==='celestial')return 'returning';
  return state;
}
export function coverPlatform(source:string|null|undefined){return source==='youtube'||source==='spotify'?source:'jorak';}

export function endingLinks(project:{youtubeUrl:string|null;spotifyUrl:string|null;editShowcaseUrl?:string;segments:{timeline?:string;sourceUrl?:string}[]}){
  const allowed=(value:string|undefined|null)=>{try{return value&&new URL(value).protocol==='https:'?value:null;}catch{return null;}};
  const links:{href:string;label:string}[]=[];
  const own=allowed(project.editShowcaseUrl)||allowed(project.segments.find(item=>item.timeline==='showcase')?.sourceUrl);
  if(own)links.push({href:own,label:/youtube\.com|youtu\.be/.test(new URL(own).hostname)?'Minha edição no canal do Jorak':'Edição publicada por Jorak'});
  const original=allowed(project.youtubeUrl);if(original&&original!==own)links.push({href:original,label:'Música no YouTube'});
  const spotify=allowed(project.spotifyUrl);if(spotify)links.push({href:spotify,label:'Música no Spotify'});
  return links;
}
