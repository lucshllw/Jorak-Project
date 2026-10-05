'use client';
import {useEffect,useRef} from 'react';
import * as THREE from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import gsap from 'gsap';
import {coverTextureFrame} from '@/lib/project-presentation';
type Props={cover:string;paused:boolean;exiting:boolean;onReady:()=>void;onFailure:()=>void;onFaceChange:(back:boolean)=>void;onInteract:()=>void;onBackClick:()=>void};
export default function CelestialScene(props:Props){
  const host=useRef<HTMLDivElement>(null),settings=useRef(props);settings.current=props;
  useEffect(()=>{
    const element=host.current;if(!element)return;const inputArea=element.closest<HTMLElement>('.playback-ending')||element;
    let renderer:THREE.WebGLRenderer|undefined,environment:THREE.WebGLRenderTarget|undefined,disposed=false,visible=false,loaded=false,angle=0,last=0,dragging=false,pointerId:number|undefined,lastX=0,startX=0,startY=0,moved=false,dirty=false,backFacing=false;
    const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>();
    let enter:gsap.core.Timeline|undefined,exit:gsap.core.Tween|undefined,observer:IntersectionObserver|undefined,resize:ResizeObserver|undefined;
    const low=(navigator as Navigator&{deviceMemory?:number}).deviceMemory!<=4||navigator.hardwareConcurrency<=4||window.innerWidth<700;
    const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
    const shapeMesh=(shape:THREE.Shape,material:THREE.Material,depth=.075)=>{
      const geometry=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.016,bevelThickness:.015,curveSegments:low?12:22});geometries.add(geometry);return new THREE.Mesh(geometry,material);
    };
    const mat=(options:THREE.MeshPhysicalMaterialParameters)=>{const value=new THREE.MeshPhysicalMaterial(options);materials.add(value);return value;};
    const geometry=<T extends THREE.BufferGeometry>(value:T)=>{geometries.add(value);return value;};
    const fail=()=>{if(!disposed)settings.current.onFailure();};
    let tick=(time:number)=>{},sync=()=>{},hitAvatar=(_event:PointerEvent)=>false;
    const pointerDown=(event:PointerEvent)=>{if(event.button!==0||settings.current.exiting||(event.target as Element).closest('button,a,input,select'))return;dragging=true;pointerId=event.pointerId;startX=lastX=event.clientX;startY=event.clientY;moved=false;inputArea.setPointerCapture(event.pointerId);element.dataset.dragging='true';};
    const pointerMove=(event:PointerEvent)=>{if(!dragging||event.pointerId!==pointerId)return;const dx=event.clientX-lastX;if(Math.abs(event.clientX-startX)>5&&!moved){moved=true;settings.current.onInteract();}angle+=dx*Math.PI/360;lastX=event.clientX;dirty=true;};
    const pointerUp=(event:PointerEvent)=>{if(event.pointerId!==pointerId)return;const activate=event.type==='pointerup'&&!moved&&Math.abs(event.clientY-startY)<8&&backFacing&&hitAvatar(event);dragging=false;pointerId=undefined;element.dataset.dragging='false';if(inputArea.hasPointerCapture(event.pointerId))inputArea.releasePointerCapture(event.pointerId);if(activate)settings.current.onBackClick();};
    const keyboard=(event:KeyboardEvent)=>{if((event.target as Element).closest('button,a,input,select')||event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;event.preventDefault();settings.current.onInteract();angle+=(event.key==='ArrowRight'?1:-1)*Math.PI/8;dirty=true;};
    inputArea.addEventListener('pointerdown',pointerDown);inputArea.addEventListener('pointermove',pointerMove);inputArea.addEventListener('pointerup',pointerUp);inputArea.addEventListener('pointercancel',pointerUp);inputArea.addEventListener('keydown',keyboard);
    const lost=(event:Event)=>{event.preventDefault();fail();};
    try{
      renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:low?'low-power':'high-performance'});
      renderer.setPixelRatio(Math.min(window.devicePixelRatio,low?1.25:1.75));
      renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
      renderer.domElement.setAttribute('aria-hidden','true');renderer.domElement.addEventListener('webglcontextlost',lost);
      element.appendChild(renderer.domElement);
      const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-5,5,4,-4,.1,40);camera.position.set(0,.2,12);camera.lookAt(0,.2,0);
      const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();environment=pmrem.fromScene(room,.04);scene.environment=environment.texture;room.dispose();pmrem.dispose();
      scene.add(new THREE.AmbientLight(0xc8fff0,.45));
      const key=new THREE.DirectionalLight(0xe2fff6,2.1);key.position.set(-3,5,6);scene.add(key);
      const rim=new THREE.DirectionalLight(0x39ced5,1.5);rim.position.set(3,1,-4);scene.add(rim);
      const fill=new THREE.DirectionalLight(0x4cdda0,.8);fill.position.set(2,-2,4);scene.add(fill);
      const piece=new THREE.Group(),frame=new THREE.Group(),aura=new THREE.Group();scene.add(piece,aura);piece.add(frame);
      const metal=mat({color:0x168b70,metalness:.8,roughness:.27,clearcoat:1,clearcoatRoughness:.2});
      const dark=mat({color:0x092b24,metalness:.65,roughness:.3});
      const edge=mat({color:0xa9f7dc,metalness:.5,roughness:.2,emissive:0x2a9e87,emissiveIntensity:.25});
      const auraMaterial=new THREE.MeshBasicMaterial({color:0x4cf2db,transparent:true,opacity:0,depthWrite:false,toneMapped:false,blending:THREE.AdditiveBlending});materials.add(auraMaterial);
      const glowCanvas=document.createElement('canvas');glowCanvas.width=glowCanvas.height=128;const glowContext=glowCanvas.getContext('2d')!;const glowGradient=glowContext.createRadialGradient(64,64,6,64,64,64);glowGradient.addColorStop(0,'rgba(54,229,185,0.5)');glowGradient.addColorStop(.5,'rgba(47,217,200,0.22)');glowGradient.addColorStop(1,'rgba(47,217,200,0)');glowContext.fillStyle=glowGradient;glowContext.fillRect(0,0,128,128);const glowTexture=new THREE.CanvasTexture(glowCanvas);textures.add(glowTexture);
      const glowMaterial=new THREE.SpriteMaterial({map:glowTexture,transparent:true,opacity:0,depthWrite:false,toneMapped:false,blending:THREE.AdditiveBlending});materials.add(glowMaterial);const glow=new THREE.Sprite(glowMaterial);glow.position.z=-.4;glow.scale.set(5.4,5.4,1);aura.add(glow);
      const loader=new THREE.TextureLoader();
      const load=(url:string)=>new Promise<THREE.Texture>((resolve,reject)=>{loader.load(url,value=>{if(disposed){value.dispose();return;}value.colorSpace=THREE.SRGBColorSpace;value.anisotropy=Math.min(renderer!.capabilities.getMaxAnisotropy(),4);textures.add(value);resolve(value);},undefined,reject);});
      const line=(points:THREE.Vector3[],target:THREE.Group,material:THREE.Material,radius=.013)=>{const curve=new THREE.CatmullRomCurve3(points);const tube=geometry(new THREE.TubeGeometry(curve,low?24:44,radius,5,false));target.add(new THREE.Mesh(tube,material));};
      const render=()=>{if(!disposed&&loaded&&renderer)renderer.render(scene,camera);};
      const size=()=>{const w=element.clientWidth,h=element.clientHeight;if(!w||!h)return;renderer!.setSize(w,h,false);const aspect=w/h;const halfH=Math.max(2.6,3.05/aspect);camera.left=-halfH*aspect;camera.right=halfH*aspect;camera.top=halfH+.2;camera.bottom=-halfH+.2;camera.updateProjectionMatrix();render();};
      resize=new ResizeObserver(size);resize.observe(element);
      void Promise.all([load(props.cover),load('/media/jorak-avatar-original.png')]).then(([image,logo])=>{
        if(disposed)return;
        const art=image.image as HTMLImageElement;
        const w=3.2,h=3.2,radius=w/2,segments=low?64:128;
        const crop=coverTextureFrame(art.width,art.height);image.repeat.set(crop.repeatX,crop.repeatY);image.offset.set(crop.offsetX,crop.offsetY);
        const body=new THREE.Mesh(geometry(new THREE.CylinderGeometry(radius,radius,.18,segments)),dark);body.rotation.x=Math.PI/2;piece.add(body);
        const face=new THREE.MeshBasicMaterial({map:image});materials.add(face);
        const front=new THREE.Mesh(geometry(new THREE.CircleGeometry(radius-.035,segments)),face);front.position.z=.106;piece.add(front);
        const back=new THREE.Mesh(geometry(new THREE.CircleGeometry(radius-.035,segments)),new THREE.MeshBasicMaterial({color:0x070d0c}));materials.add(back.material);back.position.z=-.106;back.rotation.y=Math.PI;piece.add(back);
        const avatarCrop=coverTextureFrame((logo.image as HTMLImageElement).width,(logo.image as HTMLImageElement).height);logo.repeat.set(avatarCrop.repeatX,avatarCrop.repeatY);logo.offset.set(avatarCrop.offsetX,avatarCrop.offsetY);
        const logoMat=new THREE.MeshBasicMaterial({map:logo,transparent:true,depthWrite:false});materials.add(logoMat);
        const reverse=new THREE.Mesh(geometry(new THREE.CircleGeometry(radius-.035,segments)),logoMat);reverse.position.z=-.11;reverse.rotation.y=Math.PI;piece.add(reverse);
        const raycaster=new THREE.Raycaster();hitAvatar=(event)=>{const rect=renderer!.domElement.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1),camera);return raycaster.intersectObject(reverse).length>0;};
        // Circular geometry matches the approved disc silhouette; UV framing keeps image proportions.
        const ring=new THREE.Shape();ring.absarc(0,0,radius+.075,0,Math.PI*2,false);
        const hole=new THREE.Path();hole.absarc(0,0,radius-.04,0,Math.PI*2,true);ring.holes.push(hole);
        const border=shapeMesh(ring,metal,.2);border.position.z=-.09;frame.add(border);
        for(const r of [radius-.045,radius+.08]){const lip=new THREE.Mesh(geometry(new THREE.TorusGeometry(r,.013,5,segments)),edge);lip.position.z=.13;frame.add(lip);}
        // Symmetrical tapered crystalline feathers and horn-like crown.
        for(const sign of [-1,1]){
          for(let i=0;i<(low?2:3);i++){
            const x=radius*.7-i*.14,y=Math.sqrt(radius*radius-x*x)-.025;
            const feather=new THREE.Shape();feather.moveTo(sign*x,y);
            feather.bezierCurveTo(sign*(x+.72),y+.15,sign*(x+.52),y+.72+i*.08,sign*(x+.15),y+1.0-i*.15);
            feather.bezierCurveTo(sign*(x+.38),y+.52,sign*(x+.15),y+.32,sign*(x-.1),y+.11);feather.closePath();
            const mesh=shapeMesh(feather,metal);mesh.position.z=.015;frame.add(mesh);
            const pts=feather.getPoints(22).map(p=>new THREE.Vector3(p.x,p.y,.105));line(pts,frame,edge,.014);
            line([new THREE.Vector3(sign*x,y+.03,.105),new THREE.Vector3(sign*(x+.22),y+.29,.105),new THREE.Vector3(sign*(x+.23),y+.54,.105)],frame,dark,.012);
          }
          const horn=new THREE.Shape();horn.moveTo(sign*.12,h/2+.09);horn.bezierCurveTo(sign*.75,h/2+.15,sign*.86,h/2+.52,sign*.64,h/2+.77);horn.bezierCurveTo(sign*.67,h/2+.36,sign*.41,h/2+.22,sign*.12,h/2+.09);
          const mesh=shapeMesh(horn,metal,.11);frame.add(mesh);
          line(horn.getPoints(20).map(p=>new THREE.Vector3(p.x,p.y,.13)),frame,edge);
        }
        const crown=new THREE.Shape();crown.moveTo(0,h/2+1.02);crown.lineTo(.18,h/2+.4);crown.lineTo(.36,h/2+.19);crown.lineTo(0,h/2-.09);crown.lineTo(-.36,h/2+.19);crown.lineTo(-.18,h/2+.4);crown.closePath();
        frame.add(shapeMesh(crown,edge,.13));
        const jewel=new THREE.Mesh(geometry(new THREE.OctahedronGeometry(.09)),dark);jewel.position.set(0,h/2+.23,.2);frame.add(jewel);
        for(const sign of [-1,1])for(let i=0;i<(low?3:6);i++){
          const points=[new THREE.Vector3(sign*.1,-h/2-.1,.15),new THREE.Vector3(sign*(w/2+.4),-h/2+.05+i*.08,.1),new THREE.Vector3(sign*(w/2+.8),h/2*.3+i*.1,0),new THREE.Vector3(sign*(w/2+.24),h/2+.42+i*.06,0)];
          line(points,aura,auraMaterial,.017+(i%2)*.016);
        }
        loaded=true;piece.scale.setScalar(preference.matches?1:.78);piece.rotation.x=preference.matches?0:-.09;
        enter=gsap.timeline({paused:!visible||document.hidden,onUpdate:render});
        enter.to(piece.scale,{x:1,y:1,z:1,duration:.7,ease:'power3.out'},0).to(piece.rotation,{x:0,duration:.8,ease:'power2.out'},0);
        enter.to(auraMaterial,{opacity:.8,duration:.45,ease:'sine.out'},.1).to(auraMaterial,{opacity:0,duration:1.7,ease:'sine.inOut'},.8);
        enter.to(glowMaterial,{opacity:.85,duration:.5},.1).to(glowMaterial,{opacity:0,duration:1.6},.9).fromTo(aura.scale,{x:.85,y:.85,z:1},{x:1.08,y:1.08,z:1,duration:2.4,ease:'sine.out'},0);
        if(preference.matches)enter.progress(1).pause();
        size();settings.current.onReady();sync();
      }).catch(fail);
      let wasExiting=false,lastPaused=false;
      tick=(time)=>{
        const dt=Math.min(time-last,.05);last=time;
        if(disposed||!loaded||!visible||document.hidden)return;
        const state=settings.current;frame.visible=true;aura.visible=!preference.matches;
        if(state.exiting&&!wasExiting){wasExiting=true;enter?.kill();exit=gsap.to(piece.scale,{x:.6,y:.6,z:.6,duration:.28,ease:'power2.in',onUpdate:render});}
        if(!state.paused&&!state.exiting&&!preference.matches&&!dragging)angle+=dt*Math.PI*2/16;
        piece.rotation.y=angle;
        const facing=Math.cos(angle)<-.15;if(facing!==backFacing){backFacing=facing;settings.current.onFaceChange(facing);}
        const changed=lastPaused!==state.paused;lastPaused=state.paused;
        element.dataset.auraVisible=String(aura.visible&&auraMaterial.opacity>.001);
        if((!state.paused&&!preference.matches||changed||dirty||enter?.isActive()||exit?.isActive())&&time*1000-(element.dataset.lastRender?Number(element.dataset.lastRender):0)>(low?32:15)){
          element.dataset.lastRender=String(time*1000);element.dataset.rotation=String(piece.rotation.y);render();dirty=false;
        }
      };
      sync=()=>{const active=visible&&!document.hidden;if(active){last=gsap.ticker.time;gsap.ticker.add(tick);if(!preference.matches)enter?.resume();}else{gsap.ticker.remove(tick);enter?.pause();}};
      observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:.05});observer.observe(element);
      document.addEventListener('visibilitychange',sync);preference.addEventListener('change',sync);
    }catch{fail();}
    return()=>{
      disposed=true;inputArea.removeEventListener('pointerdown',pointerDown);inputArea.removeEventListener('pointermove',pointerMove);inputArea.removeEventListener('pointerup',pointerUp);inputArea.removeEventListener('pointercancel',pointerUp);inputArea.removeEventListener('keydown',keyboard);gsap.ticker.remove(tick);enter?.kill();exit?.kill();observer?.disconnect();resize?.disconnect();document.removeEventListener('visibilitychange',sync);preference.removeEventListener('change',sync);
      geometries.forEach(value=>value.dispose());materials.forEach(value=>value.dispose());textures.forEach(value=>value.dispose());environment?.dispose();
      if(renderer){renderer.domElement.removeEventListener('webglcontextlost',lost);renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();}
    };
  },[props.cover]);
  return <div ref={host} className="celestial-webgl" role="group" tabIndex={0} aria-label="Disco celestial 3D. Arraste para os lados ou use as setas do teclado para girar. No verso, clique no ícone do Jorak para abrir os links."/>;
}
