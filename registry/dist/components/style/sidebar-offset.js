!function(t,e){"object"==typeof exports&&"object"==typeof module?module.exports=e():"function"==typeof define&&define.amd?define([],e):"object"==typeof exports?exports["style/sidebar-offset"]=e():t["style/sidebar-offset"]=e()}(self,(function(){return function(){var t,e,n={900:function(t,e,n){var o=n(645)((function(t){return t[1]}));o.push([t.id,".be-settings > .sidebar {\n  top: calc(50% + var(--be-sidebar-offset)) !important;\n}",""]),t.exports=o},645:function(t){"use strict";
// eslint-disable-next-line func-names
t.exports=function(t){var e=[];return e.toString=function(){return this.map((function(e){var n=t(e);return e[2]?"@media ".concat(e[2]," {").concat(n,"}"):n})).join("")},
// eslint-disable-next-line func-names
e.i=function(t,n,o){"string"==typeof t&&(
// eslint-disable-next-line no-param-reassign
t=[[null,t,""]]);var r={};if(o)for(var i=0;i<this.length;i++){
// eslint-disable-next-line prefer-destructuring
var f=this[i][0];null!=f&&(r[f]=!0)}for(var a=0;a<t.length;a++){var s=[].concat(t[a]);o&&r[s[0]]||(n&&(s[2]?s[2]="".concat(n," and ").concat(s[2]):s[2]=n),e.push(s))}},e}},215:function(t,e,n){var o=n(900);o&&o.__esModule&&(o=o.default),t.exports="string"==typeof o?o:o.toString()}},o={};function r(t){var e=o[t];if(void 0!==e)return e.exports;var i=o[t]={id:t,exports:{}};return n[t](i,i.exports,r),i.exports}e=Object.getPrototypeOf?function(t){return Object.getPrototypeOf(t)}:function(t){return t.__proto__},r.t=function(n,o){if(1&o&&(n=this(n)),8&o)return n;if("object"==typeof n&&n){if(4&o&&n.__esModule)return n;if(16&o&&"function"==typeof n.then)return n}var i=Object.create(null);r.r(i);var f={};t=t||[null,e({}),e([]),e(e)];for(var a=2&o&&n;"object"==typeof a&&!~t.indexOf(a);a=e(a))Object.getOwnPropertyNames(a).forEach((function(t){f[t]=function(){return n[t]}}));return f.default=function(){return n},r.d(i,f),i},r.d=function(t,e){for(var n in e)r.o(e,n)&&!r.o(t,n)&&Object.defineProperty(t,n,{enumerable:!0,get:e[n]})},r.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},r.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})};var i={};return function(){"use strict";r.d(i,{component:function(){return n}});var t=coreApis.settings,e=coreApis.utils;const n={name:"sidebarOffset",displayName:"侧栏垂直偏移",tags:[componentsTags.style],instantStyles:[{name:"sidebarOffset",style:()=>Promise.resolve().then(r.t.bind(r,215,23))}],description:{"zh-CN":"给脚本的侧栏设置垂直偏移量, 范围为 -40% ~ 40%"},entry:({metadata:e})=>{(0,t.addComponentListener)(`${e.name}.offset`,(t=>{document.body.style.setProperty("--be-sidebar-offset",`${t}%`)}),!0)},options:{offset:{displayName:"偏移量 (%)",defaultValue:0,validator:(0,e.getNumberValidator)(-40,40)}},commitHash:"c7a7e02679dca4f8098b166f4c5c9f455007837b",coreVersion:"2.1.7"}}(),i=i.component}()}));