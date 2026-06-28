/* =====================================================================
   Procedural card content. Each card runs a small time-driven GLSL sketch
   (per-card clock t, deterministic / scrubbable). Body uv 0..1, y=0 top.
   ===================================================================== */
export const CONTENT = /* glsl */`
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
    c += (side>0.5?AMBER*0.85:BONE*0.5) * 0.85 * popp * sbox(uv, vec2(x0,y), vec2(x0+w,y+0.1), 0.012);
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
  c += AMBER*0.9 * disc(uv, vec2(0.93,0.953), 0.018, 0.006);
  return c;
}

// ---------- B ----------
vec3 docDoc(vec2 uv, float seed, float t){   // lines type out one by one
  vec3 c = vec3(0.0);
  c += BONE*0.4 * sbox(uv, vec2(0.1,0.03), vec2(0.45,0.05), 0.005);               // toolbar
  c += AMBER*1.2 * sbox(uv, vec2(0.1,0.09), vec2(0.62,0.145), 0.008);             // title
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
  c += AMBER*0.7 * sbox(uv, vec2(0.0,0.0), vec2(1.0,0.12), 0.004);
  c += BONE*0.12 * sbox(uv, vec2(0.0,0.0), vec2(0.16,1.0), 0.004);
  vec2 g = uv*vec2(6.0,8.0); vec2 gf = fract(g), gi = floor(g);
  c += BONE*0.13 * max(1.0-smoothstep(0.0,0.04,gf.x), 1.0-smoothstep(0.0,0.04,gf.y));
  float filled = 9.0 + t*1.5;                                                     // cells fill at the frontier
  float ord = (gi.y-1.0)*5.0 + (gi.x-1.0);                                        // cell ordinal (reading order)
  float on = step(0.62, hash21(gi+seed*4.0)) * step(ord, filled) * step(0.0, ord);
  c += BONE*0.5 * on * sbox(gf, vec2(0.15,0.25), vec2(0.82,0.75), 0.06);
  c += AMBER*0.9 * step(0.88, hash21(gi+seed*9.0)) * step(ord,filled) * sbox(gf, vec2(0.15,0.25), vec2(0.82,0.75), 0.06);
  // a moving selection that fills entries in order
  float si = mod(floor(filled), 35.0);
  vec2 selc = vec2(1.0+mod(si,5.0), 1.0+floor(si/5.0));
  if(abs(gi.x-selc.x)<0.5 && abs(gi.y-selc.y)<0.5){
    c += AMBER*1.4 * (1.0 - sbox(gf, vec2(0.04), vec2(0.96), 0.025));             // selection box
    if(fract(filled) < 0.55) c += AMBER*0.9 * blink(t) * sbox(gf, vec2(0.2,0.32), vec2(0.24,0.68), 0.02);  // entering a value
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
    vec3 tk = mix(BONE*0.7, mix(AMBER,BLUE,hash11(fi+seed))*1.4, step(0.5, hash21(vec2(fi,seed*5.0))));
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
  c += AMBER*1.2 * sbox(uv, vec2(0.55,0.045), vec2(0.55+0.39*p,0.075), 0.006);
  for(int i=0;i<7;i++){ float fi=float(i); float y=0.13+fi*0.115;
    float done = step(fi+1.0, checked);
    float pop = done * smoothstep(0.0, 0.5, checked-(fi+1.0));
    c += BONE*0.45 * (disc(uv,vec2(0.09,y+0.025),0.022,0.006)-disc(uv,vec2(0.09,y+0.025),0.013,0.006));
    c += AMBER*1.3 * mix(done, 1.4, 1.0-step(0.05,checked-(fi+1.0))) * done * disc(uv,vec2(0.09,y+0.025),0.012,0.005);
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
    c += mix(BONE_HI,AMBER,fk*0.4) * 0.7 * sbox(uv, vec2(x0+0.02,0.05), vec2(x0+0.27,0.09), 0.006);   // header
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
  c += AMBER*0.12*(0.5+lift) * sbox(uv, vec2(mx-0.005,my-0.012), vec2(mx+0.285,my+CARDH+0.01), 0.02);   // lift halo
  c += AMBER*0.24 * sbox(uv, vec2(mx+0.02,my), vec2(mx+0.27,my+CARDH), 0.01);
  c += AMBER*(0.7+0.4*lift) * sbox(uv, vec2(mx+0.04,my+0.02), vec2(mx+0.15,my+0.04), 0.005);
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
    c += AMBER*0.95 * blob(b, vec2(0.375,0.275), 0.075, seed+1.3);                // abstract play orb (not a clean ring)
    c += AMBER_D*0.6 * blob(b, vec2(0.375,0.275), 0.04, seed+5.1);
    float pp = fract(t*0.045);                                                    // playhead loops
    c += BONE*0.18 * sbox(b, vec2(0.05,0.55), vec2(0.70,0.57), 0.004);
    c += AMBER*1.2 * sbox(b, vec2(0.05,0.55), vec2(0.05+0.65*pp,0.57), 0.004);
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
      c += AMBER*0.7*pop * disc(b, vec2(0.4,y+0.25), 0.009, 0.004);
      c += BONE*0.3*pop * disc(b, vec2(0.53,y+0.25), 0.009, 0.004);
    }
  } else if(site<3.5){                           // article (static)
    c += BONE*0.2 * sbox(b, vec2(0.06,0.05), vec2(0.94,0.32), 0.01);
    c += AMBER*1.0 * sbox(b, vec2(0.06,0.37), vec2(0.72,0.42), 0.008);
    for(int i=0;i<9;i++){ float fi=float(i); float y=0.47+fi*0.05;
      c += BONE*0.5 * sbox(b, vec2(0.06,y), vec2(0.06+0.42*(0.4+0.55*hash21(vec2(fi,seed))),y+0.018), 0.005);
      c += BONE*0.5 * sbox(b, vec2(0.52,y), vec2(0.52+0.42*(0.4+0.55*hash21(vec2(fi,seed*2.0))),y+0.018), 0.005);
    }
  } else {                                       // shop (static)
    c += BONE*0.5 * sbox(b, vec2(0.06,0.04), vec2(0.5,0.08), 0.006);
    for(int i=0;i<2;i++) for(int j=0;j<3;j++){ vec2 p=vec2(0.06+float(j)*0.31, 0.14+float(i)*0.44);
      c += BONE*0.2  * sbox(b, p, p+vec2(0.26,0.26), 0.008);
      c += BONE*0.35 * sbox(b, p+vec2(0.0,0.29), p+vec2(0.2,0.305), 0.005);
      c += AMBER*1.1 * sbox(b, p+vec2(0.0,0.33), p+vec2(0.12,0.36), 0.006);
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
    if(isCmd) c += AMBER*1.2 * sbox(uv, vec2(0.04,y), vec2(0.062,y+0.024), 0.004);   // $ prompt
    vec3 col = isCmd ? BONE_HI*0.75 : (kind<0.55 ? GREEN*0.9 : (kind<0.72 ? AMBER*0.8 : BONE*0.5));
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
      c+=AMBER*bp*disc(uv,op,0.012*zoom,0.005); c+=AMBER*0.22*disc(uv,op,0.030*zoom,0.012);
    }
  }
  float g=t/4.0,ph=fract(g),seg=floor(g);                                             // one dot drifts plate to plate
  vec2 a0=hubCtr(seed,mod(seg,zf),zf), a1=hubCtr(seed,mod(seg+1.0,zf),zf);
  vec2 mij=mix(a0,a1,smoothstep(0.18,0.88,ph)); vec2 mp=O+vec2((mij.x-mij.y)*OW,(mij.x+mij.y)*OH);
  c+=AMBER*(0.9+0.4*pulse(t*2.0))*disc(uv,mp,0.011*zoom,0.004);
  c+=BONE_HI*0.7*disc(uv,mp-vec2(0.0,0.015*zoom),0.006*zoom,0.003);
  return c;
}
vec3 cardInk(float typeF, vec2 uv, float seed, float t){
  int type = int(typeF + 0.5);
  // SALT — cheap per-card variance from the seed, so same-type buckets differ:
  float ts = t * (0.78 + 0.55*hash11(seed*5.9));        // animation speed (desyncs the sims)
  float hH = 0.1;
  vec3 c = vec3(0.0);
  if(uv.y < hH){                                         // generic title bar
    c += AMBER * (0.9 + 0.5*pulse(ts + seed*6.0)) * disc(uv, vec2(0.045,hH*0.5), 0.013, 0.005);
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
  // more salt — strong per-card colour "mood" (the scene is murky, so colour reads most),
  // plus brightness + saturation, so two buckets of the same type look clearly distinct.
  float m = hash11(seed*4.2);
  vec3 mood = m<0.30 ? vec3(1.20,0.96,0.74)        // warm amber
            : m<0.50 ? vec3(1.05,1.00,0.93)        // neutral warm
            : m<0.68 ? vec3(0.80,0.94,1.20)        // cool steel
            : m<0.84 ? vec3(1.22,0.86,0.70)        // rust
            :          vec3(0.84,1.12,0.92);       // faint green
  c *= mood;
  c *= 0.80 + 0.42 * hash11(seed*9.1);                          // brightness
  float luma = dot(c, vec3(0.299,0.587,0.114));
  c = mix(vec3(luma), c, 0.70 + 0.60 * hash11(seed*6.6));       // saturation (muted <-> vivid)
  return c;
}
`;
