/**
 * Procedural 787-inspired study, not manufacturer CAD.
 * +X = nose, +Y = up, ±Z = span. One unit is approximately five metres.
 * All triangles are non-indexed; colors are RGB floats in [0, 1].
 */
export function createAircraft() {
  const positions = [], normals = [], colors = [], wireSegments = [], parts = [];
  const color = hex => [0, 2, 4].map(offset => parseInt(hex.slice(offset, offset + 2), 16) / 255);
  const paint = {
    body: color('e8ebf5'), belly: color('b9c0d7'), wing: color('d8dfee'),
    lowerWing: color('a8b2cc'), fin: color('969bc7'), edge: color('c8cee2'),
    window: color('353d60'), intake: color('222b46'), fan: color('7887a7'),
    spinner: color('a4b0c7'), cockpit: color('273553'),
  };
  const add = (a, b) => a.map((v, i) => v + b[i]);
  const sub = (a, b) => a.map((v, i) => v - b[i]);
  const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
  const unit = v => { const length = Math.hypot(...v); return length > 1e-10 ? v.map(n => n / length) : [0, 1, 0]; };
  const mix = (a, b, t) => a + (b-a)*t;
  function triangle(a, b, c, tint, vertexNormals) {
    const face = cross(sub(b,a), sub(c,a));
    if (Math.hypot(...face) < 1e-9) return;
    positions.push(...a,...b,...c);
    normals.push(...(vertexNormals ? vertexNormals.flat() : [...unit(face),...unit(face),...unit(face)]));
    colors.push(...tint,...tint,...tint);
  }
  function quad(a,b,c,d,tint) { triangle(a,b,c,tint); triangle(a,c,d,tint); }
  function line(a,b) { if (Math.hypot(...sub(a,b)) > 1e-7) wireSegments.push(...a,...b); }
  function loop(points) { points.forEach((point,index)=>line(point,points[(index+1)%points.length])); }
  function part(name, build) {
    const firstVertex=positions.length/3, firstWire=wireSegments.length/6;
    build(); parts.push({name,firstVertex,vertexCount:positions.length/3-firstVertex,firstWire,wireCount:wireSegments.length/6-firstWire});
  }

  const bodyRings = [
    [-6.2,.015,.12],[-5.92,.13,.10],[-5.5,.25,.065],[-4.8,.40,.025],
    [-3.9,.515,0],[-2.7,.555,0],[-1.2,.56,0],[.6,.56,0],
    [2.5,.555,0],[3.6,.53,.015],[4.35,.465,.02],[4.85,.385,.015],
    [5.25,.29,-.015],[5.6,.19,-.05],[5.9,.10,-.075],[6.2,.012,-.08],
  ];
  function bodyAt(x) {
    let index=bodyRings.findIndex(ring=>ring[0]>=x);
    if(index===0) return {radius:bodyRings[0][1],centerY:bodyRings[0][2]};
    if(index<0) return {radius:bodyRings.at(-1)[1],centerY:bodyRings.at(-1)[2]};
    const a=bodyRings[index-1],b=bodyRings[index],t=(x-a[0])/(b[0]-a[0]);
    return {radius:mix(a[1],b[1],t),centerY:mix(a[2],b[2],t)};
  }
  function bodySurface(x,angle,lift=0) {
    const {radius,centerY}=bodyAt(x);
    return [x,centerY+(radius+lift)*Math.sin(angle),(radius+lift)*Math.cos(angle)];
  }
  function lathe(rings, segments, origin, tint, {inside=false, chevrons=false, wireRings=[]}={}) {
    const points=rings.map(([x,radius,centerY=0],i)=>Array.from({length:segments},(_,j)=>{
      const angle=j/segments*Math.PI*2;
      const notch=chevrons && i===0 ? (j%2===0 ? -.10 : .035) : 0;
      return add([x+notch,centerY+radius*Math.sin(angle),radius*Math.cos(angle)],origin);
    }));
    const ns=rings.map((ring,i)=>{
      const a=rings[Math.max(0,i-1)],b=rings[Math.min(rings.length-1,i+1)];
      const slope=(b[1]-a[1])/(b[0]-a[0]||1);
      const centerSlope=((b[2]||0)-(a[2]||0))/(b[0]-a[0]||1);
      return Array.from({length:segments},(_,j)=>{
        const angle=j/segments*Math.PI*2;
        const n=unit([-slope-centerSlope*Math.sin(angle),Math.sin(angle),Math.cos(angle)]);
        return inside?n.map(v=>-v):n;
      });
    });
    for(let i=0;i<rings.length-1;i++) for(let j=0;j<segments;j++) {
      const k=(j+1)%segments,a=points[i][j],b=points[i+1][j],c=points[i+1][k],d=points[i][k];
      const faceColor=typeof tint==='function'?tint(i,j,segments):tint;
      if(inside) {
        triangle(a,c,b,faceColor,[ns[i][j],ns[i+1][k],ns[i+1][j]]);
        triangle(a,d,c,faceColor,[ns[i][j],ns[i][k],ns[i+1][k]]);
      } else {
        triangle(a,b,c,faceColor,[ns[i][j],ns[i+1][j],ns[i+1][k]]);
        triangle(a,c,d,faceColor,[ns[i][j],ns[i+1][k],ns[i][k]]);
      }
    }
    for(const i of wireRings)loop(points[i]);
    for(const j of [0,Math.floor(segments/4),Math.floor(segments/2),Math.floor(segments*3/4)]) {
      for(let i=0;i<rings.length-1;i++)line(points[i][j],points[i+1][j]);
    }
    return points;
  }
  part('fuselage',()=>{
    const points=lathe(bodyRings,40,[0,0,0],(i,j,n)=>Math.sin((j+.5)/n*Math.PI*2)<-.5?paint.belly:paint.body,{wireRings:[2,5,9,12]});
    for(const index of [0,bodyRings.length-1]) {
      const [x,,y]=bodyRings[index],center=[x,y,0];
      points[index].forEach((p,j)=>{
        const next=points[index][(j+1)%40];
        index===0?triangle(center,p,next,paint.body):triangle(center,next,p,paint.body);
      });
    }
  });

  // A curved, swept wing with a raked tip; no vertical winglet.
  const foil=[[0,0],[.055,.53],[.18,1],[.4,.87],[.7,.42],[1,0],[.7,-.18],[.4,-.34],[.18,-.36],[.055,-.23]];
  function wing(sections,side,tint=paint.wing) {
    const ring=sections.map(([span,leading,trailing,y,thickness])=>foil.map(([u,v])=>[mix(leading,trailing,u),y+v*thickness,span*side]));
    for(let i=0;i<ring.length-1;i++)for(let j=0;j<foil.length;j++) {
      const k=(j+1)%foil.length;
      const a=ring[i][j],b=ring[i][k],c=ring[i+1][k],d=ring[i+1][j];
      const material=j<5?tint:paint.lowerWing;
      if(side>0)quad(a,b,c,d,material);else quad(d,c,b,a,material);
    }
    for(const index of [0,ring.length-1]) {
      const section=sections[index],center=[(section[1]+section[2])*.5,section[3],section[0]*side];
      ring[index].forEach((p,j)=>triangle(center,p,ring[index][(j+1)%foil.length],tint));
    }
    for(const j of [0,5])for(let i=0;i<ring.length-1;i++)line(ring[i][j],ring[i+1][j]);
    for(const index of [0,Math.floor((ring.length-1)*.65),ring.length-1])line(ring[index][0],ring[index][5]);
    // The two discreet panel lines are also legible in ASCII projection.
    for(const u of [.62,.79])for(let i=0;i<sections.length-2;i++) {
      const a=sections[i],b=sections[i+1];
      line([mix(a[1],a[2],u),a[3]+a[4]*.55,a[0]*side],[mix(b[1],b[2],u),b[3]+b[4]*.55,b[0]*side]);
    }
  }
  const mainWing=[
    [.38,1.12,-2.25,-.14,.18],[1.25,.82,-2.10,-.08,.15],
    [2.55,.12,-2.20,.05,.105],[3.8,-.70,-2.48,.22,.075],
    [4.85,-1.45,-2.72,.42,.047],[5.65,-2.26,-2.94,.63,.027],
    [6.10,-3.00,-3.22,.79,.012],
  ].map(([span,...rest])=>[span*(5.93/6.10),...rest]);
  for(const side of [-1,1])part(`wing-${side<0?'port':'starboard'}`,()=>wing(mainWing,side));
  const tailWing=[
    [.25,-4.05,-5.75,.13,.085],[.95,-4.65,-5.82,.22,.065],
    [1.75,-5.31,-6.01,.35,.035],[2.35,-5.90,-6.19,.47,.013],
  ];
  for(const side of [-1,1])part(`stabilizer-${side<0?'port':'starboard'}`,()=>wing(tailWing,side));

  part('vertical-stabilizer',()=>{
    const sections=[[.32,-4.15,-5.98,.11],[1.05,-4.76,-6.05,.083],[2.22,-5.62,-6.20,.028]];
    const rings=sections.map(([height,leading,trailing,t])=>foil.map(([u,v])=>[mix(leading,trailing,u),height,v*t]));
    for(let i=0;i<rings.length-1;i++)for(let j=0;j<foil.length;j++) {
      const k=(j+1)%foil.length;quad(rings[i][j],rings[i+1][j],rings[i+1][k],rings[i][k],paint.fin);
    }
    for(const j of [0,5])for(let i=0;i<rings.length-1;i++)line(rings[i][j],rings[i+1][j]);
    line(rings.at(-1)[0],rings.at(-1)[5]);
    const tip=sections.at(-1),center=[(tip[1]+tip[2])*.5,tip[0],0];
    rings.at(-1).forEach((p,j)=>triangle(center,p,rings.at(-1)[(j+1)%foil.length],paint.fin));
  });

  function plate(points,halfDepth,z,tint) {
    const a=points.map(([x,y])=>[x,y,z-halfDepth]),b=points.map(([x,y])=>[x,y,z+halfDepth]);
    for(let i=1;i<points.length-1;i++){triangle(a[0],a[i+1],a[i],tint);triangle(b[0],b[i],b[i+1],tint);}
    for(let i=0;i<points.length;i++){const j=(i+1)%points.length;quad(a[i],a[j],b[j],b[i],tint);}
    loop(a);loop(b);
  }
  function disk(x,radius,y,z,tint,segments=40) {
    const center=[x,y,z];
    const ring=Array.from({length:segments},(_,j)=>[x,y+radius*Math.sin(j/segments*Math.PI*2),z+radius*Math.cos(j/segments*Math.PI*2)]);
    for(let j=0;j<segments;j++)triangle(center,ring[(j+1)%segments],ring[j],tint);
    return ring;
  }
  for(const side of [-1,1])part(`engine-${side<0?'port':'starboard'}`,()=>{
    const y=-.69,z=side*2.02,origin=[0,y,z];
    plate([[-.38,-.16],[.48,-.03],[1.01,-.40],[.23,-.49]],.065,z,paint.edge);
    const rings=[[.10,.24,0],[.34,.30,0],[.79,.353,0],[1.18,.355,0],[1.49,.328,0],[1.56,.308,0]];
    const outer=lathe(rings,40,origin,paint.body,{chevrons:true,wireRings:[0,5]});
    const inner=lathe([[1.28,.265,0],[1.49,.274,0],[1.56,.276,0]],40,origin,paint.intake,{inside:true});
    for(let j=0;j<40;j++){const k=(j+1)%40;quad(outer.at(-1)[j],inner.at(-1)[j],inner.at(-1)[k],outer.at(-1)[k],paint.edge);}
    disk(1.285,.264,y,z,paint.intake);
    // Visible fan blades are geometry, not a painted texture.
    for(let j=0;j<18;j++) {
      const a=j/18*Math.PI*2,b=a+.14,c=a+.36;
      const p=(r,angle)=>[1.293,y+r*Math.sin(angle),z+r*Math.cos(angle)];
      triangle(p(.067,a),p(.245,b),p(.245,c),paint.fan);
    }
    lathe([[1.29,.07,0],[1.36,.056,0],[1.42,.004,0]],24,origin,paint.spinner);
    lathe([[-.04,.16,0],[.08,.205,0],[.30,.20,0]],32,origin,paint.intake,{wireRings:[0]});
    disk(-.041,.16,y,z,paint.intake,32);
    // Join the rear scalloped edge to the exhaust lip.
    for(let j=0;j<40;j++) {
      const k=(j+1)%40,angle=j/40*Math.PI*2,next=k/40*Math.PI*2;
      const a=[.11,y+.205*Math.sin(angle),z+.205*Math.cos(angle)],b=[.11,y+.205*Math.sin(next),z+.205*Math.cos(next)];
      quad(outer[0][j],outer[0][k],b,a,paint.edge);
    }
  });

  part('cabin-windows',()=>{
    for(const side of [-1,1])for(let i=0;i<34;i++) {
      const x=-4.25+i*.22;
      const centerY=bodyAt(x).centerY+.19;
      const onBody=(dx,dy)=>{
        const section=bodyAt(x+dx),y=centerY+dy;
        return [x+dx,y,side*Math.sqrt(Math.max(0,(section.radius+.006)**2-(y-section.centerY)**2))];
      };
      const center=onBody(0,0),outline=Array.from({length:8},(_,j)=>onBody(Math.cos(j/8*Math.PI*2)*.038,Math.sin(j/8*Math.PI*2)*.063));
      outline.forEach((p,j)=>side>0?triangle(center,p,outline[(j+1)%8],paint.window):triangle(center,outline[(j+1)%8],p,paint.window));
      if(i%4===0)loop(outline);
    }
  });
  part('cockpit-glazing',()=>{
    for(const side of [-1,1])for(const [x0,x1,low,high] of [[4.70,5.02,.40,.98],[5.06,5.46,.49,1.24]]) {
      const angle=v=>side>0?v:Math.PI-v;
      const surface=(u,v)=>bodySurface(mix(x0,x1,u),angle(mix(low+.08*u,high-.08*(1-u),v)),.012);
      // Subdivide onto the curved skin so the glass does not sink into the nose.
      for(let i=0;i<4;i++)for(let j=0;j<4;j++) {
        const a=surface(i/4,j/4),b=surface((i+1)/4,j/4),c=surface((i+1)/4,(j+1)/4),d=surface(i/4,(j+1)/4);
        side>0?quad(a,b,c,d,paint.cockpit):quad(d,c,b,a,paint.cockpit);
      }
      loop([surface(0,0),surface(1,0),surface(1,1),surface(0,1)]);
    }
  });

  const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
  for(let i=0;i<positions.length;i++) { const axis=i%3;min[axis]=Math.min(min[axis],positions[i]);max[axis]=Math.max(max[axis],positions[i]); }
  const center=min.map((v,i)=>(v+max[i])/2),radius=Math.hypot(...min.map((v,i)=>(max[i]-v)/2));
  return {
    positions:new Float32Array(positions),normals:new Float32Array(normals),colors:new Float32Array(colors),
    wireSegments:new Float32Array(wireSegments),bounds:{min,max,center,radius},parts,
    name:'787-inspired aircraft',approximation:true,triangleCount:positions.length/9,
  };
}
