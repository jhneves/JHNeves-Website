var Le=Object.defineProperty;var Ce=(i,e,t)=>e in i?Le(i,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):i[e]=t;var _=(i,e,t)=>Ce(i,typeof e!="symbol"?e+"":e,t);var y=(i,e,t)=>i<e?e:i>t?t:i,k=(i,e,t)=>i+(e-i)*t;var De=i=>1-Math.pow(1-i,3);var Pe=i=>i<.5?4*i*i*i:1-Math.pow(-2*i+2,3)/2;function M(i){let e=i>>>0,t=()=>{e|=0,e=e+1831565813|0;let s=Math.imul(e^e>>>15,1|e);return s=s+Math.imul(s^s>>>7,61|s)^s,((s^s>>>14)>>>0)/4294967296};return t.seed=i>>>0,t.fork=s=>M((i^Math.imul((s|0)+1,2654435761))>>>0),t}function ce(i,e,t,s,o){return i.v+=(-o*i.v+s*(e-i.x))*t,i.x+=i.v*t,i.x}function le(i,e,t=.16){if(i<0||i>e)return 0;let s=i/e;return s<t?De(s/t):1-Pe((s-t)/(1-t))}var J={startZoom:{label:"Start zoom",min:.1,max:1,step:.01,default:.3},viewScale:{label:"View scale",min:.4,max:2,step:.05,default:1},stepEarly:{label:"Beat step (early)",min:.7,max:.99,step:.005,default:.86},stepLate:{label:"Beat step (late)",min:.7,max:.99,step:.005,default:.965},floor:{label:"Zoom floor",min:.02,max:.4,step:.005,default:.07},punchEarly:{label:"Punch (early)",min:0,max:1.5,step:.02,default:.7},punchLate:{label:"Punch (late)",min:0,max:1.5,step:.02,default:.16},stiffLow:{label:"Stiffness (low)",min:40,max:240,step:5,default:105},stiffHigh:{label:"Stiffness (high)",min:40,max:240,step:5,default:150},dampLow:{label:"Damping (low)",min:6,max:40,step:1,default:11},dampHigh:{label:"Damping (high)",min:6,max:40,step:1,default:25}},V=class{constructor(e){this.p=e,this.x=0,this.y=0,this.reset()}reset(){this.zoomBeat=1,this.norm=this.p.startZoom,this.vel=0,this.tension=0,this.frozen=!1,this.zoom=this.norm*this.p.viewScale}onBeat(e){if(this.frozen)return;let t=Math.pow(e.index/Math.max(1,e.total-1),1.2);this.zoomBeat=Math.max(this.p.floor/this.p.startZoom,this.zoomBeat*k(this.p.stepEarly,this.p.stepLate,t)),this.vel-=this.norm*k(this.p.punchEarly,this.p.punchLate,t),this.tension=t}freeze(){this.frozen=!0,this.vel=0}step(e){if(!this.frozen){let t=this.p.startZoom*this.zoomBeat,s=k(this.p.stiffLow,this.p.stiffHigh,this.tension),o=k(this.p.dampLow,this.p.dampHigh,this.tension),a={x:this.norm,v:this.vel};ce(a,t,e,s,o),this.norm=a.x,this.vel=a.v}this.zoom=this.norm*this.p.viewScale}};var Q={w:34,h:17,zh:20};function he(i,e){return function(s,o,a=0){let r=i.zoom;return{x:(s-o)*(Q.w*.5)*r+e.W*.5+i.x,y:(s+o)*(Q.h*.5)*r-a*Q.zh*r+e.H*.5+i.y}}}var C=1/60,fe={fadeStartOffset:{label:"Finale start (vs last beat)",min:-3,max:4,step:.05,default:0},fadeDur:{label:"Map fade duration",min:.3,max:5,step:.1,default:2.1},freezeCamera:{label:"Freeze camera on finale",type:"bool",default:!0}},G=class{constructor(e,t,s){this.config=e,this.timeline=t,this.duration=e.duration||t.duration,this.seed=e.seed>>>0,this.view={W:1,H:1},this.camera=new V(ee(J,e.camera)),this.project=he(this.camera,this.view),this.finale=ee(fe,e.finale),this.layers=(e.layers||[]).map((o,a)=>{let r=s[o.type];if(!r)throw new Error("Unknown layer type: "+o.type);let c=new r(ee(r.schema,o.params));return c.id=o.id||(Ue(e.layers,o.type)>1?o.type+a:o.type),c}),this.t=0,this.reset()}get fadeStartT(){return this.timeline.lastBeatT()+(this.finale.fadeStartOffset||0)}reset(){this.rng=M(this.seed),this.t=0,this.mapFade=1,this.finaleStarted=!1,this.camera.reset();let e={rng:this.rng,timeline:this.timeline,view:this.view};this.layers.forEach((t,s)=>t.reset(this.rng.fork(101+s),e))}_world(e,t,s){return{t:e,dt:t,cues:s||[],view:this.view,cam:this.camera,project:this.project,timeline:this.timeline,mapFade:this.mapFade,rng:this.rng}}stepOnce(e){let t=this.t,s=t+e,o=this.timeline.cuesIn(t,s);this.t=s;for(let r of o)r.kind==="beat"&&this.camera.onBeat(r);this.camera.step(e),s>=this.fadeStartT&&!this.finaleStarted&&(this.finaleStarted=!0,this.finale.freezeCamera&&this.camera.freeze()),this.mapFade=y(1-(s-this.fadeStartT)/this.finale.fadeDur,0,1);let a=this._world(s,e,o);for(let r of this.layers)r.step(a)}seek(e){this.reset();let t=Math.max(0,Math.round(y(e,0,this.duration)/C));for(let s=0;s<t;s++)this.stepOnce(C)}params(){let e=[],t=(s,o,a)=>{for(let r in o){let c=o[r];e.push({path:s+"."+r,label:c.label||r,schema:c,get:()=>a[r],set:h=>{a[r]=h}})}};t("camera",J,this.camera.p),t("finale",fe,this.finale);for(let s of this.layers)t(s.id,s.constructor.schema,s.p);return e}};function ee(i,e={}){let t={};for(let s in i)t[s]="default"in i[s]?i[s].default:0;return Object.assign(t,e||{})}function Ue(i,e){return(i||[]).filter(t=>t.type===e).length}var q=class i{constructor(e){this.duration=e.duration||60,this.beats=(e.beats||[]).map(t=>typeof t=="number"?{t,v:1}:t),this.onsets=(e.onsets||[]).map(t=>typeof t=="number"?t:t.t),this.energy=e.energy||[0,1],this.energyMax=Math.max(1e-6,...this.energy)}energyAt(e){if(e<=0)return this.energy[0]||0;let t=this.energy.length-1;if(e>=t)return this.energy[t];let s=Math.floor(e);return k(this.energy[s],this.energy[s+1],e-s)}energyNorm(e){return y(this.energyAt(e)/this.energyMax,0,1)}beatCount(){return this.beats.length}lastBeatT(){return this.beats.length?this.beats[this.beats.length-1].t:this.duration}cuesIn(e,t){let s=[];for(let o=0;o<this.beats.length;o++){let a=this.beats[o].t;a>e&&a<=t&&s.push({kind:"beat",t:a,index:o,v:this.beats[o].v,total:this.beats.length})}for(let o=0;o<this.onsets.length;o++){let a=this.onsets[o];a>e&&a<=t&&s.push({kind:"onset",t:a,index:o,total:this.onsets.length})}return s}static async load(e){let t=await fetch(e);return new i(await t.json())}};function ue(i){let e=i.getContext("webgl2",{antialias:!1,alpha:!1,premultipliedAlpha:!1});if(!e)throw new Error("WebGL2 not available");return e.hdr=!!e.getExtension("EXT_color_buffer_float"),e.getExtension("OES_texture_float_linear"),e}var T=class{constructor(e,t,s){this.gl=e,this.prog=Ve(e,de(e,e.VERTEX_SHADER,t),de(e,e.FRAGMENT_SHADER,s)),this.u={},this.a={}}use(){return this.gl.useProgram(this.prog),this}loc(e){return this.u[e]??(this.u[e]=this.gl.getUniformLocation(this.prog,e))}attr(e){return this.a[e]??(this.a[e]=this.gl.getAttribLocation(this.prog,e))}set(e,t){let s=this.gl,o=this.loc(e);return o==null?this:(typeof t=="number"?s.uniform1f(o,t):t.length===2?s.uniform2fv(o,t):t.length===3?s.uniform3fv(o,t):t.length===4&&s.uniform4fv(o,t),this)}setTex(e,t,s){let o=this.gl;return o.activeTexture(o.TEXTURE0+s),o.bindTexture(o.TEXTURE_2D,t),o.uniform1i(this.loc(e),s),this}};function de(i,e,t){let s=i.createShader(e);if(i.shaderSource(s,t),i.compileShader(s),!i.getShaderParameter(s,i.COMPILE_STATUS))throw new Error((e===i.VERTEX_SHADER?"VERT":"FRAG")+` shader:
`+i.getShaderInfoLog(s)+`
`+Ge(t));return s}function Ve(i,e,t){let s=i.createProgram();if(i.attachShader(s,e),i.attachShader(s,t),i.linkProgram(s),!i.getProgramParameter(s,i.LINK_STATUS))throw new Error("link: "+i.getProgramInfoLog(s));return s}function Ge(i){return i.split(`
`).map((e,t)=>t+1+": "+e).join(`
`)}var I=class{constructor(e,t,s,{float:o=!1,linear:a=!0}={}){this.gl=e,this.float=o&&e.hdr,this.tex=e.createTexture(),this.fbo=e.createFramebuffer(),this.resize(t,s,a)}resize(e,t,s=!0){let o=this.gl;this.w=e|0,this.h=t|0,o.bindTexture(o.TEXTURE_2D,this.tex);let a=this.float?o.RGBA16F:o.RGBA8,r=this.float?o.HALF_FLOAT:o.UNSIGNED_BYTE;o.texImage2D(o.TEXTURE_2D,0,a,this.w,this.h,0,o.RGBA,r,null);let c=s?o.LINEAR:o.NEAREST;o.texParameteri(o.TEXTURE_2D,o.TEXTURE_MIN_FILTER,c),o.texParameteri(o.TEXTURE_2D,o.TEXTURE_MAG_FILTER,c),o.texParameteri(o.TEXTURE_2D,o.TEXTURE_WRAP_S,o.CLAMP_TO_EDGE),o.texParameteri(o.TEXTURE_2D,o.TEXTURE_WRAP_T,o.CLAMP_TO_EDGE),o.bindFramebuffer(o.FRAMEBUFFER,this.fbo),o.framebufferTexture2D(o.FRAMEBUFFER,o.COLOR_ATTACHMENT0,o.TEXTURE_2D,this.tex,0),o.bindFramebuffer(o.FRAMEBUFFER,null)}bind(){let e=this.gl;return e.bindFramebuffer(e.FRAMEBUFFER,this.fbo),e.viewport(0,0,this.w,this.h),this}};function pe(i,e,t){i.bindFramebuffer(i.FRAMEBUFFER,null),i.viewport(0,0,e,t)}var W=class{constructor(e){this.gl=e,this.vao=e.createVertexArray();let t=e.createBuffer();e.bindVertexArray(this.vao),e.bindBuffer(e.ARRAY_BUFFER,t),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),e.STATIC_DRAW),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,2,e.FLOAT,!1,0,0),e.bindVertexArray(null)}draw(){let e=this.gl;e.bindVertexArray(this.vao),e.drawArrays(e.TRIANGLES,0,3),e.bindVertexArray(null)}};var j=class{constructor(e,t,s,o){this.gl=e,this.count=0,this.baseN=t.length/s,this.stride=o.reduce((c,h)=>c+h.size,0)*4,this.vao=e.createVertexArray(),e.bindVertexArray(this.vao);let a=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,a),e.bufferData(e.ARRAY_BUFFER,t,e.STATIC_DRAW),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,s,e.FLOAT,!1,0,0),this.ibuf=e.createBuffer(),e.bindBuffer(e.ARRAY_BUFFER,this.ibuf);let r=0;for(let c of o)e.enableVertexAttribArray(c.loc),e.vertexAttribPointer(c.loc,c.size,e.FLOAT,!1,this.stride,r),e.vertexAttribDivisor(c.loc,1),r+=c.size*4;e.bindVertexArray(null)}upload(e,t){let s=this.gl;this.count=t,s.bindBuffer(s.ARRAY_BUFFER,this.ibuf),s.bufferData(s.ARRAY_BUFFER,e,s.DYNAMIC_DRAW)}draw(){if(!this.count)return;let e=this.gl;e.bindVertexArray(this.vao),e.drawArraysInstanced(e.TRIANGLES,0,this.baseN,this.count),e.bindVertexArray(null)}};function me(i,e){let t=[];for(let s=0;s<e;s++)for(let o=0;o<i;o++){let a=o/i,r=(o+1)/i,c=s/e,h=(s+1)/e,f=(o+.5)/i,u=(s+.5)/e,m=(p,l)=>t.push(p,l,f,u);m(a,c),m(r,c),m(r,h),m(a,c),m(r,h),m(a,h)}return new Float32Array(t)}var S=`#version 300 es
layout(location=0) in vec2 aPos;
void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;var z=`
const vec3 BONE    = vec3(0.878, 0.886, 0.902);
const vec3 BONE_HI = vec3(0.961, 0.969, 0.980);

