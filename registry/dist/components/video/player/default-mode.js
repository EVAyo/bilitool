!function(e,n){"object"==typeof exports&&"object"==typeof module?module.exports=n():"function"==typeof define&&define.amd?define([],n):"object"==typeof exports?exports["video/player/default-mode"]=n():e["video/player/default-mode"]=n()}(self,(function(){return function(){"use strict";var e={d:function(n,t){for(var o in t)e.o(t,o)&&!e.o(n,o)&&Object.defineProperty(n,o,{enumerable:!0,get:t[o]})},o:function(e,n){return Object.prototype.hasOwnProperty.call(e,n)}},n={};e.d(n,{component:function(){return c}});var t=coreApis.componentApis.video.playerAgent,o=coreApis.spinQuery,l=coreApis.utils,a=coreApis.utils.lazyPanel,r=coreApis.utils.urls;let s;!function(e){e.Normal="常规",e.Wide="宽屏",e.WebFullscreen="网页全屏",e.Fullscreen="全屏"}(s||(s={}));const c={name:"defaultPlayerMode",displayName:"默认播放器模式",entry:async({settings:{options:e}})=>{if((0,l.isEmbeddedPlayer)())return;const{query:{control:{buttons:n}}}=t.playerAgent;await(0,l.playerReady)();const r=new Map([[s.Normal,none],[s.Wide,async()=>{await(0,a.loadLazyPanel)(n.widescreen.selector),(0,l.disableWindowScroll)((()=>t.playerAgent.widescreen()))}],[s.WebFullscreen,async()=>{await(0,a.loadLazyPanel)(n.webFullscreen.selector),t.playerAgent.webFullscreen()}],[s.Fullscreen,async()=>{null!==await(0,o.sq)((()=>dq(t.playerAgent.query.video.element.selector)),(e=>null!==e&&4===e.readyState&&"complete"===document.readyState&&document.hasFocus()))?t.playerAgent.fullscreen():console.warn("[默认播放器模式] 未能应用全屏模式, 等待超时.")}]]),c=await t.playerAgent.query.video.element();if(!c)return;const i=r.get(e.mode);e.applyOnPlay&&!t.playerAgent.isAutoPlay()?c.addEventListener("play",i,{once:!0}):i()},tags:[componentsTags.video],description:{"zh-CN":"控制是否使用默认播放器模式, 可以为`常规`, `宽屏`, `网页全屏`或`全屏`. 注意: 不能和其他影响定位的功能一同使用, 例如播放器定位. (相关讨论: [#483](https://github.com/the1812/Bilibili-Evolved/issues/483))","en-US":"Set the default player mode. Could be `Normal`, `Widescreen`, `Web fullscreen` or `Fullscreen`.","ja-JP":"デフォルト・プレーヤー・モードが使用するかどうかを制御する、 例えば`常规`、`宽屏`、 `网页全屏`か`全屏`."},options:{mode:{defaultValue:s.Normal,displayName:"模式选择",dropdownEnum:s},applyOnPlay:{defaultValue:!1,displayName:"播放时应用"}},urlInclude:r.allVideoUrls,commitHash:"c7a7e02679dca4f8098b166f4c5c9f455007837b",coreVersion:"2.1.7"};return n=n.component}()}));