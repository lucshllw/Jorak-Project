import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { sourceId,validateSource,metadataIdentity } from './acquire-portfolio-media.mjs';
const source={projectSlug:'faminto-anirap',segmentId:'upload-real',authorized:true,sourceUrl:'https://x.com/Jorakeditor/status/2102371461277028767',originalUrl:'https://www.youtube.com/watch?v=_XKG7mIdLeg',expectedAuthor:'Jorakeditor',proofKind:'exclusive-upload',timeline:'showcase',kind:'edit',start:0,end:null,evidence:'Public commission attributed by its author, using its own timeline.'};
test('network input only accepts canonical reviewed public source URLs',()=>{
 assert.equal(sourceId(source.sourceUrl),'2102371461277028767');
 assert.equal(sourceId(source.originalUrl),'_XKG7mIdLeg');
 for(const url of ['http://www.youtube.com/watch?v=_XKG7mIdLeg','https://www.youtube.com/watch?v=_XKG7mIdLeg&list=private','https://x.com/another/status/2102371461277028767','https://user:secret@www.youtube.com/watch?v=_XKG7mIdLeg','https://example.com/video.mp4','file:///C:/secret.mp4'])assert.throws(()=>sourceId(url));
});
test('inferred or unauthorized sources cannot become downloadable portfolio clips',()=>{
 assert.equal(validateSource(source),'2102371461277028767');
 for(const patch of [{authorized:false},{proofKind:'chapter-boundary'},{proofKind:'inferred'},{expectedAuthor:'other'},{timeline:'original'},{end:20},{start:8}])assert.throws(()=>validateSource({...source,...patch}));
});
test('explicit cuts retain original timestamps and own commissions retain their separate timeline',()=>{
 const original={...source,sourceUrl:'https://www.youtube.com/watch?v=fZoCEzumGi8',expectedAuthor:'UC8F_XIeG-FYJ8ezSB352MYg',proofKind:'explicit-range',timeline:'original',start:241,end:270};
 assert.equal(validateSource(original),'fZoCEzumGi8');
 assert.throws(()=>validateSource({...original,end:241}));
 assert.throws(()=>validateSource({...original,timeline:'showcase'}));
});
test('every approved source belongs to a registered project and has auditable proof',async()=>{
 const plan=JSON.parse(await readFile(new URL('../data/media-sources.json',import.meta.url),'utf8'));
 const projects=JSON.parse(await readFile(new URL('../data/catalog.json',import.meta.url),'utf8')).portfolio.projects;
 for(const item of plan.sources){validateSource(item);const p=projects.find(p=>p.slug===item.projectSlug);assert.ok(p);assert.equal(item.originalUrl,p.youtubeUrl);}
});
test('X video IDs may differ from post IDs while author and source must match',()=>{
 const metadata={id:'2102371434194456576',webpage_url:source.sourceUrl,uploader_id:'Jorakeditor',channel_id:'1969578362428596224',availability:'public'};
 assert.equal(metadataIdentity(metadata,source),'2102371434194456576');
 for(const patch of [{webpage_url:source.originalUrl},{uploader_id:'another'},{availability:'private'},{id:'../private'}])assert.throws(()=>metadataIdentity({...metadata,...patch},source));
});