float hash11(float p){ p = fract(p*0.1031); p *= p+33.33; p *= p+p; return fract(p); }
float hash21(vec2 p){ vec3 q = fract(vec3(p.xyx)*0.1031); q += dot(q, q.yzx+33.33); return fract((q.x+q.y)*q.z); }
float sdBox(vec2 p, vec2 b){ vec2 d = abs(p)-b; return length(max(d,0.0)) + min(max(d.x,d.y),0.0); }
float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  float a=hash21(i), b=hash21(i+vec2(1,0)), c=hash21(i+vec2(0,1)), d=hash21(i+vec2(1,1));
  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y); }
float fbm(vec2 p){ float s=0.0, a=0.5; for(int i=0;i<4;i++){ s+=a*vnoise(p); p*=2.03; a*=0.5; } return s; }
float bar(float x, float a, float b, float aa){ return smoothstep(a-aa, a+aa, x) * (1.0 - smoothstep(b-aa, b+aa, x)); }
float easeOut(float t){ return 1.0 - pow(1.0-t, 3.0); }
// soft filled rect [a,b]
float sbox(vec2 p, vec2 a, vec2 b, float aa){
  vec2 lo = smoothstep(a-aa, a+aa, p), hi = 1.0 - smoothstep(b-aa, b+aa, p);
  return lo.x*lo.y*hi.x*hi.y;
}
float disc(vec2 p, vec2 c, float r, float aa){ return 1.0 - smoothstep(r-aa, r+aa, length(p-c)); }
// a smudge: a soft mass whose coordinates are domain-warped (smeared) into an irregular
// shape, with a fuzzy falloff and internal density variation \u2014 not a defined ball.
float blob(vec2 p, vec2 c, float r, float sd){
  vec2 d = (p - c) / r;
  vec2 w = d + 0.75 * vec2(fbm(d * 1.1 + sd * 3.0) - 0.5, fbm(d * 1.1 + sd * 3.0 + 11.0) - 0.5);
  float fall = smoothstep(1.3, 0.18, length(w));        // soft irregular edge
  float tex = 0.45 + 0.6 * fbm(d * 2.4 + sd * 5.0);      // patchy interior
  return clamp(fall * tex, 0.0, 1.0);
}
// right-pointing play triangle around center c, size s
float tri(vec2 p, vec2 c, float s){ p -= c; float m = step(-s, p.x) * step(p.x, s); return m * step(abs(p.y), (s - p.x)*0.7); }
// brand-ish accents (browser cards) \u2014 muted so the bloom stays tasteful
const vec3 RED = vec3(0.93,0.27,0.22), BLUE = vec3(0.27,0.52,0.96), GREEN = vec3(0.22,0.73,0.42), YEL = vec3(0.98,0.74,0.06), PURP = vec3(0.55,0.36,0.96);
`;var ve=`#version 300 es
precision highp float;
uniform vec2 uViewport;
out vec4 frag;
void main(){
  vec2 uv = gl_FragCoord.xy / uViewport;
  float r = length((uv - vec2(0.5, 0.44)) * vec2(1.0, 1.1));
  vec3 c = mix(vec3(0.078,0.082,0.094), vec3(0.022,0.025,0.033), smoothstep(0.0, 0.7, r));
  frag = vec4(c, 1.0);
}`,be=`#version 300 es
precision highp float;
uniform sampler2D uTex; uniform vec2 uViewport; uniform float uThreshold;
out vec4 frag;
void main(){
  vec3 c = texture(uTex, gl_FragCoord.xy / uViewport).rgb;
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  frag = vec4(c * (max(0.0, l - uThreshold) / max(l, 1e-4)), 1.0);
}`,xe=`#version 300 es
precision highp float;
uniform sampler2D uTex; uniform vec2 uViewport; uniform vec2 uDir;
out vec4 frag;
void main(){
  vec2 uv = gl_FragCoord.xy / uViewport, texel = uDir / uViewport;
  float w[5]; w[0]=0.227; w[1]=0.194; w[2]=0.121; w[3]=0.054; w[4]=0.016;
  vec3 s = texture(uTex, uv).rgb * w[0];
  for(int i=1;i<5;i++){ vec2 o = texel * float(i); s += texture(uTex, uv+o).rgb*w[i] + texture(uTex, uv-o).rgb*w[i]; }
  frag = vec4(s, 1.0);
}`,ye=`#version 300 es
precision highp float;
${z}
uniform sampler2D uScene; uniform sampler2D uBloom; uniform vec2 uViewport; uniform float uTime;
uniform float uBloomAmt, uGrade, uAberr, uVignette, uGrain, uExposure, uMurk;
out vec4 frag;
vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14), 0.0, 1.0); }
void main(){
  vec2 uv = gl_FragCoord.xy / uViewport;
  vec2 d = uv - 0.5; float r = dot(d, d);
  float ab = uAberr * 0.012 * r;
  vec3 scn = vec3(texture(uScene, uv + d*ab).r, texture(uScene, uv).g, texture(uScene, uv - d*ab).b);
  vec3 bloom = texture(uBloom, uv).rgb;

  // FOG OF WAR \u2014 a patchy, slowly drifting haze veils the whole scene. The BASE is dimmed and
  // veiled (so you read silhouettes + faint colour), but the bloom is added on top, so bright
  // accents pierce the murk. Familiar shapes, half-seen in the dark.
  // FLUID fog: domain-warped fbm (flow noise) that swirls and slowly drifts
  vec2 fl = uv * 2.3;
  vec2 q = vec2(fbm(fl + vec2(0.0, uTime*0.045)), fbm(fl + vec2(5.2, 1.3) - uTime*0.035));
  vec2 w = vec2(fbm(fl + 3.0*q + vec2(1.7, 9.2) + uTime*0.02), fbm(fl + 3.0*q + vec2(8.3, 2.8) - uTime*0.025));
  float haze = fbm(fl + 3.4*w);
  float veil = mix(1.0, mix(0.28, 0.92, smoothstep(0.2, 0.85, haze)), uMurk);  // patchy, flowing visibility
  scn *= veil * uExposure;

  vec3 c = scn + bloom * uBloomAmt;                               // highlights glow through
  c = aces(c);
  c = mix(c, c * vec3(0.98, 1.0, 1.04), uGrade * 0.5);           // faint cool-neutral grade
  c *= 1.0 - uVignette * smoothstep(0.16, 0.62, length(d) + (haze - 0.5)*0.18);  // ragged edge fog
  c += vec3(0.009, 0.013, 0.021) * (0.6 + 0.4*(1.0 - haze)) * uMurk;            // cool ambient -> murk, not void
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  c = mix(vec3(l), c, mix(1.0, 0.82, uMurk));                    // mute the colour a touch
  c += (hash21(uv * uViewport + uTime) - 0.5) * uGrain;
  frag = vec4(c, 1.0);
}`;var qe={bloom:1.6,threshold:.28,grade:.9,aberration:.7,vignette:.6,grain:.05,exposure:.62,murk:.9},Y=class{constructor(e,t){this.canvas=e,this.gl=ue(e),this.post=Object.assign({},qe,t);let s=this.gl;this.fs=new W(s),this.bg=new T(s,S,ve),this.bright=new T(s,S,be),this.blur=new T(s,S,xe),this.composite=new T(s,S,ye),this.dpr=1,this.scene=new I(s,2,2,{float:!0}),this.bloomA=new I(s,2,2,{float:!1}),this.bloomB=new I(s,2,2,{float:!1})}resize(e,t,s){this.dpr=s,this.canvas.width=Math.round(e*s),this.canvas.height=Math.round(t*s);let o=this.canvas.width,a=this.canvas.height;this.scene.resize(o,a),this.bloomA.resize(Math.max(1,o>>1),Math.max(1,a>>1)),this.bloomB.resize(Math.max(1,o>>1),Math.max(1,a>>1))}render(e){let t=this.gl,s=this.canvas.width,o=this.canvas.height,a={W:s,H:o,zoom:e.camera.zoom*this.dpr,camX:0,camY:0,time:e.t,mapFade:e.mapFade,camNorm:e.camera.norm,dpr:this.dpr};t.disable(t.DEPTH_TEST),this.scene.bind(),t.disable(t.BLEND),t.clearColor(0,0,0,1),t.clear(t.COLOR_BUFFER_BIT),this.bg.use().set("uViewport",[s,o]),this.fs.draw();for(let f of e.layers)f.draw&&f.draw({gl:t,fs:this.fs},a);let r=Math.max(1,s>>1),c=Math.max(1,o>>1);t.disable(t.BLEND),this.bloomA.bind(),this.bright.use().set("uViewport",[r,c]).set("uThreshold",this.post.threshold).setTex("uTex",this.scene.tex,0),this.fs.draw();for(let f=0;f<2;f++){let u=1+f;this.bloomB.bind(),this.blur.use().set("uViewport",[r,c]).set("uDir",[u,0]).setTex("uTex",this.bloomA.tex,0),this.fs.draw(),this.bloomA.bind(),this.blur.use().set("uViewport",[r,c]).set("uDir",[0,u]).setTex("uTex",this.bloomB.tex,0),this.fs.draw()}this._t0===void 0&&(this._t0=performance.now());let h=(performance.now()-this._t0)/1e3;pe(t,s,o),t.disable(t.BLEND),this.composite.use().set("uViewport",[s,o]).set("uTime",h).set("uBloomAmt",this.post.bloom).set("uGrade",this.post.grade).set("uAberr",this.post.aberration).set("uVignette",this.post.vignette).set("uGrain",this.post.grain).set("uExposure",this.post.exposure).set("uMurk",this.post.murk).setTex("uScene",this.scene.tex,0).setTex("uBloom",this.bloomA.tex,1),this.fs.draw()}};var X=class{constructor(e,t,s){this.canvas=e,this.scene=t,this.audio=s,this.renderer=new Y(e,t.config.post),this.playing=!1,this.acc=0,this.last=performance.now(),this.dirty=!1,this.onTime=null,this.onFrame=null,this.started=!1,this.bento=t.layers.find(a=>typeof a.idleStep=="function"),this.bento&&this.bento.idleReset(),this.resize(),this.resizeRaf=0;let o=()=>{cancelAnimationFrame(this.resizeRaf),this.resizeRaf=requestAnimationFrame(()=>this.resize())};addEventListener("resize",o),window.visualViewport&&(window.visualViewport.addEventListener("resize",o),window.visualViewport.addEventListener("scroll",o)),requestAnimationFrame(a=>this.loop(a))}begin(){this.started=!0,this.bento&&(this.bento.idleActive=!1),this.playing=!0,this.scene.seek(0),this.audio.muted=!1;try{this.audio.currentTime=0}catch{}this.audio.play().catch(()=>{}),this.onTime&&this.onTime(0)}notifyTime(){this.onTime&&this.onTime(this.scene.t)}resetToIdle(){this.playing=!1,this.started=!1,this.dirty=!1,this.audio.pause();try{this.audio.currentTime=0}catch{}this.scene.reset(),this.bento&&this.bento.idleReset(),this.render(),this.notifyTime()}resize(){let e=this.canvas.getBoundingClientRect(),t=Math.max(1,e.width||this.canvas.clientWidth),s=Math.max(1,e.height||this.canvas.clientHeight),o=Math.min(devicePixelRatio||1,2);this.scene.view.W=t,this.scene.view.H=s,this.renderer.resize(t,s,o),this.render()}play(){if(!this.started)return this.begin();this.scene.t>=this.scene.duration-.02&&this.seekImmediate(0),this.playing=!0,this.audio.muted=!1,this.audio.play().catch(()=>{}),this.notifyTime()}pause(){this.playing=!1,this.audio.pause(),this.notifyTime()}togglePlay(){this.playing?this.pause():this.play()}seek(e){this.pause(),this.seekImmediate(e)}seekImmediate(e){this.started=!0,this.bento&&(this.bento.idleActive=!1),this.scene.seek(e);try{this.audio.currentTime=y(e,0,(this.audio.duration||this.scene.duration)-.05)}catch{}this.render(),this.notifyTime()}setParam(e,t){let s=this.scene.params().find(o=>o.path===e);s&&(s.set(t),this.playing||(this.dirty=!0))}toggleGallery(){if(!this.bento)return;this.galleryActive=!this.galleryActive;let e=this.scene.camera,t=this.renderer.post;this.galleryActive?(this.bento.buildGallery(),this.bento.galleryActive=!0,this.galleryClock=0,this.pause(),this._save={norm:e.norm,zoom:e.zoom,murk:t.murk,exp:t.exposure},e.norm=.42,e.zoom=.42*e.p.viewScale,t.murk=.12,t.exposure=1):(this.bento.galleryActive=!1,this._save&&(e.norm=this._save.norm,e.zoom=this._save.zoom,t.murk=this._save.murk,t.exposure=this._save.exp)),this.render()}loop(e){let t=Math.min(.05,(e-this.last)/1e3);if(this.last=e,this.galleryActive){this.galleryClock+=t,this.bento.galleryClock=this.galleryClock,this.render(),requestAnimationFrame(s=>this.loop(s));return}if(!this.started)this.bento&&this.bento.idleStep(t);else if(this.playing){let s=this.audio.currentTime,o=0;for(;this.scene.t+C<=s&&o++<600;)this.scene.stepOnce(C);(this.audio.ended||this.scene.t>=this.scene.duration)&&this.pause(),this.onTime&&this.onTime(this.scene.t)}else this.dirty&&(this.scene.seek(this.scene.t),this.dirty=!1);this.render(),this.onFrame&&this.onFrame(),requestAnimationFrame(s=>this.loop(s))}render(){this.renderer.render(this.scene)}};function ge(i,e,t){t.innerHTML="";let s=O("div","studio-bar"),o=O("button","studio-play");o.innerHTML="&#9654;";let a=O("input","studio-scrub");a.type="range",a.min=0,a.max=e.duration,a.step=.01,a.value=0;let r=O("span","studio-time");s.append(o,a,r);let c=O("div","studio-ticks");for(let p of e.timeline.beats){let l=O("i");l.style.left=p.t/e.duration*100+"%",c.appendChild(l)}let h=O("div","studio-barwrap hidden");h.append(s,c),t.append(h);let f=O("button","studio-toggle");f.title="Toggle scrubber",f.onclick=()=>h.classList.toggle("hidden"),t.append(f);let u=!1;o.onclick=()=>i.togglePlay(),a.oninput=()=>{u=!0,i.seek(parseFloat(a.value))},a.onchange=()=>{u=!1};let m=p=>{p=Math.max(0,p);let l=p/60|0,d=p%60|0;return l+":"+(d<10?"0":"")+d};i.onTime=p=>{u||(a.value=p),o.innerHTML=i.playing?"&#10073;&#10073;":"&#9654;",r.textContent=m(p)+" / "+m(e.duration)},i.onTime(0)}function O(i,e){let t=document.createElement(i);return e&&(t.className=e),t}var Ee=`#version 300 es
precision highp float;
${z}
uniform vec2 uViewport; uniform float uZoom; uniform vec2 uCam;
uniform float uStep, uFlash, uRest, uColorMix, uGridFade, uMapFade, uLevelFade;
out vec4 frag;
const float ISO_W = 34.0, ISO_H = 17.0;
void main(){
  vec2 px = vec2(gl_FragCoord.x, uViewport.y - gl_FragCoord.y);   // top-down to match cards
  vec2 c = vec2(uViewport.x * 0.5 + uCam.x, uViewport.y * 0.5 + uCam.y);
  float hw = ISO_W * 0.5 * uZoom, hh = ISO_H * 0.5 * uZoom;
  float A = (px.x - c.x) / hw, B = (px.y - c.y) / hh;
  float col = (A + B) * 0.5, row = (B - A) * 0.5;
  // nearest lattice node (stepped), back to screen px
  float ci = floor(col / uStep + 0.5) * uStep, ri = floor(row / uStep + 0.5) * uStep;
  vec2 node = vec2((ci - ri) * hw + c.x, (ci + ri) * hh + c.y);
  float d = length(px - node);
  float radius = 1.7;                                  // constant size \u2014 the beat only changes colour/brightness
  float dot = 1.0 - smoothstep(radius - 1.2, radius + 0.7, d);
  float rad = length((px - c) / uViewport);
  // fill the whole frame including the unsafe edges (notch/home-indicator at rad~0.5 stay FULL);
  // only the far corners softly taper, so nothing clips at the screen edges on mobile/Safari.
  float fade = 1.0 - smoothstep(0.5, 1.5, rad);
  float inten = (uRest + uFlash * 0.55) * uGridFade * uMapFade * fade;   // gentler beat lift
  vec3 color = mix(BONE, BONE_HI, uColorMix);   // monochrome: the beat lifts brightness, not hue
  frag = vec4(color * inten * dot * 1.35 * uLevelFade, 0.0);   // uLevelFade cross-fades LOD levels
}`;var H=class{constructor(e){this.p=e,this.prog=null,this.reset()}reset(){this.flashT0=-10,this.flashStr=0,this.flashDur=.8,this.lodStep=0,this.prevLod=0,this.transStart=-10,this.transDur=.45,this.lastZoom=0}step(e){let t=e.timeline.beats;for(let s of e.cues){if(s.kind!=="beat")continue;let o=s.index+1<t.length?t[s.index+1].t:null,a=s.index>0?t[s.index-1].t:null,r=o!=null?o-s.t:a!=null?s.t-a:1.6;this.flashDur=y(r*.9,.5,3.2),this.flashT0=e.t,this.flashStr=k(this.p.peakLow,this.p.peakHigh,Math.pow(s.index/Math.max(1,s.total-1),1.2))}}draw(e,t){let s=e.gl,o=this.p,a=y((t.camNorm-o.fadeStartZoom)/o.fadeRange,0,1);if(a<=.02)return;let r=le(t.time-this.flashT0,this.flashDur,o.flashAttack)*this.flashStr;if((o.restAlpha+r)*a<.004)return;this.prog||(this.prog=new T(s,S,Ee));let c=Math.hypot(17*t.zoom,8.5*t.zoom),h=Math.max(1,Math.round(o.cellPx*t.dpr/Math.max(.001,c)));this.lodStep===0&&(this.lodStep=h,this.prevLod=h);let f=Math.abs(t.zoom-this.lastZoom);this.lastZoom=t.zoom;let u=r>.012||f>4e-4,m=t.time-this.transStart<this.transDur;!u&&!m&&h!==this.lodStep&&(this.prevLod=this.lodStep,this.lodStep=h,this.transStart=t.time);let p=y((t.time-this.transStart)/this.transDur,0,1);s.enable(s.BLEND),s.blendFunc(s.ONE,s.ONE);let l=(d,v)=>{this.prog.use().set("uViewport",[t.W,t.H]).set("uZoom",t.zoom).set("uCam",[t.camX,t.camY]).set("uStep",v).set("uFlash",r).set("uRest",o.restAlpha).set("uColorMix",r>.04?1:0).set("uGridFade",a).set("uMapFade",t.mapFade).set("uLevelFade",d),e.fs.draw()};p<1&&this.prevLod!==this.lodStep?(l(1-p,this.prevLod),l(p,this.lodStep)):l(1,this.lodStep)}};_(H,"type","isoGrid"),_(H,"schema",{cellPx:{default:24},restAlpha:{default:.07},flashDur:{default:.52},flashAttack:{default:.16},peakLow:{default:.06},peakHigh:{default:.14},fadeStartZoom:{default:.035},fadeRange:{default:.05}});var we=`
float blink(float t){ return step(0.45, fract(t*0.8)); }
float pulse(float t){ return 0.5 + 0.5*sin(t*3.0); }
vec3 caret(vec2 uv, float x, float y, float h, float t, vec3 col){
  return col * blink(t) * sbox(uv, vec2(x, y), vec2(x+0.012, y+h), 0.004);
}

