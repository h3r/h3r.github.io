import{g as n,h as s,j as t,d as h,y as x,s as f,L as v,C as k,l as m,t as o,u as e,F as w,i as b,M as g,D as C,v as y}from"./vendor.ab0b39cb.js";import{u as L}from"./index.ca32fc5f.js";const V={xmlns:"http://www.w3.org/2000/svg","xmlns:xlink":"http://www.w3.org/1999/xlink",width:"1.2em",height:"1.2em",preserveAspectRatio:"xMidYMid meet",viewBox:"0 0 32 32"},A=t("path",{d:"M21.677 14l-1.245-3.114A2.986 2.986 0 0 0 17.646 9h-4.092a3.002 3.002 0 0 0-1.544.428L7 12.434V18h2v-4.434l3-1.8v11.931l-3.462 5.194L10.202 30L14 24.303V11h3.646a.995.995 0 0 1 .928.629L20.323 16H26v-2z",fill:"currentColor"},null,-1),M=t("path",{d:"M17.051 18.316L19 24.162V30h2v-6.162l-2.051-6.154l-1.898.632z",fill:"currentColor"},null,-1),N=t("path",{d:"M16.5 8A3.5 3.5 0 1 1 20 4.5A3.504 3.504 0 0 1 16.5 8zm0-5A1.5 1.5 0 1 0 18 4.5A1.502 1.502 0 0 0 16.5 3z",fill:"currentColor"},null,-1),$=[A,M,N];function z(i,l){return n(),s("svg",V,$)}var B={name:"carbon-pedestrian",render:z};const j={class:"text-4xl"},S={class:"text-sm opacity-50"},D={key:0,class:"text-sm mt-4"},E={class:"opacity-75"},H=h({props:{name:{type:String,required:!0}},setup(i){const l=i,p=x(),c=L(),{t:r}=f();return v(()=>{c.setNewName(l.name)}),(F,u)=>{const d=B,_=k("router-link");return n(),s("div",null,[t("p",j,[m(d,{class:"inline-block"})]),t("p",null,o(e(r)("intro.hi",{name:l.name})),1),t("p",S,[t("em",null,o(e(r)("intro.dynamic-route")),1)]),e(c).otherNames.length?(n(),s("p",D,[t("span",E,o(e(r)("intro.aka"))+":",1),t("ul",null,[(n(!0),s(w,null,b(e(c).otherNames,a=>(n(),s("li",{key:a},[m(_,{to:`/hi/${a}`,replace:""},{default:C(()=>[y(o(a),1)]),_:2},1032,["to"])]))),128))])])):g("",!0),t("div",null,[t("button",{class:"btn m-3 text-sm mt-6",onClick:u[0]||(u[0]=a=>e(p).back())},o(e(r)("button.back")),1)])])}}});export{H as default};
