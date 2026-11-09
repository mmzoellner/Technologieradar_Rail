import {Technology,escape as e,fill,ink,radius,tooltip} from './model'; 

function lines(text:string,limit=25):string[]{
  const out:string[]=[];
  let line='';
  for(const word of text.split(/\s+/)){
    if((line+' '+word).length>limit&&line){
      out.push(line);
      line='';
    }
    line+=(line?' ':'')+word;
  }
  if(line)out.push(line);
  return out;
} 

export function radarSvg(items:Technology[],cluster:boolean,prefix:string):string{ 
  const visible=items.filter(t=>!t.Archived&&t.Stage>0).sort((a,b)=>(cluster?a.Category.localeCompare(b.Category,'de'):0)||a.Name.localeCompare(b.Name,'de')); 
  const cx=600,cy=450,r=285;
  let s='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" role="group" aria-label="Technologieradar Rail" style="font-family:Segoe UI,Arial,sans-serif;background:white">'; 
  
  for(const level of [20,15,10,5])
    s+=`<circle cx="${cx}" cy="${cy}" r="${radius(level,r)}" fill="${fill(level)}"/>`; 
  
  for(let level=2;level<=20;level++)
    s+=`<circle cx="${cx}" cy="${cy}" r="${radius(level,r)}" fill="none" stroke="${level%5?'#ffffff':'#aebcc7'}" stroke-width="${level%5?0.7:1.3}"/>`; 
  
  if(!visible.length)
    s+='<text x="600" y="85" text-anchor="middle" fill="#53677b" font-size="20">Noch keine sichtbaren Technologien</text>'; 
  
  const point=(angle:number,dist:number):[number,number]=>[cx+dist*Math.cos(angle),cy+dist*Math.sin(angle)]; 
  
  if(cluster){
    let offset=0;
    const groups:{name:string;count:number}[]=[];
    for(const t of visible){
      const last=groups[groups.length-1];
      if(last&&last.name===t.Category)last.count++;
      else groups.push({name:t.Category,count:1});
    } 
    groups.forEach((g,j)=>{
      const a=-Math.PI/2+(offset-.5)*2*Math.PI/visible.length+.016;
      const sweep=g.count*2*Math.PI/visible.length-.032,b=a+sweep,rr=r+19;
      const [x1,y1]=point(a,rr),[x2,y2]=point(b,rr);
      const mid=(a+b)/2;
      const reverse=Math.sin(mid)>0;
      const path=reverse?`M ${x2} ${y2} A ${rr} ${rr} 0 ${sweep>Math.PI?1:0} 0 ${x1} ${y1}`:`M ${x1} ${y1} A ${rr} ${rr} 0 ${sweep>Math.PI?1:0} 1 ${x2} ${y2}`;
      const id=prefix+'-cat-'+j; 
      s+=`<path d="${path}" fill="none" stroke="${j%2?'#507997':'#284e74'}" stroke-width="28"/><path id="${id}" d="${path}" fill="none" stroke="none"/><text fill="white" font-size="${Math.max(8,Math.min(14,rr*sweep/(g.name.length*.65)))}" font-weight="600" dy="5"><textPath href="#${id}" startOffset="50%" text-anchor="middle">${e(g.name)}</textPath><title>${e(g.name)}</title></text>`; 
      if(groups.length>1){
        const [bx,by]=point(a-.016,r+34);
        s+=`<path d="M ${cx} ${cy} L ${bx} ${by}" stroke="#778b9e" stroke-dasharray="4 5"/>`;
      }
      offset+=g.count;
    });
  } 
  
  visible.forEach((t,i)=>{
    const a=-Math.PI/2+i*2*Math.PI/visible.length;
    const [endx,endy]=point(a,r);
    s+=`<path d="M ${cx} ${cy} L ${endx} ${endy}" stroke="#bdc9d3" stroke-width=".8"/>`;
    
    const [x,y]=point(a,radius(t.Stage,r)); 
    const marker=(target:boolean,body:string):string=>`<g tabindex="0" role="button" data-marker="${e(t.Id)}" data-target="${target}" aria-label="${e(tooltip(t,target))}" style="cursor:pointer">${body}<title>${e(tooltip(t,target))}</title></g>`; 
    
    if(t.Target!==null&&t.Target>0){
      const [tx,ty]=point(a,radius(t.Target,r));
      s+=`<path d="M ${x} ${y} L ${tx} ${ty}" stroke="${ink(t.Target)}" stroke-dasharray="3 4"/>`;
      s+=marker(true,`<circle cx="${tx}" cy="${ty}" r="12" fill="transparent"/><path d="M ${tx-6} ${ty-6} L ${tx+6} ${ty+6} M ${tx-6} ${ty+6} L ${tx+6} ${ty-6}" stroke="${ink(t.Target)}" stroke-width="2.5"/>`);
    } 

    // Ist-Stand Punkt rendern (inkl. dezentem Puls-Ring für Highlights)
    let pointBody=`<circle cx="${x}" cy="${y}" r="7" fill="${ink(t.Stage)}" stroke="white" stroke-width="2"/>`;
    if(t.Highlighted){
      pointBody+=`<circle cx="${x}" cy="${y}" r="7" fill="none" stroke="${ink(t.Stage)}" stroke-width="1.5"><animate attributeName="r" values="7;16" dur="2.5s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.8;0" dur="2.5s" repeatCount="indefinite"/></circle>`;
    }
    s+=marker(false,pointBody);

    const [lx,ly]=point(a,r+49),dx=Math.cos(a),dy=Math.sin(a);
    const text=lines(cluster?t.Name:t.Category+' — '+t.Name);
    const anchor=dx<-.15?'end':dx>.15?'start':'middle';
    const top=dy<-.3?ly-text.length*17:dy>.3?ly+12:ly-text.length*8; 
    s+=`<text data-edit="${e(t.Id)}" tabindex="0" role="button" x="${lx}" y="${top}" text-anchor="${anchor}" font-size="13" fill="#24435f" style="cursor:pointer">${text.map((v,j)=>`<tspan x="${lx}" dy="${j?17:0}">${e(v)}</tspan>`).join('')}<title>${e(t.Category+' — '+t.Name)}</title></text>`; 
  }); 

  s+='<text x="24" y="858" fill="#334b61" font-size="14">● Iststand   × Zielstand</text>'; 
  
  [20,15,10,5].forEach((v,i)=>{
    const x=260+i*230;
    s+=`<rect x="${x}" y="842" width="20" height="20" fill="${fill(v)}" stroke="${ink(v)}"/><text x="${x+29}" y="858" fill="#334b61" font-size="14">${['Hold · Beobachten','Assess · Analysieren','Trial · Erproben','Adopt · Integrieren'][i]}</text>`;
  });
  
  return s+'</svg>'; 
}