// ---------- A ----------
vec3 chatInk(vec2 uv, float seed, float t){
  vec3 c = vec3(0.0);
  c += BONE*0.05 * sbox(uv, vec2(0.0,0.0), vec2(0.27,1.0), 0.003);                 // sidebar
  for(int i=0;i<6;i++){ float fi=float(i); float y=0.09+fi*0.15; if(y>0.95) break;
    c += BONE_HI*0.7 * disc(uv, vec2(0.055,y), 0.026, 0.008);
    if(hash21(vec2(fi,seed))>0.5) c += GREEN*1.0 * disc(uv, vec2(0.072,y+0.016), 0.008, 0.004);
    c += BONE*0.4 * sbox(uv, vec2(0.10,y-0.022), vec2(0.24,y-0.006), 0.005);
    c += BONE*0.2 * sbox(uv, vec2(0.10,y+0.004), vec2(0.23,y+0.017), 0.005);
  }
  c += BONE_HI*0.6 * disc(uv, vec2(0.33,0.05), 0.022, 0.007);                      // header
  c += BONE*0.4 * sbox(uv, vec2(0.37,0.04), vec2(0.62,0.062), 0.005);

  float interval = 2.0, rowH = 0.155, botY = 0.73, arrived = t/interval + 3.0;    // continuous thread (windowed)
  for(int k=0;k<7;k++){ float fi = floor(arrived) - float(k);
    if(fi < 0.0) continue;
    float y = botY - (arrived - fi)*rowH;                                         // scroll up over time
    if(y < 0.1 || y > 0.84) continue;
    float side = step(0.5, hash11(fi+seed*3.0));
    float w = 0.22 + 0.30*hash11(fi+seed*7.0);
    float x0 = side>0.5 ? (0.96-w) : 0.31;
    float popp = smoothstep(0.0, 0.5, (arrived-fi)*interval);                     // slide/fade in
    c += (side>0.5?BONE_HI*0.9:BONE*0.45) * 0.85 * popp * sbox(uv, vec2(x0,y), vec2(x0+w,y+0.1), 0.012);
  }
  // pending-indicator dots
  if(fract(arrived) > 0.65){
    float ty = botY + 0.03;
    c += BONE*0.4 * sbox(uv, vec2(0.31,ty), vec2(0.45,ty+0.07), 0.012);
    for(int i=0;i<3;i++){ float fi=float(i);
      c += BONE_HI * (0.3+0.7*max(0.0, sin(t*6.0 - fi*1.1))) * disc(uv, vec2(0.34+fi*0.035, ty+0.035), 0.009, 0.004); }
  }
  c += BONE*0.14 * sbox(uv, vec2(0.31,0.92), vec2(0.97,0.985), 0.006);            // composer
  c += caret(uv, 0.34, 0.935, 0.04, t, BONE_HI);
  c += BONE_HI*0.9 * disc(uv, vec2(0.93,0.953), 0.018, 0.006);
  return c;
}

