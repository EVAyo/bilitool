!function(e,t){"object"==typeof exports&&"object"==typeof module?module.exports=t():"function"==typeof define&&define.amd?define([],t):"object"==typeof exports?exports["video/player/focus"]=t():e["video/player/focus"]=t()}(self,(function(){return function(){"use strict";var e,t,o={103:function(e){e.exports="进入视频 / 番剧页面时, 自动定位到播放器. 注意: 不能和其他影响定位的功能一同使用, 例如自动宽屏. (相关讨论: [#483](https://github.com/the1812/Bilibili-Evolved/issues/483))\n\n可设置定位时的竖直偏移量, 单位为像素(px)."},569:function(e){e.exports=coreApis.spinQuery},109:function(e){e.exports=coreApis.utils}},n={};function r(e){var t=n[e];if(void 0!==t)return t.exports;var i=n[e]={exports:{}};return o[e](i,i.exports,r),i.exports}t=Object.getPrototypeOf?function(e){return Object.getPrototypeOf(e)}:function(e){return e.__proto__},r.t=function(o,n){if(1&n&&(o=this(o)),8&n)return o;if("object"==typeof o&&o){if(4&n&&o.__esModule)return o;if(16&n&&"function"==typeof o.then)return o}var i=Object.create(null);r.r(i);var u={};e=e||[null,t({}),t([]),t(t)];for(var c=2&n&&o;"object"==typeof c&&!~e.indexOf(c);c=t(c))Object.getOwnPropertyNames(c).forEach((function(e){u[e]=function(){return o[e]}}));return u.default=function(){return o},r.d(i,u),i},r.d=function(e,t){for(var o in t)r.o(t,o)&&!r.o(e,o)&&Object.defineProperty(e,o,{enumerable:!0,get:t[o]})},r.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},r.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})};var i={};return function(){r.d(i,{component:function(){return o}});var e=coreApis.utils.urls,t=r(103);const o={name:"playerFocus",displayName:"播放器定位",tags:[componentsTags.video],entry:async({settings:{options:e}})=>{const t=document.URL.includes("bangumi")?".bilibili-player":".video-info .video-title .tit",{select:o}=await Promise.resolve().then(r.t.bind(r,569,23)),{playerReady:n}=await Promise.resolve().then(r.t.bind(r,109,23)),i=await o(t);await n(),i&&(i.scrollIntoView(),0!==e.offset&&window.scrollBy(0,e.offset))},description:{"zh-CN":t},options:{offset:{displayName:"定位偏移量",defaultValue:-10}},urlInclude:e.videoAndBangumiUrls,commitHash:"c7a7e02679dca4f8098b166f4c5c9f455007837b",coreVersion:"2.1.7"}}(),i=i.component}()}));