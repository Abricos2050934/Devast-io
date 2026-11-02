// Minimal DOM/canvas with recorded drawing operations for behavioral assertions.
function domFixture() {
  const calls=[];
  function context(canvas){const ctx={canvas,globalAlpha:1,fillStyle:'#000',strokeStyle:'#000'};const states=[];
    for(const name of ['clearRect','fillRect','strokeRect','beginPath','moveTo','lineTo','stroke','arc','rect','clip','fillText','strokeText'])ctx[name]=function(...args){calls.push({name,args,fill:this.fillStyle,stroke:this.strokeStyle,alpha:this.globalAlpha});};
    ctx.save=function(){states.push({globalAlpha:this.globalAlpha,fillStyle:this.fillStyle,strokeStyle:this.strokeStyle});};
    ctx.restore=function(){Object.assign(this,states.pop()||{});};ctx.measureText=s=>({width:String(s).length*7});return ctx;
  }
  function element(tag){const e={tagName:tag.toUpperCase(),style:{},dataset:{},children:[],listeners:new Map(),width:800,height:600,
    appendChild(child){if(child.parent)child.parent.children=child.parent.children.filter(x=>x!==child);this.children.push(child);child.parent=this;return child;},remove(){if(this.parent)this.parent.children=this.parent.children.filter(x=>x!==this);},
    replaceChildren(...children){for(const child of this.children)child.parent=null;this.children=[];for(const child of children)this.appendChild(child);},
    addEventListener(type,fn){if(!this.listeners.has(type))this.listeners.set(type,new Set());this.listeners.get(type).add(fn);},removeEventListener(type,fn){this.listeners.get(type)?.delete(fn);},
    attachShadow(){return this.shadowRoot=element('shadow');},getBoundingClientRect(){return {left:10,top:20,width:400,height:300};},
    querySelector(){return this.input??=element('input');},blur(){},closest(){return null;}};
    if(tag==='canvas'){const c=context(e);e.getContext=()=>c;}return e;
  }
  const canvas=element('canvas');canvas.id='can';const chat=element('input');chat.id='chatInput';chat.maxLength=20;
  const document={readyState:'loading',body:element('body'),head:element('head'),activeElement:null,createElement:element,getElementById:id=>id==='can'?canvas:id==='chatInput'?chat:null};
  class GUI {
    constructor(){this.domElement=element('div');this.__controllers=[];this.__folders={};}
    addFolder(name){return this.__folders[name]=new GUI();}
    add(object,property){const c={object,property,domElement:element('div'),name(){return this;},onChange(fn){this.changed=fn;return this;},listen(){return this;},updateDisplay(){return this;},setValue(value){object[property]=value;this.changed?.(value);return this;}};this.__controllers.push(c);return c;}
    addColor(...args){return this.add(...args);}updateDisplay(){}destroy(){this.destroyed=true;}
  }
  return {document,canvas,calls,GUI};
}
module.exports={domFixture};