// ---------- B ----------
vec3 docDoc(vec2 uv, float seed, float t){   // lines type out one by one
  vec3 c = vec3(0.0);
  c += BONE*0.4 * sbox(uv, vec2(0.1,0.03), vec2(0.45,0.05), 0.005);               // toolbar
  c += BONE_HI*1.1 * sbox(uv, vec2(0.1,0.09), vec2(0.62,0.145), 0.008);           // title
  c += BONE*0.4 * sbox(uv, vec2(0.1,0.17), vec2(0.42,0.19), 0.005);
  c += BONE*0.15 * sbox(uv, vec2(0.08,0.22), vec2(0.92,0.225), 0.004);
  float typed = 2.4 + t*0.55;                                                     // a few lines already written
  for(int i=0;i<9;i++){ float fi=float(i); float y=0.27+fi*0.08; if(y>0.95) break;
    if(fi > typed) continue;
    float prog = clamp(typed - fi, 0.0, 1.0);
    float full = 0.3 + 0.6*hash21(vec2(fi,seed*1.7));
    float len = 0.1 + (0.8*full)*prog;
    c += BONE*0.5 * sbox(uv, vec2(0.1,y), vec2(0.1+len,y+0.022), 0.005);
    if(prog < 1.0 && prog > 0.0) c += caret(uv, 0.1+len+0.008, y, 0.02, t, BONE_HI);
  }
  return c;
}
vec3 sheet(vec2 uv, float seed, float t){    // grid cells fill in sequence
  vec3 c = vec3(0.0);
  c += BONE_HI*0.65 * sbox(uv, vec2(0.0,0.0), vec2(1.0,0.12), 0.004);
  c += BONE*0.12 * sbox(uv, vec2(0.0,0.0), vec2(0.16,1.0), 0.004);
  vec2 g = uv*vec2(6.0,8.0); vec2 gf = fract(g), gi = floor(g);
  c += BONE*0.13 * max(1.0-smoothstep(0.0,0.04,gf.x), 1.0-smoothstep(0.0,0.04,gf.y));
  float filled = 9.0 + t*1.5;                                                     // cells fill at the frontier
  float ord = (gi.y-1.0)*5.0 + (gi.x-1.0);                                        // cell ordinal (reading order)
  float on = step(0.62, hash21(gi+seed*4.0)) * step(ord, filled) * step(0.0, ord);
  c += BONE*0.5 * on * sbox(gf, vec2(0.15,0.25), vec2(0.82,0.75), 0.06);
  c += BONE_HI*0.85 * step(0.88, hash21(gi+seed*9.0)) * step(ord,filled) * sbox(gf, vec2(0.15,0.25), vec2(0.82,0.75), 0.06);
  // a moving selection that fills entries in order
  float si = mod(floor(filled), 35.0);
  vec2 selc = vec2(1.0+mod(si,5.0), 1.0+floor(si/5.0));
  if(abs(gi.x-selc.x)<0.5 && abs(gi.y-selc.y)<0.5){
    c += BONE_HI*1.3 * (1.0 - sbox(gf, vec2(0.04), vec2(0.96), 0.025));           // selection box
    if(fract(filled) < 0.55) c += BONE_HI*0.9 * blink(t) * sbox(gf, vec2(0.2,0.32), vec2(0.24,0.68), 0.02);  // entering a value
  }
  return c;
}
vec3 code(vec2 uv, float seed, float t){     // tinted lines type out, caret advancing
  vec3 c = vec3(0.0);
  c += BONE*0.16 * sbox(uv, vec2(0.0,0.0), vec2(0.08,1.0), 0.004);
  float typed = 3.0 + t*1.1;                                                      // a few lines already written
  for(int i=0;i<11;i++){ float fi=float(i); float y=0.04+fi*0.088; if(y>0.95) break;
    if(fi > typed) continue;
    c += BONE*0.3 * sbox(uv, vec2(0.025,y+0.004), vec2(0.06,y+0.016), 0.004);     // line number
    float ind = 0.11 + 0.06*floor(hash21(vec2(fi,seed))*4.0);
    float full = ind + 0.12 + 0.4*hash21(vec2(fi,seed*3.0));
    float prog = clamp(typed - fi, 0.0, 1.0);
    float len = mix(ind, min(full,0.95), prog);
    vec3 tk = mix(BONE*0.7, mix(PURP,BLUE,hash11(fi+seed))*1.4, step(0.5, hash21(vec2(fi,seed*5.0))));
    c += tk * sbox(uv, vec2(ind,y), vec2(len,y+0.024), 0.005);
    if(prog<1.0 && prog>0.0){
      if(hash21(vec2(fi,seed*8.0))>0.5) c += GREEN*1.2 * sbox(uv, vec2(min(full,0.88)+0.02,y), vec2(min(full+0.14,0.96),y+0.024), 0.005);
      c += caret(uv, len+0.01, y, 0.022, t, BONE_HI);
    }
  }
  return c;
}
vec3 docsInk(vec2 uv, float seed, float t){ float s=floor(hash11(seed*1.7)*3.0);
  if(s<0.5) return docDoc(uv,seed,t); if(s<1.5) return sheet(uv,seed,t); return code(uv,seed,t); }

// ---------- C ----------
vec3 checklist(vec2 uv, float seed, float t){   // rows mark off one by one; a bar fills
  vec3 c = vec3(0.0);
  c += BONE*0.45 * sbox(uv, vec2(0.06,0.04), vec2(0.42,0.08), 0.005);
  float checked = t/2.3;
  float p = clamp(checked/7.0, 0.0, 1.0);
  c += BONE*0.16 * sbox(uv, vec2(0.55,0.045), vec2(0.94,0.075), 0.006);
  c += BONE_HI*1.1 * sbox(uv, vec2(0.55,0.045), vec2(0.55+0.39*p,0.075), 0.006);
  for(int i=0;i<7;i++){ float fi=float(i); float y=0.13+fi*0.115;
    float done = step(fi+1.0, checked);
    float pop = done * smoothstep(0.0, 0.5, checked-(fi+1.0));
    c += BONE*0.45 * (disc(uv,vec2(0.09,y+0.025),0.022,0.006)-disc(uv,vec2(0.09,y+0.025),0.013,0.006));
    c += BONE_HI*1.2 * mix(done, 1.4, 1.0-step(0.05,checked-(fi+1.0))) * done * disc(uv,vec2(0.09,y+0.025),0.012,0.005);
    float len = 0.35+0.4*hash21(vec2(fi,seed*2.0));
    c += BONE*(done>0.5?0.28:0.55) * sbox(uv, vec2(0.15,y+0.013), vec2(0.15+len,y+0.037), 0.005);
    c += mix(GREEN,RED,hash11(fi+seed*4.0))*1.0*disc(uv, vec2(0.92,y+0.025),0.012,0.005);
  }
  return c;
}
vec3 kanban(vec2 uv, float seed, float t){
  vec3 c = vec3(0.0);
  float PI = 3.14159;
  float STEP = 0.165, CARDH = 0.12, BAND = 0.28, RANGE = 0.66;   // scrolling stack band [BAND, BAND+RANGE]
  float slotY = 0.12;                                            // top "incoming" row (just below header)
  // one marker dwells, then eases to the next column slot (no overlap)
  float T = 3.4, g = t/T, ci = floor(g), fr = fract(g);
  float src = mod(ci,3.0), dst = mod(ci+1.0,3.0);
  float travel = smoothstep(0.0,1.0, clamp((fr-0.58)/0.42, 0.0,1.0));

  for(int k=0;k<3;k++){
    float fk=float(k); float x0=0.04+fk*0.325;
    c += BONE*0.10 * sbox(uv, vec2(x0,0.03), vec2(x0+0.29,0.97), 0.008);
    c += mix(BONE_HI,BONE*0.75,fk*0.4) * 0.7 * sbox(uv, vec2(x0+0.02,0.05), vec2(x0+0.27,0.09), 0.006);   // header
    // faint frame at the top of each column
    float fo = sbox(uv, vec2(x0+0.02,slotY), vec2(x0+0.27,slotY+CARDH), 0.004);
    float fin = sbox(uv, vec2(x0+0.035,slotY+0.012), vec2(x0+0.255,slotY+CARDH-0.012), 0.004);
    c += BONE*0.07 * max(fo - fin, 0.0);
    // scrolling stack (seamless loop; slightly different speed per column)
    float scroll = t*(0.05 + fk*0.012);
    for(int i=0;i<4;i++){ float fi=float(i);
      float y = BAND + mod(fi*STEP - scroll, RANGE);
      float fade = smoothstep(BAND, BAND+0.045, y) * (1.0 - smoothstep(BAND+RANGE-0.06, BAND+RANGE, y));
      if(hash21(vec2(fk*5.0+fi+1.0,seed))>0.30){
        c += BONE*0.16*fade * sbox(uv, vec2(x0+0.02,y), vec2(x0+0.27,y+CARDH), 0.008);
        c += mix(BLUE,GREEN,hash11(fk+fi+seed)) * 0.85*fade * sbox(uv, vec2(x0+0.04,y+0.02), vec2(x0+0.12,y+0.04), 0.005);
        c += BONE*0.30*fade * sbox(uv, vec2(x0+0.04,y+0.06), vec2(x0+0.24,y+0.075), 0.005);
        c += BONE*0.20*fade * sbox(uv, vec2(x0+0.04,y+0.09), vec2(x0+0.19,y+0.105), 0.005);
      }
    }
  }
  // the traveling marker hops along the top row, lifting in an arc
  float srcX = 0.04 + src*0.325, dstX = 0.04 + dst*0.325;
  float mx = mix(srcX, dstX, travel);
  float lift = sin(travel*PI);
  float my = slotY - lift*0.04;                                  // lifts up (y decreases) while travelling
  c += BONE_HI*0.12*(0.5+lift) * sbox(uv, vec2(mx-0.005,my-0.012), vec2(mx+0.285,my+CARDH+0.01), 0.02);   // lift halo
  c += BONE_HI*0.24 * sbox(uv, vec2(mx+0.02,my), vec2(mx+0.27,my+CARDH), 0.01);
  c += BONE_HI*(0.7+0.4*lift) * sbox(uv, vec2(mx+0.04,my+0.02), vec2(mx+0.15,my+0.04), 0.005);
  c += BONE_HI*0.5 * sbox(uv, vec2(mx+0.04,my+0.06), vec2(mx+0.24,my+0.075), 0.005);
  c += BONE*0.32 * sbox(uv, vec2(mx+0.04,my+0.09), vec2(mx+0.18,my+0.105), 0.005);
  return c;
}
vec3 tasksInk(vec2 uv, float seed, float t){ float s=floor(hash11(seed*4.3)*2.0);
  if(s<0.5) return checklist(uv,seed,t); return kanban(uv,seed,t); }

