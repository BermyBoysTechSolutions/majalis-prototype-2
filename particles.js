const PALETTE = [[.86,.94,.58],[.47,.76,.66],[.92,.65,.48]];
export function buildShapeClouds(sources, count = 5600) {
  return sources.map((svg, scene) => {
    const paths = [...svg.querySelectorAll('path,circle,ellipse,polygon,polyline,line')].map(path => ({ path, length: path.getTotalLength(), tone: Number(path.dataset.tone || 0) }));
    const total = paths.reduce((sum, path) => sum + path.length, 0);
    const positions = new Float32Array(count * 3), colors = new Float32Array(count * 3);
    let pathIndex = 0, consumed = 0;
    for (let i = 0; i < count; i++) {
      const distance = (i + .5) / count * total;
      while (pathIndex < paths.length - 1 && distance > consumed + paths[pathIndex].length) consumed += paths[pathIndex++].length;
      const { path, tone } = paths[pathIndex];
      const p = path.getPointAtLength(distance - consumed);
      // A stable permutation distributes each illustration's strokes over the
      // same particle IDs, making the shader morph a field rather than a wipe.
      const index = ((i * 3571) % count) * 3;
      positions[index] = p.x / 120;
      positions[index + 1] = p.y / 120;
      positions[index + 2] = Math.sin(i * .071 + scene) * .026 + (tone - 1) * .07;
      colors.set(PALETTE[tone % PALETTE.length], index);
    }
    return { positions, colors };
  });
}
const VERTEX = `
precision highp float;
attribute vec3 aFrom;
attribute vec3 aTo;
attribute vec3 aColorFrom;
attribute vec3 aColorTo;
attribute float aSeed;
uniform vec2 uResolution;
uniform vec2 uCenter;
uniform float uScale;
uniform float uDpr;
uniform float uMorph;
uniform float uTime;
uniform float uIntro;
varying vec3 vColor;
varying float vAlpha;
void main() {
  float delay = fract(aSeed * 41.73) * .18;
  float t = smoothstep(delay, .82 + delay, uMorph);
  float wave = sin(t * 3.14159265);
  vec3 p = mix(aFrom, aTo, t);
  float angle = aSeed * 31.4159 + t * 4.0 + uTime * .15;
  float scatter = wave * (.18 + .62 * fract(aSeed * 23.41));
  p.xy += vec2(cos(angle), sin(angle)) * scatter;
  p.z += wave * sin(aSeed * 19.7 + t * 5.0) * .95;
  float ry = sin(uTime * .19) * .10;
  float rz = sin(uTime * .13) * .018;
  p = vec3(cos(ry)*p.x + sin(ry)*p.z, p.y, -sin(ry)*p.x + cos(ry)*p.z);
  p.xy = mat2(cos(rz), -sin(rz), sin(rz), cos(rz)) * p.xy;
  p.xy += vec2(sin(uTime*.5+aSeed*28.0),cos(uTime*.42+aSeed*23.0))*.0018;
  float intro = smoothstep(aSeed*.22, .78+aSeed*.22, uIntro);
  vec2 origin = vec2(cos(aSeed*62.0),sin(aSeed*62.0))*(1.0+fract(aSeed*14.9)*1.4);
  p.xy = mix(origin,p.xy,intro);
  float perspective = 3.5/(3.5+p.z*.38);
  vec2 pixel = uCenter + p.xy*uScale*perspective;
  gl_Position = vec4(pixel.x/uResolution.x*2.0-1.0,1.0-pixel.y/uResolution.y*2.0,0.0,1.0);
  gl_PointSize = (2.0+.6*fract(aSeed*9.7))*uDpr*perspective;
  vColor = mix(aColorFrom,aColorTo,t);
  vAlpha = (.74 + .16*sin(uTime*.8+aSeed*23.0))*(.15+.85*intro);
}`;
const FRAGMENT = `
precision mediump float;
varying vec3 vColor;
varying float vAlpha;
void main(){
 float distance=length(gl_PointCoord-vec2(.5));
 float alpha=(1.0-smoothstep(.13,.5,distance))*vAlpha;
 if(alpha<.02)discard;
 gl_FragColor=vec4(vColor*alpha,alpha);
}`;
export class ParticleWorld {
  constructor(canvas, clouds, count = 5600) {
    this.canvas = canvas; this.clouds = clouds; this.count = count; this.pair = -1;
    const gl = canvas.getContext('webgl', { alpha: true, antialias: false, depth: false, stencil: false, premultipliedAlpha: true, powerPreference: 'high-performance' });
    if (!gl) throw new Error('WebGL is unavailable');
    this.gl = gl;
    const shader = (type, source) => {
      const s = gl.createShader(type); gl.shaderSource(s, source); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    const vs = shader(gl.VERTEX_SHADER, VERTEX), fs = shader(gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram(); gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program);
    gl.deleteShader(vs); gl.deleteShader(fs);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    this.program = program; gl.useProgram(program);
    this.buffers = {};
    for (const [name, size] of [['aFrom',3],['aTo',3],['aColorFrom',3],['aColorTo',3],['aSeed',1]]) {
      const buffer = gl.createBuffer(); this.buffers[name] = buffer;
      gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
      const location=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,size,gl.FLOAT,false,0,0);
    }
    const seeds = Float32Array.from({length:count}, (_,i)=>(i*.61803398875)%1);
    gl.bindBuffer(gl.ARRAY_BUFFER,this.buffers.aSeed);gl.bufferData(gl.ARRAY_BUFFER,seeds,gl.STATIC_DRAW);
    this.uniforms = Object.fromEntries(['uResolution','uCenter','uScale','uDpr','uMorph','uTime','uIntro'].map(name=>[name,gl.getUniformLocation(program,name)]));
    gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE);gl.clearColor(0,0,0,0);
  }
  resize(width,height,portrait) {
    const gl=this.gl,dpr=Math.min(devicePixelRatio,portrait?1.6:1.8);
    this.canvas.width=Math.round(width*dpr);this.canvas.height=Math.round(height*dpr);gl.viewport(0,0,this.canvas.width,this.canvas.height);
    gl.uniform2f(this.uniforms.uResolution,width,height);gl.uniform1f(this.uniforms.uDpr,dpr);
    let cx=width*.715,cy=height*.51,scale=Math.min(width*.235,height*.34);
    if(portrait){cx=width*.5;cy=height*(height<=620?.30:height<=700?.30:.31);scale=Math.min(width*.40,height*(height<=620?.165:height<=700?.19:.205));}
    gl.uniform2f(this.uniforms.uCenter,cx,cy);gl.uniform1f(this.uniforms.uScale,scale);
  }
  render(time,position,intro=1) {
    const gl=this.gl,pair=Math.min(Math.floor(position),this.clouds.length-2),morph=Math.max(0,Math.min(1,position-pair));
    if(pair!==this.pair){
      this.pair=pair;
      for(const [name,data] of [['aFrom',this.clouds[pair].positions],['aTo',this.clouds[pair+1].positions],['aColorFrom',this.clouds[pair].colors],['aColorTo',this.clouds[pair+1].colors]]){
        gl.bindBuffer(gl.ARRAY_BUFFER,this.buffers[name]);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);
      }
    }
    gl.uniform1f(this.uniforms.uMorph,morph);gl.uniform1f(this.uniforms.uTime,time);gl.uniform1f(this.uniforms.uIntro,intro);
    gl.clear(gl.COLOR_BUFFER_BIT);gl.drawArrays(gl.POINTS,0,this.count);
  }
  destroy(){const gl=this.gl;Object.values(this.buffers).forEach(buffer=>gl.deleteBuffer(buffer));gl.deleteProgram(this.program);}
}
