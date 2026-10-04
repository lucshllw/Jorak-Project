export type CharacterPlace='home'|'index'|'about'|'contact'|'products'|'academy';
export type CharacterPose='seated'|'seated-blink'|'falling'|'landing'|'leaning'|'point-side'|'point-up'|'smile';
export function characterPose(place:CharacterPlace):CharacterPose {
  switch(place){case 'home':case 'index':return 'seated';case 'about':return 'smile';case 'contact':return 'leaning';case 'products':return 'point-side';case 'academy':return 'point-up';}
}
export function poseSrc(pose:CharacterPose){return `/media/character/poses/${pose}.png`;}