// ---------- D ----------
vec3 browserInk(vec2 uv, float seed, float t){
  vec3 c = vec3(0.0);
  c += BONE*0.25 * sbox(uv, vec2(0.0,0.0), vec2(0.30,0.02), 0.004);
  c += BONE*0.2 * sbox(uv, vec2(0.12,0.03), vec2(0.88,0.1), 0.008);
  c += GREEN*0.7 * disc(uv, vec2(0.08,0.065), 0.013, 0.005);
  if(uv.y<0.13) return c;
  vec2 b = vec2(uv.x, (uv.y-0.13)/0.87);
  float site = floor(hash11(seed*2.3)*5.0);
  if(site<0.5){                                  // variant 0
    c += BONE*0.10 * sbox(b, vec2(0.05,0.05), vec2(0.70,0.50), 0.01);
    float scene = floor(t*0.5 + seed*4.0);                                        // cut every 2s
    for(int i=0;i<3;i++){ float fi=float(i);
      float rx = 0.1 + 0.5*hash21(vec2(fi, scene)); float ry = 0.1 + 0.28*hash21(vec2(fi+9.0, scene));
      c += BONE*0.22 * sbox(b, vec2(rx,ry), vec2(rx+0.1+0.12*hash21(vec2(fi,scene+1.0)), ry+0.08), 0.01);
    }
    c += BONE_HI*0.95 * blob(b, vec2(0.375,0.275), 0.075, seed+1.3);              // abstract play orb (not a clean ring)
    c += BONE*0.55 * blob(b, vec2(0.375,0.275), 0.04, seed+5.1);
    float pp = fract(t*0.045);                                                    // playhead loops
    c += BONE*0.18 * sbox(b, vec2(0.05,0.55), vec2(0.70,0.57), 0.004);
    c += BONE_HI*1.1 * sbox(b, vec2(0.05,0.55), vec2(0.05+0.65*pp,0.57), 0.004);
    c += BONE_HI*1.3 * disc(b, vec2(0.05+0.65*pp,0.56), 0.012, 0.005);
    c += BONE*0.4 * sbox(b, vec2(0.05,0.62), vec2(0.46,0.65), 0.006);
    for(int i=0;i<4;i++){ float fi=float(i); float y=0.05+fi*0.16;
      c += BONE*0.2 * sbox(b, vec2(0.74,y), vec2(0.86,y+0.085), 0.006);
      c += BONE*0.32 * sbox(b, vec2(0.87,y+0.01), vec2(0.97,y+0.03), 0.005);
    }
    c += BONE*0.16 * sbox(b, vec2(0.05,0.78), vec2(0.70,0.97), 0.008);
  } else if(site<1.5){                           // variant 1
    c += BLUE*1.0  * blob(b, vec2(0.41,0.16), 0.052, seed+1.0);                   // abstract colored marks (not clean balls)
    c += RED*1.0   * blob(b, vec2(0.48,0.14), 0.052, seed+2.0);
    c += YEL*1.0   * blob(b, vec2(0.55,0.16), 0.052, seed+3.0);
    c += GREEN*1.0 * blob(b, vec2(0.62,0.145), 0.052, seed+4.0);
    c += BONE*0.6 * sbox(b, vec2(0.2,0.25), vec2(0.8,0.31), 0.008);
    float q = clamp(0.5 + t*0.4, 0.0, 1.0);                                       // query already partly typed
    c += BONE_HI*0.7 * sbox(b, vec2(0.24,0.27), vec2(0.24+0.4*q,0.295), 0.005);
    if(q<1.0) c += caret(b, 0.24+0.4*q+0.01, 0.262, 0.036, t, BONE_HI);
    for(int i=0;i<3;i++){ float fi=float(i); float y=0.42+fi*0.185;
      float ap = smoothstep(0.0,0.4, t - fi*0.45 + 1.0);                          // results load in (some already there)
      c += BLUE*1.0*ap  * sbox(b, vec2(0.08,y), vec2(0.45+0.2*hash21(vec2(fi,seed)),y+0.022), 0.005);
      c += GREEN*0.8*ap * sbox(b, vec2(0.08,y+0.032), vec2(0.36,y+0.046), 0.005);
      c += BONE*0.4*ap  * sbox(b, vec2(0.08,y+0.062), vec2(0.86,y+0.076), 0.005);
      c += BONE*0.32*ap * sbox(b, vec2(0.08,y+0.092), vec2(0.62,y+0.106), 0.005);
    }
  } else if(site<2.5){                           // variant 2
    c += BLUE*1.0 * sbox(b, vec2(0.0,0.0), vec2(1.0,0.09), 0.006);                // top nav
    c += BONE*0.4 * sbox(b, vec2(0.32,0.025), vec2(0.7,0.065), 0.005);           // top bar
    c += RED * (0.6+0.4*pulse(t)) * disc(b, vec2(0.92,0.045), 0.012, 0.005);     // notification
    c += BONE*0.06 * sbox(b, vec2(0.0,0.09), vec2(0.18,1.0), 0.004);             // left rail
    for(int i=0;i<4;i++){ float fy=0.15+float(i)*0.12;
      c += BONE*0.4 * disc(b, vec2(0.05,fy), 0.017, 0.006);
      c += BONE*0.25 * sbox(b, vec2(0.08,fy-0.012), vec2(0.16,fy+0.004), 0.004); }
    // list scrolls continuously (windowed)
    float interval=3.0, rowH=0.33, arrived=t/interval + 2.0, botY=0.6;
    for(int k=0;k<3;k++){ float fi=floor(arrived)-float(k); if(fi < 0.0) continue;
      float y = botY - (arrived-fi)*rowH;
      if(y < 0.1 || y > 0.62) continue;
      float pop = smoothstep(0.0,0.7, (arrived-fi)*interval);
      c += BONE_HI*0.6*pop * disc(b, vec2(0.27,y+0.025), 0.024, 0.008);          // avatar
      c += BONE*0.4*pop * sbox(b, vec2(0.32,y+0.01), vec2(0.6,y+0.028), 0.005);  // name
      c += BONE*0.2*pop * sbox(b, vec2(0.32,y+0.035), vec2(0.5,y+0.047), 0.005); // handle
      c += BONE*0.3*pop * sbox(b, vec2(0.22,y+0.062), vec2(0.92,y+0.078), 0.005);// text
      c += BONE*0.18*pop * sbox(b, vec2(0.22,y+0.095), vec2(0.94,y+0.22), 0.01); // image
      c += BONE*0.3*pop * disc(b, vec2(0.27,y+0.25), 0.009, 0.004);              // like / comment / share
      c += RED*0.75*pop * disc(b, vec2(0.4,y+0.25), 0.009, 0.004);
      c += BONE*0.3*pop * disc(b, vec2(0.53,y+0.25), 0.009, 0.004);
    }
  } else if(site<3.5){                           // article (static)
    c += BONE*0.2 * sbox(b, vec2(0.06,0.05), vec2(0.94,0.32), 0.01);
    c += BONE_HI*0.95 * sbox(b, vec2(0.06,0.37), vec2(0.72,0.42), 0.008);
    for(int i=0;i<9;i++){ float fi=float(i); float y=0.47+fi*0.05;
      c += BONE*0.5 * sbox(b, vec2(0.06,y), vec2(0.06+0.42*(0.4+0.55*hash21(vec2(fi,seed))),y+0.018), 0.005);
      c += BONE*0.5 * sbox(b, vec2(0.52,y), vec2(0.52+0.42*(0.4+0.55*hash21(vec2(fi,seed*2.0))),y+0.018), 0.005);
    }
  } else {                                       // shop (static)
    c += BONE*0.5 * sbox(b, vec2(0.06,0.04), vec2(0.5,0.08), 0.006);
    for(int i=0;i<2;i++) for(int j=0;j<3;j++){ vec2 p=vec2(0.06+float(j)*0.31, 0.14+float(i)*0.44);
      c += BONE*0.2  * sbox(b, p, p+vec2(0.26,0.26), 0.008);
      c += BONE*0.35 * sbox(b, p+vec2(0.0,0.29), p+vec2(0.2,0.305), 0.005);
      c += BONE_HI*1.0 * sbox(b, p+vec2(0.0,0.33), p+vec2(0.12,0.36), 0.006);
      c += YEL*0.85  * sbox(b, p+vec2(0.0,0.385), p+vec2(0.14,0.4), 0.005);
    }
  }
  return c;
}

// ---------- E ----------
vec3 terminalInk(vec2 uv, float seed, float t){
  vec3 c = vec3(0.0);
  float interval = 0.5, rowH = 0.07, arrived = t/interval + 7.0, botY = 0.9;     // continuous streaming log (windowed)
  for(int k=0;k<14;k++){ float fi = floor(arrived) - float(k);
    if(fi < 0.0) continue;
    float y = botY - (arrived - fi)*rowH;
    if(y < 0.03 || y > 0.95) continue;
    float kind = hash21(vec2(fi, seed));
    float prog = clamp((arrived - fi)*interval/0.28, 0.0, 1.0);
    bool isCmd = kind < 0.32;
    float xs = isCmd ? 0.08 : 0.06;
    if(isCmd) c += GREEN*1.2 * sbox(uv, vec2(0.04,y), vec2(0.062,y+0.024), 0.004);   // $ prompt
    vec3 col = isCmd ? BONE_HI*0.75 : (kind<0.55 ? GREEN*0.9 : (kind<0.72 ? BONE*0.75 : BONE*0.4));
    float full = (isCmd ? 0.18 : 0.3) + 0.5*hash21(vec2(fi, seed*3.0));
    float len = full*prog;
    c += col * sbox(uv, vec2(xs,y), vec2(xs+len,y+0.022), 0.004);
    if(arrived - fi < 1.0 && prog < 1.0) c += caret(uv, xs+len+0.006, y, 0.02, t, GREEN);
  }
  return c;
}

vec3 hubColor(int z){ return z==0?BLUE:z==1?GREEN:z==2?RED:PURP; }
// nodes distributed on a jittered ring (bigger than the viewport) so it fills the card
vec2 hubCtr(float seed, float z, float nz){ float a=(z+0.5)/nz*6.2831+seed*5.0; float r=2.0+hash11((seed+z)*5.1)*1.5;
  vec2 j=(vec2(hash11((seed+z)*8.3),hash11((seed+z)*2.7))-0.5)*0.9; return vec2(cos(a)*r,sin(a)*r)+j; }
