/**
 * Second procedural 787-9-inspired study, not manufacturer CAD.
 * +X = nose, +Y = up, ±Z = span. 12.4 units correspond to 62.81 metres.
 * All triangles are non-indexed; colors are RGB floats in [0, 1].
 */
export function createAircraft() {
  const positions = [], normals = [], colors = [], wireSegments = [], parts = [];
  const color = hex => [0, 2, 4].map(offset => parseInt(hex.slice(offset, offset + 2), 16) / 255);
  const paint = {
    body: color('f0f3fb'), belly: color('b9c0d7'), wing: color('cbd7eb'),
    lowerWing: color('9caac5'), fin: color('adbada'), edge: color('d8e0ef'),
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

  // The cylindrical cabin reaches farther forward than in the first study.
  // Closely spaced forward rings make a short, rounded radome, not a cone.
  const bodyRings = [
    [-6.2,.012,.12],[-6.0,.070,.115],[-5.65,.160,.090],[-5.15,.280,.065],
    [-4.60,.390,.040],[-3.85,.505,.018],[-3.0,.562,0],[-1.5,.568,0],
    [.5,.568,0],[2.6,.568,0],[4.15,.568,0],[4.65,.548,.005],
    [5.05,.495,.012],[5.40,.408,-.005],[5.68,.310,-.045],
    [5.89,.216,-.079],[6.06,.119,-.105],[6.16,.047,-.112],[6.2,0,-.112],
  ];
  const bodyYScale = 5.94 / 5.77;
  function bodyAt(x) {
    let index=bodyRings.findIndex(ring=>ring[0]>=x);
    if(index===0) return {radius:bodyRings[0][1],centerY:bodyRings[0][2]};
    if(index<0) return {radius:bodyRings.at(-1)[1],centerY:bodyRings.at(-1)[2]};
    const a=bodyRings[index-1],b=bodyRings[index],t=(x-a[0])/(b[0]-a[0]);
    return {radius:mix(a[1],b[1],t),centerY:mix(a[2],b[2],t)};
  }
  function bodySurface(x,angle,lift=0) {
    const {radius,centerY}=bodyAt(x);
    return [x,centerY+(radius+lift)*Math.sin(angle)*bodyYScale,(radius+lift)*Math.cos(angle)];
  }
  function lathe(rings, segments, origin, tint, {inside=false, chevrons=false, wireRings=[],yScale=1}={}) {
    const points=rings.map(([x,radius,centerY=0],i)=>Array.from({length:segments},(_,j)=>{
      const angle=j/segments*Math.PI*2;
      const notch=chevrons && i===0 ? (j%2===0 ? -.072 : .027) : 0;
      return add([x+notch,centerY+radius*Math.sin(angle)*yScale,radius*Math.cos(angle)],origin);
    }));
    const ns=rings.map((ring,i)=>{
      const a=rings[Math.max(0,i-1)],b=rings[Math.min(rings.length-1,i+1)];
      const slope=(b[1]-a[1])/(b[0]-a[0]||1);
      const centerSlope=((b[2]||0)-(a[2]||0))/(b[0]-a[0]||1);
      return Array.from({length:segments},(_,j)=>{
        const angle=j/segments*Math.PI*2;
        const n=unit([-slope-centerSlope*Math.sin(angle)/yScale,Math.sin(angle)/yScale,Math.cos(angle)]);
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
    const points=lathe(bodyRings,40,[0,0,0],(i,j,n)=>Math.sin((j+.5)/n*Math.PI*2)<-.5?paint.belly:paint.body,{wireRings:[4,7,10,14],yScale:bodyYScale});
    for(const index of [0,bodyRings.length-1]) {
      const [x,,y]=bodyRings[index],center=[x,y,0];
      points[index].forEach((p,j)=>{
        const next=points[index][(j+1)%40];
        index===0?triangle(center,p,next,paint.body):triangle(center,next,p,paint.body);
      });
    }
  });

  // Planform guided by Boeing 787-9 general-dimensions drawing, section 2.2.2.
  // Restrained dihedral/flex and a thin raked tip; no vertical winglet.
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
      ring[index].forEach((p,j)=>{
        const next=ring[index][(j+1)%foil.length];
        const reverse=(side>0 && index===0)||(side<0 && index===ring.length-1);
        reverse?triangle(center,next,p,tint):triangle(center,p,next,tint);
      });
    }
    for(const j of [0,5])for(let i=0;i<ring.length-1;i++)line(ring[i][j],ring[i+1][j]);
    for(const index of [0,Math.floor((ring.length-1)*.65),ring.length-1])line(ring[index][0],ring[index][5]);
    // A single panel line keeps small ASCII projections from looking filled in.
    for(const u of [.73])for(let i=0;i<sections.length-2;i++) {
      const a=sections[i],b=sections[i+1];
      line([mix(a[1],a[2],u),a[3]+a[4]*.55,a[0]*side],[mix(b[1],b[2],u),b[3]+b[4]*.55,b[0]*side]);
    }
  }
  const mainWing=[
    [.40,2.02,-.72,-.195,.155],[.80,1.76,-.63,-.177,.135],
    [1.55,1.25,-.59,-.126,.105],[2.12,.84,-.57,-.077,.085],
    [3.16,.11,-.96,.028,.063],[4.22,-.64,-1.43,.154,.044],
    [5.05,-1.26,-1.83,.272,.029],[5.38,-1.52,-1.99,.334,.023],
    [5.58,-1.74,-2.12,.363,.016],[5.83,-2.08,-2.29,.407,.009],
    [5.93,-2.33,-2.35,.425,.003],
  ];
  for(const side of [-1,1])part(`wing-${side<0?'port':'starboard'}`,()=>wing(mainWing,side));
  const tailWing=[
    [.25,-4.42,-5.57,.18,.070],[.75,-4.86,-5.72,.22,.052],
    [1.35,-5.40,-5.97,.30,.033],[1.90,-5.94,-6.17,.375,.012],
    [1.955,-6.14,-6.20,.383,.004],
  ];
  for(const side of [-1,1])part(`stabilizer-${side<0?'port':'starboard'}`,()=>wing(tailWing,side));

  part('vertical-stabilizer',()=>{
    const sections=[[.36,-3.55,-5.27,.085],[.65,-4.12,-5.37,.072],[1.65,-5.08,-5.73,.040],[2.28,-5.49,-5.98,.014]];
    const rings=sections.map(([height,leading,trailing,t])=>foil.map(([u,v])=>[mix(leading,trailing,u),height,v*t]));
    for(let i=0;i<rings.length-1;i++)for(let j=0;j<foil.length;j++) {
      const k=(j+1)%foil.length;quad(rings[i][j],rings[i+1][j],rings[i+1][k],rings[i][k],paint.fin);
    }
    for(const j of [0,5])for(let i=0;i<rings.length-1;i++)line(rings[i][j],rings[i+1][j]);
    line(rings.at(-1)[0],rings.at(-1)[5]);
    const tip=sections.at(-1),center=[(tip[1]+tip[2])*.5,tip[0],0];
    rings.at(-1).forEach((p,j)=>triangle(center,rings.at(-1)[(j+1)%foil.length],p,paint.fin));
  });

  function plate(points,halfDepth,z,tint) {
    const a=points.map(([x,y])=>[x,y,z-halfDepth]),b=points.map(([x,y])=>[x,y,z+halfDepth]);
    for(let i=1;i<points.length-1;i++){triangle(a[0],a[i+1],a[i],tint);triangle(b[0],b[i],b[i+1],tint);}
    for(let i=0;i<points.length;i++){const j=(i+1)%points.length;quad(a[i],a[j],b[j],b[i],tint);}
    loop(a);loop(b);
  }
  function disk(x,radius,y,z,tint,segments=40,facing=1) {
    const center=[x,y,z];
    const ring=Array.from({length:segments},(_,j)=>[x,y+radius*Math.sin(j/segments*Math.PI*2),z+radius*Math.cos(j/segments*Math.PI*2)]);
    for(let j=0;j<segments;j++)facing>0?triangle(center,ring[(j+1)%segments],ring[j],tint):triangle(center,ring[j],ring[(j+1)%segments],tint);
    return ring;
  }
  for(const side of [-1,1])part(`engine-${side<0?'port':'starboard'}`,()=>{
    const y=-.77,z=side*1.956,origin=[0,y,z];
    plate([[.65,-.13],[1.12,-.06],[1.70,-.37],[1.04,-.48]],.055,z,paint.edge);
    const rings=[[1.03,.260,0],[1.15,.326,0],[1.53,.366,0],[1.87,.362,0],[2.06,.330,0],[2.10,.309,0]];
    const outer=lathe(rings,40,origin,paint.body,{chevrons:true,wireRings:[0,5]});
    const inner=lathe([[1.86,.270,0],[2.06,.278,0],[2.10,.280,0]],40,origin,paint.intake,{inside:true});
    for(let j=0;j<40;j++){const k=(j+1)%40;quad(outer.at(-1)[j],inner.at(-1)[j],inner.at(-1)[k],outer.at(-1)[k],paint.edge);}
    disk(1.861,.269,y,z,paint.intake);
    // Visible fan blades are geometry, not a painted texture.
    for(let j=0;j<18;j++) {
      const a=j/18*Math.PI*2,b=a+.14,c=a+.36;
      const p=(r,angle)=>[1.869,y+r*Math.sin(angle),z+r*Math.cos(angle)];
      triangle(p(.067,a),p(.245,c),p(.245,b),paint.fan);
    }
    lathe([[1.865,.070,0],[1.940,.050,0],[1.990,.004,0]],24,origin,paint.spinner);
    lathe([[.77,.130,0],[.88,.180,0],[1.13,.210,0]],32,origin,paint.intake,{wireRings:[0]});
    disk(.769,.130,y,z,paint.intake,32,-1);
    // Join the rear scalloped edge to the exhaust lip.
    for(let j=0;j<40;j++) {
      const k=(j+1)%40,angle=j/40*Math.PI*2,next=k/40*Math.PI*2;
      const a=[1.04,y+.205*Math.sin(angle),z+.205*Math.cos(angle)],b=[1.04,y+.205*Math.sin(next),z+.205*Math.cos(next)];
      quad(outer[0][j],outer[0][k],b,a,paint.edge);
    }
  });

  part('cabin-windows',()=>{
    for(const side of [-1,1])for(let i=0;i<54;i++) {
      const x=-3.90+i*.158;
      const centerY=bodyAt(x).centerY+.19;
      const onBody=(dx,dy)=>{
        const section=bodyAt(x+dx),y=centerY+dy;
        return [x+dx,y,side*Math.sqrt(Math.max(0,(section.radius+.006)**2-((y-section.centerY)/bodyYScale)**2))];
      };
      const center=onBody(0,0),outline=Array.from({length:8},(_,j)=>onBody(Math.cos(j/8*Math.PI*2)*.032,Math.sin(j/8*Math.PI*2)*.054));
      outline.forEach((p,j)=>side>0?triangle(center,p,outline[(j+1)%8],paint.window):triangle(center,outline[(j+1)%8],p,paint.window));
      if(i%7===0)loop(outline);
    }
  });
  part('cockpit-glazing',()=>{
    for(const side of [-1,1])for(const [x0,x1,low,high] of [[4.98,5.23,.24,.86],[5.27,5.70,.31,1.12]]) {
      const angle=v=>side>0?v:Math.PI-v;
      const surface=(u,v)=>bodySurface(mix(x0,x1,u),angle(mix(low+.08*u,high-.07*u,v)),.012);
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
    name:'787-9-inspired aircraft · v2',approximation:true,triangleCount:positions.length/9,
  };
}