vec2 hubSize(float seed, float z){ float h=seed+z*1.37; return vec2(1.05+hash11(h*5.1)*0.9, 0.8+hash11(h*7.7)*0.6); }
// an iso plane: a salted number of tinted plates, each with a cluster of dots, on a dotted grid;
// the camera slowly zooms + pans around a plane larger than the card so it stays full.
vec3 hubInk(vec2 uv, float seed, float t){
  vec3 c=vec3(0.0);
  float zoom=1.08+0.24*sin(t*0.34+seed*6.3);                                          // zoom in/out (noticeable)
  vec2 pan=vec2(0.13*sin(t*0.19+seed*2.7), 0.085*sin(t*0.15+seed*4.1));               // move the map around
  float OW=0.072*zoom, OH=0.037*zoom; vec2 O=vec2(0.5,0.46)+pan;
  vec2 d0=uv-O; float pi=(d0.x/OW+d0.y/OH)*0.5; float pj=(d0.y/OH-d0.x/OW)*0.5;       // iso coords of this pixel
  vec2 fr=fract(vec2(pi,pj)+0.5)-0.5;                                                 // faint dotted iso grid
  c+=BONE*0.05*(1.0-smoothstep(0.04,0.12,length(fr)))*step(abs(pi),5.5)*step(abs(pj),5.5);
  int nz=4+int(hash11(seed*2.3)*1.99); float zf=float(nz);                            // 4..5 plates (salted)
  for(int z=0;z<5;z++){ if(z>=nz) break; float fz=float(z); float hs=seed+fz*1.37;
    vec2 ctr=hubCtr(seed,fz,zf); vec2 he=hubSize(seed,fz);
    vec3 col=hubColor(int(mod(fz+floor(seed*7.0),4.0)));                              // colour varies per card
    float plate=smoothstep(he.x+0.08,he.x,abs(pi-ctr.x))*smoothstep(he.y+0.08,he.y,abs(pj-ctr.y));
    float inner=smoothstep(he.x-0.07,he.x-0.16,abs(pi-ctr.x))*smoothstep(he.y-0.07,he.y-0.16,abs(pj-ctr.y));
    c+=col*0.09*plate + col*0.30*max(plate-inner,0.0);                               // tint + border
    int na=3+int(hash11(hs*2.9)*4.99);                                               // 3..7 dots (salted)
    for(int a=0;a<7;a++){ if(a>=na) break; float fa=float(a);
      float ai=ctr.x-he.x*0.6+mod(fa,3.0)*(he.x*0.6); float aj=ctr.y-he.y*0.45+floor(fa/3.0)*(he.y*0.5);
      vec2 ap=O+vec2((ai-aj)*OW,(ai+aj)*OH);
      float pl=0.5+0.5*pulse(t*0.6+fa*1.3+fz*2.7+seed*5.0);
      c+=col*(0.45+0.55*pl)*disc(uv,ap,0.009*zoom,0.004);
      c+=BONE_HI*0.45*pl*disc(uv,ap-vec2(0.0,0.013*zoom),0.005*zoom,0.003);
    }
    if(hash11(hs*9.3)>0.5){                                                           // some plates have a beacon
      vec2 op=O+vec2((ctr.x-ctr.y)*OW,(ctr.x+ctr.y)*OH); float bp=0.6+0.4*pulse(t*1.6+fz);
      c+=BONE_HI*bp*disc(uv,op,0.012*zoom,0.005); c+=BONE_HI*0.22*disc(uv,op,0.030*zoom,0.012);
    }
  }
  float g=t/4.0,ph=fract(g),seg=floor(g);                                             // one dot drifts plate to plate
  vec2 a0=hubCtr(seed,mod(seg,zf),zf), a1=hubCtr(seed,mod(seg+1.0,zf),zf);
  vec2 mij=mix(a0,a1,smoothstep(0.18,0.88,ph)); vec2 mp=O+vec2((mij.x-mij.y)*OW,(mij.x+mij.y)*OH);
  c+=BONE_HI*(0.9+0.4*pulse(t*2.0))*disc(uv,mp,0.011*zoom,0.004);
  c+=BONE_HI*0.7*disc(uv,mp-vec2(0.0,0.015*zoom),0.006*zoom,0.003);
  return c;
}
vec3 cardInk(float typeF, vec2 uv, float seed, float t){
  int type = int(typeF + 0.5);
  // SALT \u2014 cheap per-card variance from the seed, so same-type buckets differ:
  float ts = t * (0.78 + 0.55*hash11(seed*5.9));        // animation speed (desyncs the sims)
  float hH = 0.1;
  vec3 c = vec3(0.0);
  if(uv.y < hH){                                         // generic title bar
    c += BONE_HI * (0.9 + 0.5*pulse(ts + seed*6.0)) * disc(uv, vec2(0.045,hH*0.5), 0.013, 0.005);
    c += BONE*0.7 * disc(uv, vec2(0.085,hH*0.5), 0.013, 0.005);
    c += BONE*0.7 * disc(uv, vec2(0.125,hH*0.5), 0.013, 0.005);
    c += BONE*0.32 * sbox(uv, vec2(0.32,hH*0.34), vec2(0.74,hH*0.66), 0.008);
    c += BONE*0.45 * disc(uv, vec2(0.84,hH*0.5), 0.011, 0.005);
    c += BONE*0.45 * disc(uv, vec2(0.89,hH*0.5), 0.011, 0.005);
  } else {
    vec2 b = vec2(uv.x, (uv.y - hH)/(1.0 - hH));
    if(type==0)      c = chatInk(b, seed, ts);
    else if(type==1) c = docsInk(b, seed, ts);
    else if(type==2) c = tasksInk(b, seed, ts);
    else if(type==4) c = terminalInk(b, seed, ts);
    else if(type==5) c = hubInk(b, seed, ts);
    else             c = browserInk(b, seed, ts);
  }
  // more salt \u2014 strong per-card colour "mood" (the scene is murky, so colour reads most),
  // plus brightness + saturation, so two buckets of the same type look clearly distinct.
  float m = hash11(seed*4.2);
  vec3 mood = m<0.30 ? vec3(1.00,1.01,1.04)        // plain bone
            : m<0.50 ? vec3(0.92,0.97,1.14)        // cool steel
            : m<0.68 ? vec3(1.06,1.02,0.98)        // faint warm grey
            : m<0.84 ? vec3(0.96,1.06,1.02)        // faint green
            :          vec3(1.02,0.97,1.10);       // faint violet
  c *= mood;
  c *= 0.80 + 0.42 * hash11(seed*9.1);                          // brightness
  float luma = dot(c, vec3(0.299,0.587,0.114));
  c = mix(vec3(luma), c, 0.70 + 0.60 * hash11(seed*6.6));       // saturation (muted <-> vivid)
  return c;
}
`;var Ae=`#version 300 es
layout(location=0) in vec4 aVert;       // localUV.xy , tileCenter.zw  (0..1 card space)
layout(location=1) in vec4 aRect;       // col,row,w,h (world cells)
layout(location=2) in vec4 aMeta;       // spawnT, type, seed, deathT (idle dissolve; 0 = never)
uniform vec2 uViewport; uniform float uZoom; uniform vec2 uCam; uniform float uTime;
uniform float uAsmSlow, uAsmFast, uKickStart, uKickEnd;
out vec2 vUv; out float vType; out float vSeed; out float vTileRev; out float vSweep; out float vDis; out float vAge; out float vAspect;
const float ISO_W = 34.0, ISO_H = 17.0;
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx)*0.1031); q += dot(q, q.yzx+33.33); return fract((q.x+q.y)*q.z); }
void main(){
  vec2 luv = aVert.xy, tc = aVert.zw;
  float age = uTime - aMeta.x;
  // SLOW & careful assembly for cards placed before the kick, snappy after (spawnT = aMeta.x)
  float adur = mix(uAsmSlow, uAsmFast, smoothstep(uKickStart, uKickEnd, aMeta.x));
  // each tile lands on its OWN schedule, spread across most of the window -> pieced together one by one
  float delay = h21(tc + aMeta.z*7.13) * adur * 0.74;
  float trev = 1.0 - pow(1.0 - clamp((age - delay) / (adur*0.34), 0.0, 1.0), 3.0);
  float ang = h21(tc + aMeta.z*3.1) * 6.2831;
  vec2 off = vec2(cos(ang), sin(ang)) * (0.4 + 0.7*h21(tc + aMeta.z*5.7)) * (1.0 - trev);  // fly in from nearby
  float sc = mix(0.45, 1.0, trev);                                    // pop/grow toward tile centre
  vec2 uv = tc + (luv - tc) * sc + off;
  vUv = luv; vType = aMeta.y; vSeed = aMeta.z; vTileRev = trev; vAspect = aRect.z / max(aRect.w, 0.0001);
  vSweep = clamp(age / (adur*1.05), 0.0, 1.4);
  vDis = aMeta.w > 0.5 ? clamp(1.0 - (uTime - aMeta.w) / 0.7, 0.0, 1.0) : 1.0;   // idle cards dissolve at deathT
  vAge = max(0.0, age);                                                          // per-card clock for animated content
  vec2 cr = aRect.xy + uv * aRect.zw;                                 // world (col,row)
  float sx = (cr.x - cr.y) * (ISO_W*0.5) * uZoom + uViewport.x*0.5 + uCam.x;
  float sy = (cr.x + cr.y) * (ISO_H*0.5) * uZoom + uViewport.y*0.5 + uCam.y;
  gl_Position = vec4(sx / uViewport.x * 2.0 - 1.0, 1.0 - sy / uViewport.y * 2.0, 0.0, 1.0);
}`,Te=`#version 300 es
precision highp float;
${z}
${we}
in vec2 vUv; in float vType; in float vSeed; in float vTileRev; in float vSweep; in float vDis; in float vAge; in float vAspect;
uniform float uMapFade;
out vec4 frag;
// soft-focus the procedural content (5-tap) so buckets read hazy/mysterious, not crisp
vec3 inkBlur(float type, vec2 uv, float seed, float t){
  float r = 0.012;
  return cardInk(type, uv, seed, t) * 0.36
       + cardInk(type, uv + vec2(r,0.0), seed, t) * 0.16
       + cardInk(type, uv - vec2(r,0.0), seed, t) * 0.16
       + cardInk(type, uv + vec2(0.0,r), seed, t) * 0.16
       + cardInk(type, uv - vec2(0.0,r), seed, t) * 0.16;
}
void main(){
  vec2 uv = vUv;
  // LOD: 5-tap soft focus on big (close) cards; single tap when the card is tiny on screen
  // (the blur is invisible there) \u2014 keeps the climax of ~900 sim'd cards cheap.
  float texel = max(fwidth(uv.x), fwidth(uv.y));
  vec3 ink = texel > 0.02 ? cardInk(vType, uv, vSeed, vAge) : inkBlur(vType, uv, vSeed, vAge);
  vec3 col = vec3(0.030, 0.034, 0.045) + ink;                              // glass panel + content
  // rounded-rect distance field (aspect-corrected) \u2014 drives BOTH the edge glow and the corner
  // mask, so the glow follows the rounded corners instead of being clipped to a square.
  vec2 rp = (uv - 0.5) * vec2(vAspect, 1.0);
  vec2 rq = abs(rp) - vec2(0.5*vAspect, 0.5) + 0.11;
  float rsd = length(max(rq, 0.0)) + min(max(rq.x, rq.y), 0.0) - 0.11;
  float em = max(-rsd, 0.0);                                               // distance inside from the rounded edge
  col += BONE * 0.14 * (1.0 - smoothstep(0.0, 0.06, em));             // soft neutral edge glow (no hard white border)
  col *= 0.65 + 0.35 * smoothstep(0.0, 0.013, em);                    // gentle inner-shadow edge for separation
  // shimmer: a bright sweep crosses the card as it assembles \u2014 TEXTURED (irregular edge +
  // sparkle grain) so it reads like light catching a real frosted surface, not a clean band.
  float d = (uv.x + uv.y) * 0.5;
  float edge = (fbm(uv*6.0 + vSeed*3.1) - 0.5) * 0.09;                  // irregular leading/trailing edge
  float band = exp(-pow((d + edge - vSweep), 2.0) / 0.007);
  float lod = 1.0 - smoothstep(0.012, 0.03, texel);                    // grain only where the card is big
  float spark = mix(1.0, (0.45 + 0.7*fbm(uv*34.0 + vSeed*9.0 + vSweep*4.0))
                        * (0.65 + 0.6*fbm(uv*88.0 - vSweep*5.0)), lod); // sparkle/grain within the sweep
  float win = smoothstep(0.0, 0.12, vSweep) * (1.0 - smoothstep(1.0, 1.32, vSweep));
  col += (BONE_HI*1.5 + BONE*0.6) * band * spark * win;
  // rounded-corner mask (reuses the same SDF as the edge glow above)
  float caa = max(1.5*texel, 0.004);
  float corner = 1.0 - smoothstep(-caa, caa, rsd);
  float A = 0.92 * vTileRev * vDis * uMapFade * corner;
  frag = vec4(col * A, A);
}`;var L=class{constructor(e){this.p=e,this.prog=null,this.slots=[],this.outer=[],this.inner=[],this.outerIdx=0,this.innerIdx=0,this.cards=[],this.cardIndex=0,this.cardTarget=0,this.idleActive=!1,this.idleClock=0,this.idleRng=M(7),this.idleNext=.5,this.galleryActive=!1,this.galleryClock=0,this.galleryCards=null}buildGallery(){if(this.galleryCards)return;let e=d=>d-Math.floor(d),t=d=>(d=e(d*.1031),d*=d+33.33,d*=d+d,e(d)),s=d=>d<.1?5:d<.22?4:Math.min(3,Math.floor((d-.22)/.78*4)),o=(d,v)=>v===1?Math.floor(t(d*1.7)*3):v===2?Math.floor(t(d*4.3)*2):v===3?Math.floor(t(d*2.3)*5):0,a=[[0,0],[5,0],[4,0],[1,0],[1,1],[1,2],[2,0],[2,1],[3,0],[3,1],[3,2],[3,3],[3,4]],r=a.map(()=>.5);for(let d=.001;d<1;d+=3e-4){let v=s(d),b=o(d,v);for(let E=0;E<a.length;E++)a[E][0]===v&&a[E][1]===b&&(r[E]=d)}let c=4,h=13,f=9.5,u=4,m=Math.ceil(a.length/c),p=c*h+(c-1)*u,l=m*f+(m-1)*u;this.galleryCards=a.map((d,v)=>{let b=v%c,E=Math.floor(v/c);return{slot:{c:-p/2+b*(h+u),r:-l/2+E*(f+u),w:h,h:f},spawnT:-3,seed:r[v],deathT:0}})}reset(e,t){this.rng=e,this.slots=We(e,this.p.radius,this.p.cellCount,this.p.gap);let s=this.p.holeRadius;this.outer=[],this.inner=[];for(let o of this.slots){let a=Math.max(o.c,Math.min(o.c+o.w,0)),r=Math.max(o.r,Math.min(o.r+o.h,0));(s>0&&Math.hypot(a,r)<s?this.inner:this.outer).push(o)}this.inner.reverse(),this.outerIdx=0,this.innerIdx=0,this.cards=[],this.cardIndex=0,this.cardTarget=0,this.idleActive=!1,this.ENV1=t.timeline.energyNorm(t.timeline.lastBeatT())||1}idleReset(){this.idleActive=!0,this.idleClock=0,this.cards=[],this.cardIndex=0,this.idleNext=.3,this.idleRng=M(7)}idleStep(e){if(!(!this.idleActive||!this.slots.length)&&(this.idleClock+=e,this.cards=this.cards.filter(t=>this.idleClock<t.deathT+.75),this.idleNext-=e,this.idleNext<=0&&this.cards.length<3)){let t=1+Math.floor(this.idleRng()*2);for(let s=0;s<t;s++){let o=this.outer[2+Math.floor(this.idleRng()*Math.min(this.outer.length-2,36))];this.cards.push({slot:o,spawnT:this.idleClock,seed:this.idleRng(),deathT:this.idleClock+3.6+this.idleRng()*1.2})}this.idleNext=1.4+this.idleRng()*1}}step(e){let t=this.p,s=e.t,o=Math.pow(y(e.timeline.energyNorm(s)/this.ENV1,0,1),t.fillPower),a=Math.round(this.slots.length*o);a=Math.max(a,Math.min(this.slots.length,Math.floor(s/t.introRate))),this.cardTarget=Math.max(this.cardTarget,a);let r=s>=t.holeHold;for(let c of e.cues){let h=c.kind==="beat"?t.beatCap:c.kind==="onset"?t.onsetCap:0;if(!h)continue;let f=0;for(;this.outerIdx<this.outer.length&&this.outerIdx<this.cardTarget&&f++<h;)this.cards.push({slot:this.outer[this.outerIdx++],spawnT:s,seed:this.rng()});if(r){let u=0,m=c.kind==="beat"?2:1;for(;this.innerIdx<this.inner.length&&u++<m;)this.cards.push({slot:this.inner[this.innerIdx++],spawnT:s,seed:this.rng()})}}this.cardIndex=this.outerIdx+this.innerIdx}draw(e,t){let s=e.gl,o=this.galleryActive?this.galleryCards:this.cards,a=o?o.length:0;if(!a)return;this.prog||(this.prog=new T(s,Ae,Te),this.mesh=new j(s,me(4,4),4,[{loc:1,size:4},{loc:2,size:4}]),this.data=new Float32Array(2048)),this.data.length<a*8&&(this.data=new Float32Array(a*8*2));let r=this.data;for(let h=0;h<a;h++){let f=o[h],u=f.slot,m=h*8;r[m]=u.c,r[m+1]=u.r,r[m+2]=u.w,r[m+3]=u.h;let p=f.seed<.1?5:f.seed<.22?4:Math.min(3,Math.floor((f.seed-.22)/.78*4));r[m+4]=f.spawnT,r[m+5]=p,r[m+6]=f.seed,r[m+7]=f.deathT||0}this.mesh.upload(r.subarray(0,a*8),a),s.enable(s.BLEND),s.blendFunc(s.ONE,s.ONE_MINUS_SRC_ALPHA);let c=this.galleryActive?this.galleryClock:this.idleActive?this.idleClock:t.time;this.prog.use().set("uViewport",[t.W,t.H]).set("uZoom",t.zoom).set("uCam",[t.camX,t.camY]).set("uTime",c).set("uMapFade",this.idleActive||this.galleryActive?1:t.mapFade).set("uAsmSlow",this.p.asmSlow).set("uAsmFast",this.p.asmFast).set("uKickStart",this.p.kickStart).set("uKickEnd",this.p.kickEnd),this.mesh.draw()}};_(L,"type","bentoBuild"),_(L,"schema",{radius:{default:168},cellCount:{default:1300},gap:{default:.34},holeRadius:{default:20},holeHold:{default:12},fillPower:{default:2},introRate:{default:1.3},onsetCap:{default:10},beatCap:{default:90},asmSlow:{default:2.6},asmFast:{default:.55},kickStart:{default:26},kickEnd:{default:38}});function We(i,e,t,s){let o=e*2.14,a=e*2.14,r=[{c:-o/2,r:-a/2,w:o,h:a}],c=0;for(;r.length<t&&c++<t*8;){r.sort((b,E)=>E.w*E.h-b.w*b.h);let p=Math.floor(Math.pow(i(),2)*Math.min(r.length,6)),l=r.splice(p,1)[0];if(l.w<3&&l.h<3){r.push(l);continue}let d=l.w>l.h?!0:l.w<l.h?!1:i()<.5,v=.42+i()*.16;if(d){let b=l.w*v;r.push({c:l.c,r:l.r,w:b,h:l.h},{c:l.c+b,r:l.r,w:l.w-b,h:l.h})}else{let b=l.h*v;r.push({c:l.c,r:l.r,w:l.w,h:b},{c:l.c,r:l.r+b,w:l.w,h:l.h-b})}}let h=r.filter(p=>Math.hypot(p.c+p.w/2,p.r+p.h/2)<e),f=.62,u=1.85,m=[];for(let p of h){let l=p.c+s,d=p.r+s,v=p.w-s*2,b=p.h-s*2;if(v<=0||b<=0)continue;let E=v/b;if(E>u){let A=b*u;l+=(v-A)/2,v=A}else if(E<f){let A=v/f;d+=(b-A)/2,b=A}v<2.4||b<2.4||m.push({c:l,r:d,w:v,h:b})}return m.sort((p,l)=>Math.hypot(p.c+p.w/2,p.r+p.h/2)-Math.hypot(l.c+l.w/2,l.r+l.h/2)),m}var je={isoGrid:H,bentoBuild:L};async function Be({canvas:i,audio:e,panel:t,config:s,dev:o}){let a=await q.load(s.timelineUrl),r=new G(s,a,je);e.src=s.audioUrl,e.preload="auto";let c=new X(i,r,e);return o&&(ge(c,r,t),window.studio={host:c,scene:r}),{host:c,scene:r}}var Ye=`#version 300 es
const vec2 P[3] = vec2[3](vec2(-1.0,-1.0), vec2(3.0,-1.0), vec2(-1.0,3.0));
out vec2 vUv;
void main(){ vec2 p = P[gl_VertexID]; vUv = p*0.5+0.5; gl_Position = vec4(p,0.0,1.0); }`,Xe=`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 frag;
uniform float uT;        // 0..1 progress
uniform float uAspect;   // w/h  (1 vertical unit == canvas height)
uniform float uCenterY;  // vertical centre (0..1)
uniform float uHalfW;    // panel half-width  in vertical units
uniform float uHalfH;    // panel half-height in vertical units
uniform float uTime;     // seconds, for shimmer / drift

float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  float a = hash(i), b = hash(i+vec2(1,0)), c = hash(i+vec2(0,1)), d = hash(i+vec2(1,1));
  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y); }
float fbm(vec2 p){ float s = 0.0, a = 0.55; for(int i=0;i<5;i++){ s += a*vnoise(p); p = p*2.03 + 1.3; a *= 0.5; } return s; }

// faint ray pair along an axis: al = along, pe = perpendicular. Thick + soft, fading to a point.
float rays(float al, float pe, float len, float baseThick){
  float a = clamp(1.0 - al/len, 0.0, 1.0);
  float thick = max(baseThick * pow(a, 1.6), 0.0008);
  float sharp = exp(-(pe*pe)/(2.0*thick*thick));
  float soft  = exp(-(pe*pe)/(2.0*pow(thick*5.5, 2.0)));
  return (sharp*0.15 + soft*1.0) * pow(a, 1.0);
}

void main(){
  vec2 p = vUv - vec2(0.5, uCenterY);
  p.x *= uAspect;                                  // aspect-correct: x,y share scale
  float t = clamp(uT, 0.0, 1.0);

  float appear = smoothstep(0.0, 0.14, t);
  float grow   = smoothstep(0.06, 0.90, t);
  float amp    = appear * (1.0 - smoothstep(0.38, 1.0, t));

  float baseThick = mix(max(uHalfH*0.34, 0.007), 0.0014, smoothstep(0.0, 0.5, t));
  float lenH = uHalfW * mix(1.0, 3.0, grow);
  float lenV = uHalfH * mix(1.4, 2.8, grow);

  // organic domain warp: a LOW-frequency, gentle bend off the perfect gaussian (not jagged forks)
  vec2 wn   = p*8.0;
  vec2 warp = vec2(fbm(wn + vec2(0.0, uTime*0.4)), fbm(wn + vec2(8.4, -uTime*0.3))) - 0.5;
  vec2 q    = p + warp * (uHalfH*0.18 + baseThick*0.6);

  // faint, gently-warped rays
  float rayH = rays(abs(q.x), q.y, lenH, baseThick);
  float rayV = rays(abs(q.y), q.x, lenV, baseThick);

  // soft haze (fbm-broken radial falloff) instead of a clean ball \u2014 softly mottled like air
  float rq   = length(q);
  float haze = exp(-rq / (uHalfH*0.9 + 0.026));
  float tex  = 0.55 + 0.55 * fbm(p*13.0 + vec2(-uTime*0.4, uTime*0.3));
  haze *= tex;

  // faint wide ambient wash
  float amb = exp(-length(p) / (uHalfH*1.5 + 0.045));

  vec3 shine = vec3(0.961, 0.969, 0.980);          // BONE_HI
  vec3 tint  = vec3(0.878, 0.886, 0.902);          // BONE
  vec3 glim  = shine + tint*0.41;                  // bucket-assembly shimmer tint

  vec3 col = glim  * (rayH + rayV) * 0.40
           + glim  * haze * 0.50
           + tint  * amb  * 0.16;

  col *= amp;
  col = col / (1.0 + 0.60*col);                    // soft knee
  frag = vec4(max(col, 0.0), 1.0);
}`,Z=class{constructor(e){this.canvas=e,this.gl=null,this.prog=null,this.raf=0,this.durMs=680,this.elapsed=0,this.centerY=.5,this.halfW=.06,this.halfH=.022}init(){let e=this.canvas.getContext("webgl2",{alpha:!0,premultipliedAlpha:!1,antialias:!1,depth:!1});if(!e)throw new Error("WebGL2 unavailable for CRT overlay");this.gl=e;let t=(o,a)=>{let r=e.createShader(o);if(e.shaderSource(r,a),e.compileShader(r),!e.getShaderParameter(r,e.COMPILE_STATUS))throw new Error(e.getShaderInfoLog(r));return r},s=e.createProgram();if(e.attachShader(s,t(e.VERTEX_SHADER,Ye)),e.attachShader(s,t(e.FRAGMENT_SHADER,Xe)),e.linkProgram(s),!e.getProgramParameter(s,e.LINK_STATUS))throw new Error(e.getProgramInfoLog(s));this.prog=s,this.vao=e.createVertexArray(),this.u={t:e.getUniformLocation(s,"uT"),aspect:e.getUniformLocation(s,"uAspect"),centerY:e.getUniformLocation(s,"uCenterY"),halfW:e.getUniformLocation(s,"uHalfW"),halfH:e.getUniformLocation(s,"uHalfH"),time:e.getUniformLocation(s,"uTime")}}resize(){let e=Math.min(devicePixelRatio||1,2),t=this.canvas.getBoundingClientRect(),s=t.width||innerWidth,o=t.height||innerHeight,a=Math.max(1,Math.round(s*e)),r=Math.max(1,Math.round(o*e));(this.canvas.width!==a||this.canvas.height!==r)&&(this.canvas.width=a,this.canvas.height=r),this.gl.viewport(0,0,a,r),this.aspect=a/r}play(e){try{this.gl||this.init()}catch{e&&e();return}this.resize(),this.start=performance.now(),this.onDone=e,cancelAnimationFrame(this.raf),this.raf=requestAnimationFrame(t=>this.loop(t))}loop(e){let t=(e-this.start)/1e3;this.elapsed=t;let s=Math.min(t/(this.durMs/1e3),1),o=s<.5?2*s*s:1-Math.pow(-2*s+2,2)/2;this.draw(o),s<1?this.raf=requestAnimationFrame(a=>this.loop(a)):(this.clear(),this.raf=0,this.onDone&&this.onDone())}draw(e){let t=this.gl,s=this.u;t.bindVertexArray(this.vao),t.useProgram(this.prog),t.uniform1f(s.t,e),t.uniform1f(s.aspect,this.aspect),t.uniform1f(s.centerY,this.centerY),t.uniform1f(s.halfW,this.halfW),t.uniform1f(s.halfH,this.halfH),t.uniform1f(s.time,this.elapsed),t.clearColor(0,0,0,1),t.clear(t.COLOR_BUFFER_BIT),t.drawArrays(t.TRIANGLES,0,3)}clear(){let e=this.gl;e&&(e.clearColor(0,0,0,1),e.clear(e.COLOR_BUFFER_BIT))}};function ke(i,e){let{stage:t,joinForm:s,email:o,joinBtn:a,hint:r,sound:c}=e,h=new Z(document.getElementById("crtfx"));if(s.classList.add("show"),c){let n=!1;c.addEventListener("click",g=>{g.stopPropagation(),n=!n,c.classList.toggle("off",n),i.audio.muted=n})}let f=s.querySelector(".caret"),u=document.createElement("span");u.setAttribute("aria-hidden","true"),u.style.cssText="position:absolute;left:-9999px;top:-9999px;white-space:pre;visibility:hidden;",s.appendChild(u);let m=!1,p=()=>{if(!m){let n=getComputedStyle(o);u.style.fontFamily=n.fontFamily,u.style.fontSize=n.fontSize,u.style.fontWeight=n.fontWeight,u.style.letterSpacing=n.letterSpacing,m=!0}u.textContent=o.value||"",f.style.transform=`translate(calc(-50% + ${u.offsetWidth/2}px), -50%)`},l=!1,d=!1,v=null,b="what\u2019s your email?",E=n=>/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(n),A=()=>{clearTimeout(v),v=null},se=()=>s.classList.toggle("valid",E(o.value.trim())),Ze=()=>{l=!1,d=!1,A(),cancelAnimationFrame(h.raf),h.raf=0,h.clear(),s.classList.remove("revealed","qdim","ready","valid","done","hidden"),o.value="",o.placeholder="",f.style.transform="translate(-50%, -50%)",r.className="join-ok hidden",r.textContent=""},Ne=()=>{A(),o.placeholder="",s.classList.remove("qdim");let n=0,g=()=>{if(n++,o.placeholder=b.slice(0,n)+(n<b.length?"|":""),n<b.length){v=setTimeout(g,22+Math.random()*24);return}s.classList.add("qdim","ready"),p()};v=setTimeout(g,200)},Se=(n="you@example.com")=>{A(),l=!0,d=!1,s.classList.add("show","revealed","ready"),s.classList.remove("qdim","done","hidden"),o.placeholder="",o.value=n,p(),se(),o.focus()},Fe=[...document.querySelectorAll(".teaser p")],oe=document.querySelector(".reveal"),D=.54,$=.48,N=(n,g,x)=>n+(g-n)*x,_e=n=>1-Math.pow(1-n,3),ie=n=>1-Math.pow(1-n,4),Me=n=>1-Math.pow(1-n,5),Ie=n=>n>=1?1:1-Math.pow(2,-10*n),ae=()=>{let n=Math.min(94,Math.max(52,(innerWidth||1024)*.072));return{enter:-n*.72,start:-n*.46,end:n*.46,exit:n*1.35}},P=(n,g,x,B,w=1)=>{n.style.setProperty("--teaser-opacity",g.toFixed(3)),n.style.setProperty("--teaser-x",`${x.toFixed(2)}px`),n.style.setProperty("--teaser-blur",`${B.toFixed(2)}px`),n.style.setProperty("--teaser-scale",w.toFixed(3))},ze=(n,g)=>{for(let x of Fe){let B=+x.dataset.t0,w=+x.dataset.t1,ne=g&&n>=B&&n<w+$,He=g&&n>=w&&n<w+$;if(x.classList.toggle("on",ne),x.classList.toggle("leaving",He),!ne){P(x,0,ae().enter,18,1.08);continue}let F=ae();if(n<B+D){let R=y((n-B)/D,0,1),U=Ie(R);P(x,ie(R),N(F.enter,F.start,Me(R)),N(18,0,U),N(1.08,1,U))}else if(n<w){let R=y((n-B-D)/Math.max(.01,w-B-D),0,1);P(x,1,N(F.start,F.end,R),0)}else{let R=y((n-w)/$,0,1),U=ie(R),K=_e(R);P(x,1-K,N(F.end,F.exit,U),N(0,18,K),N(1,1.055,K))}}},re=null;return i.onFrame=()=>{let n=i.scene;ze(n.t,i.started);let g=i.started&&n.t>=n.fadeStartT&&n.mapFade<.12;t.classList.toggle("fading",g),c&&c.classList.toggle("finished",g);let x=!i.started||g;x!==re&&(re=x,oe&&oe.classList.toggle("show",x))},a.addEventListener("click",n=>{l||(n.preventDefault(),l=!0,s.classList.add("revealed"),o.focus({preventScroll:!0}),Ne(),i.started||i.begin())}),o.addEventListener("input",()=>{s.classList.contains("ready")||(A(),o.placeholder=b,s.classList.add("qdim","ready")),p(),se()}),s.addEventListener("submit",n=>{if(n.preventDefault(),d)return;let g=(o.value||"").trim();if(!E(g)){o.focus();return}d=!0,A(),o.blur(),fetch("/api/waitlist",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email:g})}).catch(()=>{}),s.classList.add("done");let x=a.getBoundingClientRect(),B=h.canvas.getBoundingClientRect(),w=Math.max(1,B.height||innerHeight);h.centerY=((x.top+x.bottom)/2-B.top)/w,h.halfW=x.width/2/w,h.halfH=x.height/2/w,h.play(),setTimeout(()=>{s.classList.add("hidden"),r.className="join-ok",r.textContent="On the list"},600)}),{prefillJoin:Se}}function te(i,e){let{control:t,progress:s}=e;if(!t)return;let o=s?s.parentElement:null,a=.002,r=f=>y(f/i.scene.duration,0,1),c=f=>{let u=r(f),m=i.playing&&u<1-a;t.style.setProperty("--tour-progress",u.toFixed(5)),t.style.setProperty("--tour-progress-pos",`${(u*100).toFixed(3)}%`),t.classList.toggle("playing",m),o&&o.setAttribute("aria-valuenow",String(Math.round(u*100)))},h=i.onTime;i.onTime=f=>{h&&h(f),c(f)},c(i.scene.t)}var Re={seed:20260619,duration:51,audioUrl:"./wingmanintro.mp3",timelineUrl:"./assets/wingman-intro.timeline.json",camera:{startZoom:.42,stepEarly:.94,stepLate:.98,floor:.15},layers:[{type:"isoGrid"},{type:"bentoBuild",params:{radius:168,cellCount:1300,fillPower:2.85,introRate:1.3,asmSlow:2.6,asmFast:.55,kickStart:26,kickEnd:38,onsetCap:10,beatCap:90}}],finale:{fadeStartOffset:0,fadeDur:2.1,freezeCamera:!0},post:{bloom:1.7,threshold:.26,grade:.9,aberration:.7,vignette:.45,grain:.05,exposure:1,murk:.22}};var Oe=/[?&]dev\b/.test(location.search);Be({canvas:document.getElementById("scene"),audio:document.getElementById("track"),panel:document.getElementById("ui"),config:Re,dev:Oe}).then(({host:i})=>{let e=a=>document.getElementById(a),t=ke(i,{stage:e("stage"),joinForm:e("joinForm"),email:e("contactEntry"),joinBtn:e("joinBtn"),hint:e("hint"),sound:e("sound")}),s={control:e("tourControl"),progress:e("tourProgress")};if(!Oe){te(i,s),e("galleryBtn").remove();return}e("galleryBtn").style.display="block",e("galleryBtn").addEventListener("click",()=>i.toggleGallery());let o=location.search.match(/[?&]t=([\d.]+)/);o&&(e("centerWrap").classList.add("begun"),i.seekImmediate(parseFloat(o[1]))),/[?&]join/.test(location.search)&&(e("centerWrap").classList.add("begun"),i.seekImmediate(i.scene.duration-1.5),requestAnimationFrame(()=>t.prefillJoin())),/[?&]gallery/.test(location.search)&&(e("centerWrap").classList.add("begun"),i.toggleGallery()),te(i,s)}).catch(i=>{document.body.innerHTML="<pre style='color:#f88;padding:20px'>"+i.stack+"</pre>"});
