// ==UserScript==
// @name           B站直播间挂机助手
// @name:en        Bilibili Live Helper
// @namespace      https://github.com/andywang425
// @author         andywang425
// @description    优化直播观看体验
// @description:en Improve live viewing experience
// @updateURL      https://raw.githubusercontent.com/andywang425/BLTH/master/B%E7%AB%99%E7%9B%B4%E6%92%AD%E9%97%B4%E6%8C%82%E6%9C%BA%E5%8A%A9%E6%89%8B.user.js
// @downloadURL    https://raw.githubusercontent.com/andywang425/BLTH/master/B%E7%AB%99%E7%9B%B4%E6%92%AD%E9%97%B4%E6%8C%82%E6%9C%BA%E5%8A%A9%E6%89%8B.user.js
// @homepageURL    https://github.com/andywang425/BLTH
// @supportURL     https://github.com/andywang425/BLTH/issues
// @icon           https://cdn.jsdelivr.net/gh/andywang425/BLTH@7d7ca494edd314806460e24c6b59be8ae1bd7dc6/img/script-icon.png
// @copyright      2021, andywang425 (https://github.com/andywang425)
// @license        MIT
// @compatible     chrome 80 or later
// @compatible     firefox 77 or later
// @compatible     opera 69 or later
// @compatible     safari 13.1 or later
// @version        5.7.3
// @include        /https?:\/\/live\.bilibili\.com\/[blanc\/]?[^?]*?\d+\??.*/
// @run-at         document-start
// @connect        passport.bilibili.com
// @connect        api.live.bilibili.com
// @connect        api.bilibili.com
// @connect        api.vc.bilibili.com
// @connect        live-trace.bilibili.com
// @connect        sc.ftqq.com
// @connect        push.xuthus.cc
// @connect        sctapi.ftqq.com
// @connect        pushplus.plus
// @connect        cdn.jsdelivr.net
// @connect        raw.fastgit.org
// @connect        raw.githubusercontent.com
// @connect        andywang.top
// @require        https://cdn.jsdelivr.net/gh/andywang425/BLTH@dac0d115a45450e6d3f3e17acd4328ab581d0514/assets/js/library/Ajax-hook.min.js
// @require        https://cdn.jsdelivr.net/npm/jquery@3.2.1/dist/jquery.min.js
// @require        https://cdn.jsdelivr.net/gh/andywang425/BLTH@d810c0c54546b88addc612522c76ba481285298d/assets/js/library/decode.min.js
// @require        https://cdn.jsdelivr.net/npm/pako@1.0.10/dist/pako.min.js
// @require        https://cdn.jsdelivr.net/gh/andywang425/BLTH@f50572d570ced20496cc77fe6a0853a1deed3671/assets/js/library/bliveproxy.min.js
// @require        https://cdn.jsdelivr.net/gh/andywang425/BLTH@bb6510e6a12a8a26add3cfb21527ed4d28bc6f71/assets/js/library/BilibiliAPI_Mod.min.js
// @require        https://cdn.jsdelivr.net/gh/andywang425/BLTH@4368883c643af57c07117e43785cd28adcb0cb3e/assets/js/library/layer.min.js
// @require        https://cdn.jsdelivr.net/gh/andywang425/BLTH@dac0d115a45450e6d3f3e17acd4328ab581d0514/assets/js/library/libBilibiliToken.min.js
// @require        https://cdn.jsdelivr.net/gh/andywang425/BLTH@dac0d115a45450e6d3f3e17acd4328ab581d0514/assets/js/library/libWasmHash.min.js
// @resource       layerCss https://cdn.jsdelivr.net/gh/andywang425/BLTH@f9a554a9ea739ccde68918ae71bfd17936bae252/assets/css/layer.css
// @resource       myCss    https://cdn.jsdelivr.net/gh/andywang425/BLTH@da3d8ce68cde57f3752fbf6cf071763c34341640/assets/css/myCss.min.css
// @resource       main     https://cdn.jsdelivr.net/gh/andywang425/BLTH@bb6510e6a12a8a26add3cfb21527ed4d28bc6f71/assets/html/main.min.html
// @resource       eula     https://cdn.jsdelivr.net/gh/andywang425/BLTH@da3d8ce68cde57f3752fbf6cf071763c34341640/assets/html/eula.min.html
// @grant          unsafeWindow
// @grant          GM_xmlhttpRequest
// @grant          GM_getResourceText
// @grant          GM_notification
// @grant          GM_openInTab
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_deleteValue
// @grant          GM_addStyle
// ==/UserScript==

(function () {
  localstorage2gm();
  const NAME = 'BLTH',
    anchorFollowTagName = 'BLTH天选关注UP',
    anchorPrizeTagName = 'BLTH天选中奖UP',
    W = typeof unsafeWindow === 'undefined' ? window : unsafeWindow,
    eventListener = W.addEventListener,
    wfetch = window.fetch,
    ts_ms = () => Date.now(), // 当前毫秒
    ts_s = () => Math.round(ts_ms() / 1000), // 当前秒
    tz_offset = new Date().getTimezoneOffset() + 480, // 本地时间与东八区差的分钟数
    getCHSdate = () => {
      // 返回东八区 Date
      return new Date(ts_ms() + tz_offset * 60000);
    },
    delayCall = (callback, delay = 120e3) => {
      const p = $.Deferred();
      setTimeout(() => {
        const t = callback();
        if (t && t.then) t.then((arg1, arg2, arg3, arg4, arg5, arg6) => p.resolve(arg1, arg2, arg3, arg4, arg5, arg6));
        else p.resolve();
      }, delay);
      return p;
    },
    MYDEBUG = (sign, ...data) => {
      if (!SP_CONFIG.debugSwitch) return;
      if (typeof data[0] === "object" && data[0].netError) return MYERROR(sign, ...data);
      let d = new Date();
      d = `%c[${NAME}]%c[${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}:${d.getMilliseconds()}]%c`;
      if (data.length === 1) { console.log(d, "font-weight: bold;", "color: #0920e6;", "", `${sign}:`, data[0],); return }
      console.log(d, "font-weight: bold;", "color: #0920e6;", "", `${sign}:`, data,);
    },
    MYERROR = (sign, ...data) => {
      let d = new Date();
      d = `[${NAME}][${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}:${d.getMilliseconds()}]`;
      if (data.length === 1) { console.error(d, `${sign}:`, data[0]); return }
      console.error(d, `${sign}:`, data);
    },
    runMidnight = (callback, msg) => {
      // 明天凌晨0点1分再次运行
      const t = new Date();
      let name = msg || ' ';
      t.setMinutes(t.getMinutes() + tz_offset);
      t.setDate(t.getDate() + 1);
      t.setHours(0, 1, 0, 0);
      t.setMinutes(t.getMinutes() - tz_offset);
      setTimeout(callback, t - ts_ms());
      MYDEBUG('runMidnight', name + " " + t.toString());
    },
    runExactMidnight = (callback, msg) => {
      // 明天凌晨0点再次运行
      const t = new Date();
      let name = msg || ' ';
      t.setMinutes(t.getMinutes() + tz_offset);
      t.setDate(t.getDate() + 1);
      t.setHours(0, 0, 0, 0);
      t.setMinutes(t.getMinutes() - tz_offset);
      setTimeout(callback, t - ts_ms());
      MYDEBUG('runExactMidnight', name + " " + t.toString());
    },
    runTomorrow = (callback, hour, minute, msg) => {
      // 明天运行，可自定义时间
      const t = new Date();
      let name = msg || ' ';
      t.setMinutes(t.getMinutes() + tz_offset);
      t.setDate(t.getDate() + 1);
      t.setHours(hour, minute, 0, 0);
      t.setMinutes(t.getMinutes() - tz_offset);
      setTimeout(callback, t - ts_ms());
      MYDEBUG('runTomorrow', name + " " + t.toString());
    },
    runToday = (callback, hour, minute, msg) => {
      // 今天运行，可自定义时间
      const t = new Date();
      let name = msg || ' ';
      t.setMinutes(t.getMinutes() + tz_offset);
      t.setHours(hour, minute, 0, 0);
      t.setMinutes(t.getMinutes() - tz_offset);
      setTimeout(callback, t - ts_ms());
      MYDEBUG('runToday', name + " " + t.toString());
    },
    appToken = new BilibiliToken(),
    baseQuery = `actionKey=appkey&appkey=${BilibiliToken.appKey}&build=5561000&channel=bili&device=android&mobi_app=android&platform=android&statistics=%7B%22appId%22%3A1%2C%22platform%22%3A3%2C%22version%22%3A%225.57.0%22%2C%22abtest%22%3A%22%22%7D`,
    setToken = async () => {
      if (tokenData.hasOwnProperty(Live_info.uid) && tokenData[Live_info.uid]['time'] > ts_s()) {
        userToken = tokenData[Live_info.uid];
      } else {
        tokenData[Live_info.uid] = await appToken.getToken();
        if (tokenData[Live_info.uid] === undefined) return MYERROR('appToken', 'tokenData获取失败');
        tokenData[Live_info.uid].time = ts_s() + tokenData[Live_info.uid].expires_in;
        GM_setValue(`Token`, tokenData);
        userToken = tokenData[Live_info.uid];
      };
      MYDEBUG(`appToken`, tokenData);
      return 'OK';
    },
    newWindow = {
      init: () => {
        return newWindow.Toast.init();
      },
      Toast: {
        // 设置右上角浮动提示框 Need Init
        init: () => {
          try {
            const list = [];
            window.toast = (msg, type = 'info', timeout = 5e3) => {
              switch (type) {
                case 'success':
                case 'info':
                case 'caution':
                case 'error':
                  break;
                default:
                  type = 'info';
              }
              const a = $(`<div class="link-toast ${type} fixed" style="z-index:2001"><span class="toast-text">${msg}</span></div>`)[0];
              document.body.appendChild(a);
              MYDEBUG("toast-" + type, msg);
              a.style.top = (document.body.scrollTop + list.length * 40 + 10) + 'px';
              a.style.left = (document.body.offsetWidth + document.body.scrollLeft - a.offsetWidth - 5) + 'px';
              if (!SP_CONFIG.windowToast) $('.link-toast').hide();
              list.push(a);
              setTimeout(() => {
                a.className += ' out';
                setTimeout(() => {
                  list.shift();
                  list.forEach((v) => {
                    v.style.top = (parseInt(v.style.top, 10) - 40) + 'px';
                  });
                  $(a).remove();
                }, 200);
              }, timeout);
            };
            return $.Deferred().resolve();
          } catch (err) {
            MYERROR(`初始化浮动提示时出现异常`, err);
            return $.Deferred().reject();
          }
        }
      }
    },
    addStyle = () => {
      const layerCss = GM_getResourceText('layerCss');
      const myCss = GM_getResourceText('myCss');
      const allCss = layerCss + myCss;
      return GM_addStyle(allCss);
    },
    getScrollPosition = (el = window) => ({
      x: el.pageXOffset !== undefined ? el.pageXOffset : el.scrollLeft,
      y: el.pageYOffset !== undefined ? el.pageYOffset : el.scrollTop
    }),
    linkMsg = (link, msg = link) => '<a href="' + link + '"target="_blank" style="color:">' + msg + '</a>',
    liveRoomUrl = 'https://live.bilibili.com/',
    replaceList = { 0: "寚", 1: "寜", 2: "寠", 3: "寣", 4: "寪", 5: "寭", 6: "寮", 7: "寰", 8: "寯", 9: "寴", "{": "懕", "}": "懖", "[": "懗", "]": "懘" },
    isRegexp = /^\/.+\/[i|g|m]?$/,
    SP_CONFIG_DEFAULT = {
      showEula: true, // 显示EULA
      storageLastFixVersion: "0", // 上次修复设置的版本
      mainDisplay: 'show', // UI隐藏开关
      debugSwitch: false, // 控制台日志开关
      windowToast: true, // 右上提示信息
      nosleep: true, // 屏蔽挂机检测
      invisibleEnter: false, // 隐身入场
      banP2p: false, // 禁止p2p上传
      lastShowUpdateMsgVersion: "0", // 上次显示更新信息的版本
      DANMU_MODIFY: false, // 修改弹幕
      blockLiveStream: false, // 拦截直播流
      blockliveDataUpdate: false, // 拦截直播观看数据上报
      wear_medal_before_danmu: false, // 手动发弹幕前自动佩戴当前房间勋章
      wear_medal_type: 'ONLY_FIRST' // 自动佩戴勋章方式
    };
  let otherScriptsRunningCheck = $.Deferred(),
    otherScriptsRunning = false,
    SP_CONFIG = GM_getValue("SP_CONFIG") || {},
    winPrizeNum = 0,
    winPrizeTotalCount = 0,
    SEND_GIFT_NOW = false, // 立刻送出礼物
    SEND_DANMU_NOW = false, // 立刻发弹幕
    LIGHT_MEDAL_NOW = false, // 立刻点亮勋章
    hideBtnClickable = false,
    getFollowBtnClickable = true,
    unFollowBtnClickable = true,
    mainSiteTasksBtnClickable = true,
    danmuTaskRunning = false,
    medalDanmuRunning = false,
    hasWornMedal = false,
    Live_info = {
      room_id: undefined,
      short_room_id: undefined,
      uid: undefined,
      ruid: undefined,
      gift_list: [{ id: 6, price: 1e3 }, { id: 1, price: 100 }, { id: 30607, price: 5e3 }],
      rnd: undefined,
      visit_id: undefined,
      bili_jct: undefined,
      tid: undefined,
      uname: undefined,
      user_level: undefined, // 直播等级
      level: undefined,  // 主站等级
      danmu_length: undefined, // 直播弹幕长度限制
      medal: undefined // 当前直播间勋章的 target_id
    },
    medal_info = { status: $.Deferred(), medal_list: [] },
    userToken = undefined,
    tokenData = GM_getValue("Token") || {},
    mainIndex = undefined,
    logIndex = undefined,
    layerUiMain = undefined, // 控制面板
    layerLogWindow = undefined, // 日志窗口
    logDiv = undefined,
    tabContent = undefined,
    JQlogRedPoint = undefined,
    JQmenuWindow = undefined,
    layerLogWindow_Height = undefined,
    layerLogWindow_ScrollHeight = undefined,
    layerLogWindow_ScrollTop = undefined,
    layerLogWindow_ScrollY = undefined,
    awardScrollCount = 0,
    readConfigArray = [undefined],
    noticeJson = GM_getValue("noticeJson") || {}; // 检查更新时获取的json

  /**
   * 替换字符串中所有的匹配项（可处理特殊字符如括号）
   * @param oldSubStr 搜索的字符串
   * @param newSubStr 替换内容
   */
  String.prototype.replaceall = function (oldSubStr, newSubStr) {
    function escapeRegExp(string) {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& 代表所有被匹配的字符串
    }
    return this.replace(new RegExp(escapeRegExp(oldSubStr), 'g'), () => newSubStr);
  }

  // 初始化特殊设置
  mergeObject(SP_CONFIG, SP_CONFIG_DEFAULT);

  // 拦截直播流/数据上报，需要尽早
  if (SP_CONFIG.blockLiveStream || SP_CONFIG.blockliveDataUpdate || SP_CONFIG.wear_medal_before_danmu) {
    W.fetch = (...arg) => {
      if (SP_CONFIG.blockLiveStream && arg[0].includes('bilivideo')) {
        return $.Deferred().resolve();
      } else if (SP_CONFIG.blockliveDataUpdate && arg[0].includes("data.bilibili.com/gol/postweb")) {
        return $.Deferred().resolve();
      } else if (SP_CONFIG.wear_medal_before_danmu && arg[0].includes('//api.live.bilibili.com/msg/send')) {
        if (medal_info.status.state() !== "resolved" || Live_info.medal === null || (SP_CONFIG.wear_medal_type === "ONLY_FIRST" && hasWornMedal)) return wfetch(...arg);
        if (typeof Live_info.medal === "undefined") {
          for (const m of medal_info.medal_list) {
            if (m.roomid === Live_info.short_room_id) {
              Live_info.medal = m;
              break;
            }
          }
        }
        if (typeof Live_info.medal === "undefined") {
          Live_info.medal = null; // 没有该勋章，之后无需再检查
          return wfetch(...arg);
        }
        return BAPI.xlive.wearMedal(Live_info.medal.medal_id).then((response) => {
          MYDEBUG('API.xlive.wearMedal', response);
          if (response.code === 0) {
            hasWornMedal = true;
            try {
              let medalJqItem = $(".dp-i-block.medal-item-margin");
              if (medalJqItem === null) return;
              let border = medalJqItem.find(".v-middle.fans-medal-item");
              const medalColor = '#' + Live_info.medal.color.toString(16);
              const medalLevel = Live_info.medal.medal_level;
              const medalText = Live_info.medal.medalName;
              if (border.length !== 0) {
                // 之前戴着勋章
                let background = border.find('.fans-medal-label');
                let level = border.find('.fans-medal-level');
                let text = background.find('.fans-medal-content');
                border.css('border-color', medalColor);
                background.css('background-image', `linear-gradient(45deg, ${medalColor}, ${medalColor})`);
                level.text(medalLevel);
                text.text(medalText);
              } else {
                // 如果没戴勋章则需插入缺失的 html
                $(".action-item.medal.wear-medal").remove(); // 移除提示水印
                medalJqItem.html(`<div data-v-2c4630d2="" data-v-34b5b0e1="" class="v-middle fans-medal-item" style="border-color: ${medalColor}">
                  <div data-v-2c4630d2="" class="fans-medal-label" style="background-image: linear-gradient(45deg, ${medalColor}, ${medalColor});">
                    <span data-v-2c4630d2="" class="fans-medal-content">${medalText}</span>
                  </div>
                  <div data-v-2c4630d2="" class="fans-medal-level" style="color: ${medalColor};">${medalLevel}</div>
                </div>`);
              }
            } catch (e) {
              MYERROR("修改弹幕框左侧粉丝拍样式出错", e);
            }
          } else {
            window.toast(`自动佩戴粉丝勋章出错 ${response.message}`, 'error');
          }
          return wfetch(...arg);
        }, () => {
          window.toast('自动佩戴粉丝勋章失败，请检查网络', 'error');
          return wfetch(...arg);
        })
      }
      else {
        return wfetch(...arg);
      }
    }
  }

  // DOM加载完成后运行
  $(function () {
    // 若 window 下无 BilibiliLive，则说明页面有 iframe，此时脚本在在 top 中运行 或 发生错误
    if (W.BilibiliLive === undefined) return;
    // 初始化右上角提示信息弹窗
    newWindow.init();
    // 检查浏览器版本并显示提示信息
    const checkBrowserArr = checkBrowserVersion();
    if (checkBrowserArr[0] !== "ok") {
      window.toast(...checkBrowserArr);
      if (checkBrowserArr[1] === "error") return;
    }
    // 唯一运行检测
    onlyScriptCheck();
    if (SP_CONFIG.DANMU_MODIFY) {
      window.bliveproxy.hook();
      MYDEBUG('bliveproxy hook complete', bliveproxy);
    }
    if (SP_CONFIG.nosleep) {
      setInterval(() => mouseMove(), 200e3);
      W.addEventListener = (...arg) => {
        if (arg[0].indexOf('visibilitychange') > -1) return;
        else return eventListener(...arg);
      }
    }
    if (SP_CONFIG.invisibleEnter || SP_CONFIG.blockliveDataUpdate) {
      try {
        ah.proxy({
          onRequest: (XHRconfig, handler) => {
            if (SP_CONFIG.invisibleEnter && XHRconfig.url.includes('//api.live.bilibili.com/xlive/web-room/v1/index/getInfoByUser')) {
              MYDEBUG('getInfoByUser request', XHRconfig);
              XHRconfig.url = '//api.live.bilibili.com/xlive/web-room/v1/index/getInfoByUser?room_id=22474988&from=0';
              handler.next(XHRconfig);
            } else if (SP_CONFIG.blockliveDataUpdate && XHRconfig.url.includes('//data.bilibili.com/log')) {
              handler.resolve("ok");
            } else {
              handler.next(XHRconfig);
            }
          },
          onResponse: async (response, handler) => {
            if (response.config.url.includes('//api.live.bilibili.com/xlive/web-room/v1/index/getInfoByUser')) {
              MYDEBUG('getInfoByUser response', response);
              if (!response.response.includes('"code":0')) {
                MYDEBUG('隐身入场出错，取消隐身入场并以当前房间号再次获取用户数据');
                response.response = await BAPI.xlive.getInfoByUser(W.BilibiliLive.ROOMID).then((re) => {
                  MYDEBUG('API.xlive.getInfoByUser(W.BilibiliLive.ROOMID)', re);
                  if (re.code === 0) return JSON.stringify(re);
                  else return window.toast(`获取房间基础信息失败 ${re.message}`, 'error')
                });
              }
              response.response = response.response.replace('"is_room_admin":false', '"is_room_admin":true');
              const json_response = JSON.parse(response.response);
              Live_info.danmu_length = json_response.data.property.danmu.length;
            }
            handler.next(response);
          }
        })
      } catch (e) { MYDEBUG('ah.proxy Ajax-hook代理运行出错', e) }
    }
    if (SP_CONFIG.banP2p) {
      const RTClist = ["RTCPeerConnection", "RTCDataChannel", "mozRTCPeerConnection", "webkitRTCPeerConnection", "DataChannel"];
      for (const i of RTClist) {
        delete W[i];
      }
    }
    const loadInfo = (delay = 0) => {
      return setTimeout(async () => {
        if (parseInt(W.BilibiliLive.UID) === 0 || isNaN(parseInt(W.BilibiliLive.UID))) {
          //MYDEBUG(`${GM_info.script.name}`,'无配置信息');
          return loadInfo(500);
        } else {
          window.toast("正在获取礼物 / 用户 / 账号 / 粉丝勋章数据...", "info");
          Live_info.room_id = W.BilibiliLive.ROOMID;
          Live_info.short_room_id = W.BilibiliLive.SHORT_ROOMID;
          Live_info.uid = W.BilibiliLive.UID;
          Live_info.tid = W.BilibiliLive.ANCHOR_UID;
          await BAPI.gift.gift_config().then((response) => {
            MYDEBUG('InitData: API.gift.gift_config', response);
            if (response.data && Array.isArray(response.data)) {
              return Live_info.gift_list = response.data;
            } else if (response.data.list && Array.isArray(response.data.list)) {
              return Live_info.gift_list = response.data.list;
            } else {
              return window.toast(`直播间礼物数据获取失败 ${response.message}\n使用默认数据`, 'warning');
            }
          });
          await BAPI.getuserinfo().then((re) => {
            MYDEBUG('InitData: API.getuserinfo', re);
            if (re.code === "REPONSE_OK") {
              Live_info.uname = re.data.uname;
              Live_info.user_level = re.data.user_level;
            }
            else {
              window.toast(`API.getuserinfo 获取用户信息失败 ${re.message}`, 'error');
              return delayCall(() => loadInfo());
            }
          });
          await BAPI.x.getAccInfo(Live_info.uid).then((re) => {
            MYDEBUG('InitData: API.x.getAccInfo', re);
            if (re.code === 0) {
              Live_info.level = re.data.level;
            } else {
              window.toast(`API.x.getAccInfo 获取账号信息失败 ${re.message}`, 'error');
              return delayCall(() => loadInfo());
            }
          });
          Live_info.bili_jct = BAPI.getCookie('bili_jct');
          Live_info.ruid = W.BilibiliLive.ANCHOR_UID;
          Live_info.rnd = W.BilibiliLive.RND;
          Live_info.visit_id = W.__statisObserver ? W.__statisObserver.__visitId : '';
          MYDEBUG("Live_info", Live_info);
          await getMedalList();
          MYDEBUG("medla_info", medal_info);
          init();
        }
      }, delay);
    };
    return loadInfo();
  });
  function init() { // 初始化各项功能
    const MY_API = {
      CONFIG_DEFAULT: {
        AUTO_DANMU: false, // 发送弹幕
        AUTO_GIFT: false, // 自动送礼
        AUTO_GIFT_ROOMID: ["0"], // 送礼优先房间
        AUTO_GROUP_SIGN: true, // 应援团签到开关
        ANCHOR_LOTTERY: false, // 天选时刻
        ANCHOR_AWPUSH: false, // 天选时刻 awpush
        ANCHOR_AUTO_DEL_FOLLOW: false, // 检测到未中奖自动取关
        ANCHOR_MAXROOM: 500, // 天选检查房间最大数量
        ANCHOR_MAXLIVEROOM_SAVE: 100, // 天选上传保存房间最大数量
        ANCHOR_CHECK_INTERVAL: 5, // 天选检查间隔（分钟）
        ANCHOR_IGNORE_BLACKLIST: true, // 天选忽略关键字（选项）
        ANCHOR_IGNORE_PWDROOM: true, // 不参加有密码的直播间的天选
        ANCHOR_BLACKLIST_WORD: ['测试', '钓鱼', '炸鱼', '黑屋', '脚本', '空气'], // 天选忽略关键字
        ANCHOR_INTERVAL: 350, // 天选（检查天选和取关）请求间隔
        ANCHOR_NEED_GOLD: 0, // 忽略所需电池大于_的抽奖
        ANCHOR_GOLD_JOIN_TIMES: 1, // 每个付费天选参加_次
        ANCHOR_WAIT_REPLY: true, // 请求后等待回复
        ANCHOR_UPLOAD_DATA: false, // 天选上传数据
        ANCHOR_UPLOAD_DATA_INTERVAL: 10, // 上传数据间隔
        ANCHOR_UPLOAD_MSG: false, // 天选上传时的附加信息开关
        ANCHOR_UPLOAD_MSG_CONTENT: "", // 附加信息
        ANCHOR_IGNORE_UPLOAD_MSG: false, // 天选忽略附加信息
        ANCHOR_UPLOAD_ROOMLIST: false, // 上传天选数据至 BLTH-server
        ANCHOR_SERVER_APIKEY: (function () { let obj = {}; obj[Live_info.uid] = ""; return obj; })(), // 天选时刻 BLTH-server apikey
        ANCHOR_TYPE_SERVER: false, // 天选时刻 - BLTH-server
        ANCHOR_TYPE_POLLING: true, // 天选模式 - 轮询
        ANCHOR_TYPE_LIVEROOM: false, // 天选模式 - 直播间简介
        ANCHOR_TYPE_FOLLOWING: false, // 天选模式 - 关注用户
        ANCHOR_TYPE_CUSTOM: false, // 天选模式 - 自定义房间列表
        ANCHOR_CUSTOM_ROOMLIST: [], // 自定义房间列表
        ANCHOR_GETDATA_ROOM: 22474988, // 获取天选数据的直播间
        ANCHOR_IGNORE_ROOM: true, // 天选忽略直播间
        ANCHOR_IGNORE_ROOMLIST: ["22647871"], // 天选忽略直播间房间列表
        ANCHOR_PRIVATE_LETTER: false, // 中奖后给UP发一条私信
        ANCHOR_LETTER_CONTENT: 'UP我中天选了，请问怎么领奖[doge]', // 私信内容
        ANCHOR_ADD_TO_WHITELIST: false, // 天选中奖后把发起抽奖的UP加入白名单
        ANCHOR_MOVETO_FOLLOW_TAG: true, // 把关注的UP移到新分组
        ANCHOR_MOVETO_PRIZE_TAG: true, // 把中奖的UP移到新分组
        ANCHOR_DANMU: false, // 天选中奖后弹幕
        ANCHOR_DANMU_CONTENT: ["我中啦！", "芜湖"], // 天选中奖后弹幕内容
        ANCHOR_IGNORE_MONEY: 0, // 忽略金额小于_的天选
        ANCHOR_MONEY_ONLY: false, // 仅参加现金抽奖
        ANCHOR_FANS_CHECK: false, // 忽略粉丝数小于__的天选
        ANCHOR_FANS_LEAST: 0, // 最少粉丝数
        ANCHOR_IGNORE_AREA: false, // 忽略指定分区
        ANCHOR_IGNORE_AREA_LIST: ["学习", "大事件"], // 忽略分区内容
        ANCHOR_AUTO_BUY_LV1_MEDAL: false, // 参与有1级粉丝牌要求的天选前自动购买勋章
        CHECK_HOUR_ROOM: false, // 检查小时榜
        CHECK_HOUR_ROOM_INTERVAL: 600, // 小时榜检查间隔时间(秒)
        COIN: false, // 投币
        COIN_NUMBER: 0, // 投币数量
        COIN_TYPE: "COIN_DYN", // 投币方法 动态/UID
        COIN_UID: ['0'], // 投币up主
        COIN2SILVER: false, // 银币换银瓜子
        COIN2SILVER_NUM: 1, // 银币换银瓜子，硬币数量
        CP_NOTICE: false, // 酷推
        CP_Skey: 'Skey', // 酷推Skey
        DANMU_CONTENT: ["这是一条弹幕"], // 弹幕内容
        DANMU_ROOMID: ["22474988"], // 发弹幕房间号
        DANMU_INTERVAL_TIME: ["10m"], // 弹幕发送时间
        DANMU_MODIFY_REGEX: ["/【/"],// 匹配弹幕 正则字符串
        DANMU_MODIFY_UID: [0], // 匹配弹幕 UID
        DANMU_MODIFY_POOL: [4], // 修改弹幕 弹幕池
        DANMU_MODIFY_COLOR: ["#f7335d"], // 修改弹幕 颜色
        DANMU_MODIFY_SIZE: [1.2], // 修改弹幕 大小
        FORCE_LIGHT: false, // 点亮勋章时忽略亲密度上限
        GIFT_LIMIT: 1, // 礼物到期时间(天)
        GIFT_SEND_HOUR: 23, // 送礼小时
        GIFT_SEND_MINUTE: 59, // 送礼分钟
        GIFT_INTERVAL: 5, // 送礼间隔
        GIFT_METHOD: "GIFT_SEND_TIME", // 送礼时间策略
        GIFT_SORT: 'GIFT_SORT_HIGH', // 送礼优先高等级
        GIFT_ALLOW_TYPE: ["1", "6", "30607"], // 允许送出的礼物类型，默认：辣条，亿圆, 小心心
        GIFT_SEND_METHOD: "GIFT_SEND_BLACK", // 送礼黑白名单策略
        GIFT_SEND_ROOM: ["0"], // 送礼黑白名单策略 - 房间列表
        GM_NOTICE: false, // GM通知
        IN_TIME_RELOAD_DISABLE: false, // 休眠时段是否禁止刷新直播间 false为刷新
        LOTTERY: false, // 参与抽奖
        LIVE_SIGN: true, // 直播区签到
        LOGIN: true, // 主站登陆
        LITTLE_HEART: true, // 获取小心心
        LIGHT_MEDALS: ["0"], // 点亮勋章
        LIGHT_METHOD: "LIGHT_WHITE",
        MEDAL_DANMU_ROOM: ["0"], // 打卡弹幕房间列表
        MEDAL_DANMU_METHOD: "MEDAL_DANMU_BLACK", // 打卡弹幕发送方式
        MEDAL_DANMU_INTERVAL: 2, // 打卡弹幕发送间隔（秒）
        MATERIAL_LOTTERY: true, // 实物抽奖
        MATERIAL_LOTTERY_CHECK_INTERVAL: 60, // 实物抽奖检查间隔
        MATERIAL_LOTTERY_IGNORE_QUESTIONABLE_LOTTERY: true, // 实物抽奖忽略存疑抽奖
        MEDAL_DANMU: false, // 粉丝勋章打卡弹幕
        MATERIAL_LOTTERY_REM: 10, // 每次检查aid数量
        MEDAL_DANMU_CONTENT: ["(⌒▽⌒)", "（￣▽￣）", "(=・ω・=)", "(｀・ω・´)", "(〜￣△￣)〜", "(･∀･)", "(°∀°)ﾉ", "(￣3￣)", "╮(￣▽￣)╭", "_(:3」∠)_", "(^・ω・^ )", "(●￣(ｴ)￣●)", "ε=ε=(ノ≧∇≦)ノ", "⁄(⁄ ⁄•⁄ω⁄•⁄ ⁄)⁄", "←◡←"], // 粉丝勋章打卡弹幕内容
        PP_NOTICE: false, // 推送加开关
        PP_token: "token", // 推送加 token
        QUESTIONABLE_LOTTERY: ['test', 'encrypt', '测试', '钓鱼', '加密', '炸鱼'], // 存疑实物抽奖
        RANDOM_DELAY: true, // 抽奖随机延迟
        RANDOM_SEND_DANMU: 0, // 随机弹幕发送概率
        RANDOM_SKIP: 0, // 随机跳过抽奖概率
        REMOVE_ELEMENT_2233: false, // 移除2233
        REMOVE_ELEMENT_activity: true, // 移除活动入口
        REMOVE_ELEMENT_rank: true, // 移除排行榜入口
        REMOVE_ELEMENT_followSideBar: false, // 移除右侧关注按钮及弹窗
        REMOVE_ELEMENT_flipView: true, // 移除移除礼物栏下方广告
        REMOVE_ELEMENT_anchor: false, // 移除天选时刻弹窗及图标
        REMOVE_ELEMENT_pk: false, // 移除PK弹窗及进度条
        REMOVE_ELEMENT_playerIcon: true, // 移除直播水印
        RND_DELAY_END: 5, // 延迟最大值
        RND_DELAY_START: 2, // 延迟最小值
        SEND_ALL_GIFT: false, // 送满全部勋章
        SHARE: true, // 分享
        SILVER2COIN: false, // 银瓜子换硬币
        ServerTurbo_NOTICE: false, // Server酱·Turbo版
        ServerTurbo_SendKey: "SendKey", // Server酱·Turbo版SendKey
        SPARE_GIFT_ROOM: "0", // 剩余礼物送礼房间
        STORM: false, // 节奏风暴
        STORM_MAX_COUNT: 100, // 单个风暴最大尝试次数
        STORM_ONE_LIMIT: 200, // 单个风暴参与次数间隔（毫秒）
        STORM_QUEUE_SIZE: 3, // 允许同时参与的风暴次数
        TIME_AREA_DISABLE: true, // 不抽奖时段开关
        TIME_AREA_END_H0UR: 8, // 不抽奖结束小时
        TIME_AREA_END_MINUTE: 0, // 不抽奖结束分钟
        TIME_AREA_START_H0UR: 2, // 不抽奖开始小时
        TIME_AREA_START_MINUTE: 0, // 不抽奖开始分钟
        TIME_RELOAD: false, // 定时刷新直播间
        TIME_RELOAD_MINUTE: 120, // 直播间重载时间
        UPDATE_TIP: true, //更新提示
        WATCH: true // 观看视频
      },
      CACHE_DEFAULT: {
        AUTO_SEND_DANMU_TS: [], // 弹幕发送
        AUTO_GROUP_SIGH_TS: 0, // 应援团签到
        DailyReward_TS: 0, // 每日任务
        LiveReward_TS: 0, // 直播每日任务
        Silver2Coin_TS: 0, // 银瓜子换硬币
        Coin2Sliver_TS: 0, // 硬币换银瓜子
        Gift_TS: 0, // 自动送礼（定时）
        GiftInterval_TS: 0, // 自动送礼（间隔）
        LittleHeart_TS: 0, // 小心心
        MaterialObject_TS: 0, // 实物抽奖
        AnchorLottery_TS: 0,
        last_aid: 761, // 实物抽奖最后一个有效aid
        MedalDanmu_TS: 0 //粉丝勋章打卡
      },
      GIFT_COUNT_DEFAULT: {
        COUNT: 0, // 辣条（目前没用）
        ANCHOR_COUNT: 0, // 天选
        MATERIAL_COUNT: 0, // 实物
        CLEAR_TS: 0, // 重置统计
      },
      CONFIG: {},
      CACHE: {},
      GIFT_COUNT: {},
      init: () => {
        addStyle();
        const tabList = $('.tab-list.dp-flex'),
          ct = $(".chat-history-panel"),
          ctWidth = ct.width(),
          aside_area_vmHeight = $('#aside-area-vm').height(),
          chat_control_panel_vmHeight = $('#chat-control-panel-vm').height(),
          eleList = ['.chat-history-list', '.attention-btn-ctnr', '.live-player-mounter'];
        tabContent = $('.tab-content');
        logDiv = $(`<li data-v-2fdbecb2="" data-v-d2be050a="" class="item dp-i-block live-skin-separate-border border-box t-center pointer live-skin-normal-text" style = 'font-weight:bold;color: #999;' id = "logDiv"><span id="logDivText">日志</span><div class="blth_num" style="display: none;" id = 'logRedPoint'>0</div></mli>`);
        let tabOffSet = 0, top = 0, left = 0;
        if (eleList.some(i => i.length === 0) || tabList.length === 0 || tabContent.length === 0) {
          window.toast('必要页面元素缺失，强制运行（可能会看不到控制面板，提示信息）', 'error');
        }
        tabList.append(logDiv);
        JQlogRedPoint = $('#logRedPoint');
        let tabListItems = [];
        for (let i = 0; i < tabList.children('li').length; i++) {
          tabListItems.push(tabList.children('li')[i]);
        };
        logIndex = layer.open({
          type: 1,
          title: false,
          offset: [String(top) + 'px', String(left) + 'px'],
          closeBtn: 0,
          shade: 0,
          zIndex: 2000,
          fixed: false,
          area: [String(ctWidth) + 'px', String(aside_area_vmHeight - chat_control_panel_vmHeight) + 'px'], //宽高
          anim: -1,
          isOutAnim: false,
          resize: false,
          content: '<div id = "menuWindow"></div>',
          success: () => {
            layerLogWindow = $('#layui-layer1 .layui-layer-content');
            JQmenuWindow = $('#menuWindow');
            let logDivText = $('#logDivText');
            layerLogWindow.on("DOMNodeInserted", function () {
              layerLogWindow_Height = $(this).height();
              layerLogWindow_ScrollHeight = $(this)[0].scrollHeight;
              if (layerLogWindow_ScrollHeight > layerLogWindow_Height) {
                layerLogWindow.scrollTop(layerLogWindow.prop("scrollHeight"));
                $(this).off("DOMNodeInserted");
              }
            })
            layerLogWindow.scroll(function () {
              layerLogWindow_Height = $(this).height();
              layerLogWindow_ScrollHeight = $(this)[0].scrollHeight;
              layerLogWindow_ScrollTop = $(this)[0].scrollTop;
              layerLogWindow_ScrollY = layerLogWindow_ScrollTop + layerLogWindow_Height + 1;
              if (layerLogWindow_ScrollY < layerLogWindow_ScrollHeight && winPrizeNum === 0) logDivText.text('日志🚀');
              else logDivText.text('日志');
            });
          }
        });
        layer.style(logIndex, {
          'box-shadow': 'none',
          'display': 'none',
          'background-color': '#f2f3f5'
        });
        for (const i of tabListItems) {
          let JQi = $(i);
          JQi.click(() => {
            for (const item of tabListItems) {
              let JQitem = $(item);
              if (item != i) {
                if (JQitem.css('color') !== 'rgb(153, 153, 153)') JQitem.css("color", "#999");
                if (JQitem.hasClass('live-skin-main-text')) JQitem.removeClass('live-skin-main-text');
                if (JQitem.hasClass('active')) JQitem.removeClass('active');
                if (!JQitem.hasClass('live-skin-normal-text')) JQitem.addClass('live-skin-normal-text')
              } else {
                if (JQitem.css('color') !== 'rgb(51, 51, 51)') JQi.css("color", "#333");
                if (!JQitem.hasClass('live-skin-main-text')) JQi.addClass('live-skin-main-text');
                if (!JQitem.hasClass('active')) JQi.addClass('active');
                if (JQitem.hasClass('live-skin-normal-text')) JQi.removeClass('live-skin-normal-text');
              }
            }
            if (JQi.attr('id') === "logDiv") {
              if (!tabOffSet) {
                tabOffSet = $('.tab-content').offset();
                top = tabOffSet.top;
                left = tabOffSet.left;
                layer.style(logIndex, {
                  'top': String(top) + 'px',
                  'left': String(left) + 'px'
                });
              }
              layer.style(logIndex, {
                'display': 'block'
              });
              if (winPrizeNum === 0) {
                JQlogRedPoint.hide();
                if (layerLogWindow_ScrollY < layerLogWindow_ScrollHeight || layerLogWindow_ScrollY === undefined)
                  layerLogWindow.scrollTop(layerLogWindow.prop("scrollHeight"));
              } else if (winPrizeNum > 0 && awardScrollCount < winPrizeTotalCount && $('.chatLogWinPrize').length > 0) {
                $('.chatLogWinPrize')[awardScrollCount++].scrollIntoView(false);
                $(window).scrollTop(0);
                JQlogRedPoint.text(--winPrizeNum);
                if (winPrizeNum === 0) JQlogRedPoint.hide();
              }
            } else {
              layer.style(logIndex, {
                'display': 'none'
              });
            }
          })
        };
        let p1 = $.Deferred(), p2 = $.Deferred(), p3 = $.Deferred();
        try {
          // 设置token
          BAPI.setCommonArgs(Live_info.bili_jct);
          p1.resolve()
        } catch (err) {
          MYERROR(`设置token错误`, err);
          p1.reject();
        }
        try {
          MY_API.loadConfig().then(() => {
            MY_API.chatLog('脚本载入配置成功', 'success');
            p2.resolve()
          });
        } catch (e) {
          MYERROR('API初始化出错', e);
          MY_API.chatLog('API初始化出错', 'error');
          p2.reject()
        }
        try {
          MY_API.loadCache().then(() => {
            window.toast('CACHE载入成功', 'success')
            p3.resolve()
          });
        } catch (e) {
          MYERROR('CACHE初始化出错', e);
          window.toast('CACHE初始化出错', 'error')
          p3.reject()
        }
        return $.when(p1, p2, p3);
      },
      loadConfig: () => {
        // 加载配置函数
        let p = $.Deferred();
        try {
          MY_API.CONFIG = GM_getValue("CONFIG") || {};
          mergeObject(MY_API.CONFIG, MY_API.CONFIG_DEFAULT);
          // 载入礼物统计
          MY_API.loadGiftCount();
          p.resolve()
        } catch (e) {
          MYDEBUG('API载入配置失败，加载默认配置', e);
          MY_API.setDefaults();
          p.reject()
        }
        return p
      },
      loadCache: () => {
        // 加载CACHE
        let p = $.Deferred();
        try {
          MY_API.CACHE = GM_getValue("CACHE") || {}
          mergeObject(MY_API.CACHE, MY_API.CACHE_DEFAULT);
          p.resolve()
        } catch (e) {
          MYDEBUG('CACHE载入配置失败，加载默认配置', e);
          MY_API.setDefaults();
          p.reject()
        }
        return p
      },
      newMessage: (version) => {
        try {
          const cache = SP_CONFIG.lastShowUpdateMsgVersion;
          if (cache === undefined || cache === null || versionStringCompare(cache, version) === -1) { // cache < version
            const mliList = [
              "修复【不抽奖时段不刷新直播间】设置不生效的 bug。",
              "优化消息推送。",
              "awpush 任务分配优化（服务端的代码会过几天再更新，等一定数量的用户更新至新版本后再采用新的分配逻辑）。",
              "awpush采用更严格的心跳逻辑。",
              "适配B站货币升级，把金瓜子改为电池（1电池=100金瓜子，请手动修改相关设置项的值）。",
              "适配B站api升级，修改了兑换硬币和银瓜子的api。",
              "适配B站api升级，修复【从已关注正在直播的直播间获取天选时刻数据】开启后报错的bug。"
            ];
            let mliHtml = "";
            for (const mli of mliList) {
              mliHtml = mliHtml + "<mli>" + mli + "</mli>";
            }
            layer.open({
              title: `${version}更新提示`,
              area: [String($(window).width() * 0.382) + 'px', String($(window).height() * 0.618) + 'px'],
              content: `
                <mol>${mliHtml}</mol>
                <hr><em style="color:grey;">
                如果使用过程中遇到问题，欢迎去 ${linkMsg('https://github.com/andywang425/BLTH/issues', 'github')}反馈。
                也可以进q群讨论：${linkMsg("https://jq.qq.com/?_wv=1027&amp;k=fCSfWf1O", '1106094437')}，${linkMsg('https://jq.qq.com/?_wv=1027&k=Bf951teI', '907502444（新）')}
                </em>
                `
            });
            SP_CONFIG.lastShowUpdateMsgVersion = version;
            saveSpConfig();
          }
        } catch (e) {
          MYDEBUG('提示信息CACHE载入失败', e);
        }
      },
      saveConfig: (show = true) => {
        // 保存配置函数
        try {
          GM_setValue("CONFIG", MY_API.CONFIG);
          if (show) window.toast('配置已保存，部分设置需刷新后才能生效', 'info');
          MYDEBUG('MY_API.CONFIG', MY_API.CONFIG);
          return true
        } catch (e) {
          MYDEBUG('API保存出错', e);
          return false
        }
      },
      saveCache: (logswitch = true) => {
        // 保存缓存函数
        try {
          GM_setValue("CACHE", MY_API.CACHE);
          if (logswitch) MYDEBUG('CACHE已保存', MY_API.CACHE)
          return true
        } catch (e) {
          MYDEBUG('CACHE保存出错', e);
          return false
        }
      },
      setDefaults: () => {
        // 重置配置函数
        MY_API.CONFIG = MY_API.CONFIG_DEFAULT;
        MY_API.CACHE = MY_API.CACHE_DEFAULT;
        MY_API.saveConfig();
        MY_API.saveCache();
        layer.msg('配置和CACHE已重置为默认。3秒后刷新页面', { icon: 1 });
        setTimeout(() => {
          W.location.reload()
        }, 3000);
      },
      ReDoAllTasks: () => {
        window.toast('3秒后再次执行所有任务', 'info');
        const taskList = [
          function () { MY_API.CACHE = MY_API.CACHE_DEFAULT },
          MY_API.GroupSign.run, // 应援团签到
          MY_API.DailyReward.run, // 每日任务
          MY_API.LiveReward.run, // 直播每日任务
          MY_API.Exchange.runS2C, // 银瓜子换硬币
          MY_API.Exchange.runC2S, // 硬币换银瓜子
          MY_API.Gift.run, // 送礼物
          MY_API.LITTLE_HEART.run, // 小心心
          MY_API.AUTO_DANMU.run, // 发弹幕
          MY_API.MaterialObject.run, // 实物抽奖
          MY_API.AnchorLottery.run, // 天选时刻
          MY_API.MEDAL_DANMU.run, // 粉丝勋章打卡弹幕
        ];
        runAllTasks(3000, 200, taskList);
      },
      loadGiftCount: () => { // 读取统计数量
        try {
          let giftCount = MY_API.GIFT_COUNT_DEFAULT;
          MY_API.GIFT_COUNT = $.extend(true, giftCount, GM_getValue("GIFT_COUNT") || {});
          MYDEBUG('MY_API.GIFT_COUNT', MY_API.GIFT_COUNT);
        } catch (e) {
          MYDEBUG('读取统计失败', e);
        }
      },
      saveGiftCount: (show = true) => {
        try {
          GM_setValue(`GIFT_COUNT`, MY_API.GIFT_COUNT);
          if (show) MYDEBUG('统计保存成功', MY_API.GIFT_COUNT);
          return true
        } catch (e) {
          MYDEBUG('统计保存出错', e);
          return false
        }
      },
      addAnchor: (count = 1) => {
        MY_API.GIFT_COUNT.ANCHOR_COUNT += count;
        $('#giftCount .anchor .statNum').text(MY_API.GIFT_COUNT.ANCHOR_COUNT);
        MY_API.saveGiftCount(false);
      },
      addMaterial: (count = 1) => {
        MY_API.GIFT_COUNT.MATERIAL_COUNT += count;
        $('#giftCount .material .statNum').text(MY_API.GIFT_COUNT.MATERIAL_COUNT);
        MY_API.saveGiftCount(false);
      },
      removeUnnecessary: () => {
        // 移除不必要的页面元素
        const unnecessaryObj = [
          {
            // 2233
            settingName: 'REMOVE_ELEMENT_2233',
            rmJQpath: ['#my-dear-haruna-vm']
          },
          {
            // 活动入口
            settingName: 'REMOVE_ELEMENT_activity',
            rmJQpath: ['.activity-entry']
          },
          {
            // 排行榜
            settingName: 'REMOVE_ELEMENT_rank',
            rmJQpath: ['.activity-rank']
          },
          {
            // 关注按钮及弹窗
            settingName: 'REMOVE_ELEMENT_followSideBar',
            rmJQpath: ['div[data-upgrade-intro="Follow"]', '.side-bar-popup-cntr.ts-dot-4']
          },
          {
            // 礼物栏下方广告
            settingName: 'REMOVE_ELEMENT_flipView',
            rmJQpath: ['.flip-view']
          },
          {
            // 天选时刻弹窗及图标
            settingName: 'REMOVE_ELEMENT_anchor',
            addCss: '.anchor-lottery-entry * {display: none;} #anchor-guest-box-id * {display: none;}',
            eval: `setInterval(() => {$("iframe").contents().find("#app .close-btn").click()}, 200)`
          },
          {
            // PK弹窗及进度条
            settingName: 'REMOVE_ELEMENT_pk',
            addCss: '.process-box * {display: none;} #chaos-pk-vm * {display:none;}',
            eval: `setInterval(() => {$("iframe").contents().find("#app .closeBtn").click()}, 200)`
          },
          {
            // 直播水印
            settingName: 'REMOVE_ELEMENT_playerIcon',
            rmJQpath: ['.web-player-icon-roomStatus']
          }
        ];

        const removeElement = (obj) => {
          if (MY_API.CONFIG[obj.settingName]) {
            if (obj.hasOwnProperty('rmJQpath')) {
              for (const path of obj.rmJQpath) {
                let timer = setInterval(() => {
                  const unnecessaryItem = $(path);
                  if (unnecessaryItem.length > 0) {
                    unnecessaryItem.remove();
                    clearInterval(timer)
                  }
                }, 200);
              }
            }
            if (obj.hasOwnProperty('addCss')) GM_addStyle(obj.addCss);
            if (obj.hasOwnProperty('eval')) eval(obj.eval);
          }
        };
        for (const i of unnecessaryObj) {
          removeElement(i);
        };
      },
      buyFanMedal: (room_id) => {
        return BAPI.live_user.get_anchor_in_room(room_id).then(function (response) {
          MYDEBUG('API.live_user.get_anchor_in_room response', response)
          if (response.code === 0 && response.data.info) {
            const uid = String(response.data.info.uid),
              uname = response.data.info.uname;
            layer.confirm(`<div style = "text-align:center">是否消耗20硬币购买UP主<br>${linkMsg("https://space.bilibili.com/" + uid, uname)}<br>的粉丝勋章？</div>`, {
              title: `购买勋章 房间号：${room_id}`,
              btn: ['是', '否']
            }, function () {
              BAPI.link_group.buy_medal(response.data.info.uid).then((re) => {
                MYDEBUG('API.link_group.buy_medal re', re);
                if (re.code === 0) {
                  layer.msg('购买成功', {
                    time: 2000,
                    icon: 1
                  });
                } else {
                  layer.msg(`购买失败 ${re.message}`, {
                    time: 2500,
                    icon: 2
                  });
                }
              });
            }, function () {
              layer.msg('已取消购买', {
                time: 2000
              });
            });

          }
          else if (response.code === 0 && response.data.info === undefined) {
            layer.msg(`房间不存在`, {
              time: 2500
            });
          }
          else {
            layer.msg(`检查房间出错 ${response.message}`, {
              time: 2500
            });
          }
        });
      },
      creatSetBox: async () => {
        //添加按钮
        const btnmsg = SP_CONFIG.mainDisplay === 'hide' ? '显示控制面板' : '隐藏控制面板';
        const btn = $(`<button class="blth_btn" style="display: inline-block; float: left; margin-right: 7px;cursor: pointer;box-shadow: 1px 1px 2px #00000075;" id="hiderbtn">${btnmsg}<br></button>`);
        const body = $('body');
        const html = `
        <div id="allsettings" class="blth_main"><div id="top_fieldset"><fieldset class="blth_fs"><legend>今日统计</legend><div data-toggle="topArea"><span id="giftCount" style="font-size:large; font-weight:bold; color:blueviolet;"><span class="anchor">参与天选时刻<span class="statNum">0</span>次 </span><span class="material">参与实物抽奖<span class="statNum">0</span>次 </span><button class="blth_btn" data-action="save">保存所有设置</button></span><span helpdata="topArea" class="clickableText helpText">?</span></div></fieldset></div><div id="bottom_fieldset" class="fieldset"><fieldset class="blth_fs"><legend>抽奖设置</legend><div data-toggle="LOTTERY"><label style="color:purple;"><input type="checkbox">参与礼物抽奖 </label><span helpdata="LOTTERY" class="clickableText helpText">?</span></div><div data-toggle="RANDOM_DELAY"><label class="lineStartSpace" style="color:darkgreen;"><input type="checkbox">抽奖附加随机延迟 <input class="RND_DELAY_START blth_input" style="width:30px;vertical-align:top;" type="text">~ <input class="RND_DELAY_END blth_input" style="width:30px;vertical-align:top;" type="text">s </label><span helpdata="RANDOM_DELAY" class="clickableText helpText">?</span></div><div data-toggle="RANDOM_SKIP"><label class="lineStartSpace" style="color:darkgreen;">随机跳过抽奖<input class="per blth_input" style="width:30px;" type="text">% </label><span helpdata="RANDOM_SKIP" class="clickableText helpText">?</span></div><div data-toggle="RANDOM_SEND_DANMU"><label class="lineStartSpace" style="color:darkgreen;">抽奖时活跃弹幕发送概率(0到5,为0则不发送)<input class="per blth_input" style="width:30px;" type="text">% </label></div><div data-toggle="CHECK_HOUR_ROOM"><label class="lineStartSpace" style="color:darkgreen;"><input type="checkbox">检查小时榜（间隔时间<input class="num blth_input" style="width:25px;" type="text">秒） </label></div><div data-toggle="MATERIAL_LOTTERY"><label style="color:purple;"><input type="checkbox">参与实物抽奖 </label><span helpdata="MATERIAL_LOTTERY" class="clickableText helpText">?</span></div><div data-toggle="MATERIAL_LOTTERY_CHECK_INTERVAL"><label class="lineStartSpace">检查间隔 <input class="num blth_input" style="width:30px;" type="text">分钟 </label></div><div data-toggle="MATERIAL_LOTTERY_REM"><label class="lineStartSpace">检测到 <input class="num blth_input" style="width:30px;" type="text">个不存在活动的aid后停止检测 </label><span helpdata="MATERIAL_LOTTERY_REM" class="clickableText helpText">?</span></div><div data-toggle="MATERIAL_LOTTERY_IGNORE_QUESTIONABLE_LOTTERY"><label class="lineStartSpace"><input type="checkbox">忽略关键字 <label class="str" style="font-weight:bold">1个</label><button class="blth_btn" data-action="edit_QUESTIONABLE_LOTTERY">编辑关键字</button></label><span helpdata="MATERIAL_LOTTERY_IGNORE_QUESTIONABLE_LOTTERY" class="clickableText helpText">?</span></div></fieldset><fieldset class="blth_fs"><legend>每日任务设置</legend><div data-toggle="LOGIN"><label><input type="checkbox">登录 </label></div><div data-toggle="WATCH"><label><input type="checkbox">观看视频 </label></div><div data-toggle="COIN"><label><input type="checkbox">自动投币<input class="coin_number blth_input" style="width:40px;" type="text">个(0-5) </label><span helpdata="COIN" class="clickableText helpText">?</span></div><div data-toggle="COIN_TYPE"><div data-toggle="COIN_UID"><label class="lineStartSpace"><input type="radio" name="COIN_TYPE">给用户(UID:<input class="num blth_input" style="width:150px;" type="text">) 的视频投币</label><span helpdata="COIN_UID" class="clickableText helpText">?</span></div><div data-toggle="COIN_DYN"><label class="lineStartSpace"><input type="radio" name="COIN_TYPE">给动态中的的视频投币 </label></div></div><div data-toggle="SHARE"><label><input type="checkbox">分享视频 </label><span helpdata="SHARE" class="clickableText helpText">?</span></div><div data-toggle="SILVER2COIN"><label><input type="checkbox">银瓜子换硬币 </label><span helpdata="SILVER2COIN" class="clickableText helpText">?</span></div><div data-toggle="COIN2SILVER"><label><input type="checkbox">硬币换银瓜子 <input class="coin_number blth_input" style="width:40px;" type="text">个(0-50) </label><span helpdata="COIN2SILVER" class="clickableText helpText">?</span></div><div data-toggle="LIVE_SIGN"><label><input type="checkbox">直播区签到 </label></div><div data-toggle="AUTO_GROUP_SIGN"><label><input type="checkbox">应援团签到 </label></div><div data-toggle="MEDAL_DANMU" style="color:purple"><label><input type="checkbox">粉丝勋章打卡弹幕 </label><button class="blth_btn" data-action="edit_medalDanmu">编辑弹幕内容</button><span helpdata="MEDAL_DANMU" class="clickableText helpText">?</span></div><div data-toggle="MEDAL_DANMU_METHOD" class="lineStartSpace inline">打卡弹幕模式： <div data-toggle="MEDAL_DANMU_WHITE" class="inline"><input type="radio" name="MEDAL_DANMU_METHOD">白名单 </div><div data-toggle="MEDAL_DANMU_BLACK" class="inline"><input type="radio" name="MEDAL_DANMU_METHOD" class="smallInterval">黑名单 </div><button class="blth_btn" data-action="edit_lightMedalList">编辑房间列表</button><span helpdata="MEDAL_DANMU_METHOD" class="clickableText helpText">?</span></div><div data-toggle="MEDAL_DANMU_INTERVAL" class="lineStartSpace">弹幕发送间隔 <input class="num blth_input" style="width:25px;" type="text">秒 <span helpdata="MEDAL_DANMU_INTERVAL" class="clickableText helpText">?</span></div></fieldset><fieldset class="blth_fs"><legend>小心心</legend><div data-toggle="LITTLE_HEART"><label><input type="checkbox">自动获取小心心 </label><button class="blth_btn" data-action="resetToken">重置token</button><span helpdata="LITTLE_HEART" class="clickableText helpText">?</span></div><div data-toggle="LIGHT_MEDALS" style="color:purple">自动点亮勋章房间号 <input class="num blth_input" style="width:200px;" type="text"><span helpdata="LIGHT_MEDALS" class="clickableText helpText">?</span></div><div data-toggle="LIGHT_METHOD" class="inline">勋章点亮模式： <div data-toggle="LIGHT_WHITE" class="inline"><input type="radio" name="LIGHT_METHOD">白名单 </div><div data-toggle="LIGHT_BLACK" class="inline"><input type="radio" name="LIGHT_METHOD" class="smallInterval">黑名单 </div><button class="blth_btn" data-action="lightMedalNow">立刻点亮勋章</button><span helpdata="LIGHT_METHOD" class="clickableText helpText">?</span></div><div data-toggle="FORCE_LIGHT"><label><input type="checkbox">点亮勋章时忽略亲密度上限 </label></div></fieldset><fieldset class="blth_fs"><legend>自动送礼设置</legend><div data-toggle="AUTO_GIFT" style="color:purple"><input type="checkbox">自动送礼 <span helpdata="AUTO_GIFT" class="clickableText helpText">?</span></div><div data-toggle="AUTO_GIFT_ROOMID" style="color:purple">优先送礼房间 <input class="num blth_input" style="width:150px;" type="text"><span helpdata="AUTO_GIFT_ROOMID" class="clickableText helpText">?</span></div><div data-toggle="GIFT_SEND_METHOD" class="inline">自动送礼模式： <div data-toggle="GIFT_SEND_WHITE" class="inline"><input type="radio" name="GIFT_SEND_METHOD">白名单 </div><div data-toggle="GIFT_SEND_BLACK" class="inline"><input type="radio" name="GIFT_SEND_METHOD" class="smallInterval">黑名单 </div><button class="blth_btn" data-action="edit_GIFT_SEND_ROOM">编辑房间列表</button><span helpdata="GIFT_SEND_METHOD" class="clickableText helpText">?</span></div><div data-toggle="GIFT_ALLOW_TYPE" style="color:purple">允许被送出的礼物类型 <input class="str blth_input" style="width:150px;" type="text"><span helpdata="GIFT_ALLOW_TYPE" class="clickableText helpText">?</span></div><div data-toggle="GIFT_INTERVAL"><input type="radio" name="GIFT_METHOD">间隔 <input class="num blth_input" style="width:30px;" type="text">分钟送礼 </div><div data-toggle="GIFT_SEND_TIME" style="color:purple"><input type="radio" name="GIFT_METHOD">定时送礼 <div class="lineStartSpace">送礼时间 <input class="Hour blth_input" style="width:20px;" type="text">点 <input class="Minute blth_input" style="width:20px;" type="text">分 <button class="blth_btn" data-action="sendGiftNow">立刻开始送礼</button></div></div><div data-toggle="GIFT_LIMIT" style="color:purple">礼物到期时间 <input class="num blth_input" style="width:20px;" type="text">天 <span helpdata="GIFT_LIMIT" class="clickableText helpText">?</span></div>粉丝牌送礼优先级<br><div data-toggle="GIFT_SORT_HIGH" class="lineStartSpace"><input type="radio" name="GIFT_SORT">优先<strong style="color:purple">高</strong>等级粉丝牌 </div><div data-toggle="GIFT_SORT_LOW" class="lineStartSpace"><input type="radio" name="GIFT_SORT">优先<strong style="color:purple">低</strong>等级粉丝牌 </div><div data-toggle="SEND_ALL_GIFT" style="color:#ff5200;"><input type="checkbox">无视礼物类型和到期时间限制 <span helpdata="SEND_ALL_GIFT" class="clickableText helpText">?</span></div><div data-toggle="SPARE_GIFT_ROOM">剩余礼物送礼直播间： <input class="num blth_input" type="text" style="width:100px;"><span helpdata="SPARE_GIFT_ROOM" class="clickableText helpText">?</span></div></fieldset><fieldset class="blth_fs"><legend>节奏风暴设置</legend><div data-toggle="STORM"><label style="color:#ff5200"><input type="checkbox">参与节奏风暴 </label><span helpdata="STORM" class="clickableText helpText">?</span></div><div data-toggle="STORM_QUEUE_SIZE">允许同时参与的节奏风暴次数： <input class="num blth_input" type="text" style="width:30px;"></div><div data-toggle="STORM_MAX_COUNT">单个风暴最大尝试次数： <input class="num blth_input" type="text" style="width:30px;"></div><div data-toggle="STORM_ONE_LIMIT">单个风暴参与次数间隔： <input class="num blth_input" type="text" style="width:30px;">毫秒 </div></fieldset><fieldset class="blth_fs"><legend>弹幕设置</legend><div data-toggle="AUTO_DANMU"><input type="checkbox">自动发弹幕 <span helpdata="AUTO_DANMU" class="clickableText helpText">?</span></div><div data-toggle="AUTO_DANMU_SETTINGS">弹幕内容 <input class="Danmu blth_input" style="width:330px;" type="text"><br>房间号 <input class="Roomid blth_input" style="width:330px;" type="text"><br>发送时间 <input class="Time blth_input" style="width:330px;" type="text"></div><button class="blth_btn" data-action="sendDanmuNow">立刻发送弹幕</button><button class="blth_btn" data-action="clearDanmuCache">清除弹幕缓存</button><div data-toggle="DANMU_MODIFY"><input type="checkbox">弹幕修改 <span helpdata="DANMU_MODIFY" class="clickableText helpText">?</span><br><div>1. 匹配弹幕</div><div data-toggle="DANMU_MODIFY_REGEX" class="lineStartSpace">正则表达式： <input class="str blth_input" type="text" style="width:250px;"></div><div data-toggle="DANMU_MODIFY_UID" class="lineStartSpace">发送者UID：<input class="str blth_input" type="text" style="width:250px;"></div><div>2. 修改弹幕</div><div data-toggle="DANMU_MODIFY_POOL" class="lineStartSpace">弹幕池：<input class="str blth_input" type="text" style="width:200px;"></div><div data-toggle="DANMU_MODIFY_COLOR" class="lineStartSpace">颜色：<input class="str blth_input" type="text" style="width:250px;"></div><div data-toggle="DANMU_MODIFY_SIZE" class="lineStartSpace">大小：缩放至原来的 <input class="str blth_input" type="text" style="width:200px;">倍</div></div></fieldset><fieldset class="blth_fs"><legend>粉丝勋章</legend><div data-toggle="BUY_MEDAL"><div style="color:purple">花费20硬币购买粉丝勋章</div><div class="lineStartSpace">输入粉丝勋章对应房间号：<input class="num blth_input" type="text" onclick="select();" style="width:70px"><button class="blth_btn" data-action="buy_medal">点击购买勋章</button><span helpdata="BUY_MEDAL" class="clickableText helpText">?</span></div></div><div data-toggle="WEAR_MEDAL_BEFORE_DANMU"><input type="checkbox">手动发弹幕前自动佩戴当前房间勋章 <span helpdata="WEAR_MEDAL_BEFORE_DANMU" class="clickableText helpText">?</span><div class="lineStartSpace"><div data-toggle="ONLY_FIRST"><input type="radio" name="WEAR_MEDAL_BEFORE_DANMU">仅在首次发弹幕时自动佩戴 </div><div data-toggle="ALWAYS"><input type="radio" name="WEAR_MEDAL_BEFORE_DANMU">一直自动佩戴 </div></div></div></fieldset><fieldset class="blth_fs"><legend>天选时刻</legend><div data-toggle="ANCHOR_LOTTERY"><label style="color:purple"><input type="checkbox">参加天选时刻抽奖 </label><span helpdata="ANCHOR_LOTTERY" class="clickableText helpText">?</span></div><div data-toggle="ANCHOR_AWPUSH"><input type="checkbox"><label style="font-weight: bold;">启用 awpush</label><button class="blth_btn" data-action="edit_ANCHOR_SERVER_APIKEY">编辑apikey</button><span helpdata="ANCHOR_AWPUSH" class="clickableText helpText">?</span></div><div>天选时刻数据获取方式</div><div data-toggle="ANCHOR_TYPE_POLLING" class="lineStartSpace"><input type="checkbox">从高热度直播间获取天选时刻数据 <span helpdata="ANCHOR_TYPE_POLLING" class="clickableText helpText">?</span></div><div data-toggle="ANCHOR_TYPE_LIVEROOM" class="lineStartSpace"><input type="checkbox">从直播间 <input class="num blth_input" style="width:100px;" type="text">的个人简介获取天选时刻数据 <span helpdata="ANCHOR_TYPE_LIVEROOM" class="clickableText helpText">?</span></div><div data-toggle="ANCHOR_TYPE_SERVER" class="lineStartSpace"><input type="checkbox"><span style="color: purple;">从 BLTH-server 获取天选时刻数据</span><button class="blth_btn" data-action="edit_ANCHOR_SERVER_APIKEY">编辑apikey</button><span helpdata="ANCHOR_TYPE_SERVER" class="clickableText helpText">?</span></div><div data-toggle="ANCHOR_TYPE_FOLLOWING" class="lineStartSpace"><input type="checkbox">从已关注且正在直播的直播间获取天选时刻数据 <span helpdata="ANCHOR_TYPE_FOLLOWING" class="clickableText helpText">?</span></div><div data-toggle="ANCHOR_TYPE_CUSTOM" class="lineStartSpace"><input type="checkbox">从自定义直播间列表获取天选时刻数据 <button class="blth_btn" data-action="edit_ANCHOR_CUSTOM_ROOMLIST">编辑直播间列表</button><span helpdata="ANCHOR_TYPE_CUSTOM" class="clickableText helpText">?</span></div><div data-toggle="ANCHOR_MAXROOM"><label>检查房间最大数量 <input class="roomNum blth_input" style="width:50px;" type="text"></label><span helpdata="ANCHOR_MAXROOM" class="clickableText helpText">?</span></div><div data-toggle="ANCHOR_UPLOAD_DATA"><label><input type="checkbox">上传天选数据至直播间个人简介(间隔 <input class="num blth_input" style="width:30px;" type="text">秒) </label><span helpdata="ANCHOR_UPLOAD_DATA" class="clickableText helpText">?</span></div><div data-toggle="ANCHOR_UPLOAD_ROOMLIST"><label><input type="checkbox"><span style="color: purple;">上传天选数据至BLTH-server</span></label><button class="blth_btn" data-action="edit_ANCHOR_SERVER_APIKEY">编辑apikey</button><span helpdata="ANCHOR_UPLOAD_ROOMLIST" class="clickableText helpText">?</span></div><div data-toggle="ANCHOR_MAXLIVEROOM_SAVE"><label>个人简介储存房间最大数量 <input class="roomNum blth_input" style="width:50px;" type="text"></label><span helpdata="ANCHOR_MAXLIVEROOM_SAVE" class="clickableText helpText">?</span></div><div data-toggle="ANCHOR_UPLOAD_MSG"><label style="color:purple;"><input type="checkbox">上传附加信息 <button class="blth_btn" data-action="edit_ANCHOR_UPLOAD_MSG">编辑附加信息</button></label><span helpdata="ANCHOR_UPLOAD_MSG" class="clickableText helpText">?</span></div><div data-toggle="ANCHOR_IGNORE_UPLOAD_MSG"><label><input type="checkbox">忽略附加信息 </label><span helpdata="ANCHOR_IGNORE_UPLOAD_MSG" class="clickableText helpText">?</span></div><div data-toggle="ANCHOR_CHECK_INTERVAL"><label>天选获取数据间隔 <input class="num blth_input" style="width:25px;" type="text">分钟 </label><span helpdata="ANCHOR_CHECK_INTERVAL" class="clickableText helpText">?</span></div><div data-toggle="ANCHOR_NEED_GOLD"><label>忽略所需电池大于 <input class="num blth_input" style="width:50px;" type="text">的天选 </label></div><div data-toggle="ANCHOR_GOLD_JOIN_TIMES"><label>每个付费天选参加 <input class="num blth_input" style="width:50px;" type="text">次 </label><span helpdata="ANCHOR_GOLD_JOIN_TIMES" class="clickableText helpText">?</span></div><div data-toggle="ANCHOR_IGNORE_AREA"><label><input type="checkbox">忽略指定分区 <button class="blth_btn" data-action="edit_ANCHOR_IGNORE_AREA">编辑分区</button></label><span helpdata="ANCHOR_IGNORE_AREA" class="clickableText helpText">?</span></div><div data-toggle="ANCHOR_IGNORE_BLACKLIST"><label><input type="checkbox">忽略关键字 <label class="str" style="font-weight:bold">1个</label><button class="blth_btn" data-action="edit_ANCHOR_BLACKLIST_WORD">编辑关键字</button><button class="blth_btn" data-action="addCloud_ANCHOR_BLACKLIST_WORD">添加云端关键字</button></label><span helpdata="ANCHOR_IGNORE_BLACKLIST" class="clickableText helpText">?</span></div><div data-toggle="ANCHOR_IGNORE_ROOM"><label><input type="checkbox">忽略直播间 <label class="str" style="font-weight:bold">1个</label><button class="blth_btn" data-action="edit_ANCHOR_IGNORE_ROOMLIST">编辑直播间</button><button class="blth_btn" data-action="addCloud_ANCHOR_IGNORE_ROOMLIST">添加云端直播间</button></label><span helpdata="ANCHOR_IGNORE_ROOM" class="clickableText helpText">?</span></div><div data-toggle="ANCHOR_FANS_CHECK"><label><input type="checkbox">忽略粉丝数小于 <input class="num blth_input" style="width:60px;" type="text">的UP的天选</label><span helpdata="ANCHOR_FANS_CHECK" class="clickableText helpText">?</span></div><div data-toggle="ANCHOR_IGNORE_MONEY"><label>忽略金额小于 <input class="num blth_input" style="width:30px;" type="text">元的天选 </label><span helpdata="ANCHOR_IGNORE_MONEY" class="clickableText helpText">?</span></div><div data-toggle="ANCHOR_MONEY_ONLY"><label><input type="checkbox">仅参加现金抽奖 </label><span helpdata="ANCHOR_MONEY_ONLY" class="clickableText helpText">?</span></div><div data-toggle="ANCHOR_AUTO_BUY_LV1_MEDAL"><label><input type="checkbox">检测到有1级粉丝牌要求的天选后自动购买勋章再参加 </label><span helpdata="ANCHOR_AUTO_BUY_LV1_MEDAL" class="clickableText helpText">?</span></div><div data-toggle="ANCHOR_INTERVAL"><label>请求间隔 <input class="num blth_input" style="width:30px;" type="text">毫秒 </label><span helpdata="ANCHOR_INTERVAL" class="clickableText helpText">?</span></div><div data-toggle="ANCHOR_WAIT_REPLY"><label><input type="checkbox">发出请求后等待回复 </label><span helpdata="ANCHOR_WAIT_REPLY" class="clickableText helpText">?</span></div><div data-toggle="ANCHOR_IGNORE_PWDROOM"><label><input type="checkbox">不参与加密直播间的天选 </label><span helpdata="ANCHOR_IGNORE_PWDROOM" class="clickableText helpText">?</span></div><div data-toggle="ANCHOR_MOVETO_FOLLOW_TAG"><label><input type="checkbox">把参与天选时关注的UP移到新分组 <button style="font-size:small;color:red;" class="blth_btn" data-action="removeAnchorFollowingInTag">取关该分组内的UP主</button></label><span helpdata="ANCHOR_MOVETO_FOLLOW_TAG" class="clickableText helpText">?</span></div>检测到<strong style="color:purple">未中奖</strong>后<br><div data-toggle="ANCHOR_AUTO_DEL_FOLLOW"><label class="lineStartSpace"><input type="checkbox">自动取关发起抽奖的UP </label><span helpdata="ANCHOR_AUTO_DEL_FOLLOW" class="clickableText helpText">?</span></div>检测到<strong style="color:purple">中奖</strong>后<br><div data-toggle="ANCHOR_PRIVATE_LETTER"><label class="lineStartSpace"><input type="checkbox">给发起抽奖的UP发一条私信 <button class="blth_btn" data-action="edit_ANCHOR_LETTER_CONTENT">编辑私信内容</button></label><span helpdata="ANCHOR_PRIVATE_LETTER" class="clickableText helpText">?</span></div><div data-toggle="ANCHOR_DANMU"><label class="lineStartSpace"><input type="checkbox">在对应直播间发一条弹幕 <button class="blth_btn" data-action="edit_ANCHOR_DANMU_CONTENT">编辑弹幕内容</button></label><span helpdata="ANCHOR_DANMU" class="clickableText helpText">?</span></div><div data-toggle="ANCHOR_MOVETO_PRIZE_TAG"><label class="lineStartSpace"><input type="checkbox">把发起抽奖的UP移到新分组 <button style="font-size:small;color:red;" class="blth_btn" data-action="removeAnchorPrizeInTag">取关该分组内的UP主</button></label><span helpdata="ANCHOR_MOVETO_PRIZE_TAG" class="clickableText helpText">?</span></div><div data-toggle="ANCHOR_ADD_TO_WHITELIST"><label class="lineStartSpace"><input type="checkbox">把发起抽奖的UP加入白名单 </label></div><div data-toggle="anchorBtnArea"><button data-action="saveFollowingList" class="blth_btn">保存当前关注列表为白名单</button><button data-action="removeAnchorFollowing" class="blth_btn" style="color:red;">取关不在白名单内的UP主</button><button data-action="editWhiteList" class="blth_btn">编辑白名单</button><span helpdata="anchorBtnArea" class="clickableText helpText">?</span></div></fieldset><fieldset class="blth_fs"><legend>内容屏蔽</legend><div data-toggle="REMOVE_ELEMENT_2233"><label><input type="checkbox">移除2233模型 </label></div><div data-toggle="REMOVE_ELEMENT_activity"><label><input type="checkbox">移除活动入口 </label></div><div data-toggle="REMOVE_ELEMENT_rank"><label><input type="checkbox">移除排行榜 </label></div><div data-toggle="REMOVE_ELEMENT_followSideBar"><label><input type="checkbox">移除右侧关注按钮及弹窗 </label><span helpdata="REMOVE_ELEMENT_followSideBar" class="clickableText helpText">?</span></div><div data-toggle="REMOVE_ELEMENT_flipView"><label><input type="checkbox">移除礼物栏下方广告 </label></div><div data-toggle="REMOVE_ELEMENT_anchor"><label><input type="checkbox">移除天选时刻弹窗及图标 </label><span helpdata="REMOVE_ELEMENT_anchor" class="clickableText helpText">?</span></div><div data-toggle="REMOVE_ELEMENT_pk"><label><input type="checkbox">移除大乱斗弹窗及进度条 </label><span helpdata="REMOVE_ELEMENT_pk" class="clickableText helpText">?</span></div><div data-toggle="REMOVE_ELEMENT_playerIcon"><label><input type="checkbox">移除直播水印 </label></div><div data-toggle="blockLiveStream"><label><input type="checkbox">拦截直播流 </label><span helpdata="blockLiveStream" class="clickableText helpText">?</span></div><div data-toggle="blockliveDataUpdate"><label><input type="checkbox">拦截直播观看数据上报 </label><span helpdata="blockliveDataUpdate" class="clickableText helpText">?</span></div><div data-toggle="NOSLEEP"><label><input type="checkbox">屏蔽挂机检测 </label><span helpdata="NOSLEEP" class="clickableText helpText">?</span></div><div data-toggle="INVISIBLE_ENTER"><label><input type="checkbox">隐身入场 </label><span helpdata="INVISIBLE_ENTER" class="clickableText helpText">?</span></div><div data-toggle="banP2p"><label><input type="checkbox">禁止p2p上传 </label><span helpdata="banP2p" class="clickableText helpText">?</span></div></fieldset><fieldset class="blth_fs"><legend>其他设置</legend><div data-toggle="TIME_AREA_DISABLE"><label style="color:darkgreen"><input type="checkbox">休眠时段： <input class="startHour blth_input" style="width:20px;" type="text">点 <input class="startMinute blth_input" style="width:20px;" type="text">分至 <input class="endHour blth_input" style="width:20px;" type="text">点 <input class="endMinute blth_input" style="width:20px;" type="text">分 </label><span helpdata="TIME_AREA_DISABLE" class="clickableText helpText">?</span></div><div data-toggle="TIME_RELOAD"><input type="checkbox">每 <input class="delay-seconds blth_input" type="text" style="width:30px;">分钟刷新一次页面 </div><div data-toggle="IN_TIME_RELOAD_DISABLE"><label><input type="checkbox">不抽奖时段不刷新直播间 </label></div><div data-toggle="debugSwitch"><label><input type="checkbox">控制台日志 </label><span helpdata="debugSwitch" class="clickableText helpText">?</span></div><div data-toggle="windowToast"><label><input type="checkbox">提示信息 </label><span helpdata="windowToast" class="clickableText helpText">?</span></div><div data-toggle="UPDATE_TIP"><label><input type="checkbox">更新内容提示 </label><span helpdata="UPDATE_TIP" class="clickableText helpText">?</span></div><div data-toggle="GM_NOTICE"><label><input type="checkbox">实物/天选中奖后系统通知 </label></div>实物/天选中奖后消息推送 <div data-toggle="PP_NOTICE"><label class="lineStartSpace" style="color:darkgreen"><input type="checkbox">通过<a href="http://www.pushplus.plus/" target="_blank">推送加</a>推送微信通知 <button class="blth_btn" data-action="edit_PP_SCKEY">编辑推送加token</button><button class="blth_btn" data-action="test_PP">推送测试</button></label><span helpdata="PP_NOTICE" class="clickableText helpText">?</span></div><div data-toggle="ServerTurbo_NOTICE"><label class="lineStartSpace" style="color:darkgreen"><input type="checkbox">通过<a href="https://sct.ftqq.com" target="_blank">Server酱·Turbo版</a>推送微信通知 <button class="blth_btn" data-action="edit_ServerTurbo_SendKey">编辑Turbo版Sendkey</button><button class="blth_btn" data-action="test_ServerTurbo">推送测试</button></label><span helpdata="ServerTurbo_NOTICE" class="clickableText helpText">?</span></div><div data-toggle="CP_NOTICE"><label class="lineStartSpace" style="color:darkgreen"><input type="checkbox">通过<a href="https://cp.xuthus.cc" target="_blank">酷推</a>推送QQ消息通知 <button class="blth_btn" data-action="edit_CP_Skey">编辑酷推Skey</button><button class="blth_btn" data-action="test_CP">推送测试</button></label><span helpdata="CP_NOTICE" class="clickableText helpText">?</span></div><div data-toggle="btnArea"><button data-action="reset" style="color:red;" class="blth_btn">重置所有为默认</button><button data-action="redoAllTasks" style="color:red;" class="blth_btn">再次执行所有任务</button><button data-action="mainSiteTasks" class="blth_btn">再次执行主站任务</button><br><button data-action="exportConfig" class="blth_btn">导出配置</button><button data-action="importConfig" class="blth_btn">导入配置</button><input type="file" id="BLTH_config_file" style="display:none"><button class="blth_btn" data-action="about">关于</button><span helpdata="btnArea" class="clickableText helpText">?</span></div></fieldset></div></div>
        
        `

        //GM_getResourceText('main');
        function layerOpenAbout() {
          return layer.open({
            title: `版本${GM_info.script.version}`,
            content: `<h3 style="text-align:center">B站直播间挂机助手</h3>作者：${linkMsg("https://github.com/andywang425/", "andywang425")}<br>许可证：${linkMsg("https://raw.githubusercontent.com/andywang425/BLTH/master/LICENSE", "MIT")}<br>github项目地址：${linkMsg("https://github.com/andywang425/BLTH", "BLTH")}<br>反馈：${linkMsg("https://github.com/andywang425/BLTH/issues", "BLTH/issues")}<br>交流qq群：${linkMsg("https://jq.qq.com/?_wv=1027&amp;k=fCSfWf1O", '1106094437')}，${linkMsg('https://jq.qq.com/?_wv=1027&k=Bf951teI', '907502444（新）')}<br>`
          });
        };
        const saveAction = (div) => {
          // TIME_AREA_DISABLE（控制输入的两个小时两个分钟）
          let val = undefined;
          let valArray = undefined;
          let val1 = parseInt(div.find('div[data-toggle="TIME_AREA_DISABLE"] .startHour').val());
          let val2 = parseInt(div.find('div[data-toggle="TIME_AREA_DISABLE"] .endHour').val());
          let val3 = parseInt(div.find('div[data-toggle="TIME_AREA_DISABLE"] .startMinute').val());
          let val4 = parseInt(div.find('div[data-toggle="TIME_AREA_DISABLE"] .endMinute').val());

          if (val1 >= 24 || val2 >= 24 || val3 >= 60 || val4 >= 60 || val1 < 0 || val2 < 0 || val3 < 0 || val4 < 0)
            return window.toast("[定时休眠]时间错误", 'caution');
          MY_API.CONFIG.TIME_AREA_START_H0UR = val1;
          MY_API.CONFIG.TIME_AREA_END_H0UR = val2;
          MY_API.CONFIG.TIME_AREA_START_MINUTE = val3;
          MY_API.CONFIG.TIME_AREA_END_MINUTE = val4;
          // RANDOM_SKIP save
          val = parseFloat(div.find('div[data-toggle="RANDOM_SKIP"] .per').val());
          if (val < 0 || val > 100)
            return window.toast('[随机跳过礼物]数据小于0或大于100', 'caution');
          MY_API.CONFIG.RANDOM_SKIP = val;
          // RANDOM_SEND_DANMU save
          val = parseFloat(div.find('div[data-toggle="RANDOM_SEND_DANMU"] .per').val());
          if (val > 5)
            return window.toast("[活跃弹幕]为维护直播间弹幕氛围,弹幕发送概率不得大于5%", 'caution');
          else if (val < 0)
            return Y_API.chatLog("[活跃弹幕]数据小于0", 'caution');
          MY_API.CONFIG.RANDOM_SEND_DANMU = val;
          // TIME_RELOAD save
          val = parseInt(div.find('div[data-toggle="TIME_RELOAD"] .delay-seconds').val());
          if (val <= 0 || val > 10000)
            return window.toast('[直播间重载时间]数据小于等于0或大于10000', 'caution');
          MY_API.CONFIG.TIME_RELOAD_MINUTE = val;
          // RANDOM_DELAY
          val = parseFloat(div.find('div[data-toggle="RANDOM_DELAY"] .RND_DELAY_START').val());
          val2 = parseFloat(div.find('div[data-toggle="RANDOM_DELAY"] .RND_DELAY_END').val());

          if (val < 0 || val2 > 100)
            return window.toast('[抽奖延时]数据小于0或大于100', 'caution');
          else if (val2 <= val)
            return window.toast('[抽奖延时]数据大小关系不正确', 'caution');
          MY_API.CONFIG.RND_DELAY_START = val;
          MY_API.CONFIG.RND_DELAY_END = val2;
          // COIN
          val = parseInt(div.find('div[data-toggle="COIN"] .coin_number').val());
          if (val < 0 || val > 5)
            return window.toast("[自动投币]数据小于0或大于5", 'caution');
          MY_API.CONFIG.COIN_NUMBER = val;
          // CHECK_HOUR_ROOM_INTERVAL
          val = parseInt(div.find('div[data-toggle="CHECK_HOUR_ROOM"] .num').val());
          if (val <= 0)
            return window.toast("[检查小时榜间隔]数据小于等于0", 'caution');
          MY_API.CONFIG.CHECK_HOUR_ROOM_INTERVAL = val;
          // AUTO_GIFT_ROOMID
          val = div.find('div[data-toggle="AUTO_GIFT_ROOMID"] .num').val();
          valArray = val.split(",");
          for (let i = 0; i < valArray.length; i++) {
            if (valArray[i] === '') {
              valArray[i] = 22474988;
            }
          };
          MY_API.CONFIG.AUTO_GIFT_ROOMID = valArray;
          // GIFT_LIMIT
          val = parseInt(div.find('div[data-toggle="GIFT_LIMIT"] .num').val());
          MY_API.CONFIG.GIFT_LIMIT = val;
          // GIFT_INTERVAL
          val = parseInt(div.find('div[data-toggle="GIFT_INTERVAL"] .num').val());
          MY_API.CONFIG.GIFT_INTERVAL = val;
          // GIFT_SEND_TIME
          val1 = parseInt(div.find('div[data-toggle="GIFT_SEND_TIME"] .Hour').val());
          val2 = parseInt(div.find('div[data-toggle="GIFT_SEND_TIME"] .Minute').val());
          if (val1 < 0 || val2 < 0 || val1 >= 24 || val2 >= 60)
            return window.toast("[送礼时间]时间错误", 'caution');
          MY_API.CONFIG.GIFT_SEND_HOUR = val1;
          MY_API.CONFIG.GIFT_SEND_MINUTE = val2;
          // LIGHT_MEDALS
          val = div.find('div[data-toggle="LIGHT_MEDALS"] .num').val();
          valArray = val.split(",");
          for (let i = 0; i < valArray.length; i++) {
            if (valArray[i] === '') {
              valArray[i] = 0;
            }
          };
          MY_API.CONFIG.LIGHT_MEDALS = valArray;
          // SPARE_GIFT_ROOM
          val = div.find('div[data-toggle="SPARE_GIFT_ROOM"] .num').val();
          MY_API.CONFIG.SPARE_GIFT_ROOM = val;
          // STORM_QUEUE_SIZE
          val = parseInt(div.find('div[data-toggle="STORM_QUEUE_SIZE"] .num').val());
          MY_API.CONFIG.STORM_QUEUE_SIZE = val;
          // STORM_MAX_COUNT
          val = parseInt(div.find('div[data-toggle="STORM_MAX_COUNT"] .num').val());
          MY_API.CONFIG.STORM_MAX_COUNT = val;
          // STORM_ONE_LIMIT
          val = parseInt(div.find('div[data-toggle="STORM_ONE_LIMIT"] .num').val());
          MY_API.CONFIG.STORM_ONE_LIMIT = val;
          // COIN_UID
          val = div.find('div[data-toggle="COIN_UID"] .num').val();
          valArray = val.split(",");
          for (let i = 0; i < valArray.length; i++) {
            if (valArray[i] === '') {
              valArray[i] = 0;
            }
          };
          MY_API.CONFIG.COIN_UID = valArray;
          // AUTO_DANMU
          val1 = div.find('div[data-toggle="AUTO_DANMU_SETTINGS"] .Danmu').val();
          valArray = val1.split(",");
          for (let i = 0; i < valArray.length; i++) {
            if (valArray[i] === '') {
              valArray[i] = '这是一条弹幕';
            }
          };
          val1 = valArray;
          val2 = div.find('div[data-toggle="AUTO_DANMU_SETTINGS"] .Roomid').val();
          valArray = val2.split(",");
          for (let i = 0; i < valArray.length; i++) {
            if (valArray[i] === '') {
              valArray[i] = '22474988';
            }
          };
          val2 = valArray;
          val3 = div.find('div[data-toggle="AUTO_DANMU_SETTINGS"] .Time').val();
          valArray = val3.split(",");
          for (let i = 0; i < valArray.length; i++) {
            if (valArray[i] === '') {
              valArray[i] = '10m';
            }
          };
          val3 = valArray;
          MY_API.CONFIG.DANMU_CONTENT = val1;
          MY_API.CONFIG.DANMU_ROOMID = val2;
          MY_API.CONFIG.DANMU_INTERVAL_TIME = val3;
          // MATERIAL_LOTTERY_CHECK_INTERVAL
          val = parseInt(div.find('div[data-toggle="MATERIAL_LOTTERY_CHECK_INTERVAL"] .num').val());
          MY_API.CONFIG.MATERIAL_LOTTERY_CHECK_INTERVAL = val;
          // MATERIAL_LOTTERY_REM
          val = parseInt(div.find('div[data-toggle="MATERIAL_LOTTERY_REM"] .num').val());
          if (isNaN(val)) val = 9;
          MY_API.CONFIG.MATERIAL_LOTTERY_REM = val;
          // ANCHOR_CHECK_INTERVAL
          val = parseFloat(div.find('div[data-toggle="ANCHOR_CHECK_INTERVAL"] .num').val());
          MY_API.CONFIG.ANCHOR_CHECK_INTERVAL = val;
          // ANCHOR_MAXROOM
          val = div.find('div[data-toggle="ANCHOR_MAXROOM"] .roomNum').val();
          if (val <= 0) return window.toast("[检查房间最大数量] 数据小于等于0", 'caution');
          MY_API.CONFIG.ANCHOR_MAXROOM = val;
          // ANCHOR_NEED_GOLD
          val = parseInt(div.find('div[data-toggle="ANCHOR_NEED_GOLD"] .num').val());
          MY_API.CONFIG.ANCHOR_NEED_GOLD = val;
          // ANCHOR_INTERVAL
          val = parseInt(div.find('div[data-toggle="ANCHOR_INTERVAL"] .num').val());
          if (isNaN(val) || val < 0)
            return window.toast("[请求间隔] 错误输入", 'caution');
          MY_API.CONFIG.ANCHOR_INTERVAL = val;
          // ANCHOR_GETDATA_ROOM
          val = div.find('div[data-toggle="ANCHOR_TYPE_LIVEROOM"] .num').val();
          if (isNaN(val) || val < 0) return window.toast('[从直播间获取天选数据] 直播间号格式错误', 'caution');
          MY_API.CONFIG.ANCHOR_GETDATA_ROOM = val;
          // ANCHOR_UPLOAD_DATA_INTERVAL
          val = parseInt(div.find('[data-toggle="ANCHOR_UPLOAD_DATA"] .num').val());
          if (isNaN(val) || val < 0) return window.toast('[上传天选数据至直播间个人简介间隔] 错误输入', 'caution');
          MY_API.CONFIG.ANCHOR_UPLOAD_DATA_INTERVAL = val;
          // ANCHOR_MAXLIVEROOM_SAVE
          val = div.find('[data-toggle="ANCHOR_MAXLIVEROOM_SAVE"] .roomNum').val();
          if (isNaN(val) || val < 0) return window.toast('[个人简介储存房间最大数量] 错误输入', 'caution');
          MY_API.CONFIG.ANCHOR_MAXLIVEROOM_SAVE = val;
          // ANCHOR_IGNORE_MONEY
          val = parseFloat(div.find('[data-toggle="ANCHOR_IGNORE_MONEY"] .num').val());
          if (isNaN(val) || val < 0) return window.toast('[忽略小于指定金额天选] 错误输入', 'caution');
          MY_API.CONFIG.ANCHOR_IGNORE_MONEY = val;
          // MEDAL_DANMU_INTERVAL
          val = parseFloat(div.find('[data-toggle="MEDAL_DANMU_INTERVAL"] .num').val())
          if (isNaN(val) || val < 0) return window.toast('[打卡弹幕发送间隔] 错误输入', 'caution');
          MY_API.CONFIG.MEDAL_DANMU_INTERVAL = val;
          // COIN2SILVER_NUM
          val = parseInt(div.find('[data-toggle="COIN2SILVER"] .coin_number').val());
          if (isNaN(val) || val < 0) return window.toast('[硬币换银瓜子] 错误输入', 'caution');
          MY_API.CONFIG.COIN2SILVER_NUM = val;
          // GIFT_ALLOW_TYPE
          val = div.find('[data-toggle="GIFT_ALLOW_TYPE"] .str').val();
          valArray = val.split(",");
          for (let i = 0; i < valArray.length; i++) {
            if (valArray[i] === '') {
              valArray[i] = '0';
            }
          };
          MY_API.CONFIG.GIFT_ALLOW_TYPE = valArray;
          // ANCHOR_GOLD_JOIN_TIMES
          val = parseInt(div.find('[data-toggle="ANCHOR_GOLD_JOIN_TIMES"] .num').val());
          if (isNaN(val) || val <= 0) return window.toast('[付费天选参加次数] 错误输入', 'caution');
          MY_API.CONFIG.ANCHOR_GOLD_JOIN_TIMES = val;
          // ANCHOR_FANS_LEAST
          val = parseInt(div.find('[data-toggle="ANCHOR_FANS_CHECK"] .num').val());
          if (isNaN(val) || val < 0) return window.toast('[最少粉丝数] 错误输入', 'caution');
          MY_API.CONFIG.ANCHOR_FANS_LEAST = val;
          // DANMU_MODIFY_REGEX
          val = div.find('div[data-toggle="DANMU_MODIFY_REGEX"] .str').val();
          valArray = val.split(",");
          for (let i = 0; i < valArray.length; i++) {
            if (valArray[i] === '') valArray[i] = 1;
            else valArray[i] = valArray[i];
          };
          MY_API.CONFIG.DANMU_MODIFY_REGEX = valArray;
          // DANMU_MODIFY_UID
          val = div.find('div[data-toggle="DANMU_MODIFY_UID"] .str').val();
          valArray = val.split(",");
          for (let i = 0; i < valArray.length; i++) {
            if (valArray[i] === '') valArray[i] = 0;
            else valArray[i] = parseInt(valArray[i]);
          };
          MY_API.CONFIG.DANMU_MODIFY_UID = valArray;
          // DANMU_MODIFY_POOL
          val = div.find('div[data-toggle="DANMU_MODIFY_POOL"] .str').val();
          valArray = val.split(",");
          for (let i = 0; i < valArray.length; i++) {
            if (valArray[i] === '') valArray[i] = 1;
            else valArray[i] = parseInt(valArray[i]);
          };
          MY_API.CONFIG.DANMU_MODIFY_POOL = valArray;
          // DANMU_MODIFY_COLOR
          val = div.find('div[data-toggle="DANMU_MODIFY_COLOR"] .str').val();
          valArray = val.split(",");
          for (let i = 0; i < valArray.length; i++) {
            if (valArray[i] === '') valArray[i] = '#FF000';
          };
          MY_API.CONFIG.DANMU_MODIFY_COLOR = valArray;
          // DANMU_MODIFY_SIZE
          val = div.find('div[data-toggle="DANMU_MODIFY_SIZE"] .str').val();
          valArray = val.split(",");
          for (let i = 0; i < valArray.length; i++) {
            if (valArray[i] === '') valArray[i] = 1;
            else valArray[i] = parseFloat(valArray[i]);
          };
          MY_API.CONFIG.DANMU_MODIFY_SIZE = valArray;
          return MY_API.saveConfig();
        };
        const checkList = [
          'AUTO_DANMU',
          'RANDOM_DELAY',
          'TIME_AREA_DISABLE',
          'AUTO_GROUP_SIGN',
          'LOGIN',
          'WATCH',
          'COIN',
          'SHARE',
          'SILVER2COIN',
          'LIVE_SIGN',
          'IN_TIME_RELOAD_DISABLE',
          'TIME_RELOAD',
          'AUTO_GIFT',
          'SEND_ALL_GIFT',
          'STORM',
          'LITTLE_HEART',
          'REMOVE_ELEMENT_2233',
          'REMOVE_ELEMENT_activity',
          'REMOVE_ELEMENT_rank',
          'REMOVE_ELEMENT_playerIcon',
          'LOTTERY',
          'CHECK_HOUR_ROOM',
          'MATERIAL_LOTTERY',
          'MATERIAL_LOTTERY_IGNORE_QUESTIONABLE_LOTTERY',
          'ANCHOR_IGNORE_BLACKLIST',
          'ANCHOR_LOTTERY',
          'PP_NOTICE',
          'ANCHOR_WAIT_REPLY',
          'ANCHOR_AUTO_DEL_FOLLOW',
          'ANCHOR_UPLOAD_DATA',
          'ANCHOR_PRIVATE_LETTER',
          'GM_NOTICE',
          'ANCHOR_ADD_TO_WHITELIST',
          'ANCHOR_MOVETO_FOLLOW_TAG',
          'MEDAL_DANMU',
          'ANCHOR_DANMU',
          'ANCHOR_MOVETO_PRIZE_TAG',
          'ANCHOR_IGNORE_PWDROOM',
          'UPDATE_TIP',
          'REMOVE_ELEMENT_followSideBar',
          'REMOVE_ELEMENT_flipView',
          'ANCHOR_UPLOAD_MSG',
          'ANCHOR_IGNORE_UPLOAD_MSG',
          'ANCHOR_IGNORE_ROOM',
          'ANCHOR_MONEY_ONLY',
          'FORCE_LIGHT',
          'COIN2SILVER',
          'ANCHOR_TYPE_POLLING',
          'ANCHOR_TYPE_LIVEROOM',
          'ANCHOR_TYPE_FOLLOWING',
          'CP_NOTICE',
          'ServerTurbo_NOTICE',
          'ANCHOR_TYPE_CUSTOM',
          'REMOVE_ELEMENT_anchor',
          'REMOVE_ELEMENT_pk',
          'ANCHOR_FANS_CHECK',
          'ANCHOR_TYPE_SERVER',
          'ANCHOR_UPLOAD_ROOMLIST',
          'ANCHOR_AWPUSH',
          'ANCHOR_AUTO_BUY_LV1_MEDAL',
          'ANCHOR_IGNORE_AREA'
        ];
        const radioList = [
          /**
           *  {
           *     name: 包含所有多选框的div的data-toggle，多选框的name，MY_API.CONFIG中的对象名
           *     toggle<num>: 每个多选框的div的data-toggle，MY_API.CONFIG中对应设置的值
           *  }
           */
          {
            name: 'COIN_TYPE',
            toggle1: 'COIN_DYN',
            toggle2: 'COIN_UID'
          },
          {
            name: 'GIFT_METHOD',
            toggle1: 'GIFT_INTERVAL',
            toggle2: 'GIFT_SEND_TIME'
          },
          {
            name: 'GIFT_SORT',
            toggle1: 'GIFT_SORT_HIGH',
            toggle2: 'GIFT_SORT_LOW'
          },
          {
            name: 'MEDAL_DANMU_METHOD',
            toggle1: 'MEDAL_DANMU_WHITE',
            toggle2: 'MEDAL_DANMU_BLACK'
          },
          {
            name: 'LIGHT_METHOD',
            toggle1: 'LIGHT_WHITE',
            toggle2: 'LIGHT_BLACK'
          },
          {
            name: 'GIFT_SEND_METHOD',
            toggle1: 'GIFT_SEND_WHITE',
            toggle2: 'GIFT_SEND_BLACK'
          }
        ];
        const helpText = {
          // 帮助信息
          ANCHOR_FANS_CHECK: "忽略粉丝数小于一定值的UP所发起的天选时刻。<mul><mli>通常来说粉丝数多的UP比较讲信用，不会不兑奖。当然因为这些UP的天选抽的人多也更难中奖。</mli><mli>该项只能填大于等于0的整数。</mli></mul>",
          ANCHOR_GOLD_JOIN_TIMES: "付费天选指需要花费电池才能参加的天选。<mul><mli>多次参加同一个付费天选可以提高中奖率。</mli><mli><strong>请慎重填写本设置项。</strong></mli></mul>",
          GIFT_SEND_METHOD: "自动送礼策略，有白名单和黑名单两种。后文中的<code>直播间</code>指拥有粉丝勋章的直播间。<mul><mli>白名单：仅给房间列表内的直播间送礼。</mli><mli>黑名单：给房间列表以外的直播间送礼。</mli><mli>如果要填写多个房间，每两个房间号之间需用半角逗号<code>,</code>隔开。</mli></mul>",
          ANCHOR_IGNORE_MONEY: '脚本会尝试识别天选标题中是否有金额并忽略金额小于设置值的天选。<mh3>注意：</mh3><mul><mli>支持识别阿拉伯数字和汉字数字。</mli><mli>识别的单位有限。</mli><mli>不支持识别外币。</mli><mli>由于一些天选时刻的奖品名比较特殊，可能会出现遗漏或误判。</mli></mul>',
          LOTTERY: '参与礼物抽奖。<mul><mli>礼物抽奖包括大乱斗抽奖和一小部分节奏风暴。经测试发现如果不在大乱斗中送礼物似乎必不可能中奖。节奏风暴抽奖也几乎抽不到。</mli><mli>这个功能可能会在日后被删除。</mli></mul>',
          MEDAL_DANMU: '在拥有粉丝勋章的直播间内，每天发送的首条弹幕将点亮对应勋章并给该勋章+100亲密度。<mh3>注意：</mh3><mul><mli>脚本不会给等级大于20的粉丝勋章打卡（因为不加亲密度）。</mli><mli>如果要填写多条弹幕，每条弹幕间请用半角逗号<code>,</code>隔开，发弹幕时将依次选取弹幕进行发送（若弹幕数量不足则循环选取）。</mli><mli>本功能运行时【自动发弹幕】和【自动送礼】将暂停运行。</mli></mul>',
          AUTO_DANMU: '发送直播间弹幕。<mh3>注意：</mh3><mul><mli>本功能运行时【粉丝勋章打卡弹幕】将暂停运行。</mli><mli><mp>弹幕内容，房间号，发送时间可填多个，数据之间用半角逗号<code>,</code>隔开(数组格式)。脚本会按顺序将这三个值一一对应，发送弹幕。</mp></mli><mli><mp>由于B站服务器限制，每秒最多只能发1条弹幕。若在某一时刻有多条弹幕需要发送，脚本会在每条弹幕间加上1.5秒间隔时间（对在特定时间点发送的弹幕无效）。</mp></mli><mli><mp>如果数据没对齐，缺失的数据会自动向前对齐。如填写<code>弹幕内容 lalala</code>，<code>房间号 3,4</code>，<code>发送时间 5m,10:30</code>，少填一个弹幕内容。那么在发送第二条弹幕时，第二条弹幕的弹幕内容会自动向前对齐（即第二条弹幕的弹幕内容是lalala）。</mp></mli><mli><mp>可以用默认值所填的房间号来测试本功能，但是请不要一直发。</mp></mli><mli><mp>发送时间有两种填写方法</mp><mp>1.【小时】h【分钟】m【秒】s</mp><mul><mli>每隔一段时间发送一条弹幕</mli><mli>例子：<code>1h2m3s</code>, <code>300m</code>, <code>30s</code>, <code>1h50s</code>, <code>2m6s</code>, <code>0.5h</code></mli><mli>可以填小数</mli><mli>可以只填写其中一项或两项</mli></mul><mp>脚本会根据输入数据计算出间隔时间，每隔一个间隔时间就会发送一条弹幕。如果不加单位，如填写<code>10</code>则默认单位是分钟（等同于<code>10m</code>）。</mp><mp><em>注意：必须按顺序填小时，分钟，秒，否则会出错(如<code>3s5h</code>就是错误的写法)</em></mp><mp>2.【小时】:【分钟】:【秒】</mp><mul><mli>在特定时间点（本地时间）发一条弹幕</mli><mli>例子： <code>10:30:10</code>, <code>0:40</code></mli><mli>只能填整数</mli><mli>小时分钟必须填写，秒数可以不填</mli></mul><mp>脚本会在该时间点发一条弹幕（如<code>13:30:10</code>就是在下午1点30分10秒的时候发弹幕）。</mp></mli></mul>',
          NOSLEEP: '屏蔽B站的挂机检测。不开启本功能时，标签页后台或长时间无操作就会触发B站的挂机检测。<mh3>原理：</mh3><mul><mli>劫持页面上的<code>addEventListener</code>绕过页面可见性检测，每5分钟触发一次鼠标移动事件规避鼠标移动检测。</mli><mul>',
          INVISIBLE_ENTER: '开启后进任意直播间其他人都不会看到你进直播间的提示【xxx 进入直播间】（只有你自己能看到）。<mh3>缺点：</mh3>开启后无法获取自己是否是当前直播间房管的数据，关注按钮状态均为未关注。所以开启本功能后进任意直播间都会有【禁言】按钮（如果不是房管点击后会提示接口返回错误），发弹幕时弹幕旁边会有房管标识（如果不是房管则只有你能看到此标识）。',
          MATERIAL_LOTTERY: '实物抽奖，即金宝箱抽奖。某些特殊的直播间会有金宝箱抽奖。<mh3>注意：</mh3><mul><mli>【忽略关键字】中每一项之间用半角逗号<code>,</code>隔开。</mli></mul>',
          MATERIAL_LOTTERY_REM: "aid是活动的编号。如你不理解此项保持默认配置即可。",
          ANCHOR_IGNORE_BLACKLIST: "忽略奖品名中含特定关键字或匹配特定正则表达式的存疑天选。<mh3>注意：</mh3><mul><mli>若要填写多个，每一项之间用半角逗号<code>,</code>隔开。</mli><mli>可以填<a href='https://www.runoob.com/js/js-regexp.html' target='_blank'>JavaScript正则表达式</a>。格式为<code>/【正则】/【修饰符】（可选）</code>，如<code>/cards/i</code>。</mli><mli>关键字对大小写不敏感，而正则在没有添加修饰符<code>i</code>的情况下会区分大小写。</mli><mli>欢迎大家在Github Discussion的<a href='https://github.com/andywang425/BLTH/discussions/80' target='_blank'>信息收集贴</a>分享你的关键字。</mli></mul>",
          MATERIAL_LOTTERY_IGNORE_QUESTIONABLE_LOTTERY: "忽略奖品名中含特定关键字或匹配特定正则表达式的存疑抽奖。<mh3>注意：</mh3><mul><mli>若要填写多个，每一项之间用半角逗号<code>,</code>隔开。</mli><mli>可以填<a href='https://www.runoob.com/js/js-regexp.html' target='_blank'>JavaScript正则表达式</a>。格式为<code>/【正则】/【修饰符】（可选）</code>，如<code>/cards/i</code>。</mli><mli>关键字对大小写不敏感，而正则在没有添加修饰符<code>i</code>的情况下会区分大小写。</mli><mli>欢迎大家在Github Discussion的<a href='https://github.com/andywang425/BLTH/discussions/80' target='_blank'>信息收集贴</a>分享你的关键字。</mli></mul>",
          PP_NOTICE: "<a href = 'http://www.pushplus.plus/' target = '_blank'>推送加（点我注册）</a>，即「pushplus」，一个很好用的消息推送平台。<br><br><blockquote>“ 我们的所做的一切只是为了让推送变的更简单。”</blockquote><br>使用前请先前往推送加官网完成注册，然后回到脚本界面填写token。<br><mul><mli>检测到实物/天选中奖后会发一条包含中奖具体信息的微信公众号推送提醒你中奖了。</mli></mul>",
          BUY_MEDAL: "调用官方api，消耗20硬币购买某位UP的粉丝勋章。<mul><mli>默认值为当前房间号。点击购买按钮后有确认界面，无需担心误触。</mli></mul>",
          btnArea: "<mul><mli>重置所有为默认：指将设置和任务执行时间缓存重置为默认。</mli><mli>再次执行所有任务，再次执行主站任务会使相关缓存重置为默认，可以在勾选了新的任务设置后使用。</mli><mli>导出配置：导出一个包含当前脚本设置的json到浏览器的默认下载路径，文件名为<code>BLTH_CONFIG.json</code>。</mli><mli>导入配置：从一个json文件导入脚本配置，导入成功后脚本会自动刷新页面使配置生效。</mli></mul>",
          LITTLE_HEART: "通过发送客户端心跳包获取小心心（无论目标房间是否开播都能获取）。<mul><mli>检测到包裹内有24个7天的小心心后会停止。</mli><mli>在获取完所有小心心之前直播间不刷新。</mli><mli>B站随时可以通过热更新使该功能失效。</mli><mli>【重置token】可在无法获取小心心时点击，下次获取小心心前会重新获取token。<strong>请谨慎点击该按钮，不要频繁使用。</strong></mli></mul>",
          STORM: "仅会参加被广播的节奏风暴。若无法参加请尝试实名后再参加。<mul><mli>由于B站改版现在几乎不可能抽到节奏风暴了。</mli><mli>这一功能可能会在日后被删除。</mli></mul>",
          SEND_ALL_GIFT: "若不勾选该项，自动送礼只会送出在【允许被送出的礼物类型】中的礼物。",
          AUTO_GIFT_ROOMID: "送礼时优先给这些房间送礼，送到对应粉丝牌亲密度上限后再送其它的。<mul><mli>如果要填写多个房间，每两个房间号之间需用半角逗号<code>,</code>隔开。如<code>666,777,888</code>。</mli></mul>",
          GIFT_LIMIT: "将要在这个时间段里过期的礼物会被送出。<mh3>注意：</mh3><mul><mli>勾选【无视礼物类型和到期时间限制】时无论礼物是否将要过期都会被送出。</mli></mul>",
          AUTO_GIFT: "<mh3>说明：</mh3><mul><mli>送礼设置优先级：<br>不送礼房间 >优先送礼房间 >优先高/低等级粉丝牌。</mli><mli>送礼设置逻辑规则：<br>无论【优先高/低等级粉丝牌】如何设置，会根据【无视礼物类型和到期时间限制】（勾选则无视是否到期补满亲密度，否则只送到期的）条件去按优先送礼房间先后顺序送礼。之后根据【优先高/低等级粉丝牌】决定先送高级还是低级。 </mli><mli>送礼顺序：<br>高亲密度的礼物会被优先送出，在满足此条件的情况下先送快要过期的礼物。 </mli><mli>不会送出永久礼物。 </mli></mul>",
          SPARE_GIFT_ROOM: "【剩余礼物】指送满了所有粉丝牌，但仍有剩余的将在1天内过期的礼物。<mul><mli>该项填<code>0</code>则不送剩余礼物。</mli></mul>",
          COIN: "自动给视频投币，每天最多投5个。<mul><mli>脚本会根据今日你已获得的投币经验值判断你已经投了多少个币，然后自动投剩余没投的币。<blockquote>如今日已获得投币经验20，脚本投币数量设置为4，则会投2个币。</blockquote></mli></mul>",
          COIN_UID: "该项若填<code>0</code>则给动态中的视频依次投币(不存在UID为0的用户)。<mul><mli>可以填写多个uid，每两个uid间用半角逗号<code>,</code>隔开。</mli><mli>如果填了多个uid，则会依次检查这些UP是否有可投币的视频。</mli></mul>",
          ANCHOR_INTERVAL: "轮询天选，取关，获取房间列表时每两个请求间的间隔时间。<mh3>注意：</mh3><mul><mli>如果间隔时间过短可能会被风控。</mli></mul>",
          ANCHOR_WAIT_REPLY: "发起检查直播间天选信息，取关的请求后会等待回复，收到回复后等待一个间隔时间再发起下一个请求。<mh3>任务流程：</mh3><mul><mli>发起请求 - 等待回复 - 等待一个间隔时间 - 发起下一个请求</mli></mul>",
          ANCHOR_AUTO_DEL_FOLLOW: "如果该UP在白名单内或一开始就在默认/特别关注分组则不会被取关。",
          anchorBtnArea: "参加天选时会关注很多UP。可以在参加天选前点击【保存当前关注列表为白名单】，参与完天选后再点【取关不在白名单内的UP主】来清理关注列表。<mul><mli>不建议频繁清理，可能会被风控。</mli><mli>【编辑白名单】每两个uid之间用半角逗号<code>,</code>隔开。</mli><mli>推荐大家使用【取关分组内的UP主】的功能来清理关注列表，【取关不在白名单内的UP主】可以作为一个备选方案。</mli></mul>",
          ANCHOR_TYPE_POLLING: "高热度房间来源于各分区热门房间列表。",
          ANCHOR_UPLOAD_DATA: "使用这个功能前你必须先拥有自己的直播间。<mul><mli>【间隔__秒】：这个设置项若填<code>10</code>秒，则每<code>10</code>秒检查一次是否收集到了新的数据，若有才上传。</mli></mul>",
          ANCHOR_UPLOAD_MSG: "在上传天选数据的同时可以上传一段附加信息。<mul><mli>如果想把附加信息设为空，请点击编辑界面上的<code>留空</code>按钮。</mli></mul>",
          ANCHOR_MAXLIVEROOM_SAVE: "个人简介有长度限制（约为一万个字符），若【个人简介储存房间最大数量】太大会无法上传。",
          ANCHOR_MAXROOM: "若收集的房间总数超过【检查房间最大数量】则会删除一部分最开始缓存的房间。<mh3>注意：</mh3><mul><mli>这一项并不是数值越大效率就越高。如果把这个值设置得过高会浪费很多时间去检查热度较低的，甚至已经下播的房间。【个人简介储存房间最大数量】同理。</mli></mul>",
          ANCHOR_TYPE_LIVEROOM: "因为在云上部署了脚本，<strong>默认值所填直播间(<a href = 'https://live.bilibili.com/22474988' target = '_blank'>22474988</a>)的个人简介可以持续提供天选数据</strong>（除非被风控或遇到一些突发情况）。<mul><mli>这个功能主要是为了减少请求数量，提高效率同时减少风控的概率。</mli><mli>使用本功能时建议把【天选获取数据间隔】调低一些减少遗漏的天选数量。</mli><mli><a href='https://jq.qq.com/?_wv=1027&amp;k=fCSfWf1O' target = '_blank'>q群（1106094437）</a>的群在线文档中有一些群友上传的能提供天选数据的直播间号。</mli></mul>",
          ANCHOR_PRIVATE_LETTER: "若中奖，会在开奖后10秒发送私信。<mul><mli>建议改一下私信内容，不要和默认值完全一样。</mli></mul>",
          ANCHOR_MOVETO_FOLLOW_TAG: `分组的名称为<code>${anchorFollowTagName}</code>。<mul><mli>在白名单内或天选功能运行前在默认/特别关注分组内的UP不会被移入该分组，即使后来出现在该分组里也不会被取关。</mli><mli><strong>请勿修改该分组名称。</strong></mli></mul>`,
          RANDOM_DELAY: "抽奖前额外等待一段时间。<mul><mli>可以填小数。</mli></mul>",
          RANDOM_SKIP: "随机忽略一部分抽奖。<mul><mli>可以填小数。</mli></mul>",
          ANCHOR_CHECK_INTERVAL: "检查完一轮天选后等待的时间。<mul><mli>可以填小数。</mli></mul>",
          TIME_AREA_DISABLE: "处于这个时段内时，脚本会暂停检查小时榜和天选时刻。<br><mul><mli>24小时制，只能填整数。</mli></mul>",
          MEDAL_DANMU_METHOD: "发送粉丝勋章打卡弹幕的逻辑，有白名单和黑名单两种。后文中的<code>直播间</code>指拥有粉丝勋章的直播间。<mul><mli>白名单：仅给房间列表内的直播间发弹幕。</mli><mli>黑名单：给房间列表以外的直播间发弹幕。</mli><mli>若要填写多个直播间，每两个直播间号之间用半角逗号<code>,</code>隔开。</mli></mul>",
          ANCHOR_DANMU: "检测到中奖后在发起抽奖的直播间发一条弹幕。<mh3>注意：</mh3><mul><mli>如果要填写多条弹幕，每条弹幕间请用半角逗号<code>,</code>隔开，发弹幕时将从中随机抽取弹幕进行发送。</mli></mul>",
          topArea: "这里会显示一些统计信息。点击【保存所有设置】按钮即可保存当前设置。<mul><mli>统计信息实时更新，北京时间0点时重置。</mli><mli><strong>支持输入框回车保存。</strong></mli><mli>单选框和多选框设置发生变化时会自动保存设置。</mli></mul>",
          ANCHOR_MOVETO_PRIZE_TAG: `分组的名称为<code>${anchorPrizeTagName}</code>。<mul><mli>在白名单内或天选功能运行前在默认/特别关注分组内的UP不会被移入该分组，即使后来出现在该分组里也不会被取关。</mli><mli><strong>请勿修改该分组名称。</strong></mli></mul>`,
          debugSwitch: "开启或关闭控制台日志(Chrome可通过<code>ctrl + shift + i</code>，再点击<code>Console</code>打开控制台)。<mul><mli>平时建议关闭，减少资源占用。</mli><mli>该设置只会影响日志(<code>console.log</code>)，不会影响报错(<code>console.error</code>)。</mli></mul>",
          UPDATE_TIP: "每次更新后第一次运行脚本时显示关于更新内容的弹窗。",
          ANCHOR_IGNORE_UPLOAD_MSG: "不显示获取到的附加信息。",
          MEDAL_DANMU_INTERVAL: "每两条弹幕间所等待的时间。<mh3>注意：</mh3><mul><mli>由于B站服务器限制，间隔时间必须大于等于1秒，否则弹幕发送会出错。</mli></mul>",
          ANCHOR_IGNORE_ROOM: "不检查和参加这些直播间的天选。<mul><mli>如果要填写多个直播间，每两个直播间号之间请用半角逗号<code>,</code>隔开。</mli></mul>",
          ANCHOR_LOTTERY: "参加B站直播间的天选时刻抽奖。<mul><mli>这些抽奖通常是有参与条件的，如关注主播，投喂礼物，粉丝勋章等级，主站等级，直播用户等级，上舰等。</mli><mli>根据目前B站的规则，参加天选的同时会在发起抽奖的直播间发送一条弹幕（即弹幕口令，参加天选后自动发送）。</mli><mli>脚本会根据用户设置来决定是否要忽略某个天选，以下是判断的先后顺序，一旦检测到不符合要求则忽略该天选并中断后续判断流程：<br><code>忽略直播间</code>，<code>忽略已参加天选</code>，<code>忽略过期天选</code>，<code>忽略关键字</code>，<code>忽略金额</code>，<code>忽略非现金抽奖的天选</code>，<code>忽略付费天选</code>，<code>忽略不满足参加条件（粉丝勋章，大航海，直播用户等级，主站等级）的天选</code>。</mli></mul>",
          SHARE: "并不会真的分享视频，通过调用特定api直接完成任务。",
          ANCHOR_MONEY_ONLY: "仅参加能识别到金额的天选。<mul><mli>由于部分天选的奖品名较特殊，可能会遗漏或误判一些天选。</mli></mul>",
          LIGHT_MEDALS: "根据点亮模式的不同，这些直播间的粉丝勋章将会被点亮或排除在外。<mul><mli>如果要填写多个房间，每两个房间号之间需用半角逗号<code>,</code>隔开。</mli></mul>",
          LIGHT_METHOD: "通过给拥有粉丝勋章的直播间送一个小心心来点亮熄灭的勋章。<mul><mli>白名单：只点亮这些房间的粉丝勋章。</mli><mli>黑名单：点亮除了这些房间以外的直播间的粉丝勋章。</mli><mli>如果你不想启用本功能，把【勋章点亮模式】设为白名单，然后在【自动点亮勋章房间号】中填<code>0</code>即可。</mli><mli>脚本会在运行自动送礼前点亮勋章。如果未启用自动送礼，请点击【立刻点亮勋章】按钮。</mli><mli>优先送出快过期的小心心。</mli></mul>",
          ANCHOR_IGNORE_PWDROOM: "部分直播间需输入密码后才能进入。勾选此选项后将忽略这些直播间的天选。",
          COIN2SILVER: "普通用户每天兑换上限<code>25</code>硬币，老爷或大会员每天兑换上限<code>50</code>硬币。<mul><mli><code>1</code>硬币 = <code>450</code>银瓜子（老爷或大会员<code>500</code>银瓜子）。</mli></mul>",
          SILVER2COIN: "每日直播用户都可以将部分银瓜子转化为硬币，每天仅一次机会。<mul><mli><code>700</code>银瓜子 = <code>1</code>硬币。</mul></mli>",
          windowToast: `右上角的提示信息。相对来说不是那么重要，所以不放在日志窗口里。<mul style = "line-height:1em;"><div class="link-toast info fixed"><span class="toast-text">普通消息</span></div><br><br><br><div class="link-toast success fixed"><span class="toast-text">成功</span></div><br><br><br><div class="link-toast error fixed"><span class="toast-text">发生错误</span></div></mul>`,
          GIFT_ALLOW_TYPE: "可以填写礼物的id或者礼物名称。<mul><mli>如果要填写多个，每两项之间请用半角逗号<code>,</code>隔开。</mli><mli>如果填写礼物名称，请确保所填写的名称与官方名称完全一致，否则将无法识别。</mli><mli>在脚本中打开控制台日志后，在控制台(Chrome可通过<code>ctrl + shift + i</code>，再点击<code>Console</code>打开控制台)中搜索<code>InitData: API.gift.gift_config</code>可以找到一个包含礼物名称和 id 的json。将data下的几项全部展开，再搜索礼物名即可找到 id 。</mli><mli>常用 id ：1: <code>辣条</code> 6: <code>亿圆</code> 30607: <code>小心心</code></mli></mul>",
          ANCHOR_TYPE_FOLLOWING: "搜寻已关注且开播的直播间的天选时刻。",
          CP_NOTICE: "<a href = 'https://cp.xuthus.cc/' target = '_blank'>酷推（点我注册）</a>，英文名「Cool Push」，QQ消息推送服务。使用前请先前往酷推官网完成注册，然后回到脚本界面填写Skey。<mul><mli>检测到实物/天选中奖后会发一条包含中奖具体信息的QQ私聊消息提醒你中奖了。</mli></mu;>",
          ServerTurbo_NOTICE: "<a href = 'https://sct.ftqq.com/' target = '_blank'>Server酱Turbo版（点我注册）</a>，是「<a href='http://sc.ftqq.com' target='_blank'>公众号版</a>」分离出来的一个版本，它为捐赠用户提供更多的推送渠道选择，除了方糖服务号（因为举报原因卡片不显示正文），它还包括了到微信官方提供的「<a href='https://mp.weixin.qq.com/debug/cgi-bin/sandbox?t=sandbox/login' target='_blank'>测试号</a>」、企业微信群、钉钉群、飞书群的推送。<mul><mli>检测到实物/天选中奖后会发一条包含中奖具体信息的微信推送提醒你中奖了。</mli></mul>",
          ANCHOR_TYPE_CUSTOM: "手动填写直播间列表，脚本会逐个检查这些直播间是否有天选时刻。<mul><mli>如果要填写多个直播间，每两个直播间号之间需用半角逗号<code>,</code>隔开。</mli></mul>",
          REMOVE_ELEMENT_anchor: "屏蔽天选时刻弹窗和礼物栏左侧的图标。<mh3>注意：</mh3><mul><mli>开启这一功能后会消耗相对较多的资源。</mli><mli>弹窗出现后（不可见）0-200ms的时间内浏览器窗口会无法滚动。</mli></mul><mh3>原理：</mh3><mul>通过修改css样式使弹窗不显示。但弹窗出现时浏览器窗口会被限制滚动，脚本检测到之后会将其关闭来解除滚动限制。</mul>",
          REMOVE_ELEMENT_anchor: "屏蔽天选时刻弹窗和礼物栏左侧的图标。<mh3>注意：</mh3><mul><mli>开启这一功能后会消耗相对较多的资源。</mli><mli>弹窗出现后（不可见）0-200ms的时间内浏览器窗口会无法滚动。</mli></mul><mh3>原理：</mh3><mul>通过修改css样式使弹窗不显示。但弹窗出现时浏览器窗口会被限制滚动，脚本检测到之后会将其关闭来解除滚动限制。</mul>",
          REMOVE_ELEMENT_pk: "屏蔽大乱斗弹窗和进度条。<mh3>注意：</mh3><mul><mli>开启这一功能后会消耗相对较多的资源。</mli><mli>弹窗出现后（不可见）0-200ms的时间内浏览器窗口会无法滚动。</mli></mul><mh3>原理：</mh3><mul>通过修改css样式使弹窗不显示。但弹窗出现时浏览器窗口会被限制滚动，脚本检测到之后会将其关闭来解除滚动限制。</mul>",
          banP2p: "禁止p2p上传（下载），减少上行带宽的占用。<mh3>原理：</mh3><mul>删除window下部分WebRTC方法，如<code>RTCPeerConnection</code>,<code>RTCDataChannel</code>。</mul><h3>说明：</h3><mul><mli>B站的<a href = 'https://baike.baidu.com/item/%E5%AF%B9%E7%AD%89%E7%BD%91%E7%BB%9C/5482934' target = '_blank'>P2P</a>上传速率大概在600KB/s左右，目的是为了让其他用户能更加流畅地观看直播。如果你的上行带宽较小建议禁用。</mli><mli>开启后控制台可能会出现大量报错如<code style='color:red;'>unsupported bilibili p2p</code>，<code style='color:red;'>Error: launch bili_p2p failed</code>，此类报错均为b站js的报错，无视即可。</mli></mul>",
          DANMU_MODIFY: "修改匹配到的当前直播间弹幕，改变弹幕的显示方式。<mh3>注意：</mh3><mul><mli>匹配弹幕和修改弹幕中的所有设置项都支持填写多个数据。若要填写多个，请用半角逗号<code>,</code>隔开。例：正则表达式 <code>/团【/,/P【/</code>。 </mli><mli>若填写了多个数据，脚本会把这些数据一一匹配，创建不同的规则。缺失的数据会自动向前对齐。<br>例：脚本设置为 匹配弹幕：<code>/团【/,/P【/</code> 发送者UID：<code>0</code> 弹幕池：<code>4,5</code> 颜色：<code>#FF0000,#9932CC</code> 大小：<code>1.2</code><br>此时有这么一条弹幕：<code>P【这个塔的伤害好高啊</code>，满足了第二条匹配规则<code>/P【/</code>。但由于该规则中缺少【大小】数据，则自动向前对齐，即大小被设为<code>1.2</code>。</mli></mli></mul><mh3>匹配弹幕</mh3>有【正则表达式】和【发送者UID】两种匹配方式，任意一项匹配成功则对弹幕进行修改。<mul><mli>正则表达式：即<a href='https://www.runoob.com/js/js-regexp.html' target='_blank'>JavaScript正则表达式</a>。格式为<code>/【正则】/【修饰符】（可选）</code>，如<code>/cards/i</code>。<br>如果填写的正则表达式能匹配弹幕内容则对弹幕进行修改。 </mli><mli>发送者UID：如果填写的UID中包含弹幕发送者的UID则对弹幕进行修改。</mli></mul><mh3>修改弹幕</mh3><mul><mli>弹幕池：修改弹幕所在的弹幕池，可以改变弹幕的显示位置。<br>弹幕池编号：<code>1</code>滚动，<code>4</code>底部，<code>5</code>顶部。如果填写其他数字则不会显示。</mli><mli>颜色：修改弹幕的颜色。<br>需填写所要修改颜色的<a href='http://tools.jb51.net/color/rgb_hex_color' target='_blank'>十六进制颜色码</a>，如<code style='color:#FF0000;'>#FF0000</code>。</mli><mli>大小：缩放弹幕到指定大小。<br>填<code>1.5</code>就是放大到原来的1.5倍，填<code>0.5</code>则是缩小到一半。</mli></mul>",
          blockLiveStream: `拦截直播流。开启本功能后将无法观看直播。<mh3>原理：</mh3><mul>劫持页面上的fetch，通过判断url是否含有<code>bilivideo</code>拦截所有直播流请求。</mul><mh3>注意：</mh3><mul><mli>开启本功能后控制台中会出现大量报错，如<code style='color:red;'>id 38: player core NetworkError, {"code":11001,"errInfo":{"url":"https://d1--cn-gotcha204.bilivideo.com/live-bvc/284219/live_50333369_2753084_4000/index.m3u8?expires=1618677399&len=0&oi=1700331273&pt=web&qn=0&trid=9cc4c8772c0543999b03360f513dd1fa&sigparams=cdn,expires,len,oi,pt,qn,trid&cdn=cn-gotcha04&sign=bd05d848ebf2c7a815e0242ac1477187&p2p_type=1&src=9&sl=4&sk=59b4112a8c653bb","info":"TypeError: Cannot read property 'then' of undefined"}}</code>，此类报错均为b站js的报错，无视即可。</mli></mul>`,
          blockliveDataUpdate: "拦截直播观看数据上报。<mh3>原理：</mh3><mul>劫持页面上的fetch和XMLHttpRequest，拦截所有url中含有<code>data.bilibili.com/gol/postweb</code>的fetch请求和url中含有<code>data.bilibili.com/log</code>的xhr请求。</mul><mh3>注意：</mh3><mul><mli>开启本功能后控制台中会出现大量警告，如<code style='color:rgb(255 131 0);'>jQuexry.Deferred exception: Cannot read property 'status' of undefined TypeError: Cannot read property 'status' of undefined</code>，此类报错均为b站js的报错，无视即可。 </mli></mul><mh3>说明：</mh3><mul><mli>根据观察，目前上报的数据有：p2p种类，直播画质，直播流编码方式，直播流地址，直播流名称，直播流协议，窗口大小，观看时长，请求花费时长， 请求成功/失败数量，通过p2p下载的有效直播流大小，通过p2p上传的直播流大小，当前直播间地址，当前时间戳等等。 </mli></mul>",
          WEAR_MEDAL_BEFORE_DANMU: "手动发送弹幕前自动佩戴当前房间的粉丝勋章再发弹幕。<mul><mli>如果没有当前直播间的粉丝勋章则不进行任何操作。</mli><mli>【一直自动佩戴】比较适合需要同时在多个直播间发弹幕的情况。如果只想在某一个直播间发弹幕勾选【仅在首次发弹幕时自动佩戴】即可。</mli><mli>佩戴成功后会把弹幕框左侧的粉丝牌替换为当前直播间的粉丝牌。</mli></mul>",
          ANCHOR_UPLOAD_ROOMLIST: "上传你所收集到的直播间列表至BLTH-server。<mul><mli>如果可以的话请在【天选时刻获取数据方式】中勾选至少两项，因为单纯地把你从BLTH-server获取到的直播间号再上传回去意义不大。</mli><mli>填写了正确的apikey的用户可以长期使用该功能，不填也能用但当服务器资源紧缺时会无法使用。apikey可以进q群找群主要，私聊群主说明来意并附上你的B站uid即可。</mli></mul>",
          ANCHOR_TYPE_SERVER: "<strong>BLTH-server</strong>是本脚本的服务端，用于推送天选时刻数据，提供脚本更新信息等。<mul><mli>填写了正确的apikey的用户可以长期使用该功能，不填也能用但当服务器资源紧缺时会无法使用。apikey可以进q群找群主要，私聊群主说明来意并附上你的B站uid即可。</mli><mli>该功能的原理为ajax轮询，与awpush不同。awpush使用webSocket实时推送天选数据。</mli></mul>",
          ANCHOR_AWPUSH: "<strong>awpush</strong>是搭建在<strong>BLTH-server</strong>的一个天选时刻数据推送系统。可以实现天选数据的收集和分发。<mh3>说明</mh3><mul><mli>这个功能仍处于测试阶段，不是很稳定。</mli><mli>填写了正确的apikey的用户可以长期使用该功能，不填也能用但当服务器资源紧缺时会无法使用。apikey可以进q群找群主要，私聊群主说明来意并附上你的B站uid即可。</mli><mli>启用这个功能后你的部分设置将会由服务端决定，如【天选时刻数据获取方式】，检查房间最大数量，请求间隔等。</mli><mli>该功能与【从BLTH-server获取天选时刻数据】不同。awpush使用webSocket实现实时推送，【从BLTH-server获取天选时刻数据】通过ajax轮询获取数据。</mli></mul><mh3>原理</mh3><mul>首先客户端连接awpush并进行身份验证。验证成功后服务端会下发一个任务，若失败则断开连接。 接着客户端执行任务并上报所检索到的天选数据。同时服务端会实时推送收到的天选数据。</mul>",
          ANCHOR_AUTO_BUY_LV1_MEDAL: "检测到有1级粉丝牌要求的天选后，如果没有该勋章，则自动用20硬币购买再参加。",
          REMOVE_ELEMENT_followSideBar: "开启本功能后会导致【实验室】按钮点击后无法出现弹窗。",
          ANCHOR_IGNORE_AREA: "忽略指定分区，即不检索这些分区的天选。<mul><mli>请正确填写所要忽略分区的名称，如:<code>娱乐,网游,手游,电台,单机游戏,虚拟主播,生活,学习,大事件</code>。</mli><mli>如果要填写多个分区，每两项之间请用半角逗号<code>,</code>隔开。</mli></mul>"
        };
        const openMainWindow = () => {
          let settingTableoffset = $('.live-player-mounter').offset(),
            settingTableHeight = $('.live-player-mounter').height();
          mainIndex = layer.open({
            type: 1,
            title: false,
            offset: [String(settingTableoffset.top - getScrollPosition().y) + 'px', String(settingTableoffset.left - getScrollPosition().x) + 'px'],
            closeBtn: 0,
            shade: 0,
            zIndex: 1000,
            fixed: false,
            area: [, String(settingTableHeight) + 'px'], // 宽高
            resize: false,
            content: html,
            success: () => {
              // layer窗口中的总div
              let myDiv = $('#allsettings');
              // 整个layer窗口
              layerUiMain = myDiv.parent().parent();
              // 显示顶部统计数据
              $('#giftCount .anchor .statNum').text(MY_API.GIFT_COUNT.ANCHOR_COUNT); // 天选
              $('#giftCount .material .statNum').text(MY_API.GIFT_COUNT.MATERIAL_COUNT); // 实物
              // 显示忽略关键字等统计数量
              myDiv.find('div[data-toggle="MATERIAL_LOTTERY_IGNORE_QUESTIONABLE_LOTTERY"] label.str').text(String(MY_API.CONFIG.QUESTIONABLE_LOTTERY.length) + '个');
              myDiv.find('div[data-toggle="ANCHOR_IGNORE_BLACKLIST"] label.str').text(String(MY_API.CONFIG.ANCHOR_BLACKLIST_WORD.length) + '个');
              myDiv.find('div[data-toggle="ANCHOR_IGNORE_ROOM"] label.str').text(String(MY_API.CONFIG.ANCHOR_IGNORE_ROOMLIST.length) + '个');
              // 显示输入框的值
              myDiv.find('div[data-toggle="DANMU_MODIFY_SIZE"] .str').val(MY_API.CONFIG.DANMU_MODIFY_SIZE.toString());
              myDiv.find('div[data-toggle="DANMU_MODIFY_COLOR"] .str').val(MY_API.CONFIG.DANMU_MODIFY_COLOR.toString());
              myDiv.find('div[data-toggle="DANMU_MODIFY_POOL"] .str').val(MY_API.CONFIG.DANMU_MODIFY_POOL.toString());
              myDiv.find('div[data-toggle="DANMU_MODIFY_REGEX"] .str').val(MY_API.CONFIG.DANMU_MODIFY_REGEX.toString());
              myDiv.find('div[data-toggle="DANMU_MODIFY_UID"] .str').val(MY_API.CONFIG.DANMU_MODIFY_UID.toString());
              myDiv.find('div[data-toggle="ANCHOR_FANS_CHECK"] .num').val(MY_API.CONFIG.ANCHOR_FANS_LEAST.toString());
              myDiv.find('div[data-toggle="ANCHOR_GOLD_JOIN_TIMES"] .num').val(MY_API.CONFIG.ANCHOR_GOLD_JOIN_TIMES.toString());
              myDiv.find('div[data-toggle="GIFT_ALLOW_TYPE"] .str').val(MY_API.CONFIG.GIFT_ALLOW_TYPE.toString());
              myDiv.find('div[data-toggle="COIN2SILVER"] .coin_number').val(parseInt(MY_API.CONFIG.COIN2SILVER_NUM).toString());
              myDiv.find('div[data-toggle="LIGHT_MEDALS"] .num').val(MY_API.CONFIG.LIGHT_MEDALS.toString());
              myDiv.find('div[data-toggle="MEDAL_DANMU_INTERVAL"] .num').val(parseFloat(MY_API.CONFIG.MEDAL_DANMU_INTERVAL).toString());
              myDiv.find('div[data-toggle="ANCHOR_IGNORE_MONEY"] .num').val(parseFloat(MY_API.CONFIG.ANCHOR_IGNORE_MONEY).toString());
              myDiv.find('div[data-toggle="ANCHOR_MAXLIVEROOM_SAVE"] .roomNum').val(parseInt(MY_API.CONFIG.ANCHOR_MAXLIVEROOM_SAVE).toString());
              myDiv.find('div[data-toggle="ANCHOR_UPLOAD_DATA"] .num').val(MY_API.CONFIG.ANCHOR_UPLOAD_DATA_INTERVAL.toString());
              myDiv.find('div[data-toggle="ANCHOR_TYPE_LIVEROOM"] .num').val(MY_API.CONFIG.ANCHOR_GETDATA_ROOM.toString());
              myDiv.find('div[data-toggle="ANCHOR_INTERVAL"] .num').val(parseInt(MY_API.CONFIG.ANCHOR_INTERVAL).toString());
              myDiv.find('div[data-toggle="ANCHOR_NEED_GOLD"] .num').val(parseInt(MY_API.CONFIG.ANCHOR_NEED_GOLD).toString());
              myDiv.find('div[data-toggle="ANCHOR_MAXROOM"] .roomNum').val(parseInt(MY_API.CONFIG.ANCHOR_MAXROOM).toString());
              myDiv.find('div[data-toggle="ANCHOR_CHECK_INTERVAL"] .num').val(parseFloat(MY_API.CONFIG.ANCHOR_CHECK_INTERVAL).toString());
              myDiv.find('div[data-toggle="MATERIAL_LOTTERY_REM"] .num').val(parseInt(MY_API.CONFIG.MATERIAL_LOTTERY_REM).toString());
              myDiv.find('div[data-toggle="MATERIAL_LOTTERY_CHECK_INTERVAL"] .num').val(parseInt(MY_API.CONFIG.MATERIAL_LOTTERY_CHECK_INTERVAL).toString());
              myDiv.find('div[data-toggle="AUTO_DANMU_SETTINGS"] .Time').val(MY_API.CONFIG.DANMU_INTERVAL_TIME.toString());
              myDiv.find('div[data-toggle="AUTO_DANMU_SETTINGS"] .Roomid').val(MY_API.CONFIG.DANMU_ROOMID.toString());
              myDiv.find('div[data-toggle="AUTO_DANMU_SETTINGS"] .Danmu').val(MY_API.CONFIG.DANMU_CONTENT.toString());
              myDiv.find('div[data-toggle="GIFT_INTERVAL"] .num').val(parseInt(MY_API.CONFIG.GIFT_INTERVAL).toString());
              myDiv.find('div[data-toggle="STORM_MAX_COUNT"] .num').val(parseInt(MY_API.CONFIG.STORM_MAX_COUNT).toString());
              myDiv.find('div[data-toggle="STORM_ONE_LIMIT"] .num').val(parseInt(MY_API.CONFIG.STORM_ONE_LIMIT).toString());
              myDiv.find('div[data-toggle="STORM_QUEUE_SIZE"] .num').val(parseInt(MY_API.CONFIG.STORM_QUEUE_SIZE).toString());
              myDiv.find('div[data-toggle="SPARE_GIFT_ROOM"] .num').val(MY_API.CONFIG.SPARE_GIFT_ROOM.toString());
              myDiv.find('div[data-toggle="TIME_RELOAD"] .delay-seconds').val(parseInt(MY_API.CONFIG.TIME_RELOAD_MINUTE).toString());
              myDiv.find('div[data-toggle="RANDOM_SKIP"] .per').val((parseFloat(MY_API.CONFIG.RANDOM_SKIP)).toString());
              myDiv.find('div[data-toggle="RANDOM_SEND_DANMU"] .per').val((parseFloat(MY_API.CONFIG.RANDOM_SEND_DANMU)).toString());
              myDiv.find('div[data-toggle="COIN"] .coin_number').val(parseInt(MY_API.CONFIG.COIN_NUMBER).toString());
              myDiv.find('div[data-toggle="COIN_UID"] .num').val(MY_API.CONFIG.COIN_UID.toString());
              myDiv.find('div[data-toggle="RANDOM_DELAY"] .RND_DELAY_START').val(parseFloat(MY_API.CONFIG.RND_DELAY_START).toString());
              myDiv.find('div[data-toggle="RANDOM_DELAY"] .RND_DELAY_END').val(parseFloat(MY_API.CONFIG.RND_DELAY_END).toString());
              myDiv.find('div[data-toggle="TIME_AREA_DISABLE"] .startHour').val(parseInt(MY_API.CONFIG.TIME_AREA_START_H0UR).toString());
              myDiv.find('div[data-toggle="TIME_AREA_DISABLE"] .endHour').val(parseInt(MY_API.CONFIG.TIME_AREA_END_H0UR).toString());
              myDiv.find('div[data-toggle="TIME_AREA_DISABLE"] .startMinute').val(parseInt(MY_API.CONFIG.TIME_AREA_START_MINUTE).toString());
              myDiv.find('div[data-toggle="TIME_AREA_DISABLE"] .endMinute').val(parseInt(MY_API.CONFIG.TIME_AREA_END_MINUTE).toString());
              myDiv.find('div[data-toggle="CHECK_HOUR_ROOM"] .num').val(parseInt(MY_API.CONFIG.CHECK_HOUR_ROOM_INTERVAL).toString());
              myDiv.find('div[data-toggle="AUTO_GIFT_ROOMID"] .num').val((MY_API.CONFIG.AUTO_GIFT_ROOMID).toString());
              myDiv.find('div[data-toggle="GIFT_SEND_TIME"] .Hour').val(MY_API.CONFIG.GIFT_SEND_HOUR.toString());
              myDiv.find('div[data-toggle="GIFT_SEND_TIME"] .Minute').val(MY_API.CONFIG.GIFT_SEND_MINUTE.toString());
              myDiv.find('div[data-toggle="GIFT_LIMIT"] .num').val(parseInt(MY_API.CONFIG.GIFT_LIMIT).toString());
              myDiv.find('div[data-toggle="BUY_MEDAL"] .num').val(Live_info.room_id);
              // 监听导入文件按钮
              const inputConfig = $("#BLTH_config_file");
              inputConfig.on("change", importConfig);
              // 禁止选中
              myDiv[0].onselectstart = function () {
                return false;
              }
              // 绑定按钮
              myDiv.find('button[data-action="save"]').click(() => {
                // 保存按钮
                saveAction(myDiv);
              });
              myDiv.find('button[data-action="exportConfig"]').click(() => {
                // 导出配置按钮
                exportConfig(MY_API.CONFIG, SP_CONFIG, GM_getValue("AnchorFollowingList") || [])
                layer.msg('配置已导出', {
                  time: 2500,
                });
              });
              myDiv.find('button[data-action="importConfig"]').click(() => {
                // 导入配置按钮
                readConfigArray[1] = $.Deferred();
                inputConfig.click();
                readConfigArray[1].then(() => {
                  let json = readConfigArray[0];
                  MYDEBUG('readConfigArray 文件读取结果：', readConfigArray[0]);
                  MY_API.CONFIG = json.MY_API_CONFIG;
                  MY_API.saveConfig(false);
                  SP_CONFIG = json.SP_CONFIG;
                  saveSpConfig();
                  if (json.AnchorFollowingList) {
                    let followingList = GM_getValue("AnchorFollowingList") || [];
                    GM_setValue("AnchorFollowingList", [...new Set([...followingList, ...json.AnchorFollowingList])]);
                  }
                  layer.msg('配置导入成功，3秒后将自动刷新页面', {
                    time: 3000,
                    icon: 1
                  });
                  setTimeout(() => {
                    W.location.reload()
                  }, 3000);
                })
              });
              myDiv.find('div[data-toggle="BUY_MEDAL"] [data-action="buy_medal"]').click(function () {
                // 购买勋章
                const room_id = parseInt(myDiv.find('div[data-toggle="BUY_MEDAL"] .num').val());
                MY_API.buyFanMedal(room_id);
              });

              myDiv.find('button[data-action="reset"]').click(() => {
                // 重置按钮
                const index = layer.confirm(`<div style = "text-align:center">是否重置所有设置及缓存为默认？</div>`, {
                  title: '重置所有为默认',
                  btn: ['是', '否']
                }, function () {
                  layer.close(index);
                  MY_API.setDefaults();
                }, function () {
                  layer.msg('已取消', { time: 2000 });
                })
              });
              myDiv.find('button[data-action="redoAllTasks"]').click(() => {
                // 重置每日任务状态
                MY_API.ReDoAllTasks();
              });
              myDiv.find('button[data-action="about"]').click(() => {
                // 关于
                layerOpenAbout();
              });
              myDiv.find('button[data-action="lightMedalNow"]').click(() => {
                // 立刻点亮勋章
                LIGHT_MEDAL_NOW = true;
                MY_API.Gift.run();
              });
              myDiv.find('button[data-action="test_PP"]').click(() => {
                // 推送加推送测试
                const data = {
                  token: MY_API.CONFIG.PP_token,
                  title: `${GM_info.script.name} 推送测试`,
                  content: `<div style="border: 1px solid rgb(223, 187, 0);color: rgb(145, 123, 0);background: none 0% 0% repeat scroll rgb(255, 215, 0, 30%);text-align: center;border-radius: 5%;padding: 15px 20px;"><h3>天选时刻中奖</h3><br /><h4>中奖账号id：测试</h4><br /><h4>房间号roomid=测试</h4><br /><h4>主播uid=测试</h4><br /><h4>抽奖id=测试</h4><br /><h4>获得奖品：</h4><br /><h3>测试</h3><br /><h4>此条为测试消息</h4></div>`
                };
                return PP_sendMsg(data).then((re) => {
                  MYDEBUG('PP_sendMsg test response', re);
                  if (re.body.code == 200) {
                    window.toast('[天选时刻] 推送加推送测试消息发送成功', 'success');
                  } else {
                    window.toast(`[天选时刻] 推送加推送测试消息发送失败 ${re.body.msg}`, 'error')
                  }
                  return $.Deferred().resolve();
                })
              });
              myDiv.find('button[data-action="test_ServerTurbo"]').click(() => {
                // Server酱·Turbo版推送测试
                return ServerTurbo_sendMsg(MY_API.CONFIG.ServerTurbo_SendKey,
                  `【${GM_info.script.name}】推送测试`,
                  `## 实物抽奖中奖  \n  \n## 中奖账号id：测试  \n  \n## 测试  \n  \n## aid = 测试  \n  \n## 第测试轮  \n  \n## 获得奖品：  \n  \n# 测试  \n  \n## 此条为测试消息`
                ).then((re) => {
                  MYDEBUG('ServerTurbo_sendMsg response', re);
                  if (re.body && re.body.code === 0) {
                    window.toast('[实物抽奖] Server酱Turbo版推送测试消息发送成功', 'success');
                  } else {
                    window.toast(`[实物抽奖] Server酱Turbo版推送测试消息发送失败 ${re.response.status}`, 'error');
                  }
                  return $.Deferred().resolve();
                });
              });
              myDiv.find('button[data-action="test_CP"]').click(() => {
                // 酷推推送测试
                return CP_sendMsg(MY_API.CONFIG.CP_Skey,
                  `【${GM_info.script.name}】推送测试\n中奖账号id：测试\n房间号roomid = 测试\n主播uid = 测试\n抽奖id = 测试\n获得奖品：\n测试\n此条为测试消息`
                ).then((re) => {
                  MYDEBUG('CP_sendMsg test response', re);
                  if (re.body.code === 200) {
                    window.toast('[天选时刻] 酷推推送测试消息发送成功', 'success');
                  } else {
                    window.toast(`[天选时刻] 酷推推送测试消息发送失败 ${re.body.code}`, 'error')
                  }
                  return $.Deferred().resolve();
                });
              });
              myDiv.find('button[data-action="edit_ANCHOR_SERVER_APIKEY"]').click(() => {
                // 编辑 BLTH-server apikey
                layer.prompt({
                  formType: 0,
                  value: String(MY_API.CONFIG.ANCHOR_SERVER_APIKEY[Live_info.uid] || ""),
                  title: '请输入 BLTH-server apikey',
                  btn: ['保存', '取消'],
                },
                  function (value, index) {
                    MY_API.CONFIG.ANCHOR_SERVER_APIKEY[Live_info.uid] = value;
                    MY_API.saveConfig(false);
                    layer.msg('BLTH-server apikey 保存成功', {
                      time: 2500,
                      icon: 1
                    });
                    layer.close(index);
                  });
              });
              myDiv.find('button[data-action="edit_ANCHOR_UPLOAD_MSG"]').click(() => {
                // 编辑天选附加信息
                layer.prompt({
                  formType: 2,
                  value: String(MY_API.CONFIG.ANCHOR_UPLOAD_MSG_CONTENT),
                  title: '请输入上传天选信息时的附加信息',
                  btn: ['保存', '留空', '取消'],
                  btn2: function () {
                    MY_API.CONFIG.ANCHOR_UPLOAD_MSG_CONTENT = "";
                    MY_API.saveConfig(false);
                    layer.msg('附加信息已被设为空字符串', {
                      time: 2500,
                      icon: 1
                    });
                  }
                },
                  function (value, index) {
                    MY_API.CONFIG.ANCHOR_UPLOAD_MSG_CONTENT = value;
                    MY_API.saveConfig(false);
                    layer.msg('附加信息保存成功', {
                      time: 2500,
                      icon: 1
                    });
                    layer.close(index);
                  });
              });
              myDiv.find('button[data-action="edit_GIFT_SEND_ROOM"]').click(() => {
                // 编辑自动送礼黑白名单策略
                layer.prompt({
                  formType: 2,
                  value: String(MY_API.CONFIG.GIFT_SEND_ROOM),
                  maxlength: Number.MAX_SAFE_INTEGER,
                  title: '请输入自动送礼房间列表',
                  btn: ['保存', '取消']
                },
                  function (value, index) {
                    let valArray = value.split(",");
                    valArray = [...new Set(valArray)];
                    for (let i = 0; i < valArray.length; i++) {
                      if (!valArray[i]) valArray.splice(i, 1);
                    };
                    MY_API.CONFIG.GIFT_SEND_ROOM = [...valArray];
                    MY_API.saveConfig(false);
                    layer.msg('自动送礼房间列表保存成功', {
                      time: 2500,
                      icon: 1
                    });
                    layer.close(index);
                  });
              });
              myDiv.find('button[data-action="edit_ANCHOR_IGNORE_ROOMLIST"]').click(() => {
                // 编辑忽略直播间
                layer.prompt({
                  formType: 2,
                  value: String(MY_API.CONFIG.ANCHOR_IGNORE_ROOMLIST),
                  maxlength: Number.MAX_SAFE_INTEGER,
                  title: '请输入天选时刻忽略直播间',
                  btn: ['保存', '取消']
                },
                  function (value, index) {
                    let valArray = value.split(",");
                    valArray = [...new Set(valArray)];
                    for (let i = 0; i < valArray.length; i++) {
                      if (!valArray[i]) valArray.splice(i, 1);
                    };
                    MY_API.CONFIG.ANCHOR_IGNORE_ROOMLIST = [...valArray];
                    MY_API.saveConfig(false);
                    layer.msg('天选时刻忽略直播间保存成功', {
                      time: 2500,
                      icon: 1
                    });
                    myDiv.find('div[data-toggle="ANCHOR_IGNORE_ROOM"] label.str').html(MY_API.CONFIG.ANCHOR_IGNORE_ROOMLIST.length + '个')
                    layer.close(index);
                  });
              });
              myDiv.find('button[data-action="edit_lightMedalList"]').click(() => {
                // 编辑打卡弹幕房间列表
                layer.prompt({
                  formType: 2,
                  value: String(MY_API.CONFIG.MEDAL_DANMU_ROOM),
                  maxlength: Number.MAX_SAFE_INTEGER,
                  title: '请输入粉丝勋章打卡弹幕房间列表',
                  btn: ['保存', '取消']
                },
                  function (value, index) {
                    let valArray = value.split(",");
                    valArray = [...new Set(valArray)];
                    for (let i = 0; i < valArray.length; i++) {
                      if (!valArray[i]) valArray.splice(i, 1);
                    };
                    MY_API.CONFIG.MEDAL_DANMU_ROOM = [...valArray];
                    MY_API.saveConfig(false);
                    layer.msg('粉丝勋章打卡弹幕房间列表保存成功', {
                      time: 2500,
                      icon: 1
                    });
                    layer.close(index);
                  });
              });
              myDiv.find('button[data-action="edit_ANCHOR_IGNORE_AREA"]').click(() => {
                // 编辑忽略分区
                layer.prompt({
                  formType: 2,
                  value: String(MY_API.CONFIG.ANCHOR_IGNORE_AREA_LIST),
                  title: '请输入所要忽略分区的名称',
                  btn: ['保存', '取消']
                },
                  function (value, index) {
                    let valArray = value.split(",");
                    for (let i = 0; i < valArray.length; i++) {
                      if (!valArray[i]) valArray.splice(i, 1);
                    };
                    MY_API.CONFIG.ANCHOR_IGNORE_AREA_LIST = [...valArray];
                    MY_API.saveConfig(false);
                    layer.msg('天选时刻忽略分区保存成功', {
                      time: 2500,
                      icon: 1
                    });
                    layer.close(index);
                  });
              })
              myDiv.find('button[data-action="edit_ANCHOR_DANMU_CONTENT"]').click(() => {
                // 编辑天选弹幕内容
                layer.prompt({
                  formType: 2,
                  value: String(MY_API.CONFIG.ANCHOR_DANMU_CONTENT),
                  title: '请输入天选时刻中奖后弹幕',
                  btn: ['保存', '取消']
                },
                  function (value, index) {
                    let valArray = value.split(",");
                    for (let i = 0; i < valArray.length; i++) {
                      if (!valArray[i]) valArray.splice(i, 1);
                    };
                    MY_API.CONFIG.ANCHOR_DANMU_CONTENT = [...valArray];
                    MY_API.saveConfig(false);
                    layer.msg('天选时刻中奖后弹幕保存成功', {
                      time: 2500,
                      icon: 1
                    });
                    layer.close(index);
                  });
              });
              myDiv.find('button[data-action="edit_medalDanmu"]').click(() => {
                // 编辑打卡弹幕内容
                layer.prompt({
                  formType: 2,
                  value: String(MY_API.CONFIG.MEDAL_DANMU_CONTENT),
                  maxlength: Number.MAX_SAFE_INTEGER,
                  title: '请输入粉丝勋章打卡弹幕',
                  btn: ['保存', '取消']
                },
                  function (value, index) {
                    let valArray = value.split(",");
                    for (let i = 0; i < valArray.length; i++) {
                      if (!valArray[i]) valArray.splice(i, 1);
                    };
                    MY_API.CONFIG.MEDAL_DANMU_CONTENT = [...valArray];
                    MY_API.saveConfig(false);
                    layer.msg('粉丝勋章打卡弹幕保存成功', {
                      time: 2500,
                      icon: 1
                    });
                    layer.close(index);
                  });
              });
              myDiv.find('button[data-action="edit_QUESTIONABLE_LOTTERY"]').click(() => {
                // 编辑实物忽略关键字
                layer.prompt({
                  formType: 2,
                  value: String(MY_API.CONFIG.QUESTIONABLE_LOTTERY),
                  maxlength: Number.MAX_SAFE_INTEGER,
                  title: '请输入实物抽奖忽略关键字',
                  btn: ['保存', '取消']
                },
                  function (value, index) {
                    let valArray = value.split(",");
                    valArray = [...new Set(valArray)];
                    for (let i = 0; i < valArray.length; i++) {
                      if (!valArray[i]) valArray.splice(i, 1);
                    };
                    MY_API.CONFIG.QUESTIONABLE_LOTTERY = [...valArray];
                    MY_API.saveConfig(false);
                    layer.msg('实物抽奖忽略关键字保存成功', {
                      time: 2500,
                      icon: 1
                    });
                    myDiv.find('div[data-toggle="MATERIAL_LOTTERY_IGNORE_QUESTIONABLE_LOTTERY"] label.str').html(MY_API.CONFIG.QUESTIONABLE_LOTTERY.length + '个')
                    layer.close(index);
                  });
              });
              myDiv.find('button[data-action="edit_ANCHOR_BLACKLIST_WORD"]').click(() => {
                // 编辑天选忽略关键字
                layer.prompt({
                  formType: 2,
                  value: String(MY_API.CONFIG.ANCHOR_BLACKLIST_WORD),
                  maxlength: Number.MAX_SAFE_INTEGER,
                  title: '请输入天选时刻忽略关键字',
                  btn: ['保存', '取消']
                },
                  function (value, index) {
                    let valArray = value.split(",");
                    valArray = [...new Set(valArray)];
                    for (let i = 0; i < valArray.length; i++) {
                      if (valArray[i] === '') valArray.splice(i, 1);
                    };
                    MY_API.CONFIG.ANCHOR_BLACKLIST_WORD = [...valArray];
                    MY_API.saveConfig(false);
                    layer.msg('天选时刻忽略关键字保存成功', {
                      time: 2500,
                      icon: 1
                    });
                    myDiv.find('div[data-toggle="ANCHOR_IGNORE_BLACKLIST"] label.str').html(MY_API.CONFIG.ANCHOR_BLACKLIST_WORD.length + '个')
                    layer.close(index);
                  });
              });
              myDiv.find('button[data-action="addCloud_ANCHOR_BLACKLIST_WORD"]').click(() => {
                // 加入天选云端忽略关键字
                const cloudWords = noticeJson.anchor_blacklist_word || [],
                  localWords = [...MY_API.CONFIG.ANCHOR_BLACKLIST_WORD];
                let newWords = [];
                for (const i of cloudWords) {
                  if (findVal(localWords, i) === -1) newWords.push(i);
                }
                const wordsLength = newWords.length;
                if (wordsLength > 0) {
                  layer.confirm(`<div style = "text-align:center">将要被添加的关键字有</div><div style = "font-weight:bold">${String(newWords)}<code>（共${wordsLength}个）</code></div><div style = "text-align:center">是否添加这些关键字到本地关键字？</div>`, {
                    title: '添加天选时刻云端关键字',
                    btn: ['添加', '取消']
                  },
                    function (index) {
                      MY_API.CONFIG.ANCHOR_BLACKLIST_WORD = [...new Set([...localWords, ...newWords])];
                      MY_API.saveConfig(false);
                      layer.msg('已添加天选时刻云端关键字', {
                        time: 2500,
                        icon: 1
                      });
                      myDiv.find('div[data-toggle="ANCHOR_IGNORE_BLACKLIST"] label.str').html(MY_API.CONFIG.ANCHOR_BLACKLIST_WORD.length + '个')
                      layer.close(index);
                    });
                } else {
                  layer.msg('本地关键字已包含所有云端关键字', {
                    time: 2500
                  });
                }
              });
              myDiv.find('button[data-action="addCloud_ANCHOR_IGNORE_ROOMLIST"]').click(() => {
                // 加入天选云端忽略直播间
                const cloudRooms = noticeJson.anchor_ignore_roomlist || [],
                  localRooms = [...MY_API.CONFIG.ANCHOR_IGNORE_ROOMLIST];
                let newRooms = [];
                for (const i of cloudRooms) {
                  if (findVal(localRooms, i) === -1) newRooms.push(i);
                }
                const roomsLength = newRooms.length;
                if (roomsLength > 0) {
                  layer.confirm(`<div style = "text-align:center">将要被添加的直播间有</div><div style = "font-weight:bold">${String(newRooms)}<code>（共${roomsLength}个）</code></div><div style = "text-align:center">是否添加这些直播间到本地忽略直播间？</div>`, {
                    title: '添加天选时刻云端忽略直播间',
                    btn: ['添加', '取消']
                  },
                    function (index) {
                      MY_API.CONFIG.ANCHOR_IGNORE_ROOMLIST = [...new Set([...localRooms, ...newRooms])];
                      MY_API.saveConfig(false);
                      layer.msg('已添加天选时刻云端忽略直播间', {
                        time: 2500,
                        icon: 1
                      });
                      myDiv.find('div[data-toggle="ANCHOR_IGNORE_ROOM"] label.str').html(MY_API.CONFIG.ANCHOR_IGNORE_ROOMLIST.length + '个');
                      layer.close(index);
                    });
                } else {
                  layer.msg('本地忽略直播间已包含所有云端忽略直播间', {
                    time: 2500
                  });
                }
              });
              myDiv.find('button[data-action="edit_ANCHOR_LETTER_CONTENT"]').click(() => {
                // 编辑天选私信
                layer.prompt({
                  formType: 2,
                  value: MY_API.CONFIG.ANCHOR_LETTER_CONTENT,
                  title: '请输入天选时刻中奖后发送私信内容',
                  btn: ['保存', '取消']
                },
                  function (value, index) {
                    let val = value;
                    if (!val) val = 'UP我中天选了，怎么领奖'
                    MY_API.CONFIG.ANCHOR_LETTER_CONTENT = val;
                    MY_API.saveConfig(false);
                    layer.msg('天选时刻私信内容保存成功', {
                      time: 2500,
                      icon: 1
                    });
                    layer.close(index);
                  });
              });
              myDiv.find('button[data-action="mainSiteTasks"]').click(() => {
                // 再次执行主站任务
                if (mainSiteTasksBtnClickable) {
                  mainSiteTasksBtnClickable = false;
                  setTimeout(() => mainSiteTasksBtnClickable = true, 2000);
                  MY_API.DailyReward.run(true);
                }
              });
              myDiv.find('button[data-action="edit_PP_SCKEY"]').click(() => {
                // 编辑推送加 token
                layer.prompt({
                  formType: 0,
                  value: MY_API.CONFIG.PP_token,
                  title: '请输入推送加token',
                  btn: ['保存', '取消']
                },
                  function (value, index) {
                    MY_API.CONFIG.PP_token = value;
                    MY_API.saveConfig(false);
                    layer.msg('推送加token保存成功', {
                      time: 2500,
                      icon: 1
                    });
                    layer.close(index);
                  }
                )
              });
              myDiv.find('button[data-action="edit_CP_Skey"]').click(() => {
                // 编辑酷推Skey
                layer.prompt({
                  formType: 0,
                  value: MY_API.CONFIG.CP_Skey,
                  title: '请输入酷推Skey',
                  btn: ['保存', '取消']
                },
                  function (value, index) {
                    MY_API.CONFIG.CP_Skey = value;
                    MY_API.saveConfig(false);
                    layer.msg('酷推Skey保存成功', {
                      time: 2500,
                      icon: 1
                    });
                    layer.close(index);
                  }
                )
              });
              myDiv.find('button[data-action="edit_ServerTurbo_SendKey"]').click(() => {
                // 编辑Server酱·Turbo版SendKey
                layer.prompt({
                  formType: 0,
                  value: MY_API.CONFIG.ServerTurbo_SendKey,
                  title: '请输入Server酱·Turbo版SendKey',
                  btn: ['保存', '取消']
                },
                  function (value, index) {
                    MY_API.CONFIG.ServerTurbo_SendKey = value;
                    MY_API.saveConfig(false);
                    layer.msg('Server酱·Turbo版SendKey保存成功', {
                      time: 2500,
                      icon: 1
                    });
                    layer.close(index);
                  }
                )
              });
              myDiv.find('button[data-action="edit_ANCHOR_CUSTOM_ROOMLIST"]').click(() => {
                // 自定义直播间列表
                layer.prompt({
                  formType: 2,
                  value: MY_API.CONFIG.ANCHOR_CUSTOM_ROOMLIST,
                  maxlength: Number.MAX_SAFE_INTEGER,
                  title: '天选时刻自定义直播间列表',
                  btn: ['保存', '取消']
                },
                  function (value, index) {
                    let val = value;
                    if (!val) { val = "" }
                    else {
                      val = val.split(",");
                      val = [...new Set(val)];
                      for (let i = 0; i < val.length; i++) {
                        if (!val[i]) val.splice(i, 1);
                      }
                    }
                    MY_API.CONFIG.ANCHOR_CUSTOM_ROOMLIST = val;
                    MY_API.saveConfig(false);
                    layer.msg('天选时刻自定义直播间列表保存成功', {
                      time: 2500,
                      icon: 1
                    });
                    layer.close(index);
                  });
              });
              myDiv.find('button[data-action="editWhiteList"]').click(() => {
                // 编辑白名单
                const list = GM_getValue(`AnchorFollowingList`) || "";
                layer.prompt({
                  formType: 2,
                  maxlength: Number.MAX_SAFE_INTEGER,
                  value: String(list),
                  title: '天选时刻UID白名单',
                  btn: ['保存', '取消']
                },
                  function (value, index) {
                    let val = value;
                    if (!val) { val = "" }
                    else {
                      val = val.split(",");
                      val = [...new Set(val)];
                      for (let i = 0; i < val.length; i++) {
                        if (!val[i]) val.splice(i, 1);
                      }
                    }
                    GM_setValue(`AnchorFollowingList`, val);
                    layer.msg('天选时刻UID白名单保存成功', {
                      time: 2500,
                      icon: 1
                    });
                    layer.close(index);
                  });
              });
              myDiv.find('button[data-action="saveFollowingList"]').click(() => {
                if (getFollowBtnClickable) {
                  // 保存当前关注列表为白名单
                  getFollowBtnClickable = false;
                  window.toast('[ 保存当前关注列表为白名单 ] 开始获取关注列表');
                  return MY_API.AnchorLottery.get_attention_list(Live_info.uid);
                }
              });
              myDiv.find('button[data-action="removeAnchorPrizeInTag"]').click(() => {
                // 取关中奖分组内的UP
                if (unFollowBtnClickable) {
                  layer.confirm(`是否取关在【${anchorPrizeTagName}】分组的UP主？<mul><mli>注：不建议取关该分组内UP。</mli></mul>`, {
                    title: '取关不在分组内的UP主',
                    btn: ['是', '否']
                  }, function () {
                    unFollowBtnClickable = false;
                    layer.msg('开始取关', {
                      time: 2000,
                    });
                    return MY_API.AnchorLottery.getTag(anchorPrizeTagName, true).then(() => MY_API.AnchorLottery.delAnchorFollowing(3));
                  }, function () {
                    layer.msg('已取消', {
                      time: 2000
                    });
                  })
                }
              });
              myDiv.find('button[data-action="removeAnchorFollowingInTag"]').click(() => {
                // 取关关注分组内的UP
                if (unFollowBtnClickable) {
                  layer.confirm(`是否取关在【${anchorFollowTagName}】分组的UP主？`, {
                    title: '取关不在分组内的UP主',
                    btn: ['是', '否']
                  }, function () {
                    unFollowBtnClickable = false;
                    layer.msg('开始取关', {
                      time: 2000,
                    });
                    return MY_API.AnchorLottery.getTag(anchorFollowTagName, true).then(() => MY_API.AnchorLottery.delAnchorFollowing(2));
                  }, function () {
                    layer.msg('已取消', {
                      time: 2000
                    });
                  })
                }
              });
              myDiv.find('button[data-action="removeAnchorFollowing"]').click(() => {
                // 取关不在白名单内的UP主
                if (unFollowBtnClickable) {
                  layer.confirm(`是否取关不在白名单内的UP主？`, {
                    title: '取关不在白名单内的UP主',
                    btn: ['是', '否']
                  }, function () {
                    unFollowBtnClickable = false;
                    layer.msg('开始取关', {
                      time: 2000,
                    });
                    return MY_API.AnchorLottery.delAnchorFollowing(1);
                  }, function () {
                    layer.msg('已取消', {
                      time: 2000
                    });
                  })
                }
              });
              myDiv.find('button[data-action="resetToken"]').click(() => {
                // 重置token
                layer.confirm(`<h3 style="text-align:center">是否重置移动端Token？</h3>重置后下次获取小心心前会重新获取Token。`, {
                  title: '重置Token',
                  btn: ['是', '否']
                }, function () {
                  let token = GM_getValue('Token');
                  if (token && !token.hasOwnProperty("access_token")) {
                    delete token[Live_info.uid];
                    GM_setValue('Token', token);
                  } else {
                    GM_setValue('Token', {});
                  }
                  layer.msg('已重置Token', {
                    time: 2000,
                  });
                }, function () {
                  layer.msg('已取消', {
                    time: 2000
                  });
                })
              });
              myDiv.find('button[data-action="sendGiftNow"]').click(() => {
                // 立刻开始送礼
                if (!MY_API.CONFIG.AUTO_GIFT) {
                  window.toast('[ 立刻开始送礼 ] 请先勾选【自动送礼】再点击此按钮', 'info');
                  return
                }
                SEND_GIFT_NOW = true;
                MY_API.Gift.run();
              });
              myDiv.find('button[data-action="sendDanmuNow"]').click(() => {
                // 立刻发送弹幕
                if (!MY_API.CONFIG.AUTO_DANMU) {
                  window.toast('[ 立刻发送弹幕 ] 请先勾选【自动发弹幕】再点击此按钮', 'info');
                  return
                }
                SEND_DANMU_NOW = true;
                MY_API.AUTO_DANMU.run();
              });
              myDiv.find('button[data-action="clearDanmuCache"]').click(() => {
                // 清除弹幕缓存
                MY_API.CACHE.AUTO_SEND_DANMU_TS = [];
                if (MY_API.saveCache()) MY_API.chatLog('清除弹幕缓存成功', 'success');
              });
              // 绑定所有checkbox事件
              for (const i of checkList) {
                const input = myDiv.find(`div[data-toggle="${i}"] input:checkbox`);
                if (MY_API.CONFIG[i]) input.attr('checked', '');
                input.change(function () {
                  MY_API.CONFIG[i] = $(this).prop('checked');
                  MY_API.saveConfig();
                });
              };
              // 绑定特殊设置（不在MY_API.CONFIG中）
              const specialSetting = [
                {
                  jqPath1: `div[data-toggle="INVISIBLE_ENTER"] input:checkbox`,
                  gmItem: `invisibleEnter`,
                  toastMsg: ["[隐身入场] 配置已保存", "info"],
                },
                {
                  jqPath1: `div[data-toggle="NOSLEEP"] input:checkbox`,
                  gmItem: `nosleep`,
                  toastMsg: ["[屏蔽挂机检测] 配置已保存", "info"],
                },
                {
                  jqPath1: `div[data-toggle="banP2p"] input:checkbox`,
                  gmItem: `banP2p`,
                  toastMsg: ["[禁止p2p上传] 配置已保存", "info"],
                },
                {
                  jqPath1: `div[data-toggle="debugSwitch"] input:checkbox`,
                  gmItem: `debugSwitch`,
                  toastMsg: ["[控制台日志] 配置已保存", "info"],
                  changeFn: function (self) { SP_CONFIG.debugSwitch = $(self).prop('checked'); }
                },
                {
                  jqPath1: `div[data-toggle="windowToast"] input:checkbox`,
                  gmItem: `windowToast`,
                  // toastMsg: ["[提示信息] 配置已保存", "info"],
                  changeFn: function (self) {
                    SP_CONFIG.windowToast = $(self).prop('checked');
                    if (SP_CONFIG.windowToast) $('.link-toast').show();
                    else $('.link-toast').hide();
                  }
                },
                {
                  jqPath1: `div[data-toggle="DANMU_MODIFY"] input:checkbox`,
                  gmItem: `DANMU_MODIFY`,
                  toastMsg: ["[弹幕修改] 配置已保存", "info"]
                },
                {
                  jqPath1: `div[data-toggle="blockLiveStream"] input:checkbox`,
                  gmItem: `blockLiveStream`,
                  toastMsg: ["[拦截直播流] 配置已保存", "info"]
                }, {
                  jqPath1: `div[data-toggle="blockliveDataUpdate"] input:checkbox`,
                  gmItem: `blockliveDataUpdate`,
                  toastMsg: ["[拦截直播观看数据上报] 配置已保存", "info"]
                }, {
                  jqPath1: `div[data-toggle="WEAR_MEDAL_BEFORE_DANMU"] input:checkbox`,
                  gmItem: `wear_medal_before_danmu`,
                  toastMsg: ["[自动佩戴勋章] 配置已保存", "info"]
                }, {
                  jqPath1: `div[data-toggle="ONLY_FIRST"] input:radio`,
                  jqPath2: `div[data-toggle="ALWAYS"] input:radio`,
                  changeFn: function (self, gmItem) {
                    if ($(self).is(':checked')) SP_CONFIG[gmItem] = $(self).parent().attr("data-toggle");
                  },
                  name: 'WEAR_MEDAL_BEFORE_DANMU',
                  gmItem: `wear_medal_type`,
                  toastMsg: ["[自动佩戴勋章] 配置已保存", "info"]
                }
              ];
              for (const i of specialSetting) {
                let input, isradio = i.hasOwnProperty('name') ? true : false;
                for (let count = 1; true; count++) {
                  const jqPathNum = "jqPath" + String(count);
                  if (!i.hasOwnProperty(jqPathNum)) break;
                  input = myDiv.find(i[jqPathNum]);
                  const setting = SP_CONFIG[i.gmItem];
                  if (!isradio) {
                    if (setting) input.attr('checked', '');
                  } else {
                    if (setting === i[jqPathNum].match(/data\-toggle="(.*)"/)[1]) {
                      $(i[jqPathNum]).attr('checked', '');
                    }
                  }
                }
                if (isradio) input = $(`input:radio[name= ${i.name} ]`);
                input.change(function () {
                  let self = this;
                  if (i.hasOwnProperty('changeFn')) isradio ? i.changeFn(self, i.gmItem) : i.changeFn(self);
                  if (!isradio) SP_CONFIG[i.gmItem] = $(self).prop('checked');
                  saveSpConfig();
                  if (i.hasOwnProperty('toastMsg')) window.toast(i.toastMsg[0], i.toastMsg[1]);
                })
              }
              // 绑定回车保存
              $('input:text').bind('keydown', function (event) {
                if (event.keyCode == 13) {
                  saveAction(myDiv);
                }
              });
              // 绑定多选框事件
              for (const i of radioList) {
                for (let count = 1; true; count++) {
                  const toggleName = "toggle" + String(count);
                  if (!i.hasOwnProperty(toggleName)) break;
                  if (MY_API.CONFIG[i.name] === i[toggleName]) {
                    $(`div[data-toggle= ${i[toggleName]}] input:radio`).attr('checked', '');
                  }
                }
                $(`input:radio[name= ${i.name} ]`).change(function () {
                  for (let count = 1; true; count++) {
                    const toggleName = "toggle" + String(count);
                    if (!i.hasOwnProperty(toggleName)) break;
                    if ($(`div[data-toggle= ${i[toggleName]} ] input:radio`).is(':checked')) {
                      MY_API.CONFIG[i.name] = i[toggleName];
                      MY_API.saveConfig();
                      break;
                    }
                  }
                })
              }
              // 绑定帮助文字 (?)
              $('.helpText').click(function () {
                const id = $(this).attr('helpdata');
                if (id !== undefined) {
                  if (helpText.hasOwnProperty(id)) {
                    return layer.open({
                      title: `帮助信息 ${id}`,
                      anim: 5,
                      area: [String($(window).width() * 0.382) + 'px', String($(window).height() * 0.618) + 'px'],
                      content: helpText[id]
                    });
                  }
                }
              });
              // 允许按钮点击
              hideBtnClickable = true;
            },
            end: () => {
              // 理论上此处代码不会运行，因为窗口保持常开不关闭
              SP_CONFIG.mainDisplay = 'hide';
              saveSpConfig();
              document.getElementById('hiderbtn').innerHTML = "显示控制面板";
            }
          });
        };
        // 添加隐藏/显示窗口按钮
        $('.attention-btn-ctnr').append(btn);
        // 监听隐藏/显示窗口按钮
        let JQshow = false;
        btn.click(() => {
          if (hideBtnClickable) {
            hideBtnClickable = false;
            setTimeout(function () { hideBtnClickable = true }, 310);
            if (SP_CONFIG.mainDisplay === 'show') { // 显示 -> 隐藏
              SP_CONFIG.mainDisplay = 'hide';
              saveSpConfig(false);
              animChange(layerUiMain, true);
              document.getElementById('hiderbtn').innerHTML = "显示控制面板";
              setTimeout(() => layer.style(mainIndex, { "zIndex": 0 }), 300);
            }
            else { // 隐藏 -> 显示
              SP_CONFIG.mainDisplay = 'show';
              layer.style(mainIndex, { "zIndex": 1000 })
              saveSpConfig(false);
              if (JQshow) {
                layerUiMain.show();
                JQshow = false;
              }
              else animChange(layerUiMain, false)
              document.getElementById('hiderbtn').innerHTML = "隐藏控制面板";
            }
          }
        });
        // 打开窗口
        openMainWindow();
        if (SP_CONFIG.mainDisplay === 'hide') {
          layerUiMain.hide();
          JQshow = true;
        }
        // 监听播放器全屏变化
        function bodyPropertyChange() {
          let attr = body.attr('class'), tabOffSet = tabContent.offset(), top = tabOffSet.top, left = tabOffSet.left;
          if (/[player\-full\-win]|[fullscreen\-fix]/.test(attr)) {
            if (SP_CONFIG.mainDisplay === 'show') { // 显示 -> 隐藏
              SP_CONFIG.mainDisplay = 'hide';
              saveSpConfig(false);
              animChange(layerUiMain, true);
              document.getElementById('hiderbtn').innerHTML = "显示控制面板";
              setTimeout(() => layer.style(mainIndex, { "zIndex": 0 }), 300);
            }
          }
          layer.style(logIndex, {
            'top': String(top) + 'px',
            'left': String(left) + 'px'
          });
        }
        let mutationObserver = new MutationObserver(bodyPropertyChange);
        const options = { attributes: true };
        mutationObserver.observe(body[0], options);
        // 添加隐藏/显示窗口按钮
        $('.attention-btn-ctnr').append(btn);
        // 初次运行时tips
        if (!MY_API.CACHE.DailyReward_TS) {
          layer.tips('点我隐藏/显示控制面板', '#hiderbtn', {
            tips: 1
          });
          setTimeout(() => layer.tips('点我查看日志', '#logDiv', {
            tips: 1
          }), 6000);
        }
      },
      chatLog: function (text, _type = 'info') { // 自定义提示
        let div = $("<div class='chatLogDiv'>"),
          msg = $("<div class='chatLogMsg'>"),
          myDate = new Date();
        msg.html(text);
        div.text(myDate.toLocaleString());
        div.append(msg);
        switch (_type) {
          case 'warning':
            div.addClass('chatLogWarning')
            break;
          case 'success':
            div.addClass('chatLogSuccess')
            break;
          case 'error':
            div.addClass('chatLogError')
            break;
          case 'prize':
            div.addClass('chatLogWinPrize')
            break;
          default:
            div.addClass('chatLogDefault')
        };
        JQmenuWindow.append(div);
        let time = div.find('span[id="time"] .num');
        let clickableText = div.find('div[class="clickableText"]');
        const num = Number(time.text());
        const id = clickableText.attr('id');
        if (num !== undefined) {
          let remainTime = num;
          let timer = setInterval(() => {
            remainTime--;
            if (remainTime <= 0) {
              div.find('span[id="time"]').html('已开奖');
              if (id !== undefined && id.indexOf(`${NAME}_ANCHOR`) === 0) clickableText.remove();
              clearInterval(timer);
            }
            else time.text(remainTime)
          }, 1000);
        }
        if (layerLogWindow_ScrollY >= layerLogWindow_ScrollHeight)
          layerLogWindow.scrollTop(layerLogWindow.prop("scrollHeight"));
      },
      blocked: false,
      LOTTERY: {
        // 大乱斗抽奖
        listen: (roomId, uid, area = '本直播间') => { // ${response.message}
          BAPI.room.getConf(roomId).then((response) => {
            MYDEBUG(`获取弹幕服务器信息 ${area}`, response);
            if (response.code == 0) {
              let wst = new BAPI.DanmuWebSocket(uid, roomId, response.data.host_server_list, response.data.token);
              wst.bind((newWst) => {
                wst = newWst;
                MY_API.chatLog(`[${area}]弹幕服务器连接断开，尝试重连`, 'warning');
              }, () => {
                MY_API.chatLog(`——————连接弹幕服务器成功——————<br>房间号: ${roomId} 分区: ${area}`
                  , 'success');
              }, () => {
                if (MY_API.blocked || MY_API.stormBlack) {
                  wst.close();
                  MY_API.chatLog(`进了小黑屋主动与弹幕服务器断开连接-${area}`, 'warning')
                }
              }, (obj) => {
                MYDEBUG('弹幕公告' + area, obj);
                switch (obj.cmd) {
                  case 'GUARD_MSG':
                    if (obj.roomid === obj.real_roomid) {
                      MY_API.checkRoom(obj.roomid, area);
                    } else {
                      MY_API.checkRoom(obj.roomid, area);
                      MY_API.checkRoom(obj.real_roomid, area);
                    }
                    break;
                  case 'PK_BATTLE_SETTLE_USER':
                    if (obj.data.winner) {
                      MY_API.checkRoom(obj.data.winner.room_id, area);
                    } else {
                      MY_API.checkRoom(obj.data.my_info.room_id, area);
                    }
                    MY_API.checkRoom(obj.data.winner.room_id, area);
                    break;
                  case 'NOTICE_MSG':
                    switch (obj.msg_type) {
                      case 1: break; // 系统
                      case 2:
                      case 3: // 舰队领奖
                      case 4: // 登船
                      case 8: // 礼物抽奖
                        if (obj.roomid === obj.real_roomid) {
                          MY_API.checkRoom(obj.roomid, area);
                        } else {
                          MY_API.checkRoom(obj.roomid, area);
                          MY_API.checkRoom(obj.real_roomid, area);
                        }
                        break;
                      /*case 4:
                          // 登船
                          break;*/
                      case 5:
                        // 获奖
                        break;
                      case 6:
                        // 节奏风暴
                        window.toast(`监控到房间 ${obj.roomid} 的节奏风暴`, 'info');
                        MY_API.Storm.run(obj.roomid);
                        break;
                    }
                    break;
                  case 'SPECIAL_GIFT':
                    // MYDEBUG(`DanmuWebSocket${area}(${roomid})`, str);
                    if (obj.data['39']) {
                      switch (obj.data['39'].action) {
                        case 'start':
                          // 节奏风暴开始
                          window.toast(`监控到房间 ${obj.roomid} 的节奏风暴`, 'info');
                          MY_API.Storm.run(obj.roomid);
                        case 'end':
                        // 节奏风暴结束
                      }
                    };
                    break;
                  default:
                    return;
                }
              });
            } else {
              MY_API.chatLog(`获取弹幕服务器地址错误 ${response.message}`, 'error')
            }
          });
        },
        run: async () => {
          if (!MY_API.CONFIG.LOTTERY || otherScriptsRunning) return $.Deferred().resolve();
          let roomList;
          await BAPI.room.getList().then((response) => {
            // 获取各分区的房间号
            MYDEBUG('[礼物抽奖] 分区列表', response);
            if (response.code === 0) {
              roomList = response.data;
              for (const obj of response.data) {
                BAPI.room.getRoomList(obj.id, 0, 0, 1, 1).then((re) => {
                  MYDEBUG('[礼物抽奖] 直播间列表', re);
                  if (re.code === 0) {
                    for (let j = 0; j < re.data.list.length; ++j) {
                      MY_API.LOTTERY.listen(re.data.list[j].roomid, Live_info.uid, `${obj.name}区`);
                    }
                  } else {
                    MY_API.chatLog(`[礼物抽奖] 获取直播间列表出错 ${re.message}`, 'error');
                  }
                });
              }
            } else {
              MY_API.chatLog(`[礼物抽奖] 获取各分区的房间号出错 ${response.message}`, 'error');
            }
          });
          if (MY_API.CONFIG.CHECK_HOUR_ROOM) {
            let check_timer;
            let check_top_room = async () => {
              // 检查小时榜房间
              if (MY_API.blocked) {
                // 如果被禁用则停止
                if (MY_API.blocked) {
                  API.chatLog('进入小黑屋检查小时榜已停止运行');
                  return clearInterval(check_timer);
                }
                else {
                  return API.chatLog('辣条已达到最大值检查小时榜已停止运行');
                }
              }
              if (MY_API.CONFIG.TIME_AREA_DISABLE && inTimeArea(MY_API.CONFIG.TIME_AREA_START_H0UR, MY_API.CONFIG.TIME_AREA_END_H0UR, MY_API.CONFIG.TIME_AREA_START_MINUTE, MY_API.CONFIG.TIME_AREA_END_MINUTE)) { // 判断时间段
                return MY_API.chatLog('当前时间段不检查小时榜礼物', 'warning');
              }
              for (const r of roomList) {
                await BAPI.rankdb.getTopRealTimeHour(r.id).then((response) => {
                  if (response.code === 0) {
                    let list = response.data.list;
                    MY_API.chatLog(`检查${r.name + '小时榜'}房间的礼物`, 'warning');
                    for (const i of list) {
                      MY_API.checkRoom(i.roomid, `小时榜-${i.area_v2_parent_name}区`);
                    }
                  } else {
                    return MY_API.chatLog(`检查小时榜房间礼物出错 ${response.message}`, 'error')
                  }
                })
              }
            }
            setTimeout(() => check_top_room(), 6e3); // 加载脚本后6秒检查一次小时榜
            check_timer = setInterval(() => check_top_room(), parseInt(MY_API.CONFIG.CHECK_HOUR_ROOM_INTERVAL * 1000));
          }
        }
      },
      EntryRoom_list_history: { // 进入房间历史记录缓存
        add: function (EntryRoom) {
          let EntryRoom_list = [];
          try {
            EntryRoom_list = GM_getValue(`EntryRoom_list`) || [];
            EntryRoom_list.push(EntryRoom);
            if (EntryRoom_list.length > 100) {
              EntryRoom_list.splice(0, 50); // 删除前50条数据
            }
            GM_setValue(`EntryRoom_list`, EntryRoom_list);
          } catch (e) {
            EntryRoom_list.push(EntryRoom);
            GM_setValue(`EntryRoom_list`, EntryRoom_list);
          }
        },
        isIn: function (EntryRoom) {
          let EntryRoom_list = [];
          try {
            EntryRoom_list = GM_getValue(`EntryRoom_list`) || [];
            return EntryRoom_list.indexOf(EntryRoom) > -1
          } catch (e) {
            GM_setValue(`EntryRoom_list`, EntryRoom_list);
            MYDEBUG('读取' + `EntryRoom_list` + '缓存错误已重置');
            return EntryRoom_list.indexOf(EntryRoom) > -1
          }
        }
      },
      RoomId_list: [],
      err_roomId: [],
      auto_danmu_list: ["(=・ω・=)", "（￣▽￣）", "nice", "666", "kksk", "(⌒▽⌒)", "(｀・ω・´)", "╮(￣▽￣)╭", "(￣3￣)", "Σ( ￣□￣||)",
        "(^・ω・^ )", "_(:3」∠)_"], // 共12个
      checkRoom: function (roomId, area = '本直播间') {
        if (MY_API.blocked) {
          return
        }
        if (MY_API.RoomId_list.indexOf(roomId) > -1) { // 防止重复检查直播间
          return
        } else {
          MY_API.RoomId_list.push(roomId);
        }
        if (!MY_API.EntryRoom_list_history.isIn(roomId) && MY_API.CONFIG.LOTTERY) {
          BAPI.room.room_entry_action(roomId); // 直播间进入记录
          MY_API.EntryRoom_list_history.add(roomId); // 加入列表
        }
        if (probability(MY_API.CONFIG.RANDOM_SEND_DANMU)) { // 概率发活跃弹幕
          BAPI.room.get_info(roomId).then((res) => {
            MYDEBUG(`API.room.get_info roomId=${roomId} res`, res);
            // Math.floor(Math.random() * (max - min + 1) ) + min
            BAPI.sendLiveDanmu(MY_API.auto_danmu_list[Math.floor(Math.random() * MY_API.auto_danmu_list.length)], res.data.room_id).then((response) => {
              MYDEBUG('[活跃弹幕]弹幕发送返回信息', response);
            })
          })
        }
        BAPI.xlive.lottery.check(roomId).then((re) => {
          rmVal(MY_API.RoomId_list, roomId)
          MYDEBUG('检查房间返回信息', re);
          const data = re.data;
          if (re.code === 0) {
            if (data.gift) {
              const list = data.gift;
              for (let i in list) {
                if (!list.hasOwnProperty(i)) continue;
                MY_API.creat_join(roomId, list[i], 'gift', area)
              }
            }
            if (data.guard) {
              const list = data.guard;
              for (let i in list) {
                if (!list.hasOwnProperty(i)) continue;
                MY_API.creat_join(roomId, list[i], 'guard', area)
              }
            }
            if (data.pk) {
              const list = data.pk;
              for (let i in list) {
                if (!list.hasOwnProperty(i)) continue;
                MY_API.creat_join(roomId, list[i], 'pk', area)
              }
            }

          } else {
            MY_API.chatLog(`[检查房间出错]${response.msg}`, 'error');
            if (MY_API.err_roomId.indexOf(roomId) > -1) {
              MYDEBUG(`[检查此房间出错多次]${roomId}${re.message}`);
            }
            else {
              MY_API.err_roomId.push(roomId);
              MY_API.checkRoom(roomId, area);
              MYDEBUG(`[检查房间出错_重试一次]${roomId}${re.message}`);
            }
          }
        })

      },
      Id_list_history: { // 礼物历史记录缓存
        add: function (id, type) {
          let id_list = [];
          try {
            id_list = GM_getValue(`${type}Id_list`) || [];
            id_list.push(id);
            if (id_list.length > 200) {
              id_list.splice(0, 50); // 删除前50条数据
            }
            GM_setValue(`${type}Id_list`, id_list);
            MYDEBUG(`${type}Id_list_add`, id_list);
          } catch (e) {
            id_list.push(id);
            GM_setValue(`${type}Id_list`, id_list);
          }
        },
        isIn: function (id, type) {
          let id_list = [];
          try {
            id_list = GM_getValue(`${type}Id_list`) || [];
            MYDEBUG(`${type}Id_list_read`, config);
            return id_list.indexOf(id) > -1
          } catch (e) {
            GM_setValue(`${type}Id_list`, id_list);
            MYDEBUG('读取' + `${type}Id_list` + '缓存错误已重置');
            return id_list.indexOf(id) > -1
          }
        }
      },
      raffleId_list: [],
      guardId_list: [],
      pkId_list: [],
      creat_join: function (roomId, data, type, area = '本直播间') {
        MYDEBUG('礼物信息', data);
        switch (type) { // 防止重复抽奖上船PK
          case 'gift':
            if (MY_API.Id_list_history.isIn(data.raffleId, 'raffle')) {
              MYDEBUG('礼物重复', `raffleId ${data.raffleId}`);
              return
            } else {
              MY_API.raffleId_list.push(data.raffleId);
              MY_API.Id_list_history.add(data.raffleId, 'raffle');
            }
            break;
          case 'guard':
            if (MY_API.Id_list_history.isIn(data.id, 'guard')) {
              MYDEBUG('舰长重复', `id ${data.id}`);
              return
            } else {
              MY_API.guardId_list.push(data.id);
              MY_API.Id_list_history.add(data.id, 'guard');
            }
            break;
          case 'pk':
            if (MY_API.Id_list_history.isIn(data.id, 'pk')) {
              MYDEBUG('pk重复', `id ${data.id}`);
              return
            } else {
              MY_API.pkId_list.push(data.id);
              MY_API.Id_list_history.add(data.id, 'pk');
            }
            break;
        }

        let delay = data.time_wait || 0;
        if (MY_API.CONFIG.RANDOM_DELAY)
          delay += getRandomNum(MY_API.CONFIG.RND_DELAY_START, MY_API.CONFIG.RND_DELAY_END);
        //随机延迟 return Math.floor(Math.random() * (max - min + 1) ) + min; min，max都包括
        let div = $("<div class='chatLogLottery'>"),
          msg = $("<div class='chatLogMsg'>"),
          aa = $("<div>"),
          myDate = new Date();
        msg.text(`[${area}]` + data.thank_text.split('<%')[1].split('%>')[0] + data.thank_text.split('%>')[1]);
        div.text(myDate.toLocaleString());
        div.append(msg);
        aa.css('color', 'red');
        aa.text('等待抽奖');
        msg.append(aa);
        JQmenuWindow.append(div); // 向聊天框加入信息
        if (layerLogWindow_ScrollY >= layerLogWindow_ScrollHeight)
          layerLogWindow.scrollTop(layerLogWindow.prop("scrollHeight"));
        let timer = setInterval(() => {
          aa.text(`等待抽奖倒计时${delay}秒`);
          if (delay <= 0) {
            if (probability(MY_API.CONFIG.RANDOM_SKIP)) {
              aa.text(`跳过此礼物抽奖`);
            } else {
              aa.text(`进行抽奖...`);
              switch (type) {
                case 'gift':
                  MY_API.gift_join(roomId, data.raffleId, data.type).then(function (msg, num) {
                    aa.text(msg);
                    rmVal(MY_API.raffleId_list, data.raffleId); // 移除礼物id列表
                  });
                  break;
                case 'guard':
                  MY_API.guard_join(roomId, data.id).then(function (msg, num) {
                    aa.text(msg);
                    rmVal(MY_API.guardId_list, data.id); // 移除礼物id列表
                  });
                  break;
                case 'pk':
                  MY_API.pk_join(roomId, data.id).then(function (msg, num) {
                    aa.text(msg);
                    rmVal(MY_API.pkId_list, data.id); // 移除礼物id列表
                  });
                  break;
              }
            }
            aa.css('color', 'green');
            clearInterval(timer)
          }
          delay--;
        }, 1000);


      },
      gift_join: function (roomid, raffleId, type) {
        return BAPI.Lottery.Gift.join(roomid, raffleId, type).then((response) => {
          let p = $.Deferred();
          MYDEBUG('抽奖返回信息', response);
          switch (response.code) {
            case 0:
              if (response.data.award_text) {
                p.resolve(response.data.award_text, response.data.award_num);
              } else {
                p.resolve(response.data.award_name + 'X' + response.data.award_num.toString()
                  , response.data.award_num);
              }
              break;
            default:
              if (response.msg.indexOf('拒绝') > -1) {
                MY_API.blocked = true; // 停止抽奖
                p.resolve('访问被拒绝，您的帐号可能已经被关小黑屋，已停止');
              } else {
                p.resolve(`[礼物抽奖](roomid=${roomid},id=${raffleId},type=${type})${response.msg}`);
              }
              break;
          }
          return p
        });
      },
      guard_join: function (roomid, Id) {
        return BAPI.Lottery.Guard.join(roomid, Id).then((response) => {
          MYDEBUG('上船抽奖返回信息', response);
          let p = $.Deferred();
          switch (response.code) {
            case 0:
              if (response.data.award_text) {
                p.resolve(response.data.award_text, response.data.award_num);
              } else {
                p.resolve(response.data.award_name + 'X' + response.data.award_num.toString()
                  , response.data.award_num);
              }
              break;
            default:
              if (response.msg.indexOf('拒绝') > -1) {
                MY_API.blocked = true; // 停止抽奖
                p.resolve('访问被拒绝，您的帐号可能已经被关小黑屋，已停止');
              } else {
                p.resolve(`[上船](roomid=${roomid},id=${Id})${response.msg}`);
              }
              break;
          }
          return p
        });
      },
      pk_join: function (roomid, Id) {
        return BAPI.Lottery.Pk.join(roomid, Id).then((response) => {
          MYDEBUG('PK抽奖返回信息', response);
          let p = $.Deferred();
          switch (response.code) {
            case 0:
              if (response.data.award_text) {
                p.resolve(response.data.award_text, response.data.award_num);
              } else {
                p.resolve(response.data.award_name + 'X' + response.data.award_num.toString()
                  , response.data.award_num);
              }
              break;
            case -1:
              //奖品已经飞走啦~
              p.resolve(response.message);
              break;
            case -2:
              //您已参加过抽奖
              //未中奖~参与大乱斗可提升欧气哦~~
              p.resolve(response.message);
              break;
            default:
              if (response.msg.indexOf('拒绝') > -1) {
                MY_API.blocked = true; // 停止抽奖
                p.resolve('访问被拒绝，您的帐号可能已经被关小黑屋，已停止');
              } else {
                p.resolve(`[PK](roomid=${roomid},id=${Id})${response.msg}`);
              }
              break;
          }
          return p
        });
      },
      GroupSign: {
        fullLevalMedalUidList: [],
        getGroups: () => {
          //获取应援团列表
          return BAPI.Group.my_groups().then((response) => {
            MYDEBUG('GroupSign.getGroups: API.Group.my_groups', response);
            if (response.code === 0) return $.Deferred().resolve(response.data.list);
            window.toast(`[自动应援团签到]' ${response.msg}`, 'error');
            return $.Deferred().reject();
          }, () => {
            window.toast('[自动应援团签到]获取应援团列表失败，请检查网络', 'error');
            return delayCall(() => MY_API.GroupSign.getGroups());
          });
        },
        signInList: (list, i = 0) => {
          // 应援团签到
          if (i >= list.length) return $.Deferred().resolve();
          const obj = list[i];
          // 自己不能给自己的应援团应援，不给20或40级粉丝牌的应援团签到
          if (obj.owner_uid == Live_info.uid || MY_API.GroupSign.fullLevalMedalUidList == Live_info.uid) return MY_API.GroupSign.signInList(list, i + 1);
          return BAPI.Group.sign_in(obj.group_id, obj.owner_uid).then((response) => {
            MYDEBUG('GroupSign.signInList: API.Group.sign_in', response);
            let p = $.Deferred();
            if (response.code === 0) {
              if (response.data.add_num > 0) { // || response.data.status === 1
                window.toast(`[自动应援团签到]应援团(group_id=${obj.group_id},owner_uid=${obj.owner_uid})签到成功，当前勋章亲密度+${response.data.add_num}`, 'success');
                p.resolve();
              }
              else if (response.data.add_num == 0) {
                window.toast(`[自动应援团签到]应援团(group_id=${obj.group_id},owner_uid=${obj.owner_uid})已签到`, 'caution');
                p.resolve();
              }
              else {
                p.reject();
              }
            } else {
              window.toast(`[自动应援团签到] 应援团(group_id=${obj.group_id},owner_uid=${obj.owner_uid})签到失败 ${response.msg}`, 'caution');
              p.reject();
              return delayCall(() => MY_API.GroupSign.signInList(list, i));
            }
            return $.when(MY_API.GroupSign.signInList(list, i + 1), p);
          });
        },
        run: () => {
          // 执行应援团任务
          try {
            if (!MY_API.CONFIG.AUTO_GROUP_SIGN || otherScriptsRunning) return $.Deferred().resolve();
            if (!checkNewDay(MY_API.CACHE.AUTO_GROUP_SIGH_TS)) {
              runTomorrow(() => MY_API.GroupSign.run(), 8, 1, '应援团签到');
              return $.Deferred().resolve();
            } else if (getCHSdate().getHours() < 8 && MY_API.CACHE.AUTO_GROUP_SIGH_TS !== 0) {
              runToday(() => MY_API.GroupSign.run(), 8, 1, '应援团签到');
              return $.Deferred().resolve();
            }
            return MY_API.GroupSign.getGroups().then((list) => {
              for (const i of medal_info.medal_list) {
                if (i.medal_level === 20 || i.medal_level === 40)
                  MY_API.GroupSign.fullLevalMedalUidList.push(i.target_id)
              }
              return MY_API.GroupSign.signInList(list).then(() => {
                MY_API.CACHE.AUTO_GROUP_SIGH_TS = ts_ms();
                MY_API.saveCache();
                runTomorrow(() => MY_API.GroupSign.run(), 8, 1, '应援团签到');
                return $.Deferred().resolve();
              }, () => delayCall(() => MY_API.GroupSign.run()));

            }, () => delayCall(() => MY_API.GroupSign.run()));
          } catch (err) {
            window.toast('[自动应援团签到]运行时出现异常，已停止', 'error');
            MYERROR(`自动应援团签到出错`, err);
            return $.Deferred().reject();
          }
        }
      },
      DailyReward: {
        // 每日任务
        coin_exp: 0,
        login: () => {
          return BAPI.DailyReward.login().then((response) => {
            MYDEBUG('DailyReward.login: API.DailyReward.login');
            if (response.code === 0) window.toast('[自动每日奖励][每日登录]完成', 'success');
            else {
              window.toast(`[自动每日奖励][每日登录]失败 ${response.message}`, 'error');
              return delayCall(() => MY_API.DailyReward.login());
            }
          });
        },
        watch: (aid, cid) => {
          if (!MY_API.CONFIG.WATCH) return $.Deferred().resolve();
          return BAPI.DailyReward.watch(aid, cid, Live_info.uid, ts_s()).then((response) => {
            MYDEBUG('DailyReward.watch: API.DailyReward.watch', response);
            if (response.code === 0) {
              window.toast(`[自动每日奖励][每日观看]完成(av=${aid})`, 'success');
            } else {
              window.toast(`[自动每日奖励][每日观看]失败 aid=${aid}, cid=${cid} ${response.msg}`, 'error');
              return delayCall(() => MY_API.DailyReward.watch(aid, cid));
            }
          });
        },
        coin: (cards, n, i = 0, one = false) => {
          if (!MY_API.CONFIG.COIN) return $.Deferred().resolve();
          if (MY_API.DailyReward.coin_exp >= MY_API.CONFIG.COIN_NUMBER * 10) {
            window.toast('[自动每日奖励][每日投币]今日投币已完成', 'info');
            return $.Deferred().resolve();
          }
          if (i >= cards.length) {
            window.toast('[自动每日奖励][每日投币]动态里可投币的视频不足', 'caution');
            return $.Deferred().resolve();
          }
          const obj = JSON.parse(cards[i].card);
          let num = Math.min(2, n);
          if (one) num = 1;
          return BAPI.x.getCoinInfo('', 'jsonp', obj.aid, ts_ms()).then((re) => {
            if (re.code === 0) {
              if (re.data.multiply === 2) {
                MYDEBUG('API.x.getCoinInfo', `已投币两个 aid = ${obj.aid}`)
                return MY_API.DailyReward.coin(vlist, n, i + 1);
              }
              else {
                if (re.data.multiply === 1) num = 1;
                return BAPI.DailyReward.coin(obj.aid, num).then((response) => {
                  MYDEBUG('DailyReward.coin: API.DailyReward.coin', response);
                  if (response.code === 0) {
                    MY_API.DailyReward.coin_exp += num * 10;
                    window.toast(`[自动每日奖励][每日投币]投币成功(av=${obj.aid},num=${num})`, 'success');
                    return MY_API.DailyReward.coin(cards, n - num, i + 1);
                  } else if (response.code === -110) {
                    window.toast('[自动每日奖励][每日投币]未绑定手机，已停止', 'error');
                    return $.Deferred().reject();
                  } else if (response.code === 34003) {
                    // 非法的投币数量
                    if (one) return MY_API.DailyReward.coin(cards, n, i + 1);
                    return MY_API.DailyReward.coin(cards, n, i, true);
                  } else if (response.code === 34005) {
                    // 塞满啦！先看看库存吧~
                    return MY_API.DailyReward.coin(cards, n, i + 1);
                  } else if (response.code === -104) {
                    //硬币余额不足
                    window.toast('[自动每日奖励][每日投币]剩余硬币不足，已停止', 'warning');
                    return $.Deferred().reject();
                  }
                  window.toast(`[自动每日奖励][每日投币]出错 ${response.msg}`, 'error');
                  return delayCall(() => MY_API.DailyReward.coin(cards, n, i))
                });
              }
            } else {
              window.toast(`[自动每日奖励][每日投币]获取视频(aid=${obj.aid})投币状态出错 ${response.msg}`, 'error');
              return delayCall(() => MY_API.DailyReward.coin(cards, n, i))
            }
          })
        },
        coin_uid: (vlist, n, pagenum, uidIndex, i = 0, one = false) => {
          if (!MY_API.CONFIG.COIN) return $.Deferred().resolve();
          if (MY_API.DailyReward.coin_exp >= MY_API.CONFIG.COIN_NUMBER * 10) {
            window.toast('[自动每日奖励][每日投币]今日投币已完成', 'info');
            return $.Deferred().resolve();
          }
          if (i >= vlist.length) {
            return MY_API.DailyReward.UserSpace(uidIndex, 30, 0, pagenum + 1, '', 'pubdate', 'jsonp');
          }
          const obj = vlist[i], uid = MY_API.CONFIG.COIN_UID[uidIndex];
          if (obj.hasOwnProperty('is_union_video') && obj.is_union_video === 1 && obj.mid != uid) {
            MYDEBUG('DailyReward.coin_uid', `联合投稿且UP不是指定UID用户 aid = ${obj.aid}`)
            return MY_API.DailyReward.coin_uid(vlist, n, pagenum, uidIndex, i + 1);
          }
          let num = Math.min(2, n);
          if (one) num = 1;
          return BAPI.x.getCoinInfo('', 'jsonp', obj.aid, ts_ms()).then((re) => {
            if (re.code === 0) {
              if (re.data.multiply === 2) {
                MYDEBUG('API.x.getCoinInfo', `已投币两个 aid = ${obj.aid}`)
                return MY_API.DailyReward.coin_uid(vlist, n, pagenum, uidIndex, i + 1);
              }
              else {
                if (re.data.multiply === 1) num = 1;
                return BAPI.DailyReward.coin(obj.aid, num).then((response) => {
                  MYDEBUG('DailyReward.coin_uid: API.DailyReward.coin_uid', response);
                  if (response.code === 0) {
                    MY_API.DailyReward.coin_exp += num * 10;
                    window.toast(`[自动每日奖励][每日投币]投币成功(av=${obj.aid},num=${num})`, 'success');
                    return MY_API.DailyReward.coin_uid(vlist, n - num, pagenum, uidIndex, i + 1);
                  } else if (response.code === -110) {
                    window.toast('[自动每日奖励][每日投币]未绑定手机，已停止', 'error');
                    return $.Deferred().reject();
                  } else if (response.code === 34003) {
                    // 非法的投币数量
                    if (one) return MY_API.DailyReward.coin_uid(vlist, n, pagenum, uidIndex, i + 1);
                    return MY_API.DailyReward.coin_uid(vlist, n, i, pagenum, uidIndex, true);
                  } else if (response.code === 34005) {
                    // 塞满啦！先看看库存吧~
                    return MY_API.DailyReward.coin_uid(vlist, n, pagenum, uidIndex, i + 1);
                  } else if (response.code === -104) {
                    // 硬币余额不足
                    window.toast('[自动每日奖励][每日投币]剩余硬币不足，已停止', 'warning');
                    return $.Deferred().reject();
                  }
                  window.toast(`[自动每日奖励][每日投币] 出错 ${response.msg}`, 'caution');
                  return delayCall(() => MY_API.DailyReward.coin_uid(vlist, n, pagenum, uidIndex, i))
                });
              }
            } else {
              window.toast(`[自动每日奖励][每日投币]获取视频(aid=${obj.aid})投币状态出错 ${response.msg}`, 'error');
              return delayCall(() => MY_API.DailyReward.coin(cards, n, i))
            }
          });
        },
        share: (aid) => {
          if (!MY_API.CONFIG.SHARE) return $.Deferred().resolve();
          return BAPI.DailyReward.share(aid).then((response) => {
            MYDEBUG('DailyReward.share: API.DailyReward.share', response);
            if (response.code === 0) {
              window.toast(`[自动每日奖励][每日分享]分享成功(av=${aid})`, 'success');
            } else if (response.code === 71000) {
              // 重复分享
              window.toast('[自动每日奖励][每日分享]今日分享已完成', 'info');
            } else {
              window.toast(`[自动每日奖励][每日分享] 出错 ${response.msg}`, 'caution');
              return delayCall(() => MY_API.DailyReward.share(aid));
            }
          });
        },
        dynamic: async () => {
          const coinNum = MY_API.CONFIG.COIN_NUMBER - MY_API.DailyReward.coin_exp / 10;
          const throwCoinNum = await BAPI.getuserinfo().then((re) => {
            MYDEBUG('DailyReward.dynamic: API.getuserinfo', re);
            if (re.code === "REPONSE_OK") {
              if (re.data.biliCoin < coinNum) return re.data.biliCoin
              else return coinNum
            } else {
              window.toast(`[自动每日奖励][每日投币] 获取用户信息失败 ${response.message}`, 'error');
            }
          });
          if (throwCoinNum < coinNum) window.toast(`[自动每日奖励][每日投币]剩余硬币不足，仅能投${throwCoinNum}个币`, 'warning');
          return BAPI.dynamic_svr.dynamic_new(Live_info.uid, 8).then((response) => {
            MYDEBUG('DailyReward.dynamic: API.dynamic_svr.dynamic_new', response);
            if (response.code === 0) {
              if (response.data.cards) {
                const obj = JSON.parse(response.data.cards[0].card);
                const p1 = MY_API.DailyReward.watch(obj.aid, obj.cid);
                let p2;
                if (MY_API.CONFIG.COIN_UID == 0 || MY_API.CONFIG.COIN_TYPE == 'COIN_DYN') {
                  p2 = MY_API.DailyReward.coin(response.data.cards, Math.max(throwCoinNum, 0));
                } else {
                  p2 = MY_API.DailyReward.UserSpace(0, 30, 0, 1, '', 'pubdate', 'jsonp');
                }
                const p3 = MY_API.DailyReward.share(obj.aid);
                return $.when(p1, p2, p3);
              } else {
                window.toast('[自动每日奖励]"动态-投稿视频"中暂无动态', 'info');
              }
            } else {
              window.toast(`[自动每日奖励]获取"动态-投稿视频"失败 ${response.msg}`, 'caution');
              return delayCall(() => MY_API.DailyReward.dynamic());
            }
          });
        },
        UserSpace: (uidIndex, ps, tid, pn, keyword, order, jsonp) => {
          return BAPI.x.getUserSpace(MY_API.CONFIG.COIN_UID[uidIndex], ps, tid, pn, keyword, order, jsonp).then((response) => {
            MYDEBUG('DailyReward.UserSpace: API.dynamic_svr.UserSpace', response);
            if (response.code === 0) {
              if (response.data.list.vlist) {
                const throwCoinNum = MY_API.CONFIG.COIN_NUMBER - MY_API.DailyReward.coin_exp / 10;
                return MY_API.DailyReward.coin_uid(response.data.list.vlist, Math.max(throwCoinNum, 0), pn, uidIndex);
              } else if (uidIndex < MY_API.CONFIG.COIN_UID.length - 1) {
                const throwCoinNum = MY_API.CONFIG.COIN_NUMBER - MY_API.DailyReward.coin_exp / 10;
                return MY_API.DailyReward.coin_uid(response.data.list.vlist, Math.max(throwCoinNum, 0), pn, uidIndex + 1);
              } else {
                window.toast(`[自动每日奖励]"UID = ${String(MY_API.CONFIG.COIN_UID)}的空间-投稿视频"中暂无视频`, 'info');
              }
            }
            else {
              window.toast(`[自动每日奖励]获取UID = ${MY_API.CONFIG.COIN_UID[uidIndex]}的"空间-投稿视频"失败 ${response.msg}`, 'caution');
              return delayCall(() => MY_API.DailyReward.UserSpace(uid, ps, tid, pn, keyword, order, jsonp));
            }
          });
        },
        run: (forceRun = false) => {
          try {
            if ((!MY_API.CONFIG.LOGIN && !MY_API.CONFIG.COIN && !MY_API.CONFIG.WATCH) || otherScriptsRunning) return $.Deferred().resolve();
            if (!checkNewDay(MY_API.CACHE.DailyReward_TS) && !forceRun) {
              // 同一天，不执行每日任务
              runMidnight(() => MY_API.DailyReward.run(), '每日任务');
              return $.Deferred().resolve();
            }
            return BAPI.DailyReward.exp().then((response) => {
              MYDEBUG('DailyReward.run: API.DailyReward.exp', response);
              if (response.code === 0) {
                MY_API.DailyReward.coin_exp = response.number;
                MY_API.DailyReward.login();
                MY_API.DailyReward.dynamic();
                MY_API.CACHE.DailyReward_TS = ts_ms();
                MY_API.saveCache();
                runMidnight(() => MY_API.DailyReward.run(), '每日任务');
              } else {
                window.toast(`[自动每日奖励] 获取今日已获得的投币经验出错 ${response.message}`, 'caution');
                return delayCall(() => MY_API.DailyReward.run());
              }
            });
          } catch (err) {
            window.toast('[自动每日奖励]运行时出现异常', 'error');
            MYERROR(`自动每日奖励出错`, err);
            return $.Deferred().reject();
          }
        }
      },
      LiveReward: {
        dailySignIn: () => {
          return BAPI.xlive.dosign().then((response) => {
            MYDEBUG('LiveReward.dailySignIn: API.xlive.dosign', response);
            if (response.code === 0) {
              window.toast('[自动直播签到]完成', 'success');
              $('.hinter').remove(); // 移除签到按钮和小红点
              $('.checkin-btn').remove();
            } else if (response.code === 1011040) {
              window.toast('[自动直播签到]今日直播签到已完成', 'info')
            } else {
              window.toast(`[自动直播签到]失败 ${response.message}，尝试点击签到按钮`, 'caution');
              $('.checkin-btn').click();
              return delayCall(() => MY_API.LiveReward.dailySignIn());
            }
          });
        },
        run: () => {
          try {
            if (!MY_API.CONFIG.LIVE_SIGN || otherScriptsRunning) return $.Deferred().resolve();
            if (!checkNewDay(MY_API.CACHE.LiveReward_TS)) {
              // 同一天，不执行
              runMidnight(() => MY_API.LiveReward.run(), '直播签到');
              return $.Deferred().resolve();
            }
            MY_API.LiveReward.dailySignIn()
            MY_API.CACHE.LiveReward_TS = ts_ms();
            MY_API.saveCache();
            runMidnight(() => MY_API.LiveReward.run(), '直播签到');
          } catch (err) {
            window.toast('[自动直播签到]运行时出现异常', 'error');
            MYERROR(`自动直播签到出错`, err);
            return $.Deferred().reject();
          }
        }
      },
      Exchange: {
        coin2silver: (num) => {
          return BAPI.xlive.revenue.coin2silver(num).then((response) => {
            MYDEBUG('Exchange.coin2silver: API.Exchange.coin2silver', response);
            if (response.code === 0) {
              window.toast(`[硬币换银瓜子] ${response.msg}，获得${response.data.silver}银瓜子`, 'success');
            } else {
              // 其它状态码待补充
              window.toast(`[银瓜子换硬币] 失败 ${response.msg}`, 'caution');
              return delayCall(() => MY_API.Exchange.coin2silver(num));
            }
          });
        },
        silver2coin: () => {
          return BAPI.xlive.revenue.silver2coin().then((response) => {
            MYDEBUG('Exchange.silver2coin: API.Exchange.silver2coin', response);
            if (response.code === 0) {
              window.toast(`[银瓜子换硬币] ${response.msg}`, 'success'); // 兑换成功
            } else if (response.code === 403) {
              window.toast(`[银瓜子换硬币] ${response.msg}`, 'info'); // 每天最多能兑换 1 个 or 银瓜子余额不足
            } else {
              window.toast(`[银瓜子换硬币] 失败 ${response.msg}`, 'caution');
              return delayCall(() => MY_API.Exchange.silver2coin());
            }
          });
        },
        runC2S: () => {
          if (!MY_API.CONFIG.COIN2SILVER || otherScriptsRunning) return $.Deferred().resolve();
          if (!checkNewDay(MY_API.CACHE.Coin2Sliver_TS)) {
            // 同一天，不再兑换瓜子
            runMidnight(() => MY_API.Exchange.runC2S(), '硬币换瓜子');
            return $.Deferred().resolve();
          }
          return MY_API.Exchange.coin2silver(MY_API.CONFIG.COIN2SILVER_NUM).then(() => {
            MY_API.CACHE.Coin2Sliver_TS = ts_ms();
            MY_API.saveCache();
            runMidnight(() => MY_API.Exchange.runC2S(), '硬币换瓜子');
          }, () => delayCall(() => MY_API.Exchange.runC2S()))
        },
        runS2C: () => {
          try {
            if (!MY_API.CONFIG.SILVER2COIN || otherScriptsRunning) return $.Deferred().resolve();
            if (!checkNewDay(MY_API.CACHE.Silver2Coin_TS)) {
              // 同一天，不再兑换硬币
              runMidnight(() => MY_API.Exchange.runS2C(), '瓜子换硬币');
              return $.Deferred().resolve();
            }
            return MY_API.Exchange.silver2coin().then(() => {
              MY_API.CACHE.Silver2Coin_TS = ts_ms();
              MY_API.saveCache();
              runMidnight(() => MY_API.Exchange.runS2C(), '瓜子换硬币');
            }, () => delayCall(() => MY_API.Exchange.runS2C()));
          } catch (err) {
            window.toast('[银瓜子换硬币]运行时出现异常，已停止', 'error');
            MYERROR(`银瓜子换硬币出错`, err);
            return $.Deferred().reject();
          }
        }
      },
      Gift: {
        run_timer: undefined, // 可用来取消下次运行的计划 clearTimeout(MY_API.Gift.run_timer)
        ruid: undefined, // 包裹内礼物的ruid
        room_id: undefined, // 送礼目标房间号
        medal_list: undefined, // 勋章列表
        bag_list: undefined, // 包裹
        giftFeed_list: {}, // 每种礼物所对应的亲密度
        remain_feed: undefined, // 该勋章今日剩余亲密度
        over: undefined, // 是否结束送礼
        allowGiftList: undefined, // 允许被送出礼物的id
        /**
         * 获取礼物包裹
         */
        getBagList: async () => {
          return BAPI.gift.bag_list().then((response) => {
            MYDEBUG('Gift.getBagList: API.gift.bag_list', response);
            if (response.code === 0) {
              MY_API.Gift.bag_list = response.data.list;
            } else {
              window.toast(`[自动送礼]获取包裹列表失败，${response.message}`, 'error');
              return delayCall(() => MY_API.Gift.getBagList());
            }
          });
        },
        /**
         * 通过礼物id获取礼物的亲密度
         * @param {Number} gift_id 礼物id
         */
        getFeedByGiftID: (gift_id) => {
          if (gift_id === 30607) return 50; // 小心心
          for (let i = Live_info.gift_list.length - 1; i >= 0; --i) {
            if (Live_info.gift_list[i].id === gift_id) {
              return Math.ceil(Live_info.gift_list[i].price / 100);
            }
          }
          return 0;
        },
        /**
         * 排序粉丝勋章
         * @param {Object} medals 
         */
        sort_medals: (medals) => {
          if (MY_API.CONFIG.GIFT_SORT == 'GIFT_SORT_HIGH') {
            medals.sort((a, b) => {
              if (b.level - a.level == 0) {
                return b.intimacy - a.intimacy;
              }
              return b.level - a.level;
            });
          } else {
            medals.sort((a, b) => {
              if (a.level - b.level == 0) {
                return a.intimacy - b.intimacy;
              }
              return a.level - b.level;
            });
          }
          if (MY_API.CONFIG.AUTO_GIFT_ROOMID) {
            let sortRooms = [...MY_API.CONFIG.AUTO_GIFT_ROOMID];
            sortRooms.reverse();
            for (let froom of sortRooms) {
              let rindex = medals.findIndex(r => r.roomid == froom);
              if (rindex != -1) {
                let tmp = medals[rindex];
                medals.splice(rindex, 1);
                medals.unshift(tmp);
              }
            }
          }
          return medals;
        },
        /**
         * 送小心心点亮勋章
         */
        auto_light: async () => {
          try {
            const feed = MY_API.Gift.getFeedByGiftID(30607), // 小心心
              light_roomid = MY_API.CONFIG.LIGHT_MEDALS; // 点亮勋章房间号
            for (const m of MY_API.Gift.medal_list) {
              let remain_feed = m.day_limit - m.today_feed;
              if (MY_API.CONFIG.LIGHT_METHOD === 'LIGHT_WHITE') {
                // 白名单
                if (!(m.is_lighted === 0 && (remain_feed >= feed || MY_API.CONFIG.FORCE_LIGHT) &&
                  light_roomid.findIndex(it => it == m.roomid) > -1)) continue;
              } else {
                // 黑名单
                if (!(m.is_lighted === 0 && (remain_feed >= feed || MY_API.CONFIG.FORCE_LIGHT) &&
                  light_roomid.findIndex(it => it == m.roomid) === -1)) continue;
              }
              for (const g of MY_API.Gift.bag_list) {
                if (g.gift_id !== 30607 || g.gift_num <= 0) continue;
                let response = await BAPI.room.room_init(parseInt(m.roomid, 10)).then(re => {
                  MYDEBUG(`[自动送礼][自动点亮勋章] API.room.room_init(${m.roomid})`, re);
                  if (response.code !== 0) throw re.msg;
                });
                let send_room_id = parseInt(response.data.room_id, 10);
                const feed_num = 1;
                let rsp = await BAPI.gift.bag_send(Live_info.uid, 30607, m.target_id, feed_num, g.bag_id, send_room_id, Live_info.rnd).then(re => {
                  MYDEBUG(`[自动送礼][自动点亮勋章] API.gift.bag_send ${Live_info.uid}, 30607, ${m.target_id}, ${feed_num}, ${g.bag_id}, ${send_room_id}, ${Live_info.rnd}`, re);
                  if (re.code !== 0) throw re.msg;
                });
                if (rsp.code === 0) {
                  m.is_lighted = 1;
                  g.gift_num -= feed_num;
                  m.today_feed += feed_num * feed;
                  remain_feed -= feed_num * feed;
                  window.toast(`[自动送礼]勋章[${m.medalName}]点亮成功，送出${feed_num}个${g.gift_name}，[${m.today_feed}/${m.day_limit}]`, 'success');
                  MYDEBUG('Gift.auto_light', `勋章[${m.medalName}]点亮成功，送出${feed_num}个${g.gift_name}，[${m.today_feed}/${m.day_limit}]`);
                  break;
                } else {
                  window.toast(`[自动送礼]勋章[${m.medalName}]点亮失败【${rsp.msg}】`, 'caution');
                  break;
                }
              }
            }
          } catch (e) {
            console.error(e);
            window.toast(`[自动送礼]点亮勋章出错:${e}`, 'error');
          }
        },
        run: async (noTimeCheck = false) => {
          /**
           * 一轮送礼结束后运行的函数
           */
          const waitForNextRun = () => {
            window.toast('[自动送礼] 本次送礼结束', 'info');
            SEND_GIFT_NOW = false;
            if (MY_API.CONFIG.GIFT_METHOD == "GIFT_SEND_TIME") {
              let alternateTime = getIntervalTime(MY_API.CONFIG.GIFT_SEND_HOUR, MY_API.CONFIG.GIFT_SEND_MINUTE);
              MY_API.Gift.run_timer = setTimeout(() => MY_API.Gift.run(true), alternateTime);
              let runTime = new Date(ts_ms() + alternateTime).toLocaleString();
              MYDEBUG("[自动送礼]", `将在${runTime}进行自动送礼`);
              MY_API.CACHE.Gift_TS = ts_ms();
              MY_API.saveCache();
            } else {
              let alternateTime = MY_API.CONFIG.GIFT_INTERVAL * 60 * 1000;
              MY_API.Gift.run_timer = setTimeout(() => MY_API.Gift.run(true), alternateTime);
              MYDEBUG("[自动送礼]", `将在${MY_API.CONFIG.GIFT_INTERVAL}分钟后进行自动送礼`);
              MY_API.CACHE.GiftInterval_TS = ts_ms();
              MY_API.saveCache();
            }
          };
          /**
           * 处理用户输入的【允许被送出的礼物类型】，将礼物名转换为id
           */
          const handleGiftList = () => {
            MY_API.Gift.allowGiftList = [...MY_API.CONFIG.GIFT_ALLOW_TYPE];
            MYDEBUG('[自动送礼]', `处理前的礼物列表 ${MY_API.Gift.allowGiftList}`);
            for (let i = 0; i < MY_API.Gift.allowGiftList.length; i++) {
              const listItem = MY_API.Gift.allowGiftList[i];
              let matchItem;
              if (isNaN(listItem)) {
                // 如果填了礼物名，转换为id
                matchItem = Live_info.gift_list.find(item => item.name === listItem);
                if (matchItem) MY_API.Gift.allowGiftList[i] = String(matchItem.id);
              }
            }
            MYDEBUG('[自动送礼]', `处理后得到的礼物id列表 ${MY_API.Gift.allowGiftList}`)
          };
          /**
           * 获取礼物列表中的每种礼物所对应的亲密度，把结果保存至 giftFeed_list。
           * 格式：{ id1: feed1, id2: feed2, ... }
           */
          const getGiftFeed = async () => {
            for (const i of MY_API.Gift.bag_list) {
              if (!MY_API.Gift.giftFeed_list.hasOwnProperty(i.gift_id)) {
                MY_API.Gift.giftFeed_list[i.gift_id] = await MY_API.Gift.getFeedByGiftID(i.gift_id);
              }
            }
          }
          /**
           * 处理包裹。
           * 1. 根据礼物到期时间过滤包裹
           * 2. 按礼物亲密度由高到低排序
           * 3. 按过期时间由早到晚排序
           * @param filter 是否按设置过滤礼物
           */
          const handleBagList = (filter = true) => {
            let bag_list;
            if (!MY_API.CONFIG.SEND_ALL_GIFT && filter) {
              // 送之前查一次有没有可送的
              bag_list = MY_API.Gift.bag_list.filter(r => MY_API.Gift.allowGiftList.includes(String(r.gift_id)) && r.gift_num > 0 &&
                Number(r.corner_mark.substring(0, r.corner_mark.indexOf("天"))) <= MY_API.CONFIG.GIFT_LIMIT);
              MYDEBUG("[自动送礼] if分支 过滤后的礼物", bag_list);
              if (bag_list.length === 0) {
                MY_API.Gift.over = true;
                return;
              }
            } else {
              bag_list = MY_API.Gift.bag_list.filter(r => r.gift_num > 0 && r.corner_mark != '永久');
              MYDEBUG("[自动送礼] else分支 过滤后的礼物", bag_list);
              if (bag_list.length === 0) {
                MY_API.Gift.over = true;
                return;
              }
            }
            // 按礼物亲密度由高到低排序
            for (const i of bag_list) {
              i.gift_feed = MY_API.Gift.giftFeed_list[i.gift_id];
            }
            bag_list.sort(function (a, b) { return b.gift_feed - a.gift_feed });
            // 按过期时间由早到晚
            bag_list.sort(function (a, b) {
              if (b.gift_feed === a.gift_feed) {
                return a.expire_at - b.expire_at
              }
            });
            MY_API.Gift.bag_list = [...bag_list];
            MYDEBUG('Gift.bag_list (sorted)', MY_API.Gift.bag_list);
          };
          /**
           * 处理粉丝勋章
           * @param {Object} MY_API.Gift.medal_list 
           */
          const handleMedalList = () => {
            MY_API.Gift.medal_list = MY_API.Gift.medal_list.filter(it => it.day_limit - it.today_feed > 0 && it.level < 20 && it.roomid);
            MY_API.Gift.medal_list = MY_API.Gift.sort_medals(MY_API.Gift.medal_list);
            // 排除直播间
            if (MY_API.CONFIG.GIFT_SEND_METHOD === "GIFT_SEND_BLACK") {
              // 黑名单
              MY_API.Gift.medal_list = MY_API.Gift.medal_list.filter(Er => MY_API.CONFIG.GIFT_SEND_ROOM.findIndex(exp => exp == Er.roomid) == -1);
            } else {
              // 白名单
              MY_API.Gift.medal_list = MY_API.Gift.medal_list.filter(Er => MY_API.CONFIG.GIFT_SEND_ROOM.findIndex(exp => exp == Er.roomid) > -1);
            }
          }
          /**
           * 判断包裹内是否还有礼物
           * @returns {Boolean} 有礼物 true, 无礼物 false
           */
          const checkRemainGift = () => {
            return MY_API.Gift.bag_list.some(g => g.gift_num > 0) ? true : false;
          };
          try {
            if ((!MY_API.CONFIG.AUTO_GIFT && !LIGHT_MEDAL_NOW) || otherScriptsRunning) return $.Deferred().resolve();
            if (medalDanmuRunning) {
              // [自动送礼]【粉丝牌打卡】任务运行中
              return setTimeout(() => MY_API.Gift.run(), 3e3);
            }
            if (MY_API.Gift.run_timer) clearTimeout(MY_API.Gift.run_timer);
            if (MY_API.CONFIG.GIFT_METHOD == "GIFT_SEND_TIME" && !isTime(MY_API.CONFIG.GIFT_SEND_HOUR, MY_API.CONFIG.GIFT_SEND_MINUTE) && !SEND_GIFT_NOW && !LIGHT_MEDAL_NOW && !noTimeCheck) {
              // 定时送礼
              let alternateTime = getIntervalTime(MY_API.CONFIG.GIFT_SEND_HOUR, MY_API.CONFIG.GIFT_SEND_MINUTE);
              MY_API.Gift.run_timer = setTimeout(() => MY_API.Gift.run(true), alternateTime);
              let runTime = new Date(ts_ms() + alternateTime).toLocaleString();
              MYDEBUG("[自动送礼]", `将在${runTime}进行自动送礼`);
              return $.Deferred().resolve();
            } else if (MY_API.CONFIG.GIFT_METHOD == "GIFT_INTERVAL" && !SEND_GIFT_NOW && !LIGHT_MEDAL_NOW && !noTimeCheck) {
              // 间隔__分钟送礼
              let GiftInterval = MY_API.CONFIG.GIFT_INTERVAL * 60e3;
              if (MY_API.CACHE.GiftInterval_TS) {
                const interval = ts_ms() - MY_API.CACHE.GiftInterval_TS;
                if (interval < GiftInterval) {
                  let intervalTime = GiftInterval - interval;
                  MY_API.Gift.run_timer = setTimeout(() => MY_API.Gift.run(true), intervalTime);
                  MYDEBUG("[自动送礼]", `将在${intervalTime}毫秒后进行自动送礼`);
                  return $.Deferred().resolve();
                }
              }
              else {
                MY_API.CACHE.GiftInterval_TS = ts_ms();
                MY_API.saveCache();
              }
            }
            if (medal_info.status.state() === "resolved") MY_API.Gift.medal_list = [...medal_info.medal_list];
            else {
              window.toast('[自动送礼] 粉丝勋章列表未被完全获取，暂停运行', 'error');
              return medal_info.status.then(() => MY_API.Gift.run());
            }
            MYDEBUG('Gift.run: Gift.getMedalList().then: Gift.medal_list', MY_API.Gift.medal_list);
            MY_API.Gift.over = false; // 开始运行前先把停止运行设为 false
            handleGiftList();
            await MY_API.Gift.getBagList();
            await getGiftFeed();
            handleBagList(false);
            if (MY_API.Gift.over) return waitForNextRun();
            if (MY_API.Gift.medal_list.length > 0) {
              handleMedalList();
              await MY_API.Gift.auto_light(); // 点亮勋章
              if (LIGHT_MEDAL_NOW) {
                LIGHT_MEDAL_NOW = false;
                return $.Deferred().resolve();
              }
              handleBagList();
              if (MY_API.Gift.over) return waitForNextRun();
              for (const v of MY_API.Gift.medal_list) {
                if (!checkRemainGift()) {
                  MY_API.Gift.over = true;
                  break;
                }
                const response = await BAPI.room.room_init(parseInt(v.roomid, 10)).then(re => {
                  MYDEBUG(`[自动送礼] API.room.room_init(${v.roomid})`, re);
                  if (re.code !== 0) throw re.msg;
                  return re;
                });
                MY_API.Gift.room_id = parseInt(response.data.room_id, 10);
                MY_API.Gift.ruid = v.target_id;
                MY_API.Gift.remain_feed = v.day_limit - v.today_feed;
                if (MY_API.Gift.remain_feed > 0) {
                  window.toast(`[自动送礼]勋章[${v.medalName}] 今日亲密度未满[${v.today_feed}/${v.day_limit}]，预计需要[${MY_API.Gift.remain_feed}]送礼开始`, 'info');
                  await MY_API.Gift.sendGift(v);
                } else {
                  window.toast(`[自动送礼]勋章[${v.medalName}] 今日亲密度已满`, 'info');
                }
              }
            }
            if (!MY_API.Gift.over) await MY_API.Gift.sendRemainGift(MY_API.CONFIG.SPARE_GIFT_ROOM);
            return waitForNextRun();
          } catch (err) {
            window.toast('[自动送礼] 运行时出现异常，已停止', 'error');
            MYERROR(`自动送礼出错`, err);
            return delayCall(() => MY_API.Gift.run());
          }
        },
        sendGift: async (medal) => {
          for (const v of MY_API.Gift.bag_list) {
            if (MY_API.Gift.remain_feed <= 0) {
              return window.toast(`[自动送礼]勋章[${medal.medalName}]送礼结束，今日亲密度已满[${medal.today_feed}/${medal.day_limit}]`, 'info');
            }
            if (v.gift_num === 0) continue; // 如果这一礼物送完了则跳到下一个礼物
            const feed = MY_API.Gift.giftFeed_list[v.gift_id];
            if (feed > 0) {
              let feed_num = Math.floor(MY_API.Gift.remain_feed / feed);
              if (feed_num === 0) continue; // 当前礼物亲密度大于勋章今日剩余亲密度
              if (feed_num > v.gift_num) feed_num = v.gift_num;
              MYDEBUG(`[自动送礼]送出礼物类型${v.gift_name}，该项礼物数量${v.gift_num}，送出礼物数量${feed_num}`);
              await BAPI.gift.bag_send(Live_info.uid, v.gift_id, MY_API.Gift.ruid, feed_num, v.bag_id, MY_API.Gift.room_id, Live_info.rnd).then((response) => {
                MYDEBUG('Gift.sendGift: API.gift.bag_send', response);
                if (response.code === 0) {
                  v.gift_num -= feed_num;
                  medal.today_feed += feed_num * feed;
                  MY_API.Gift.remain_feed -= feed_num * feed;
                  window.toast(`[自动送礼]勋章[${medal.medalName}] 送礼成功，送出${feed_num}个${v.gift_name}，[${medal.today_feed}/${medal.day_limit}]距离今日亲密度上限还需[${MY_API.Gift.remain_feed}]`, 'success');
                } else {
                  window.toast(`[自动送礼]勋章[${medal.medalName}] 送礼异常：${response.msg}`, 'caution');
                  return delayCall(() => MY_API.Gift.sendGift(medal));
                }
              });
            }
          }
        },
        sendRemainGift: async (ROOM_ID) => {
          if (ROOM_ID == 0) return $.Deferred().resolve();
          let UID = undefined;
          await BAPI.room.room_init(ROOM_ID).then((response) => {
            MYDEBUG('API.room.room_init', response);
            if (response.code === 0) UID = response.data.uid;
            else {
              window.toast(`[自动送礼]【剩余礼物】检查房间出错 ${response.message}`);
              return delayCall(() => BAPI.room.room_init(ROOM_ID));
            }
          })
          let bag_list = MY_API.Gift.bag_list.filter(r => MY_API.Gift.allowGiftList.includes(String(r.gift_id)) && r.gift_num > 0 &&
            r.corner_mark == '1天');
          if (bag_list.length === 0) return;
          MYDEBUG('[自动送礼]【剩余礼物】bag_list', bag_list);
          for (const v of bag_list) {
            if (v.gift_num <= 0) continue;
            const feed = MY_API.Gift.giftFeed_list[v.gift_id];
            if (feed > 0) {
              let feed_num = v.gift_num;
              await BAPI.gift.bag_send(Live_info.uid, v.gift_id, UID, feed_num, v.bag_id, ROOM_ID, Live_info.rnd).then((response) => {
                MYDEBUG('Gift.sendGift: API.gift.bag_send', response);
                if (response.code === 0) {
                  v.gift_num -= feed_num;
                  window.toast(`[自动送礼]【剩余礼物】房间[${ROOM_ID}] 送礼成功，送出${feed_num}个${v.gift_name}`, 'success');
                } else {
                  window.toast(`[自动送礼]【剩余礼物】房间[${ROOM_ID}] 送礼异常：${response.msg}`, 'caution');
                  return delayCall(() => MY_API.Gift.sendGift(medal));
                }
              });
            }
          }
        }
      },
      stormQueue: [], // n节奏风暴队列
      stormBlack: false, // n节奏风暴黑屋
      stormIdSet: { // 风暴历史记录缓存
        add: function (id) {
          let storm_id_list = [];
          try {
            storm_id_list = GM_getValue(`stormIdSet`) || [];
            storm_id_list.push(id);
            if (storm_id_list.length > 50) {
              storm_id_list.splice(0, 10); // 删除前10条数据
            }
            GM_setValue(`stormIdSet`, storm_id_list);
            MYDEBUG(`storm_Id_list_add`, storm_id_list);
          } catch (e) {
            storm_id_list.push(id);
            GM_setValue(`stormIdSet`, storm_id_list);
          }
        },
        isIn: function (id) {
          let storm_id_list = [];
          try {
            storm_id_list = GM_getValue(`stormIdSet`) || [];
            MYDEBUG(`storm_Id_list_read`, config);
            return storm_id_list.indexOf(id) > -1
          } catch (e) {
            GM_setValue(`stormIdSet`, storm_id_list);
            MYDEBUG('读取' + `stormIdSet` + '缓存错误已重置');
            return storm_id_list.indexOf(id) > -1
          }
        }
      },
      Storm: {
        check: (id) => {
          return MY_API.stormQueue.indexOf(id) > -1;
        },
        append: (id) => {
          MY_API.stormQueue.push(id);
          if (MY_API.stormQueue.length > MY_API.CONFIG.STORM_QUEUE_SIZE) {
            MY_API.stormQueue.shift();
          }
        },
        over: (id) => {
          let index = MY_API.stormQueue.indexOf(id);
          if (index > -1) {
            MY_API.stormQueue.splice(id, 1);
          }
        },
        run: (roomid) => {
          try {
            if (!MY_API.CONFIG.STORM || otherScriptsRunning) return $.Deferred().resolve();
            //if (Info.blocked) return $.Deferred().resolve();
            if (MY_API.stormBlack) return $.Deferred().resolve();
            return BAPI.Storm.check(roomid).then((response) => {
              MYDEBUG('MY_API.Storm.run: MY_API.API.Storm.check', response);
              if (response.code === 0) {
                let data = response.data;
                MY_API.Storm.join(data.id, data.roomid, Math.round(new Date().getTime() / 1000) + data.time);
                return $.Deferred().resolve();
              } else {
                window.toast(`[自动抽奖][节奏风暴](roomid=${roomid}) ${response.msg}`, 'caution');
                //return delayCall(() => MY_API.Storm.run(roomid));
              }
            });
          } catch (err) {
            window.toast('[自动抽奖][节奏风暴]运行时出现异常', 'error');
            MYERROR(`节奏风暴出错`, err);
            return $.Deferred().reject();
          }
        },
        join: (id, roomid, endtime) => {
          //if (Info.blocked) return $.Deferred().resolve();
          roomid = parseInt(roomid, 10);
          id = parseInt(id, 10);
          if (isNaN(roomid) || isNaN(id)) return $.Deferred().reject();
          let tid = Math.round(id / 1000000);
          if (MY_API.stormIdSet.isIn(tid)) return $.Deferred().resolve();
          MY_API.stormIdSet.add(tid);
          if (MY_API.Storm.check(id)) {
            return;
          }
          MY_API.Storm.append(id);
          let stormInterval = 0;
          if (endtime <= 0) {
            endtime = Math.round(new Date().getTime() / 1000) + 90;
          }
          let count = 0;
          window.toast(`[自动抽奖][节奏风暴]尝试抽奖(roomid=${roomid},id=${id})`, 'success');
          async function process() {
            try {
              if (!MY_API.Storm.check(id)) {
                clearInterval(stormInterval);
                return;
              }
              let timenow = Math.round(new Date().getTime() / 1000);
              if (timenow > endtime && endtime > 0) {
                MY_API.Storm.over(id);
                clearInterval(stormInterval);
                //window.toast(`[自动抽奖][节奏风暴]抽奖(roomid=${roomid},id=${id})过期。  \n尝试次数:${count}`, 'caution');
                return;
              }
              count++;
              if (count > MY_API.CONFIG.STORM_MAX_COUNT && MY_API.CONFIG.STORM_MAX_COUNT > 0) {
                MY_API.Storm.over(id);
                clearInterval(stormInterval);
                window.toast(`[自动抽奖][节奏风暴]抽奖(roomid=${roomid},id=${id})到达尝试次数。  \n尝试次数:${count},距离到期:${endtime - timenow}s`, 'caution');
                return;
              }
              let response;
              try {
                if (userToken && appToken && userToken.access_token) {
                  response = await BAPI.Storm.join_ex(id, roomid, userToken.access_token, BilibiliToken.appKey, BilibiliToken.headers);
                } else {
                  response = await BAPI.Storm.join(id, captcha_token = '', captcha_phrase = '', roomid);
                }
                MYDEBUG('MY_API.Storm.join: MY_API.API.Storm.join', response);
                if (response.code) {
                  if (response.msg.indexOf("领取") > -1) {
                    MY_API.Storm.over(id);
                    clearInterval(stormInterval);
                    window.toast(`[自动抽奖][节奏风暴]领取(roomid=${roomid},id=${id})成功,${response.msg}  \n尝试次数:${count}`, 'success');
                    return;
                  }
                  if (response.msg.indexOf("验证码") > -1) {
                    MY_API.Storm.over(id);
                    clearInterval(stormInterval);
                    MY_API.stormBlack = true;
                    window.toast(`[自动抽奖][节奏风暴]抽奖(roomid=${roomid},id=${id})失败,疑似账号不支持,${response.msg}`, 'caution');
                    return;
                  }
                  if (response.data && response.data.length == 0 && response.msg.indexOf("下次要更快一点") != -1) {
                    MY_API.Storm.over(id);
                    window.toast(`[自动抽奖][节奏风暴]抽奖(roomid=${roomid},id=${id})疑似风暴黑屋,终止！`, 'error');
                    clearInterval(stormInterval);
                    MY_API.stormBlack = true;
                    setTimeout(() => { MY_API.stormBlack = false; }, 3600 * 1000);
                    return;
                  }
                  if (response.msg.indexOf("下次要更快一点") === -1) {
                    clearInterval(stormInterval);
                    return;
                  }
                  //setTimeout(()=>process(),CONFIG.AUTO_LOTTERY_CONFIG.STORM_CONFIG.STORM_ONE_LIMIT);
                } else {
                  MY_API.Storm.over(id);
                  Statistics.appendGift(response.data.gift_name, response.data.gift_num);
                  window.toast(`[自动抽奖][节奏风暴]领取(roomid=${roomid},id=${id})成功,${response.data.gift_name + "x" + response.data.gift_num}  \n${response.data.mobile_content}  \n尝试次数:${count}`, 'success');
                  clearInterval(stormInterval);
                  return;
                }
              } catch (e) {
                MY_API.Storm.over(id);
                window.toast(`[自动抽奖][节奏风暴]抽奖(roomid=${roomid},id=${id})疑似触发风控,终止！  \n尝试次数:${count}`, 'error');
                MYERROR('节奏风暴疑似触发风控', `roomid = ${roomid}`, `id = ${id}`, e);
                clearInterval(stormInterval);
                return;
              }
            }
            catch (e) {
              MY_API.Storm.over(id);
              window.toast(`[自动抽奖][节奏风暴]抽奖(roomid=${roomid},id=${id})抽奖异常,终止！`, 'error');
              MYERROR('节奏风暴抽奖异常', `roomid = ${roomid}`, `id = ${id}`, e);
              clearInterval(stormInterval);
              return;
            }
          }
          //setTimeout(()=>process(),1);
          stormInterval = setInterval(() => process(), MY_API.CONFIG.STORM_ONE_LIMIT);
          return $.Deferred().resolve();
        }
      },
      LITTLE_HEART: {
        getInfo: () => XHR({
          GM: true,
          anonymous: true,
          method: 'GET',
          url: `https://passport.bilibili.com/x/passport-login/oauth2/info?${appToken.signLoginQuery(`access_key=${userToken.access_token}`)}`,
          responseType: 'json',
          headers: appToken.headers
        }),
        RandomHex: (length) => {
          const words = '0123456789abcdef';
          let randomID = '';
          randomID += words[Math.floor(Math.random() * 15) + 1];
          for (let i = 0; i < length - 1; i++)
            randomID += words[Math.floor(Math.random() * 16)];
          return randomID;
        },
        uuid: () => MY_API.LITTLE_HEART.RandomHex(32).replace(/(\w{8})(\w{4})\w(\w{3})\w(\w{3})(\w{12})/, `$1-$2-4$3-${'89ab'[Math.floor(Math.random() * 4)]}$4-$5`),
        getFansMedal: async () => {
          const funsMedals = await XHR({
            GM: true,
            anonymous: true,
            method: 'GET',
            url: `https://api.live.bilibili.com/fans_medal/v1/FansMedal/get_list_in_room?${BilibiliToken.signQuery(`access_key=${userToken.access_token}&target_id=${Live_info.tid}&uid=${Live_info.uid}&${baseQuery}`)}`,
            responseType: 'json',
            headers: appToken.headers
          });
          MYDEBUG('[小心心] getFansMedal', funsMedals.response);
          if (funsMedals !== undefined && funsMedals.response.status === 200)
            if (funsMedals.body.code === 0)
              if (funsMedals.body.data.length > 0)
                return funsMedals.body.data.filter(m => m.room_id !== 0);
        },
        getGiftNum: async () => {
          let todayHeart = 0;
          await BAPI.gift.bag_list().then((re) => {
            MYDEBUG('[小心心]检查包裹 API.gift.bag_list', re);
            if (re.code === 0) {
              const allHeart = re.data.list.filter(r => r.gift_id == 30607 && r.corner_mark == "7天");
              for (const heart of allHeart) {
                todayHeart += heart.gift_num;
              }
            } else {
              window.toast(`[小心心] 获取包裹数据失败 ${re.message}`);
              return delayCall(() => BAPI.gift.bag_list());
            }
          });
          MYDEBUG(`[小心心]检测到包裹内7天小心心数量`, todayHeart);
          return todayHeart
        },
        mobileHeartBeat: async (postJSON) => {
          const wasm = new WasmHash();
          await wasm.init();
          const clientSign = (data) => wasm.hash('BLAKE2b512', wasm.hash('SHA3-384', wasm.hash('SHA384', wasm.hash('SHA3-512', wasm.hash('SHA512', JSON.stringify(data))))));
          const sign = clientSign(postJSON);
          let postData = '';
          for (const i in postJSON)
            postData += `${i}=${encodeURIComponent(postJSON[i])}&`;
          postData += `client_sign=${sign}`;
          const mobileHeartBeat = await XHR({
            GM: true,
            anonymous: true,
            method: 'POST',
            url: 'https://live-trace.bilibili.com/xlive/data-interface/v1/heartbeat/mobileHeartBeat',
            data: BilibiliToken.signQuery(`access_key=${userToken.access_token}&${postData}&${baseQuery}`),
            responseType: 'json',
            headers: appToken.headers
          });
          MYDEBUG('[小心心] mobileHeartBeat', mobileHeartBeat.response);
          if (mobileHeartBeat !== undefined && mobileHeartBeat.response.status === 200)
            if (mobileHeartBeat.body.code === 0)
              return true;
          return false;
        },
        run: async () => {
          if (!MY_API.CONFIG.LITTLE_HEART || otherScriptsRunning) return $.Deferred().resolve();
          if (!checkNewDay(MY_API.CACHE.LittleHeart_TS)) {
            runMidnight(() => MY_API.LITTLE_HEART.run(), '获取小心心');
            return $.Deferred().resolve();
          }
          const mobileHeartBeatJSON = {
            platform: 'android',
            uuid: MY_API.LITTLE_HEART.uuid(),
            buvid: appToken.buvid,
            seq_id: '1',
            room_id: '{room_id}',
            parent_id: '6',
            area_id: '283',
            timestamp: '{timestamp}',
            secret_key: 'axoaadsffcazxksectbbb',
            watch_time: '60',
            up_id: '{target_id}',
            up_level: '40',
            jump_from: '30000',
            gu_id: MY_API.LITTLE_HEART.RandomHex(43),
            play_type: '0',
            play_url: '',
            s_time: '0',
            data_behavior_id: '',
            data_source_id: '',
            up_session: 'l:one:live:record:{room_id}:{last_wear_time}',
            visit_id: MY_API.LITTLE_HEART.RandomHex(32),
            watch_status: '%7B%22pk_id%22%3A0%2C%22screen_status%22%3A1%7D',
            click_id: MY_API.LITTLE_HEART.uuid(),
            session_id: '',
            player_type: '0',
            client_ts: '{client_ts}'
          };
          const endFunc = async (check = true) => {
            if (check) await sleep(5000); // 小心心获取有延时等待5秒
            if (!check || await MY_API.LITTLE_HEART.getGiftNum() >= 24) {
              window.toast('[小心心]今日小心心已全部获取', 'success');
              MY_API.CACHE.LittleHeart_TS = ts_ms();
              MY_API.saveCache();
              return runMidnight(() => MY_API.LITTLE_HEART.run(), '获取小心心');
            } else { // 出于某些原因心跳次数到到了但小心心个数没到，再次运行
              window.toast('[小心心]小心心未全部获取，60秒后将再次运行', 'info');
              return setTimeout(() => MY_API.LITTLE_HEART.run(), 60 * 1000)
            }
          }
          if (await setToken() === undefined)
            return;
          else if (!userToken.access_token && !userToken.mid && !userToken.refresh_token) {
            const userInfo = await MY_API.LITTLE_HEART.getInfo();
            MYDEBUG('[小心心]userInfo', userInfo);
            if (userInfo === undefined)
              return MYERROR('小心心', '获取用户信息错误');
            if (userInfo.body.code !== 0 && await setToken() === undefined)
              return;
            else if (userInfo.body.data.mid !== Live_info.uid && await setToken() === undefined)
              return;
          };
          MYDEBUG('[小心心] 开始客户端心跳 userToken.access_token', userToken.access_token);
          window.toast('[小心心]开始获取小心心', 'success');
          const giftNum = await MY_API.LITTLE_HEART.getGiftNum();
          if (giftNum < 24) {
            const fansMedal = await MY_API.LITTLE_HEART.getFansMedal();
            if (fansMedal !== undefined) {
              const control = 24 - giftNum;
              const loopNum = Math.ceil(control / fansMedal.length) * 5;
              for (let i = 0; i < loopNum; i++) {
                let count = 0;
                for (const funsMedalData of fansMedal) {
                  if (count >= control) break;
                  const postData = Object.assign({}, mobileHeartBeatJSON, {
                    room_id: funsMedalData.room_id.toString(),
                    timestamp: (BilibiliToken.TS - 60).toString(),
                    up_id: funsMedalData.target_id.toString(),
                    up_session: `l:one:live:record:${funsMedalData.room_id}:${funsMedalData.last_wear_time}`,
                    client_ts: BilibiliToken.TS.toString()
                  });
                  await MY_API.LITTLE_HEART.mobileHeartBeat(postData);
                  count++;
                }
                await sleep(60 * 1000);
              }
              return endFunc();
            }
          } else {
            return endFunc(false);
          }
        }
      },
      AUTO_DANMU: {
        setValue: (array, index) => {
          if (MY_API.CONFIG[array][index] === undefined && index > 0)
            return MY_API.AUTO_DANMU.setValue(array, index - 1);
          else return MY_API.CONFIG[array][index];
        },
        sendDanmu: async (danmuContent, roomId) => {
          let realRoomId = roomId;
          if (Number(roomId) <= 10000) {
            realRoomId = await BAPI.room.get_info(roomId).then((res) => {
              MYDEBUG(`API.room.get_info roomId=${roomId} res`, res); // 可能是短号，要用长号发弹幕
              if (res.code === 0) {
                return res.data.room_id;
              } else {
                window.toast(`[自动发弹幕]房间号【${roomId}】信息获取失败 ${res.message}`, 'error');
                return roomId
              }
            });
          }
          return BAPI.sendLiveDanmu(danmuContent, realRoomId).then((response) => {
            MYDEBUG(`[自动发弹幕]弹幕发送内容【${danmuContent}】，房间号【${roomId}】`, response);
            if (response.code === 0) {
              window.toast(`[自动发弹幕]弹幕【${danmuContent}】（房间号【${roomId}】）发送成功`, 'success');
            } else {
              window.toast(`[自动发弹幕]弹幕【${danmuContent}】（房间号【${roomId}】）出错 ${response.msg}`, 'caution');
            }
          })
        },
        getMaxLength: () => {
          let maxLength = undefined;
          const contentLength = MY_API.CONFIG.DANMU_CONTENT.length,
            roomidLength = MY_API.CONFIG.DANMU_ROOMID.length,
            intervalTimeLength = MY_API.CONFIG.DANMU_INTERVAL_TIME.length;
          if (contentLength >= roomidLength) maxLength = contentLength;
          else maxLength = roomidLength;
          if (maxLength < intervalTimeLength)
            maxLength = intervalTimeLength;
          return maxLength
        },
        run: async () => {
          if (!MY_API.CONFIG.AUTO_DANMU || otherScriptsRunning) return $.Deferred().resolve();
          if (medalDanmuRunning) {
            // [自动发弹幕]【粉丝牌打卡】任务运行中
            return setTimeout(() => MY_API.AUTO_DANMU.run(), 3e3);
          }
          danmuTaskRunning = true;
          if (SEND_DANMU_NOW) {
            for (let i = 0; i < MY_API.CONFIG.DANMU_CONTENT.length; i++) {
              let danmu_content = MY_API.AUTO_DANMU.setValue('DANMU_CONTENT', i),
                danmu_roomid = parseInt(MY_API.AUTO_DANMU.setValue('DANMU_ROOMID', i));
              await MY_API.AUTO_DANMU.sendDanmu(danmu_content, danmu_roomid);
              await sleep(1000);
            }
            SEND_DANMU_NOW = false;
          } else {
            let maxLength = MY_API.AUTO_DANMU.getMaxLength();
            for (let i = 0; i < maxLength; i++) {
              let danmu_content = MY_API.AUTO_DANMU.setValue('DANMU_CONTENT', i),
                danmu_roomid = parseInt(MY_API.AUTO_DANMU.setValue('DANMU_ROOMID', i)),
                danmu_intervalTime = MY_API.AUTO_DANMU.setValue('DANMU_INTERVAL_TIME', i), // 设置-发送时间
                lastSendTime = undefined, // 上次发弹幕的时间戳(毫秒)
                jsonCache = MY_API.CACHE.AUTO_SEND_DANMU_TS,
                objIndex = undefined, // 弹幕缓存下标
                isTimeData = undefined, // 是否是时间点数据(eg 9:01)
                intervalTime = undefined, // 据上次发弹幕的时间(毫秒)
                danmu_intervalTime_Ts = undefined, // 间隔时间
                sleepTime = 0;
              function getDanmuCache() {
                for (let i = 0; i < jsonCache.length; i++) {
                  const obj = jsonCache[i];
                  if (obj.roomid == danmu_roomid && obj.content == danmu_content) {
                    lastSendTime = obj.sendTs
                    objIndex = i;
                    break;
                  }
                }
              }
              if (danmu_intervalTime.indexOf(':') > -1) { // 时间
                isTimeData = true;
                const danmu_time = danmu_intervalTime.split(':'); // 小时，分钟，秒
                const hour = parseInt(danmu_time[0]), minute = parseInt(danmu_time[1]), second = parseInt(danmu_time[2]);
                if (!isTime(hour, minute, second)) sleepTime = getIntervalTime(hour, minute, second);
                else sleepTime = 86400000;
              }
              else {
                isTimeData = false;
                danmu_intervalTime = danmu_intervalTime.toLowerCase();
                if (danmu_intervalTime.indexOf('h') > -1 || danmu_intervalTime.indexOf('m') > -1 || danmu_intervalTime.indexOf('s') > -1) {
                  const hourArray = danmu_intervalTime.split('h'); // 1h5m3s
                  const minuteArray = (hourArray[1] === undefined) ? hourArray[0].split('m') : hourArray[1].split('m');
                  const secondArray = (minuteArray[1] === undefined) ? minuteArray[0].split('s') : minuteArray[1].split('s');
                  const hour = hourArray[0],
                    minute = minuteArray[0],
                    second = secondArray[0];
                  const finalHour = isNaN(hour) ? 0 : hour || 0,
                    finalMinute = isNaN(minute) ? 0 : minute || 0,
                    finalSecond = isNaN(second) ? 0 : second || 0;
                  danmu_intervalTime_Ts = finalHour * 3600000 + finalMinute * 60000 + finalSecond * 1000;
                } else { // 没有h或m或s则默认是分钟
                  danmu_intervalTime_Ts = danmu_intervalTime * 60000;
                }
              }
              MYDEBUG('[自动发弹幕]MY_API.CACHE.AUTO_SEND_DANMU_TS => jsoncache', jsonCache);
              getDanmuCache();
              if (!isTimeData) {
                if (lastSendTime) intervalTime = ts_ms() - lastSendTime;
                else intervalTime = ts_ms();
              }
              const setCache = () => {
                const newJson = {
                  roomid: danmu_roomid,
                  content: danmu_content,
                  sendTs: ts_ms()
                };
                getDanmuCache();
                if (objIndex === undefined) {
                  jsonCache.push(newJson);
                } else {
                  jsonCache[objIndex].sendTs = ts_ms();
                }
                MY_API.CACHE.AUTO_SEND_DANMU_TS = jsonCache;
                return MY_API.saveCache(false);
              };
              const sendNextDanmu = (intervalTS, isTime) => {
                if (!isTime) setCache();
                return setTimeout(async () => {
                  await MY_API.AUTO_DANMU.sendDanmu(danmu_content, danmu_roomid);
                  if (!isTime) setCache();
                  return sendNextDanmu(intervalTS, isTime);
                }, intervalTS);
              }
              if (!isTimeData && intervalTime >= danmu_intervalTime_Ts) {
                // 非时间点数据，距上次发送的时间大于间隔时间
                await MY_API.AUTO_DANMU.sendDanmu(danmu_content, danmu_roomid);
                MYDEBUG(`[自动发弹幕]弹幕发送内容【${danmu_content}】，房间号【${danmu_roomid}】，距下次发送还有`, danmu_intervalTime);
                sendNextDanmu(danmu_intervalTime_Ts, isTimeData);
              } else if (isTimeData && !sleepTime) {
                // 时间点数据，立刻发送
                await MY_API.AUTO_DANMU.sendDanmu(danmu_content, danmu_roomid);
                MYDEBUG(`[自动发弹幕]弹幕发送内容【${danmu_content}】，房间号【${danmu_roomid}】，距下次发送还有`, '24小时');
                sendNextDanmu(sleepTime, isTimeData);
              }
              else {
                // 时间点数据，需等待一段时间再发送
                MYDEBUG(`[自动发弹幕]弹幕发送内容【${danmu_content}】，房间号【${danmu_roomid}】，距下次发送还有`, `${(!isTimeData) ? (danmu_intervalTime_Ts - intervalTime) / 60000 : sleepTime / 60000}分钟`);
                setTimeout(async () => {
                  await MY_API.AUTO_DANMU.sendDanmu(danmu_content, danmu_roomid);
                  sendNextDanmu((isTimeData) ? 86400000 : danmu_intervalTime_Ts, isTimeData);
                }, (isTimeData) ? sleepTime : danmu_intervalTime_Ts - intervalTime);
              }
              await sleep(1500);
            }
          }
          danmuTaskRunning = false;
        }
      },
      MEDAL_DANMU: {
        medal_list: [],
        sendDanmu: async (danmuContent, roomId, medal_name) => {
          let realRoomId = roomId;
          if (Number(roomId) <= 10000) {
            realRoomId = await BAPI.room.get_info(roomId).then((res) => {
              MYDEBUG(`API.room.get_info roomId=${roomId} res`, res); // 可能是短号，要用长号发弹幕
              if (res.code === 0) {
                return res.data.room_id;
              } else {
                window.toast(`[粉丝牌打卡弹幕] 房间号【${roomId}】信息获取失败 ${res.message}`, 'error');
                return roomId;
              }
            })
          }
          return BAPI.sendLiveDanmu(danmuContent, realRoomId).then((response) => {
            MYDEBUG(`[粉丝牌打卡弹幕] 弹幕发送内容【${danmuContent}】，房间号【${roomId}】，粉丝勋章【${medal_name}】`, response);
            if (response.code === 0) {
              return window.toast(`[粉丝牌打卡弹幕] 弹幕【${danmuContent}】发送成功，房间号【${roomId}】，粉丝勋章【${medal_name}】已点亮，当前亲密度+100`, 'success');
            } else {
              return window.toast(`[粉丝牌打卡弹幕] 弹幕【${danmuContent}】（房间号【${roomId}】，粉丝勋章【${medal_name}】）出错 ${response.msg}`, 'caution');
            }
          })
        },
        run: async () => {
          if (!MY_API.CONFIG.MEDAL_DANMU || otherScriptsRunning) return $.Deferred().resolve();
          if (!checkNewDay(MY_API.CACHE.MedalDanmu_TS)) {
            runMidnight(() => MY_API.MEDAL_DANMU.run(), '粉丝勋章打卡弹幕');
            return $.Deferred().resolve();
          }
          if (danmuTaskRunning) {
            // [粉丝牌打卡]【自动发弹幕】任务运行中
            return setTimeout(() => MY_API.MEDAL_DANMU.run(), 3e3);
          }
          if (medal_info.status.state() === "resolved") MY_API.MEDAL_DANMU.medal_list = [...medal_info.medal_list];
          else {
            window.toast('[粉丝牌打卡] 粉丝勋章列表未被完全获取，暂停运行', 'error');
            return medal_info.status.then(() => MY_API.MEDAL_DANMU.run());
          }
          medalDanmuRunning = true;
          let lightMedalList;
          if (MY_API.CONFIG.MEDAL_DANMU_METHOD === 'MEDAL_DANMU_WHITE')
            lightMedalList = MY_API.MEDAL_DANMU.medal_list.filter(r => MY_API.CONFIG.MEDAL_DANMU_ROOM.findIndex(m => m == r.roomid) > -1 && r.medal_level <= 20 && r.roomid);
          else {
            lightMedalList = MY_API.MEDAL_DANMU.medal_list.filter(r => MY_API.CONFIG.MEDAL_DANMU_ROOM.findIndex(m => m == r.roomid) === -1 && r.medal_level <= 20 && r.roomid);
          }
          MYDEBUG('[粉丝牌打卡] 过滤后的粉丝勋章房间列表', lightMedalList);
          let danmuContentIndex = 0;
          const configDanmuLength = MY_API.CONFIG.MEDAL_DANMU_CONTENT.length;
          // 第一轮
          for (const up of lightMedalList) {
            if (danmuContentIndex >= configDanmuLength) danmuContentIndex = 0;
            const medal_name = up.medal_name,
              roomid = up.roomid,
              danmuContent = MY_API.CONFIG.MEDAL_DANMU_CONTENT[danmuContentIndex];
            await MY_API.MEDAL_DANMU.sendDanmu(danmuContent, roomid, medal_name);
            danmuContentIndex++;
            await sleep(MY_API.CONFIG.MEDAL_DANMU_INTERVAL * 1000);
          }
          medalDanmuRunning = false;
          window.toast('[粉丝牌打卡弹幕] 今日已完成', 'success');
          MY_API.CACHE.MedalDanmu_TS = ts_ms();
          MY_API.saveCache();
          return runTomorrow(() => MY_API.MEDAL_DANMU.run(), 0, 2, '粉丝勋章打卡弹幕');
        }
      },
      MaterialObject: { // 实物
        list: [],
        firstAid: undefined,
        run: () => {
          try {
            if (!MY_API.CONFIG.MATERIAL_LOTTERY || otherScriptsRunning) return $.Deferred().resolve();
            if (MY_API.CACHE.MaterialObject_TS) {
              const diff = ts_ms() - MY_API.CACHE.MaterialObject_TS;
              const interval = MY_API.CONFIG.MATERIAL_LOTTERY_CHECK_INTERVAL * 60e3 || 600e3;
              if (diff < interval) {
                MYDEBUG('[实物抽奖]', `${interval - diff}毫秒后再次运行`);
                setTimeout(MY_API.MaterialObject.run, interval - diff);
                return $.Deferred().resolve();
              }
            };
            MY_API.chatLog('[实物抽奖] 开始寻找可参加的抽奖');
            return MY_API.MaterialObject.check().then((aid) => {
              if (aid) { // aid有效
                MY_API.CACHE.last_aid = aid;
                MY_API.CACHE.MaterialObject_TS = ts_ms();
                MY_API.saveCache();
              }
              MYDEBUG('[实物抽奖]', `将在${MY_API.CONFIG.MATERIAL_LOTTERY_CHECK_INTERVAL}分钟后再次运行实物抽奖`);
              setTimeout(MY_API.MaterialObject.run, MY_API.CONFIG.MATERIAL_LOTTERY_CHECK_INTERVAL * 60e3 || 600e3);
            }, () => delayCall(() => MY_API.MaterialObject.run()));
          } catch (err) {
            MY_API.chatLog('[实物抽奖]运行时出现异常', 'error');
            MYERROR(`实物抽奖出错`, err);
            return $.Deferred().reject();
          }
        },
        check: (aid, valid = 710, rem = MY_API.CONFIG.MATERIAL_LOTTERY_REM || 9) => { // TODO valid起始aid rem + 1检查次数
          aid = parseInt(aid || (MY_API.CACHE.last_aid), 10);
          if (isNaN(aid)) aid = valid;
          MYDEBUG('API.MaterialObject.check: aid=', aid);
          return BAPI.Lottery.MaterialObject.getStatus(aid).then((response) => {
            MYDEBUG('API.MaterialObject.check: API.MY_API.MaterialObject.getStatus', response);
            if (response.code === 0 && response.data) {
              if (response.data.typeB[response.data.typeB.length - 1].status != 3 && MY_API.MaterialObject.firstAid === undefined)
                MY_API.MaterialObject.firstAid = aid;
              if (MY_API.CONFIG.MATERIAL_LOTTERY_IGNORE_QUESTIONABLE_LOTTERY) {
                for (const str of MY_API.CONFIG.QUESTIONABLE_LOTTERY) {
                  if (!isRegexp.test(str)) {
                    if (response.data.title.toLowerCase().indexOf(str.toLowerCase()) > -1) {
                      MY_API.chatLog(`[实物抽奖] 忽略存疑抽奖<br>${response.data.title} (aid = ${aid})<br>含有关键字：` + str, 'warning');
                      return MY_API.MaterialObject.check(aid + 1, aid);
                    }
                  }
                  else {
                    const reg = eval(str);
                    if (reg.test(response.data.title)) {
                      MY_API.chatLog(`[实物抽奖] 忽略存疑抽奖<br>${response.data.title} (aid = ${aid})<br>匹配正则：` + str, 'warning');
                      return MY_API.MaterialObject.check(aid + 1, aid);
                    }
                  }
                }
              }
              return MY_API.MaterialObject.join(aid, response.data.title, response.data.typeB).then(() => MY_API.MaterialObject.check(aid + 1, aid));
            } else if (response.code === -400 || response.data == null) { // 活动不存在
              if (rem) return MY_API.MaterialObject.check(aid + 1, valid, rem - 1);
              return $.Deferred().resolve(MY_API.MaterialObject.firstAid || valid);
            } else {
              MY_API.chatLog(`[实物抽奖] 获取抽奖(aid=${aid})状态失败 ${response.msg}`, 'warning');
              return delayCall(() => MY_API.MaterialObject.check(aid, valid));
            }
          });
        },
        join: (aid, title, typeB, i = 0) => {
          if (i >= typeB.length) return $.Deferred().resolve();
          if (MY_API.MaterialObject.list.some(v => v.aid === aid && v.number === i + 1))
            return MY_API.MaterialObject.join(aid, title, typeB, i + 1);
          const number = i + 1;
          let obj = {
            title: title,
            aid: aid,
            number: number,
            status: typeB[i].status,
            join_start_time: typeB[i].join_start_time, //开始时间戳
            join_end_time: typeB[i].join_end_time, //结束时间戳
            list: typeB[i].list, //礼物列表
            jpName: ''
          };
          for (const i of obj.list) {
            obj.jpName = obj.jpName.concat(' ', i.jp_name);
          }
          switch (obj.status) {
            case -1: // 未开始
              {
                MY_API.chatLog(`[实物抽奖] 将在<br>${new Date((obj.join_start_time + 1) * 1000).toLocaleString()}参加抽奖<br>"${obj.title}"<br>aid = ${obj.aid}，第${i + 1}轮<br>奖品：${obj.jpName}`, 'info');
                MY_API.MaterialObject.list.push(obj);
                const p = $.Deferred();
                p.then(() => {
                  return MY_API.MaterialObject.draw(obj);
                });
                setTimeout(() => {
                  p.resolve();
                }, (obj.join_start_time - ts_s() + 1) * 1e3);
              }
              break;
            case 0: // 可参加
              return MY_API.MaterialObject.draw(obj).then(() => {
                return MY_API.MaterialObject.join(aid, title, typeB, i + 1);
              });
            case 1: // 已参加
              {
                MY_API.chatLog(`[实物抽奖] 已参加抽奖<br>"${obj.title}"<br>aid = ${obj.aid} 第${i + 1}轮<br>奖品：${obj.jpName}`, 'info');
                MY_API.MaterialObject.list.push(obj);
                const p = $.Deferred();
                p.then(() => {
                  return MY_API.MaterialObject.notice(obj);
                });
                setTimeout(() => {
                  p.resolve();
                }, (obj.join_end_time - ts_s() + 1) * 1e3);
              }
              break;
          }
          return MY_API.MaterialObject.join(aid, title, typeB, i + 1);
        },
        draw: (obj) => {
          return BAPI.Lottery.MaterialObject.draw(obj.aid, obj.number).then((response) => {
            MYDEBUG('API.MaterialObject.check: API.MY_API.MaterialObject.draw',
              response);
            if (response.code === 0) {
              $.each(MY_API.MaterialObject.list, (i, v) => {
                if (v.aid === obj.aid && v.number === obj.number) {
                  v.status = 1;
                  MY_API.MaterialObject.list[i] = v;
                  return false;
                }
              });
              MY_API.chatLog(`[实物抽奖] 成功参加抽奖<br>${obj.title}<br>aid = ${obj.aid}，第${obj.number}轮<br>奖品：${obj.jpName}`, 'success');
              MY_API.addMaterial();
              const p = $.Deferred();
              p.then(() => {
                return MY_API.MaterialObject.notice(obj);
              });
              setTimeout(() => {
                p.resolve();
              }, (obj.join_end_time - ts_s() + 1) * 1e3);
            } else {
              MY_API.chatLog(
                `[实物抽奖] 参加"${obj.title}"(aid = ${obj.aid}，第${obj.number}轮)失败<br>${response.msg}`,
                'warning');
              return delayCall(() => MY_API.MaterialObject.draw(obj));
            }
          });
        },
        notice: (obj) => {
          return BAPI.Lottery.MaterialObject.getWinnerGroupInfo(obj.aid, obj.number).then((response) => {
            MYDEBUG('API.MaterialObject.check: API.MY_API.MaterialObject.getWinnerGroupInfo', response);
            if (response.code === 0) {
              $.each(MY_API.MaterialObject.list, (i, v) => { // i下表,v元素
                if (v.aid === obj.aid && v.number === obj.number) {
                  v.status = 3;
                  MY_API.MaterialObject.list[i] = v;
                  return false;
                }
              });
              for (const i of response.data.groups) {
                for (const g of i.list) {
                  if (g.uid === Live_info.uid) {
                    MY_API.chatLog(
                      `[实物抽奖] 抽奖"${obj.title}"<br>aid = ${obj.aid}，第${obj.number}轮<br>获得奖品："${i.giftTitle}"`,
                      'prize');
                    winPrizeNum++;
                    winPrizeTotalCount++;
                    JQlogRedPoint.text(winPrizeNum);
                    if (JQlogRedPoint.is(":hidden")) JQlogRedPoint.show();
                    if (MY_API.CONFIG.PP_NOTICE) {
                      // pushplus
                      const data = {
                        token: MY_API.CONFIG.PP_token,
                        title: `【${GM_info.script.name}】实物抽奖中奖通知 ${obj.title}，第${obj.number}轮`,
                        content: `<div style="border: 1px solid rgb(223, 187, 0);color: rgb(145, 123, 0);background: none 0% 0% repeat scroll rgb(255, 215, 0, 30%);text-align: center;border-radius: 5%;padding: 15px 20px;"><h3>实物抽奖中奖</h3><br /><h4>中奖账号id：${Live_info.uname}</h4><br /><h4>${obj.title}</h4><br /><h4>aid=${obj.aid}</h4><br /><h4>第${obj.number}轮</h4><br /><h4>获得奖品：</h4><br /><h3>${i.giftTitle}</h3><br /><h4>请及时填写领奖信息</h4></div>`
                      };
                      PP_sendMsg(data).then((re) => {
                        MYDEBUG('PP_sendMsg response', re);
                        if (re.body.code == 200) {
                          window.toast('[实物抽奖] 推送加中奖提示发送成功', 'success');
                        } else {
                          window.toast(`[实物抽奖] 推送加中奖提示发送失败 ${re.body.msg}`, 'error')
                        }
                        return $.Deferred().resolve();
                      });
                    }
                    if (MY_API.CONFIG.CP_NOTICE) {
                      // 酷推
                      CP_sendMsg(MY_API.CONFIG.CP_Skey,
                        `【${GM_info.script.name}实物抽奖中奖通知\n${obj.title}\n第${obj.number}轮\n中奖账号id：${Live_info.uname}\n${obj.title}\naid = ${obj.aid}\n第${obj.number}轮\n获得奖品：\n${i.giftTitle}\n请及时填写领奖信息`
                      ).then((re) => {
                        MYDEBUG('CP_sendMsg response', re);
                        if (re.body.code === 200) {
                          window.toast('[实物抽奖] 酷推中奖提示发送成功', 'success');
                        } else {
                          window.toast(`[实物抽奖] 酷推中奖提示发送失败 ${re.body.code}`, 'error')
                        }
                        return $.Deferred().resolve();
                      });
                    }
                    if (MY_API.CONFIG.ServerTurbo_NOTICE) {
                      // Server酱turbo版
                      ServerTurbo_sendMsg(MY_API.CONFIG.ServerTurbo_SendKey,
                        `【${GM_info.script.name}】实物抽奖中奖通知 ${obj.title}，第${obj.number}轮`,
                        `## 实物抽奖中奖  \n  \n## 中奖账号id：${Live_info.uname}  \n  \n## ${obj.title}  \n  \n## aid = ${obj.aid}  \n  \n## 第${obj.number}轮  \n  \n## 获得奖品：  \n  \n# ${i.giftTitle}  \n  \n## 请及时填写领奖信息`
                      ).then((re) => {
                        MYDEBUG('ServerTurbo_sendMsg response', re);
                        if (re.body && re.body.code === 0) {
                          window.toast('[实物抽奖] Server酱Turbo版发起推送成功', 'success');
                        } else {
                          window.toast(`[实物抽奖] Server酱Turbo版发起推送失败 ${re.response.status}`, 'error');
                        }
                        return $.Deferred().resolve();
                      });
                    }
                    if (MY_API.CONFIG.GM_NOTICE) {
                      GM_notice("实物抽奖中奖", `${obj.title}，奖品：${i.giftTitle}`)
                    }
                    return true;
                  }
                }
              }
              MY_API.chatLog(`[实物抽奖] 抽奖"${obj.title}"(aid = ${obj.aid}，第${obj.number}轮)未中奖`, 'info');
            } else {
              MY_API.chatLog(
                `[实物抽奖] 获取抽奖"${obj.title}"(aid = ${obj.aid}，第${obj.number}轮)中奖名单失败<br>${response.msg}`,
                'warning');
              return delayCall(() => MY_API.MaterialObject.notice(obj));
            }
          });
        }
      },
      AnchorLottery: {
        allRoomList: [], // 所有房间号的集合列表，统一用数字格式储存
        checkedIdList: [], // 已经检索到的天选时刻 id
        roomidList: [], // 轮询直播间
        liveUserList: [], // 正在直播的用户列表
        liveRoomList: [], // 正在直播的房间号，可能带uid。格式：roomid|uid
        oldLotteryResponseList: [], // 上传：旧简介直播间
        lotteryResponseList: [], // 上传：新简介直播间
        BLTHserverRoomList: [], // 从BLTH-server获取的直播间
        BLTHuploadRoomList: [], // 上传至BLTH-server的直播间列表
        introRoomList: [], // 从简介获取到的直播间
        roomidAndUid: {}, // 房间号和uid对应
        myLiveRoomid: 0, // 我的直播间号
        customLiveRoomList: [], // 自定义直播间号
        followingList: [], // 关注的所有UP的uid列表
        unfollowList: [], // 将要被取关的uid列表
        uidInTagList: [], // 取关时存放BLTH天选关注分组或中奖分组UP
        BLTHfollowList: [], // BLTH天选关注分组
        BLTHprizeList: [], // BLTH天选中奖分组
        uidInOriginTag: [], // 默认关注分组内up
        uidInSpecialTag: [], // 特别关注分组内up
        medal_list: [],
        anchorFollowTagid: undefined,
        anchorPrizeTagid: undefined,
        get_attention_list: (mid) => {
          return BAPI.relation.get_attention_list(mid).then((response) => {
            MYDEBUG(`get_attention_list API.relation.get_attention_list ${mid}`, response);
            let p = $.Deferred();
            if (response.code === 0) {
              MY_API.AnchorLottery.followingList = [...response.data.list];
              GM_setValue(`AnchorFollowingList`, MY_API.AnchorLottery.followingList);
              getFollowBtnClickable = true;
              window.toast('[保存当前关注列表为白名单] 保存关注列表成功', 'success');
              return p.resolve();
            } else {
              window.toast(`[保存当前关注列表为白名单] 获取关注列表出错 ${response.message}`, 'error');
              return delayCall(() => MY_API.AnchorLottery.get_attention_list(mid));
            }
          })
        },
        getLiveUsers: () => {
          return BAPI.dynamic_svr.w_live_users(2000).then((response) => {
            MYDEBUG(`API.dynamic_svr.w_live_users`, response);
            let p = $.Deferred();
            if (response.code === 0) {
              MY_API.AnchorLottery.liveUserList = [...response.data.items];
              return p.resolve();
            } else {
              MY_API.chatLog(`[天选时刻] 获取正在直播的已关注UP出错 ${response.msg}`, 'caution');
              return delayCall(() => MY_API.AnchorLottery.getLiveUsers());
            }
          })
        },
        getTag: async (tagName, click = false) => {
          if (MY_API.AnchorLottery.anchorFollowTagid && MY_API.AnchorLottery.anchorPrizeTagid) return $.Deferred().resolve();
          if (typeof tagName === 'string') tagName = [tagName];
          return BAPI.relation.getTags().then((response) => {
            MYDEBUG('API.relation.getTags', response);
            if (response.code === 0) {
              for (const tag of response.data) {
                if (tag.name === anchorFollowTagName) {
                  if (tagName.indexOf(anchorFollowTagName) > -1)
                    MY_API.AnchorLottery.anchorFollowTagid = tag.tagid;
                } else if (tag.name === anchorPrizeTagName) {
                  if (tagName.indexOf(anchorPrizeTagName) > -1)
                    MY_API.AnchorLottery.anchorPrizeTagid = tag.tagid;
                }
              }
              if (!click) {
                //没创建过分组则创建一个新的
                let p1 = $.Deferred(), p2 = $.Deferred();
                if (MY_API.AnchorLottery.anchorFollowTagid === undefined && MY_API.CONFIG.ANCHOR_MOVETO_FOLLOW_TAG)
                  MY_API.AnchorLottery.creatTag(anchorFollowTagName).then(() => p1.resolve());
                else p1.resolve();
                if (MY_API.AnchorLottery.anchorPrizeTagid === undefined && MY_API.CONFIG.ANCHOR_MOVETO_PRIZE_TAG)
                  p1.then(() => MY_API.AnchorLottery.creatTag(anchorPrizeTagName).then(() => p2.resolve()));
                else p2.resolve();
                return $.when(p1, p2);
              } else {
                if (tagName.indexOf(anchorFollowTagName) > -1 && MY_API.AnchorLottery.anchorFollowTagid === undefined)
                  MY_API.chatLog(`[天选时刻] 分组【${anchorFollowTagName}】不存在，请先勾选【把参与天选时关注的UP移到新分组】和【参加天选时刻抽奖】，再次运行脚本。`, 'warning');
                if (tagName.indexOf(anchorPrizeTagName) > -1 && MY_API.AnchorLottery.anchorPrizeTagid === undefined)
                  MY_API.chatLog(`[天选时刻] 分组【${anchorPrizeTagName}】不存在，请先勾选【把发起抽奖的UP移到新分组】和【参加天选时刻抽奖】，再次运行脚本。`, 'warning');
                return $.Deferred().resolve();
              }
            } else {
              MY_API.chatLog(`[天选时刻] 获取关注分组出错 ${response.message}`, 'error');
              return delayCall(() => MY_API.AnchorLottery.getTag(tagName));
            }
          });
        },
        creatTag: (tagName) => {
          return BAPI.relation.createTag(tagName).then((re) => {
            MYDEBUG(`API.relation.createTag ${tagName}`, re);
            let p = $.Deferred();
            if (re.code === 0) {
              if (tagName === anchorFollowTagName)
                MY_API.AnchorLottery.anchorFollowTagid = re.data.tagid;
              else if (tagName === anchorPrizeTagName)
                MY_API.AnchorLottery.anchorPrizeTagid = re.data.tagid;
              return p.resolve();
            } else {
              MY_API.chatLog(`[天选时刻] 创建分组【${tagName}】出错 ${re.message}`, 'error');
              return delayCall(() => MY_API.AnchorLottery.creatTag(tagName));
            }
          })
        },
        getUpInBLTHTag: (myuid, tagid, pn = 1, ps = 50) => {
          let p1 = $.Deferred(), p2 = $.Deferred();
          function getUpInBLTHFollowTag(uid, tid, n, s) {
            if (n === 1) MY_API.AnchorLottery.BLTHfollowList = [];
            BAPI.relation.getUpInTag(uid, tid, n, s).then((response) => {
              MYDEBUG(`API.relation.getUpInTag 获取BLTH天选UP关注分组内UP ${tid} ${n} ${s}`, response);
              if (response.code === 0) {
                for (const up of response.data) {
                  MY_API.AnchorLottery.BLTHfollowList.push(String(up.mid));
                }
                if (response.data.length < s) return p1.resolve();
                return delayCall(() => getUpInBLTHFollowTag(uid, tid, n + 1, s), 200);
              } else {
                MY_API.chatLog(`[天选时刻] 获取BLTH天选关注UP分组内UP出错 ${response.message}`, 'error');
                return delayCall(() => MY_API.AnchorLottery.getUpInTag(uid, tid, n, s));
              }
            })
          }
          function getUpInBLTHPrizeTag(uid, tid, n, s) {
            if (n === 1) MY_API.AnchorLottery.BLTHprizeList = [];
            BAPI.relation.getUpInTag(uid, tid, n, s).then((response) => {
              MYDEBUG(`API.relation.getUpInTag 获取BLTH天选中奖UP分组内UP ${tid} ${n} ${s}`, response);
              if (response.code === 0) {
                for (const up of response.data) {
                  MY_API.AnchorLottery.BLTHprizeList.push(String(up.mid));
                }
                if (response.data.length < s) return p2.resolve();
                return delayCall(() => getUpInBLTHPrizeTag(uid, tid, n + 1, s), 200);
              } else {
                MY_API.chatLog(`[天选时刻] 获取BLTH天选中奖UP分组内UP出错 ${response.message}`, 'error');
                return delayCall(() => MY_API.AnchorLottery.getUpInTag(uid, tid, n, s));
              }
            })
          }
          if (MY_API.AnchorLottery.anchorFollowTagid) getUpInBLTHFollowTag(myuid, tagid[0], pn, ps);
          else p1.resolve();
          if (MY_API.AnchorLottery.anchorPrizeTagid) getUpInBLTHPrizeTag(myuid, tagid[1], pn, ps);
          else p2.resolve();
          return $.when(p1, p2);
        },
        getUpInSpecialTag: (myuid, tagid = -10, pn = 1, ps = 50) => {
          return BAPI.relation.getUpInTag(myuid, tagid, pn, ps).then((response) => {
            let p = $.Deferred();
            MYDEBUG(`API.relation.getUpInSpecialTag ${tagid} ${pn} ${ps}`, response);
            if (response.code === 0) {
              for (const up of response.data) {
                MY_API.AnchorLottery.uidInSpecialTag.push(String(up.mid));
              }
              if (response.data.length < ps) return p.resolve();
              return delayCall(() => MY_API.AnchorLottery.getUpInSpecialTag(myuid, tagid, pn + 1, ps), 200);
            } else {
              MY_API.chatLog(`[天选时刻] 获取特别关注关注列表出错 ${response.message}`, 'error');
              return delayCall(() => MY_API.AnchorLottery.getUpInSpecialTag(myuid, tagid, pn, ps));
            }
          })
        },
        getUpInOriginTag: (myuid, tagid = 0, pn = 1, ps = 50) => {
          return BAPI.relation.getUpInTag(myuid, tagid, pn, ps).then((response) => {
            let p = $.Deferred();
            MYDEBUG(`API.relation.getUpInOriginTag ${tagid} ${pn} ${ps}`, response);
            if (response.code === 0) {
              for (const up of response.data) {
                MY_API.AnchorLottery.uidInOriginTag.push(String(up.mid));
              }
              if (response.data.length < ps) return p.resolve();
              return delayCall(() => MY_API.AnchorLottery.getUpInOriginTag(myuid, tagid, pn + 1, ps), 200);
            } else {
              MY_API.chatLog(`[天选时刻] 获取默认分组关注列表出错 ${response.message}`, 'error');
              return delayCall(() => MY_API.AnchorLottery.getUpInOriginTag(myuid, tagid, pn, ps));
            }
          })
        },
        delAnchorFollowing: (mode = 1) => {
          function getUpInTag(myuid, tagid, pn = 1, ps = 50) {
            if (pn === 1) MY_API.AnchorLottery.unfollowList = [];
            return BAPI.relation.getUpInTag(myuid, tagid, pn, ps).then((response) => {
              let p = $.Deferred();
              MYDEBUG(`API.relation.getUpInTag ${tagid} ${pn} ${ps}`, response);
              if (response.code === 0) {
                for (const up of response.data) {
                  MY_API.AnchorLottery.uidInTagList.push(String(up.mid));
                }
                if (response.data.length < ps) return p.resolve();
                return delayCall(() => getUpInTag(myuid, tagid, pn + 1, ps), 200);
              } else {
                window.toast(`[取关BLTH天选分组内的UP] 获取关注列表出错 ${response.message}`, 'error');
                return delayCall(() => getUpInTag(myuid, tagid, pn = 1, ps = 50));
              }
            }, () => {
              MY_API.chatLog(`[天选时刻] 获取Tag内UP列表出错，请检查网络`, 'error');
            })
          }
          function get_attention_list(mid) {
            return BAPI.relation.get_attention_list(mid).then((response) => {
              MYDEBUG(`get_attention_list API.relation.get_attention_list(${mid})`, response)
              let p = $.Deferred();
              if (response.code === 0) {
                MY_API.AnchorLottery.unfollowList = [...response.data.list];
                return p.resolve();
              } else {
                window.toast(`[取关不在白名单内的UP主] 获取关注列表出错 ${response.message}`, 'error');
                return delayCall(() => get_attention_list(mid));
              }
            });
          }
          function delFollowingList(targetList) {
            let id_list;
            id_list = GM_getValue(`AnchorFollowingList`) || [];
            if (id_list.length === 0) { // 关注列表为空
              window.toast(`[取关不在白名单内的UP主] 请先点击【保存当前关注列表为白名单】!`, 'info');
              return $.Deferred().resolve();
            }
            let doUnfollowList = [], pList = [];
            for (const uid of targetList) {
              if (findVal(id_list, uid) === -1)
                doUnfollowList.push(uid);
            }
            for (let c = 0; c <= doUnfollowList.length; c++) {
              pList[c] = $.Deferred();
              if (!MY_API.CONFIG.ANCHOR_WAIT_REPLY) pList[c].resolve();
            }
            pList[0].resolve();
            for (let i = 0; i < doUnfollowList.length; i++) {
              pList[i].then(() => {
                let p = $.Deferred();
                setTimeout(() => p.resolve(), MY_API.CONFIG.ANCHOR_INTERVAL);
                p.then(() => {
                  BAPI.relation.modify(doUnfollowList[i], 2).then((response) => {
                    MYDEBUG(`API.relation.modify ${doUnfollowList[i]}, ${2}`, response);
                    if (response.code === 0) {
                      window.toast(`[天选时刻取关UP主] 取关UP(uid = ${doUnfollowList[i]})成功`, 'success');
                      pList[i + 1].resolve();
                    }
                    else {
                      window.toast(`[天选时刻取关UP主] 取关UP(uid = ${doUnfollowList[i]})出错  ${response.message}`, 'error');
                      pList[i + 1].reject();
                      return delayCall(() => delFollowingList(targetList));
                    }
                  })
                })
              });
            }
            return $.when(...pList)
          }
          if (mode === 1) // 白名单
            return get_attention_list(Live_info.uid).then(() => delFollowingList(MY_API.AnchorLottery.unfollowList).then(() => { unFollowBtnClickable = true }));
          else if (mode === 2) // 关注分组
            return getUpInTag(Live_info.uid, MY_API.AnchorLottery.anchorFollowTagid).then(() => delFollowingList(MY_API.AnchorLottery.uidInTagList).then(() => { unFollowBtnClickable = true }));
          else if (mode === 3) // 中奖分组
            return getUpInTag(Live_info.uid, MY_API.AnchorLottery.anchorPrizeTagid).then(() => delFollowingList(MY_API.AnchorLottery.uidInTagList).then(() => { unFollowBtnClickable = true }));
        },
        getAreaData: () => {
          return BAPI.room.getList().then((response) => {
            MYDEBUG('API.room.getList 分区信息', response);
            if (response.code === 0) return response.data;
            else {
              MY_API.chatLog(`[天选时刻] 获取各分区信息出错，${response.message}`, 'error');
              return delayCall(() => MY_API.AnchorLottery.getAreaData());
            }
          });
        },
        getRoomList: (data) => {
          if (!data.page) data.page = 1;
          if (!data.size) data.size = 50;
          return BAPI.room.getRoomList(data.id, 0, 0, data.page, data.size).then((re) => {
            MYDEBUG(`API.room.getRoomList(${data.id}, 0, 0, ${data.page}, ${data.size})`, re);
            if (re.code === 0) {
              const list = re.data.list;
              MY_API.chatLog(`[天选时刻] 获取${data.name + '分区'}的直播间`, 'info');
              MYDEBUG(`[天选时刻] 获取${data.name + '分区'}房间列表`, re);
              for (const i of list) {
                addVal(MY_API.AnchorLottery.roomidList, i.roomid);
              }
            } else {
              MY_API.chatLog(`[天选时刻] 获取${data.name + '分区'}的直播间出错<br>${re.message}`, 'warning');
              return delayCall(() => checkRoomList());
            }
          });
        },
        getHotRoomList: async (ignore_area = []) => {
          let areaData = await MY_API.AnchorLottery.getAreaData();
          MY_API.AnchorLottery.roomidList = [];
          for (const r of areaData) {
            if (ignore_area.indexOf(r.name) > -1) continue;
            await MY_API.AnchorLottery.getRoomList(r);
            await sleep(MY_API.AnchorLottery.awpush.userInfo.interval || MY_API.CONFIG.ANCHOR_INTERVAL)
          }
          MY_API.chatLog(`[天选时刻] 高热度直播间收集完毕<br>共${MY_API.AnchorLottery.roomidList.length}个`, 'success');
          return $.Deferred().resolve();
        },
        uploadData: async () => {
          let description = undefined, p = $.Deferred();
          if (MY_API.AnchorLottery.lotteryResponseList.length === 0) {
            await BAPI.room.getRoomBaseInfo(MY_API.CONFIG.ANCHOR_GETDATA_ROOM).then((response) => {
              MYDEBUG(`API.room.getRoomBaseInfo(${MY_API.CONFIG.ANCHOR_GETDATA_ROOM})`, response);
              if (response.code === 0) {
                description = response.data.by_room_ids[MY_API.CONFIG.ANCHOR_GETDATA_ROOM].description;
              } else {
                MY_API.chatLog(`[天选时刻] 获取直播间个人简介错误 ${response.message}`, 'error');
                return p.reject();
              }
            });
            let lotteryInfoJson;
            try {
              if (description === undefined) throw "undefined"
              lotteryInfoJson = description.match(/狧(.*)狨/)[1];
              for (const i in replaceList) {
                lotteryInfoJson = lotteryInfoJson.replaceall(replaceList[i], i)
              }
              lotteryInfoJson = JSON.parse(lotteryInfoJson);
              if (typeof lotteryInfoJson !== 'object' || !lotteryInfoJson)
                throw 'Not a JSON';
              if (!lotteryInfoJson.hasOwnProperty('roomList'))
                throw 'Missing property roomList';
              if (!lotteryInfoJson.hasOwnProperty('ts'))
                throw 'Missing property ts';
            } catch (e) {
              MYDEBUG('MY_API.AnchorLottery.uploadData', `获取到的直播间简介格式有误 ${e}，上传初始值设为undefined`);
              lotteryInfoJson = undefined;
            }
            if (lotteryInfoJson !== undefined) {
              for (const i of lotteryInfoJson.roomList) {
                MY_API.AnchorLottery.lotteryResponseList.push(i); // 旧数据用push
              }
              MY_API.AnchorLottery.oldLotteryResponseList = [...MY_API.AnchorLottery.lotteryResponseList];
            }
          }
          if (MY_API.AnchorLottery.oldLotteryResponseList.length === MY_API.AnchorLottery.lotteryResponseList.length)
            return setTimeout(() => MY_API.AnchorLottery.uploadData(), MY_API.CONFIG.ANCHOR_UPLOAD_DATA_INTERVAL * 1000);
          if (MY_API.AnchorLottery.myLiveRoomid === 0) {
            await BAPI.room.getRoomInfoOld(Live_info.uid).then((response) => {
              MYDEBUG(`API.room.getRoomInfoOld(${Live_info.uid})`, response);
              if (response.code === 0) {
                MY_API.AnchorLottery.myLiveRoomid = response.data.roomid; // 没有则返回0
              } else {
                MY_API.chatLog(`[天选时刻] 获取直播间信息出错 ${response.data.message}`, 'error');
                return p.reject();
              }
            });
          }
          if (MY_API.AnchorLottery.myLiveRoomid === 0) {
            MY_API.chatLog('[天选时刻] 请先开通直播间再使用上传房间列表至个人简介的功能', 'warning');
            return p.reject()
          }
          if (MY_API.AnchorLottery.lotteryResponseList.length > MY_API.CONFIG.ANCHOR_MAXLIVEROOM_SAVE) // 删除超出的旧数据
            MY_API.AnchorLottery.lotteryResponseList = MY_API.AnchorLottery.lotteryResponseList.splice(0, MY_API.CONFIG.ANCHOR_MAXLIVEROOM_SAVE);
          let uploadRawJson = {
            roomList: MY_API.AnchorLottery.lotteryResponseList,
            ts: ts_ms()
          };
          if (MY_API.CONFIG.ANCHOR_UPLOAD_MSG) // 上传附加信息
            uploadRawJson.msg = MY_API.CONFIG.ANCHOR_UPLOAD_MSG_CONTENT;
          function updateEncodeData(roomId, str) {
            return BAPI.room.update(roomId, str).then((re) => {
              MYDEBUG(`API.room.update MY_API.AnchorLottery.myLiveRoomid`, re);
              if (re.code === 0) {
                MY_API.chatLog(`[天选时刻] 房间列表上传至个人简介成功（共${MY_API.AnchorLottery.lotteryResponseList.length}个房间）`, 'success');
                MY_API.AnchorLottery.oldLotteryResponseList = [...MY_API.AnchorLottery.lotteryResponseList];
                return p.resolve()
              } else if (re.code === 1) {
                if (re.message === '出错啦，再试试吧') {
                  MY_API.chatLog(`[天选时刻] 上传房间列表至个人简介失败，${MY_API.CONFIG.ANCHOR_UPLOAD_DATA_INTERVAL}秒后再次尝试`, 'warning');
                  return p.resolve()
                } else if (re.message === '简介内容过长') {
                  MY_API.chatLog('[天选时刻] 上传房间列表至个人简介失败，内容过长，清空数据', 'warning');
                  MY_API.AnchorLottery.lotteryResponseList = [];
                  MY_API.AnchorLottery.oldLotteryResponseList = [];
                  return p.resolve()
                } else if (re.message === '您所填写的简介可能涉及不符合相关法律法规和政策的内容，请修改') {
                  MY_API.chatLog(`[天选时刻] 上传房间列表至个人简介失败，${re.message}`, 'warning');
                  MY_API.AnchorLottery.oldLotteryResponseList = [...MY_API.AnchorLottery.lotteryResponseList];
                  return p.resolve()
                }
                else {
                  MY_API.chatLog(`[天选时刻] 上传房间列表至个人简介失败 ${re.message}`, 'warning');
                  return p.reject()
                }
              } else if (re.code === -1) {
                MY_API.chatLog(`[天选时刻] 上传房间列表至个人简介失败，${re.message}，上传间隔临时增加5秒`, 'warning');
                MY_API.CONFIG.ANCHOR_UPLOAD_DATA_INTERVAL += 5;
                return p.resolve();
              } else {
                MY_API.chatLog(`[天选时刻] 上传房间列表至个人简介失败 ${re.message}`, 'error');
                return p.reject();
              }
            })
          }
          let jsonStr = JSON.stringify(uploadRawJson);
          for (const i in replaceList) {
            jsonStr = jsonStr.replaceall(i, replaceList[i])
          }
          let finalStr = '狧' + jsonStr + '狨';
          console.log('final', finalStr)
          return updateEncodeData(MY_API.AnchorLottery.myLiveRoomid, finalStr).then(() => {
            return setTimeout(() => MY_API.AnchorLottery.uploadData(), MY_API.CONFIG.ANCHOR_UPLOAD_DATA_INTERVAL * 1000)
          });
        },
        uploadRoomList: () => {
          if (MY_API.AnchorLottery.BLTHuploadRoomList.length === 0) return setTimeout(() => MY_API.AnchorLottery.uploadRoomList(), 20e3);
          // if (!MY_API.CONFIG.ANCHOR_SERVER_APIKEY[Live_info.uid]) return MY_API.chatLog(`[天选时刻] 未填写apikey，<br>无法上传天选数据至BLTH-server`, 'warning');
          const uploadRoomlist = MY_API.AnchorLottery.BLTHuploadRoomList.slice(0, 50);
          const settings = {
            GM: true,
            anonymous: true,
            url: 'https://andywang.top:3001/api/v1/anchor/updateroomlist',
            method: "POST",
            headers: { "content-type": "charset=utf-8" },
            data: `apikey=${MY_API.CONFIG.ANCHOR_SERVER_APIKEY[Live_info.uid]}&uid=${Live_info.uid}&roomList=${[...MY_API.AnchorLottery.BLTHuploadRoomList.slice(0, 50)]}`,
            responseType: "json"
          };
          return XHR(settings).then((response) => {
            MYDEBUG('BLTH-server api/v1/anchor/updateroomlist', response)
            if (response.body === null)
              return MY_API.chatLog(`[天选时刻] 连接BLTH-server出错<br>状态码: ${response.response.status}`, 'error');
            if (response.body.code === 0) {
              MY_API.chatLog(`[天选时刻] 上传房间列表至BLTH-server成功<br>上传房间数：${uploadRoomlist.length}`, 'success');
              MY_API.AnchorLottery.BLTHuploadRoomList = [];
            }
            else MY_API.chatLog(`[天选时刻] 上传直播间至BLTH-server出错<br>${response.body.msg}`, 'error');
            return setTimeout(() => MY_API.AnchorLottery.uploadRoomList(), 20e3);
          }).catch((e) => {
            MYERROR('天选时刻', '上传直播间至BLTH-server出错', e);
            MY_API.chatLog(`[天选时刻] 上传直播间至BLTH-server出错<br>${e}`, 'error');
            return setTimeout(() => MY_API.AnchorLottery.uploadRoomList(), 120e3);
          });
        },
        getDataFromBLTHserver: () => {
          // if (!MY_API.CONFIG.ANCHOR_SERVER_APIKEY[Live_info.uid]) return MY_API.chatLog(`[天选时刻] 未填写apikey，<br>无法从BLTH-server获取天选数据`, 'warning');
          const settings = {
            GM: true,
            anonymous: true,
            url: `https://andywang.top:3001/api/v1/anchor/getroomlist?apikey=${MY_API.CONFIG.ANCHOR_SERVER_APIKEY[Live_info.uid]}&uid=${Live_info.uid}&num=50`,
            method: "GET",
            headers: { "content-type": "charset=utf-8" },
            responseType: "json"
          };
          return XHR(settings).then((response) => {
            MYDEBUG('BLTH-server api/v1/anchor/getroomlist', response);
            if (response.body === null) {
              return MY_API.chatLog(`[天选时刻] 连接BLTH-server出错<br>状态码: ${response.response.status}`, 'error');
            }
            if (response.body.code === 0) {
              const roomList = response.body.data;
              for (const i of roomList) {
                addVal(MY_API.AnchorLottery.BLTHserverRoomList, i);
              }
              MY_API.chatLog(`[天选时刻] BLTH-server天选数据获取完毕<br>共${roomList.length}个房间`, 'success');
              return $.Deferred().resolve();
            } else {
              return MY_API.chatLog(`[天选时刻] 连接BLTH-server出错<br>${response.body.msg}`, 'error');
            }
          }).catch((e) => {
            MYERROR('天选时刻', '从BLTH-server获取直播间出错', e);
            MY_API.chatLog(`[天选时刻] 从BLTH-server获取直播间出错<br>${e}`, 'error');
          });
        },
        getLotteryInfoFromRoom: async () => {
          let description = undefined;
          await BAPI.room.getRoomBaseInfo(MY_API.CONFIG.ANCHOR_GETDATA_ROOM).then((response) => {
            MYDEBUG(`API.room.getRoomBaseInfo(${MY_API.CONFIG.ANCHOR_GETDATA_ROOM})`, response);
            if (response.code === 0) {
              description = response.data.by_room_ids[MY_API.CONFIG.ANCHOR_GETDATA_ROOM].description;
            } else {
              MY_API.chatLog(`[天选时刻] 获取直播间个人简介错误 ${response.message}`, 'error');
            }
          });
          let lotteryInfoJson;
          try {
            if (description === undefined) throw "undefined"
            lotteryInfoJson = description.match(/狧(.*)狨/)[1];
            for (const i in replaceList) {
              lotteryInfoJson = lotteryInfoJson.replaceall(replaceList[i], i)
            }
            lotteryInfoJson = JSON.parse(lotteryInfoJson);
            if (typeof lotteryInfoJson !== 'object' || !lotteryInfoJson)
              throw 'Not a JSON';
            if (!lotteryInfoJson.hasOwnProperty('roomList'))
              throw 'Missing property roomList';
            if (!lotteryInfoJson.hasOwnProperty('ts'))
              throw 'Missing property ts';
          } catch (e) {
            MY_API.chatLog(`[天选时刻] 直播间${MY_API.CONFIG.ANCHOR_GETDATA_ROOM}个人简介的数据格式不符合要求<br>` + e, 'error');
            return setTimeout(() => MY_API.AnchorLottery.getLotteryInfoFromRoom(), MY_API.CONFIG.ANCHOR_CHECK_INTERVAL * 60000);
          }
          MY_API.AnchorLottery.introRoomList = [...lotteryInfoJson.roomList];
          return MY_API.chatLog(`[天选时刻] 简介数据获取完毕（共${MY_API.AnchorLottery.introRoomList.length}个房间）<br>数据来源：直播间${linkMsg(liveRoomUrl + MY_API.CONFIG.ANCHOR_GETDATA_ROOM, MY_API.CONFIG.ANCHOR_GETDATA_ROOM)}的个人简介${(!MY_API.CONFIG.ANCHOR_IGNORE_UPLOAD_MSG && lotteryInfoJson.hasOwnProperty('msg') && lotteryInfoJson.msg.length > 0 && !/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(lotteryInfoJson.msg)) ? '<br>附加信息：' + lotteryInfoJson.msg : ''}<br>该数据最后上传时间：${new Date(lotteryInfoJson.ts).toLocaleString()}`, 'success');
        },
        moneyCheck: (award_name) => {
          const name = award_name.replaceall(' ', '').toLowerCase(); // 去空格+转小写
          let numberArray = name.match(/\d+(\.\d+)?/g); // 提取阿拉伯数字
          let chineseNumberArray = name.match(/([一壹二贰两三叁四肆五伍六陆七柒八捌九玖][千仟]零?[一壹二贰两三叁四肆五伍六陆七柒八捌九玖]?[百佰]?[一壹二贰三叁四肆五伍六陆七柒八捌九玖]?[十拾]?[一壹二贰三叁四肆五伍六陆七柒八捌九玖]?)|([一壹二贰两三叁四肆五伍六陆七柒八捌九玖][百佰][一壹二贰三叁四肆五伍六陆七柒八捌九玖]?[十拾]?[一壹二贰三叁四肆五伍六陆七柒八捌九玖]?)|([一壹二贰三叁四肆五伍六陆七柒八捌九玖]?[十拾][一壹二贰三叁四肆五伍六陆七柒八捌九玖]?)|[一壹二贰两三叁四肆五伍六陆七柒八捌九玖十拾]/g); // 提取汉字数字
          const chnNumChar = { "零": 0, "一": 1, "壹": 1, "二": 2, "贰": 2, "两": 2, "三": 3, "叁": 3, "四": 4, "肆": 4, "五": 5, "伍": 5, "六": 6, "陆": 6, "七": 7, "柒": 7, "八": 8, "捌": 8, "九": 9, "玖": 9 },
            chnNameValue = { "十": { value: 10, secUnit: false }, "拾": { value: 10, secUnit: false }, "百": { value: 100, secUnit: false }, "佰": { value: 100, secUnit: false }, "千": { value: 1e3, secUnit: false }, "仟": { value: 1e3, secUnit: false }, "万": { value: 1e4, secUnit: true }, "亿": { value: 1e8, secUnit: true } };
          if (chineseNumberArray !== null && numberArray === null) { // 只提取出汉字数字
            return chineseFunc();
          } else if (chineseNumberArray === null && numberArray !== null) { // 只提取出阿拉伯数字
            return arabicNumberFunc();
          } else if (chineseNumberArray !== null && numberArray !== null) { // 都提取出来
            let arr = arabicNumberFunc();
            if (arr[0]) return arr; // 数组第一项为true则识别成功
            else return chineseFunc()
          } else { // 都没提取出来
            return [false]
          }
          function chineseFunc() {
            // 把匹配到的数字由长到段重新排列
            let chineseNumIndexList = [];
            chineseNumberArray.sort(function (a, b) {
              return b.length - a.length;
            });
            for (const n of chineseNumberArray) {
              chineseNumIndexList.push(getIndex(name, n, chineseNumIndexList));
            }
            for (let n = 0; n < chineseNumberArray.length; n++) {
              const chineseNum = chineseNumberArray[n]; // 中文数字
              if (chineseNum !== undefined) {
                const num = ChineseToNumber(chineseNum); // 阿拉伯数字
                const ChineseNumberIndex = chineseNumIndexList[n], // 中文数字下标
                  ChineseNumLength = chineseNum.length, // 中文数字长度
                  nextChineseNumIndex = chineseNumIndexList[n + 1], // 下一个数字下标 可能为undefined
                  lastChineseNumIndex = chineseNumIndexList[n - 1]; // 上一个数字下标 可能为undefined
                const unitTailIndex = ChineseNumberIndex + ChineseNumLength; // 数字后一个中文数字的下标
                let strAfterNum = ''; // 数字后面的字符串
                let strBeforeNum = ''; // 数字前面的字符串
                if (unitTailIndex < nextChineseNumIndex) {
                  // 如果下一个数字的起始位置不在当前数字所占范围内
                  for (let i = unitTailIndex; i < name.length; i++) {
                    if (nextChineseNumIndex !== undefined) {
                      if (i < nextChineseNumIndex) // 不能把下一个数字取进去
                        strAfterNum = strAfterNum + name[i];
                      else
                        break;
                    } else {
                      strAfterNum = strAfterNum + name[i];
                    }
                  }
                } else {
                  strAfterNum = name.slice(unitTailIndex, name.length);
                }
                if (ChineseNumberIndex > lastChineseNumIndex) {
                  for (let i = lastChineseNumIndex; i < name.length; i++) {
                    if (lastChineseNumIndex !== undefined) {
                      if (i < ChineseNumberIndex) // 不能把下一个数字取进去
                        strBeforeNum = strBeforeNum + name[i];
                      else
                        break;
                    } else {
                      strBeforeNum = strBeforeNum + name[i];
                    }
                  }
                } else {
                  strBeforeNum = name.slice(0, ChineseNumberIndex);
                }
                let finalMoney = getPrice(num, strAfterNum, strBeforeNum);
                if (finalMoney === undefined) {
                  if (n === chineseNumberArray.length - 1) return [false];
                  else continue;
                }
                else return [true, Number(finalMoney).toFixed(2)];
              }
            }
          }
          function arabicNumberFunc() {
            // 把匹配到的数字由长到段重新排列
            let numIndexList = [];
            numberArray.sort(function (a, b) {
              return b.length - a.length;
            });
            for (const n of numberArray) { //每个数字在name中的下标
              numIndexList.push(getIndex(name, n, numIndexList));
            }
            for (let n = 0; n < numberArray.length; n++) {
              const num = numberArray[n]; // 数字
              const numberIndex = name.indexOf(num), // 数字下标
                numLength = num.length, // 数字长度
                nextNumIndex = numIndexList[n + 1], // 下一个数字下标 可能为undefined
                lastNumIndex = numIndexList[n - 1]; // 上一个数字下标 可能为undefined
              const unitTailIndex = numberIndex + numLength; // 数字后一个字符的下标
              let strAfterNum = ''; // 数字后面的字符串
              let strBeforeNum = '';
              if (unitTailIndex < nextNumIndex) {
                // 如果下一个数字的起始位置不在当前数字所占范围内
                for (let i = unitTailIndex; i < name.length; i++) {
                  if (nextNumIndex !== undefined) {
                    if (i < nextNumIndex) // 不能把下一个数字取进去
                      strAfterNum = strAfterNum + name[i];
                    else
                      break;
                  } else {
                    strAfterNum = strAfterNum + name[i];
                  }
                }
              } else {
                strAfterNum = name.slice(unitTailIndex, name.length);
              }
              if (numberIndex > lastNumIndex) {
                for (let i = lastNumIndex; i < name.length; i++) {
                  if (lastNumIndex !== undefined) {
                    if (i < numberIndex) // 不能把下一个数字取进去
                      strBeforeNum = strBeforeNum + name[i];
                    else
                      break;
                  } else {
                    strBeforeNum = strBeforeNum + name[i];
                  }
                }
              } else {
                strBeforeNum = name.slice(0, numberIndex);
              }
              let finalMoney = getPrice(num, strAfterNum, strBeforeNum);
              if (finalMoney === undefined) { // 识别失败
                if (n === numberArray.length - 1) return [false];
                else continue;
              } else return [true, Number(finalMoney).toFixed(2)]
            }
          }
          function getPrice(num, strAfterNum, strBeforeNum) {
            const after_yuan = ['元', 'r', '块'], // 1
              after_yuanWords = ['rmb', 'cny', '人民币', '软妹币', '微信红包', '红包', 'qq红包', '现金'], // 1
              after_dime = ['毛', '角', '电池'], // 0.1
              after_penny = ['分'], // 0.01
              before_yuanWords = ['rmb', 'cny', '人民币', '软妹币', '微信红包', '红包', 'qq红包', '现金']; // 1
            const firstAfterChar = strAfterNum[0];
            let finalMoney = undefined; // 单位：元
            let needFurtherCheck = false;
            const number = Number(num);
            for (const w of before_yuanWords) {
              if (strBeforeNum.indexOf(w) > -1) {
                finalMoney = number;
                needFurtherCheck = true;
                break;
              }
            }
            for (const w of after_yuanWords) {
              if (strAfterNum.indexOf(w) > -1) {
                finalMoney = number;
                break;
              }
            }
            if (finalMoney === undefined || needFurtherCheck) {
              if (after_yuan.indexOf(firstAfterChar) > -1) {
                finalMoney = number
              } else if (after_dime.indexOf(firstAfterChar) > -1) {
                finalMoney = number * 0.1;
              } else if (after_penny.indexOf(firstAfterChar) > -1) {
                // 排除特殊奖品名
                const ignoreList = ['分钟'];
                for (const i of ignoreList) {
                  if (strAfterNum.indexOf(i) > -1) return undefined
                }
                finalMoney = number * 0.01;
              }
            }
            return finalMoney;
          }
          function ChineseToNumber(chnStr) {
            let chineseStr = chnStr[0] === '十' ? "一" + chnStr : chnStr;
            let rtn = 0,
              section = 0,
              number = 0,
              secUnit = false,
              str = chineseStr.split('');
            for (let i = 0; i < str.length; i++) {
              let num = chnNumChar[str[i]];
              if (typeof num !== 'undefined') {
                number = num;
                if (i === str.length - 1) {
                  section += number;
                }
              } else {
                if (!chnNameValue.hasOwnProperty(str[i])) return undefined;
                let unit = chnNameValue[str[i]].value;
                secUnit = chnNameValue[str[i]].secUnit;
                if (secUnit) {
                  section = (section + number) * unit;
                  rtn += section;
                  section = 0;
                } else {
                  section += (number * unit);
                }
                number = 0;
              }
            }
            return rtn + section;
          };
          /**
          * 获取下标，可处理部分特殊情况，如
          * 100电池1个
          * 1份100电池1个
          * @param str 字符串
          * @param num 被搜索的数字
          * @param array 储存已搜索到的数字的下标的数组
          * @param start 搜索数字的开始下标，初始为0，为了防止重复搜索字符串中的一个子串
          * @param arrStart 搜索数组的开始下标，初始为0，为了防止重复搜索数组中的某一项
          * @returns {number} index
          */
          function getIndex(str, num, array, start = 0, arrStart = 0) {
            let index = str.indexOf(num, start),
              arrayIndex = array.indexOf(index, arrStart);
            if (arrayIndex > -1) return getIndex(str, num, array, index + 1, arrayIndex + 1);
            else return index
          }
        },
        filter: {
          delUselessData(obj) {
            const delList = ['asset_icon', 'url', 'web_url'];
            for (const i of delList) {
              delete obj[i];
            }
            return obj;
          },
          ignore_room: (roomid) => {
            if (MY_API.CONFIG.ANCHOR_IGNORE_ROOM && findVal(MY_API.CONFIG.ANCHOR_IGNORE_ROOMLIST, roomid) > -1) {
              MY_API.chatLog(`[天选时刻] 忽略直播间<br>不参加直播间${linkMsg(liveRoomUrl + roomid, roomid)}的天选`, 'warning');
              return false;
            } else return true;
          },
          hasChecked: (data) => {
            if (findVal(MY_API.AnchorLottery.checkedIdList, data.id) > -1) {
              MY_API.chatLog(`[天选时刻] 忽略已检索过的天选<br>roomid = ${linkMsg(liveRoomUrl + data.room_id, data.room_id)}, id = ${data.id}`, 'info');
              if (MY_API.AnchorLottery.checkedIdList.length > 500) MY_API.AnchorLottery.checkedIdList.splice(0, 500);
              return false
            } else {
              // 添加到已检索过的 id 列表
              addVal(MY_API.AnchorLottery.checkedIdList, data.id);
              return true;
            }
          },
          time: (data) => {
            if (data.time === 0) {
              MY_API.chatLog(`[天选时刻] 忽略过期天选<br>roomid = ${linkMsg(liveRoomUrl + data.room_id, data.room_id)}, id = ${data.id}`, 'info');
              return false
            } else return true;
          },
          status: (data) => {
            if (data.status === 2) {
              MY_API.chatLog(`[天选时刻] 忽略已参加天选<br>roomid = ${linkMsg(liveRoomUrl + data.room_id, data.room_id)}, id = ${data.id}<br>奖品名：${data.award_name}<br>`, 'info');
              return false
            } else return true;
          },
          further: (data, uid = MY_API.AnchorLottery.roomidAndUid[data.room_id]) => {
            const joinPrice = (data.gift_num * data.gift_price) / 100, // 1 电池 = 100 金瓜子
              joinTextTitle = `${NAME}_ANCHOR_${data.id}`,
              ts = ts_ms();
            let defaultJoinData = {
              id: data.id,
              gift_id: joinPrice === 0 ? undefined : data.gift_id,
              gift_num: joinPrice === 0 ? undefined : data.gift_num,
              roomid: data.room_id,
              award_name: data.award_name,
              time: data.time,
              require_type: data.require_type,
              joinPrice: joinPrice,
              uid: uid // 可能为undefined
            };
            let medalJson = undefined;
            let joinText = null, joinDisplay = "block";
            switch (data.require_type) {
              case 0: /* 无 */
              case 1: /* 关注 */ joinText = "点击参加"; break;
              case 2: /* 粉丝勋章 */
                if (data.require_value === 1) joinText = "点击购买粉丝勋章并参加";
                else joinText = "点击购买粉丝勋章"; break;
              /* case 3: 大航海 */
              default: joinDisplay = "none";
            }
            const joinHtml = (text = joinText, display = joinDisplay) => `<div class = "clickableText" title = "${joinTextTitle}" ts = "${ts}" style = "display:${display};">${text}</div>`;
            function joinAnchorListener() {
              let jqText = $('div' + '[title=\"' + joinTextTitle + '\"]' + '[ts=\"' + ts + '\"]');
              let timer = setTimeout(() => jqText.remove(), data.time * 1000);
              jqText.click(() => {
                let p = $.Deferred();
                switch (data.require_type) {
                  case 2: // 粉丝勋章
                    let getUid = $.Deferred();
                    if (!defaultJoinData.uid) {
                      BAPI.live_user.get_anchor_in_room(defaultJoinData.roomid).then((res) => {
                        MYDEBUG(`API.live_user.get_anchor_in_room(${defaultJoinData.roomid})`, res);
                        if (res.data) {
                          defaultJoinData.uid = res.data.info.uid;
                          medalJson = {
                            anchorInfo: {
                              uid: res.data.info.uid,
                              uname: res.data.info.uname,
                              face: res.data.info.face
                            },
                            medal_level: 1,
                            target_id: res.data.info.uid
                          };
                          getUid.resolve();
                          MY_API.AnchorLottery.roomidAndUid[defaultJoinData.roomid] = res.data.info.uid;
                        } else {
                          MY_API.chatLog(`[天选时刻] 获取uid出错<br>roomid = ${defaultJoinData.roomid}<br>${res.msg}`, 'error');
                          getUid.reject();
                        }
                      }, () => {
                        MY_API.chatLog(`[天选时刻] 获取uid出错，请检查网络`, 'error');
                        getUid.reject();
                      })
                    } else getUid.resolve();
                    getUid.then(() => {
                      BAPI.link_group.buy_medal(defaultJoinData.uid).then((re) => {
                        MYDEBUG('API.link_group.buy_medal re', re);
                        if (re.code === 0) {
                          if (data.require_value === 1) {
                            layer.msg('粉丝勋章购买成功，约2秒后参加天选', {
                              time: 2000,
                              icon: 1
                            });
                            setTimeout(() => p.resolve(), 2000);
                          } else {
                            layer.msg('粉丝勋章购买成功', {
                              time: 2000,
                              icon: 1
                            });
                            p.reject();
                          }
                          if (medalJson !== undefined)
                            MY_API.AnchorLottery.medal_list.push(medalJson);
                        } else {
                          layer.msg(`粉丝勋章购买失败 ${re.message}`, {
                            time: 3500,
                            icon: 2
                          });
                          p.reject()
                        }
                      }, () => {
                        MY_API.chatLog('[天选时刻] 购买粉丝勋章出错，请检查网络', 'error');
                        p.reject()
                      });
                    });
                    break;
                  default: p.resolve()
                }
                p.then(() => {
                  // 已经过了一段时间，需再次获取剩余时间
                  BAPI.xlive.anchor.randTime(data.id).then((re) => {
                    MYDEBUG(`API.xlive.anchor.randTime ${data.id}`, re);
                    if (re.code === 0) {
                      if (re.data.time > 0) {
                        defaultJoinData.time = re.data.time;
                        MY_API.AnchorLottery.join(defaultJoinData);
                        let allSameJqText = $('div' + '[title=\"' + joinTextTitle + '\"]');
                        allSameJqText.unbind('click');
                        allSameJqText.remove();
                        clearTimeout(timer);
                      } else {
                        return MY_API.chatLog(`[天选时刻] 该天选已过期<br>roomid = ${linkMsg(liveRoomUrl + defaultJoinData.roomid, defaultJoinData.roomid)}, id = ${data.id}<br>奖品名：${data.award_name}`, 'info')
                      }
                    }
                  }, () => {
                    MY_API.chatLog(`[天选时刻] 获取天选开奖剩余时间失败，请检查网络`, 'error')
                  })
                })
              });
            };
            if (MY_API.CONFIG.ANCHOR_IGNORE_BLACKLIST) {
              // 忽略关键字
              for (const str of MY_API.CONFIG.ANCHOR_BLACKLIST_WORD) {
                if (!isRegexp.test(str)) {
                  if (data.award_name.toLowerCase().indexOf(str.toLowerCase()) > -1) {
                    MY_API.chatLog(`[天选时刻] 忽略存疑天选<br>roomid = ${linkMsg(liveRoomUrl + defaultJoinData.roomid, defaultJoinData.roomid)}, id = ${data.id}<br>奖品名：${data.award_name}<br>含有关键字：${str}<br>${data.require_text === '无' ? '' : '参加条件：' + data.require_text + '<br>'}${joinPrice === 0 ? '无需电池' : "所需电池：" + joinPrice}<br>${MY_API.AnchorLottery.countDown(data.time)}${joinHtml()}`, 'warning');
                    joinAnchorListener();
                    return false
                  }
                }
                else {
                  try {
                    const reg = eval(str);
                    if (reg.test(data.award_name)) {
                      MY_API.chatLog(`[天选时刻] 忽略存疑天选<br>roomid = ${linkMsg(liveRoomUrl + defaultJoinData.roomid, defaultJoinData.roomid)}, id = ${data.id}<br>奖品名：${data.award_name}<br>匹配正则：${str}<br>${data.require_text === '无' ? '' : '参加条件：' + data.require_text + '<br>'}${joinPrice === 0 ? '无需电池' : "所需电池：" + joinPrice}<br>${MY_API.AnchorLottery.countDown(data.time)}${joinHtml()}`, 'warning');
                      joinAnchorListener();
                      return false
                    }
                  } catch (e) {
                    MYDEBUG('[天选时刻] 正则eval出错：', str);
                  }
                }
              }
            };
            if (MY_API.CONFIG.ANCHOR_IGNORE_MONEY > 0 || MY_API.CONFIG.ANCHOR_MONEY_ONLY) {
              // 忽略金额或仅参加现金天选
              const moneyCheckReturnArray = MY_API.AnchorLottery.moneyCheck(data.award_name);
              if (moneyCheckReturnArray[0]) {
                // 有金额
                if (moneyCheckReturnArray[1] < MY_API.CONFIG.ANCHOR_IGNORE_MONEY) {
                  MY_API.chatLog(`[天选时刻] 忽略金额小于${MY_API.CONFIG.ANCHOR_IGNORE_MONEY}元的天选<br>roomid = ${linkMsg(liveRoomUrl + defaultJoinData.roomid, defaultJoinData.roomid)}, id = ${data.id}<br>奖品名：${data.award_name}<br>${data.require_text === '无' ? '' : '参加条件：' + data.require_text + '<br>'}识别到的金额：${moneyCheckReturnArray[1]}元<br>${joinPrice === 0 ? '无需电池' : "所需电池：" + joinPrice}<br>${MY_API.AnchorLottery.countDown(data.time)}${joinHtml()}`, 'warning');
                  joinAnchorListener();
                  return false
                }
              } else if (MY_API.CONFIG.ANCHOR_MONEY_ONLY) {
                MY_API.chatLog(`[天选时刻] 忽略非现金抽奖的天选<br>roomid = ${linkMsg(liveRoomUrl + defaultJoinData.roomid, defaultJoinData.roomid)}, id = ${data.id}<br>奖品名：${data.award_name}<br>${data.require_text === '无' ? '' : '参加条件：' + data.require_text + '<br>'}${joinPrice === 0 ? '无需电池' : "所需电池：" + joinPrice}<br>${MY_API.AnchorLottery.countDown(data.time)}${joinHtml()}`, 'warning');
                return false
              }
            }
            if (joinPrice > MY_API.CONFIG.ANCHOR_NEED_GOLD) {
              MY_API.chatLog(`[天选时刻] 忽略付费天选<br>roomid = ${linkMsg(liveRoomUrl + defaultJoinData.roomid, defaultJoinData.roomid)}, id = ${data.id}<br>奖品名：${data.award_name}<br>${data.require_text === '无' ? '' : '参加条件：' + data.require_text + '<br>'}${joinPrice === 0 ? '无需电池' : "所需电池：" + joinPrice}<br>${MY_API.AnchorLottery.countDown(data.time)}${joinHtml()}`, 'warning');
              joinAnchorListener();
              return false
            }
            switch (data.require_type) {
              case 0: // 无要求
              case 1: return defaultJoinData // 关注
              case 2: { // 粉丝勋章
                return BAPI.live_user.get_anchor_in_room(defaultJoinData.roomid).then((res) => {
                  MYDEBUG(`API.live_user.get_anchor_in_room(${defaultJoinData.roomid})`, res);
                  if (res.data) {
                    defaultJoinData.uid = res.data.info.uid;
                    medalJson = {
                      anchorInfo: {
                        uid: res.data.info.uid,
                        uname: res.data.info.uname,
                        face: res.data.info.face
                      },
                      medal_level: 1,
                      target_id: res.data.info.uid
                    };
                    MY_API.AnchorLottery.roomidAndUid[defaultJoinData.roomid] = res.data.info.uid;
                    for (const m of MY_API.AnchorLottery.medal_list) {
                      if (m.target_id === defaultJoinData.uid) {
                        // m.target_id为勋章对应 UP 的uid，m.uid是自己的uid
                        if (m.medal_level < data.require_value) {
                          MY_API.chatLog(`[天选时刻] 忽略粉丝勋章等级不足的天选<br>roomid = ${linkMsg(liveRoomUrl + defaultJoinData.roomid, defaultJoinData.roomid)}, id = ${data.id}<br>奖品名：${data.award_name}<br>所需勋章等级：${data.require_value}<br>你的勋章等级：${m.level}<br>${MY_API.AnchorLottery.countDown(data.time)}`, 'warning');
                          return false
                        } else {
                          return defaultJoinData
                        }
                      }
                    }
                    if (MY_API.CONFIG.ANCHOR_AUTO_BUY_LV1_MEDAL && data.require_value === 1) {
                      // 自动买一级牌子
                      return BAPI.link_group.buy_medal(defaultJoinData.uid).then((re) => {
                        MYDEBUG('API.link_group.buy_medal 自动买一级牌子 re', re);
                        if (re.code === 0) {
                          window.toast(`[天选时刻] 自动购买UP【${medalJson.anchorInfo.uname}】的1级粉丝牌（uid=${medalJson.anchorInfo.uid}）成功`, 'success');
                          medal_list.push(medalJson);
                          return defaultJoinData;
                        } else {
                          window.toast(`[天选时刻] 自动购买UP【${medalJson.anchorInfo.uname}】的1级粉丝牌（uid=${medalJson.anchorInfo.uid}）失败<br>${re.message}`, 'warning');
                        }
                      });
                    } else {
                      MY_API.chatLog(`[天选时刻] 忽略有粉丝勋章要求的天选<br>roomid = ${linkMsg(liveRoomUrl + defaultJoinData.roomid, defaultJoinData.roomid)}, id = ${data.id}<br>奖品名：${data.award_name}<br>所需勋章等级：${data.require_value}<br>你没有该勋章<br>${MY_API.AnchorLottery.countDown(data.time)}${joinHtml()}`, 'warning');
                      joinAnchorListener();
                    }
                    return false
                  } else {
                    MY_API.chatLog(`[天选时刻] 获取uid出错<br>${res.msg}`, 'error');
                    return false
                  }
                }, () => {
                  MY_API.chatLog(`[天选时刻] 获取uid出错，请检查网络`, 'error');
                  return false
                });
              }
              case 3: { // 大航海
                return BAPI.xlive.getInfoByUser(defaultJoinData.roomid).then((re) => {
                  MYDEBUG(`API.xlive.getInfoByUser ${defaultJoinData.roomid}`, re);
                  if (re.code === 0) {
                    const privilege_type = re.data.privilege.privilege_type;
                    if (privilege_type !== 0 && privilege_type <= data.require_value) {
                      // 0：未上船，1：总督，2：提督，3：舰长。若满足要求则返回数据
                      return defaultJoinData;
                    } else {
                      function getPrivilegeText(typeNum) {
                        switch (typeNum) {
                          case 0: return '无';
                          case 1: return '总督';
                          case 2: return '提督';
                          case 3: return '舰长';
                          default: return '未知';
                        }
                      }
                      const requireText = getPrivilegeText(data.require_value),
                        myText = getPrivilegeText(privilege_type);
                      MY_API.chatLog(`[天选时刻] 忽略大航海等级不足的天选<br>roomid = ${linkMsg(liveRoomUrl + defaultJoinData.roomid, defaultJoinData.roomid)}, id = ${data.id}<br>奖品名：${data.award_name}<br>所需大航海等级：${requireText}<br>你的大航海等级：${myText}<br>${MY_API.AnchorLottery.countDown(data.time)}`, 'warning');
                      return false
                    }
                  } else {
                    return false
                  }
                })
              }
              case 4: {
                //直播等级
                if (Live_info.user_level >= data.require_value) return defaultJoinData;
                else MY_API.chatLog(`[天选时刻] 忽略直播等级不足的天选<br>roomid = ${linkMsg(liveRoomUrl + defaultJoinData.roomid, defaultJoinData.roomid)}, id = ${data.id}<br>奖品名：${data.award_name}<br>所需直播等级：${data.require_value}<br>你的直播等级：UL.${Live_info.user_level}<br>${MY_API.AnchorLottery.countDown(data.time)}`, 'warning');
                return false
              }
              case 5: {
                //主站等级
                if (Live_info.level >= data.require_value) return defaultJoinData;
                else MY_API.chatLog(`[天选时刻] 忽略主站等级不足的天选<br>roomid = ${linkMsg(liveRoomUrl + defaultJoinData.roomid, defaultJoinData.roomid)}, id = ${data.id}<br>奖品名：${data.award_name}<br>所需直播等级：${data.require_value}<br>你的主站等级：Lv${Live_info.level}<br>${MY_API.AnchorLottery.countDown(data.time)}`, 'warning');
                return false
              }
              default: {
                MYDEBUG(`[天选时刻] 未被收录的类型 require_value = ${data.require_value}`, response);
                return false
              }
            }
          }
        },
        check: (roomid, uid) => {
          if (!MY_API.AnchorLottery.filter.ignore_room(roomid)) return $.Deferred().resolve(false);
          return BAPI.xlive.anchor.check(roomid).then((response) => {
            MYDEBUG(`API.xlive.anchor.check(${roomid}) response`, response);
            if (response.code === 0) {
              if (!response.data) return false;
              if (!MY_API.AnchorLottery.filter.hasChecked(response.data)) return false;
              if (!MY_API.AnchorLottery.filter.time(response.data)) return false;
              if (!MY_API.AnchorLottery.filter.status(response.data)) return false;
              // 添加至上传列表
              addVal(MY_API.AnchorLottery.lotteryResponseList, response.data.room_id);
              addVal(MY_API.AnchorLottery.BLTHuploadRoomList, response.data.room_id);
              return MY_API.AnchorLottery.filter.further(response.data, uid);
            }
            else {
              MY_API.chatLog(`[天选时刻] 天选检查出错，${response.message}`, 'error');
              return delayCall(() => MY_API.AnchorLottery.check(roomid));
            }
          });
        },
        reCheck: (data) => {
          return BAPI.xlive.anchor.check(data.roomid).then((response) => {
            MYDEBUG(`API.xlive.anchor.reCheck(${data.roomid}) response`, response);
            if (response.code === 0 && response.data && response.data.hasOwnProperty('award_users') && response.data.award_users) {
              let anchorUid = data.uid, award = false;
              for (const i of response.data.award_users) {
                if (i.uid === Live_info.uid) {
                  award = true;
                  break;
                }
              }
              if (!award) { // 运行没中奖的代码
                if (MY_API.CONFIG.ANCHOR_AUTO_DEL_FOLLOW) {
                  // 取关
                  const id_list = GM_getValue(`AnchorFollowingList`) || [];
                  if (findVal(id_list, anchorUid) === -1 && findVal(MY_API.AnchorLottery.uidInOriginTag, anchorUid) === -1 && findVal(MY_API.AnchorLottery.uidInSpecialTag, anchorUid) === -1) {
                    return BAPI.relation.modify(anchorUid, 2).then((response) => {
                      MYDEBUG(`API.relation.modify response.info.uid, ${2}`, response);
                      if (response.code === 0) {
                        window.toast(`[天选自动取关] 取关UP(uid = ${anchorUid})成功`, 'success');
                      }
                      else {
                        window.toast(`[天选自动取关] 取关UP(uid = ${anchorUid})出错  ${response.message}`, 'error');
                      }
                    }, () => {
                      MY_API.chatLog(`[天选自动取关] 取关UP(uid = ${anchorUid})出错，请检查网络`);
                    })
                  }
                }
              } else { // 中奖的代码
                MY_API.chatLog(`[天选时刻] 天选时刻<br>roomid = ${linkMsg(liveRoomUrl + data.roomid, data.roomid)}, id = ${data.id}中奖<br>奖品：${data.award_name}<br>`, 'prize');
                winPrizeNum++;
                winPrizeTotalCount++;
                JQlogRedPoint.text(winPrizeNum);
                if (JQlogRedPoint.is(":hidden")) JQlogRedPoint.show();
                if (MY_API.CONFIG.ANCHOR_PRIVATE_LETTER) {
                  // 私信
                  const msg = {
                    sender_uid: Live_info.uid,
                    receiver_id: anchorUid,
                    receiver_type: 1,
                    msg_type: 1,
                    msg_status: 0,
                    content: `{"content":"` + MY_API.CONFIG.ANCHOR_LETTER_CONTENT + `"}`,
                    dev_id: getMsgDevId()
                  }
                  setTimeout(() => {
                    BAPI.sendMsg(msg).then((res) => {
                      MYDEBUG(`API.sendMsg ${msg}`, res);
                      if (res.code === 0) {
                        window.toast(`[天选自动私信] 私信UP(uid = ${anchorUid})成功`, 'success');
                      } else {
                        window.toast(`[天选自动私信] 私信UP(uid = ${anchorUid})失败 ${res.message}`, 'error');
                      }
                    }, () => {
                      MY_API.chatLog(`[天选自动私信] 私信UP(uid = ${anchorUid})出错，请检查网络`);
                    })
                  }, getRandomNum(5000, 8000));
                }
                if (MY_API.CONFIG.ANCHOR_MOVETO_PRIZE_TAG) {
                  // 移动分组
                  if (findVal(MY_API.AnchorLottery.BLTHprizeList, anchorUid) === -1) {
                    BAPI.relation.addUsers(anchorUid, MY_API.AnchorLottery.anchorPrizeTagid).then((re) => {
                      MYDEBUG(`API.relation.addUsers ${anchorUid} ${MY_API.AnchorLottery.anchorPrizeTagid}`, re);
                      MY_API.AnchorLottery.BLTHprizeList.push(anchorUid);
                      if (re.code === 0) window.toast(`[天选时刻] 移动UP（uid = ${anchorUid}）至分组【${anchorPrizeTagName}】成功`, 'success');
                      else window.toast(`[天选时刻] 移动UP（uid = ${anchorUid}）至分组【${anchorPrizeTagName}】失败 ${re.message}`, 'warning');
                    }, () => {
                      MY_API.chatLog(`[天选时刻] 移动UP（uid = ${anchorUid}）到分组【${anchorPrizeTagName}】出错，请检查网络`, 'error');
                    });
                  }
                }
                if (MY_API.CONFIG.PP_NOTICE) {
                  // pushplus
                  const data = {
                    token: MY_API.CONFIG.PP_token,
                    title: `${GM_info.script.name} 天选时刻中奖通知`,
                    content: `<div style="border: 1px solid rgb(223, 187, 0);color: rgb(145, 123, 0);background: none 0% 0% repeat scroll rgb(255, 215, 0, 30%);text-align: center;border-radius: 5%;padding: 15px 20px;"><h3>天选时刻中奖</h3><br /><h4>中奖账号id：${Live_info.uname}</h4><br /><h4>房间号roomid=${data.roomid}</h4><br /><h4>主播uid=${anchorUid}</h4><br /><h4>抽奖id=${data.id}</h4><br /><h4>获得奖品：</h4><br /><h3>${data.award_name}</h3><br /><h4>请及时私信主播发放奖励</h4></div>`
                  };
                  PP_sendMsg(data).then((re) => {
                    MYDEBUG('PP_sendMsg response', re);
                    if (re.body.code == 200) {
                      window.toast('[天选时刻] 推送加中奖提示发送成功', 'success');
                    } else {
                      window.toast(`[天选时刻] 推送加中奖提示发送失败 ${re.body.msg}`, 'error')
                    }
                    return $.Deferred().resolve();
                  });
                }
                if (MY_API.CONFIG.CP_NOTICE) {
                  // 酷推
                  CP_sendMsg(MY_API.CONFIG.CP_Skey,
                    `【${GM_info.script.name}】天选时刻中奖通知\n中奖账号id：${Live_info.uname}\n房间号roomid = ${data.roomid}\n主播uid = ${anchorUid}\n抽奖id = ${data.id}\n获得奖品：\n${data.award_name}\n请及时私信主播发放奖励`
                  ).then((re) => {
                    MYDEBUG('CP_sendMsg response', re);
                    if (re.body.code === 200) {
                      window.toast('[天选时刻] 酷推中奖提示发送成功', 'success');
                    } else {
                      window.toast(`[天选时刻] 酷推中奖提示发送失败 ${re.body.code}`, 'error')
                    }
                    return $.Deferred().resolve();
                  });
                }
                if (MY_API.CONFIG.ServerTurbo_NOTICE) {
                  // Server酱turbo版
                  ServerTurbo_sendMsg(MY_API.CONFIG.ServerTurbo_SendKey,
                    `${GM_info.script.name} 天选时刻中奖通知`,
                    `## 天选时刻中奖  \n  \n## 中奖账号id：${Live_info.uname}  \n  \n## 房间号roomid = ${data.roomid}  \n  \n## 主播uid = ${anchorUid}  \n  \n## 抽奖id = ${data.id}  \n  \n## 获得奖品：  \n  \n# ${data.award_name}  \n  \n## 请及时私信主播发放奖励`
                  ).then((re) => {
                    MYDEBUG('ServerTurbo_sendMsg response', re);
                    if (re.body && re.body.code === 0) {
                      window.toast('[实物抽奖] Server酱Turbo版发起推送成功', 'success');
                    } else {
                      window.toast(`[实物抽奖] Server酱Turbo版发起推送失败 ${re.response.status}`, 'error');
                    }
                    return $.Deferred().resolve();
                  })
                }
                if (MY_API.CONFIG.GM_NOTICE) {
                  // 系统通知
                  GM_notice("天选时刻中奖", `房间号：${data.roomid}，奖品：${data.award_name}`)
                }
                if (MY_API.CONFIG.ANCHOR_DANMU) {
                  // 弹幕
                  const danmuContent = MY_API.CONFIG.ANCHOR_DANMU_CONTENT[Math.floor(Math.random() * MY_API.CONFIG.MEDAL_DANMU_CONTENT.length)];
                  MY_API.AnchorLottery.sendDanmu(danmuContent, data.roomid)
                }
                if (MY_API.CONFIG.ANCHOR_ADD_TO_WHITELIST) {
                  // 添加到白名单
                  let id_list = GM_getValue(`AnchorFollowingList`) || [];
                  id_list.push(String(anchorUid));
                  GM_setValue(`AnchorFollowingList`, id_list);
                  window.toast(`[天选时刻] 已将UP（uid = ${anchorUid}）添加至白名单`, 'success');
                }
              }
            } else if (response.code !== 0) {
              MY_API.chatLog(`[天选时刻] 天选检查出错，${response.message}`, 'error');
              return delayCall(() => MY_API.AnchorLottery.check(roomid));
            }
          });
        },
        sendDanmu: async (danmuContent, roomId) => {
          let realRoomId = roomId;
          if (Number(roomId) <= 10000) {
            realRoomId = await BAPI.room.get_info(roomId).then((res) => {
              MYDEBUG(`API.room.get_info roomId=${roomId} res`, res); // 可能是短号，要用长号发弹幕
              if (res.code === 0) {
                return res.data.room_id;
              } else {
                window.toast(`[天选中奖弹幕] 房间号【${roomId}】信息获取失败 ${res.message}`, 'error');
                return roomId;
              }
            });
          }
          return BAPI.sendLiveDanmu(danmuContent, realRoomId).then((response) => {
            MYDEBUG(`[天选中奖弹幕] 弹幕发送内容【${danmuContent}】，房间号【${roomId}】`, response);
            if (response.code === 0) {
              window.toast(`[天选中奖弹幕] 弹幕【${danmuContent}】发送成功（房间号【${roomId}】）`, 'success');
            } else {
              window.toast(`[天选中奖弹幕] 弹幕【${danmuContent}】（房间号【${roomId}】）出错 ${response.msg}`, 'caution');
            }
          })
        },
        countDown: (time, color = '#da4939') => {
          if (time !== undefined)
            return `<span id="time" style="color:${color};">距开奖还有<span class = 'num'>${time}</span>秒</span>`;
          else return '';
        },
        pwdCheck: (room_id, pwd = '') => {
          return BAPI.room.verify_room_pwd(room_id, pwd).then((response) => {
            MYDEBUG(`API.room.verify_room_pwd(${room_id}, ${pwd})`, response);
            if (response.code === -1) return true; // message: ╮(￣▽￣)╭请输入密码 / 你确定不是掏错卡了？("▔□▔)/请重新输入密码
            else if (response.code === 0) return false; // message: room_not_encrypted
            else {
              MY_API.chatLog(`[天选时刻] 直播间加密检查出错，${response.message} 视为加密`, 'error');
              return true;
            }
          });
        },
        /**
         * 参与天选
           @param {
               { id: number, gift_id?: number, gift_num?: number, roomid: number, award_name: string, time: number, require_type: number, joinPrice: number, uid: undefined}
            } data
         */
        join: (data, joinTimes) => {
          //console.table('[天选时刻] 参加天选 join(data)\n', { id: data.id, gift_id: data.gift_id, gift_num: data.gift_num, roomid: data.roomid, award_name: data.award_name, time: data.time, require_type: data.require_type, joinPrice: data.joinPrice});
          return BAPI.xlive.anchor.join(data.id, data.gift_id, data.gift_num).then((response) => {
            MYDEBUG(`API.xlive.anchor.join(${data.id}) response`, response);
            if (response.code === 0) {
              MY_API.chatLog(`[天选时刻] 成功参加天选<br>roomid = ${linkMsg(liveRoomUrl + data.roomid, data.roomid)}, id = ${data.id}<br>${data.joinPrice === 0 ? '' : ('花费电池：' + data.joinPrice + '<br>')}奖品：${data.award_name}<br>${MY_API.AnchorLottery.countDown(data.time)}`, 'success');
              let p = $.Deferred();
              if (!data.uid) {
                BAPI.live_user.get_anchor_in_room(data.roomid).then((res) => { // 获取uid
                  MYDEBUG(`API.live_user.get_anchor_in_room(${data.roomid})`, res);
                  if (res.code === 0) {
                    data.uid = res.data.info.uid;
                    p.resolve();
                    MY_API.AnchorLottery.roomidAndUid[data.roomid] = res.data.info.uid;
                  } else {
                    MY_API.chatLog(`[天选时刻] 获取uid出错，中断后续操作<br>roomid = ${linkMsg(liveRoomUrl + data.roomid, data.roomid)}, id = ${data.id}<br>${res.msg}`, 'error');
                    p.reject();
                  }
                }, () => {
                  MY_API.chatLog(`[天选时刻] 获取uid出错，中断后续操作<br>roomid = ${linkMsg(liveRoomUrl + data.roomid, data.roomid)}, id = ${data.id}<br>请检查网络`, 'error');
                  p.reject();
                });
              } else p.resolve();
              p.then(() => {
                MY_API.addAnchor();
                MYDEBUG('天选时刻join data', data);
                if (data.require_type === 1 && MY_API.CONFIG.ANCHOR_MOVETO_FOLLOW_TAG) { // 有关注要求
                  if (findVal(MY_API.AnchorLottery.uidInOriginTag, data.uid) > -1 && findVal(MY_API.AnchorLottery.uidInSpecialTag, data.uid) > -1) return; // 之前在默认/特别分组，不移动
                  setTimeout(() => {
                    const id_list = GM_getValue(`AnchorFollowingList`) || []; // 白名单
                    if (findVal(id_list, data.uid) === -1 && findVal(MY_API.AnchorLottery.BLTHprizeList, data.uid) === -1 && findVal(MY_API.AnchorLottery.BLTHfollowList, data.uid) === -1) {
                      // 该UP不在中奖分组/关注分组/白名单才移动
                      BAPI.relation.addUsers(data.uid, MY_API.AnchorLottery.anchorFollowTagid).then((re) => {
                        MYDEBUG(`API.relation.addUsers ${data.uid} ${MY_API.AnchorLottery.anchorFollowTagid}`, re);
                        MY_API.AnchorLottery.BLTHfollowList.push(data.uid);
                        if (re.code === 0) window.toast(`[天选时刻] 移动UP（uid = ${data.uid}）至分组【${anchorFollowTagName}】成功`, 'success');
                        else window.toast(`[天选时刻] 移动UP（uid = ${data.uid}）至分组【${anchorFollowTagName}】失败 ${re.message}`, 'warning');
                      }, () => {
                        MY_API.chatLog(`[天选时刻] 移动UP（uid = ${data.uid}）到分组【${anchorFollowTagName}】出错，请检查网络`, 'error');
                      });
                    }
                  }, getRandomNum(5000, 8000));
                }
                if (data.joinPrice > 0 && --joinTimes > 0) return MY_API.AnchorLottery.join(data, joinTimes);
                else return setTimeout(() => MY_API.AnchorLottery.reCheck(data), data.time * 1000 + 1500);
              })
            } else if (response.code === 500) {
              MY_API.chatLog(`[天选时刻] 天选参加失败<br>roomid = ${linkMsg(liveRoomUrl + data.roomid, data.roomid)}, id = ${data.id}<br>奖品：${data.award_name}<br>${response.msg}<br>3秒后再次尝试参加`, 'warning');
              return setTimeout(() => MY_API.AnchorLottery.join(data, joinTimes), 3000);
            }
            else {
              return MY_API.chatLog(`[天选时刻] 天选参加失败<br>roomid = ${linkMsg(liveRoomUrl + data.roomid, data.roomid)}, id = ${data.id}<br>奖品：${data.award_name}<br>${response.msg}`, 'warning')
            }
          })
        },
        /**
         * 检测是否在休眠时间休眠时间
         * @returns {boolean} false （不在休眠时间段）
         * @returns {number} 距休眠结束的毫秒数 （在休眠时间段）
         */
        sleepCheck: () => {
          if (!MY_API.CONFIG.TIME_AREA_DISABLE) return false;
          if (inTimeArea(MY_API.CONFIG.TIME_AREA_START_H0UR, MY_API.CONFIG.TIME_AREA_END_H0UR, MY_API.CONFIG.TIME_AREA_START_MINUTE, MY_API.CONFIG.TIME_AREA_END_MINUTE)) {
            // 判断时间段
            return getIntervalTime(MY_API.CONFIG.TIME_AREA_END_H0UR, MY_API.CONFIG.TIME_AREA_END_MINUTE);
          } else {
            return false
          }
        },
        /**
         * 获取房间号对应的uid
         * @param {Number} roomid 
         * @returns {Number} uid
         */
        getAnchorUid: (roomid) => {
          if (MY_API.AnchorLottery.roomidAndUid.hasOwnProperty(roomid)) return $.Deferred().resolve(MY_API.AnchorLottery.roomidAndUid[roomid]);
          return BAPI.room.getRoomBaseInfo(roomid).then((response) => {
            MYDEBUG(`API.room.getRoomBaseInfo(${roomid}) getAnchorUid`, response);
            if (response.code === 0) {
              const uid = response.data.by_room_ids[roomid].uid;
              MY_API.AnchorLottery.roomidAndUid[roomid] = uid;
              return uid;
            } else {
              MY_API.chatLog(`[天选时刻] 获取uid出错<br>roomid = ${linkMsg(liveRoomUrl + roomid, roomid)}<br>${response.message}`, 'error');
              return -1
            }
          })
        },
        /**
         * 获取粉丝数量
         * @param {Number} uid 
         * @returns {Number} 粉丝数量（失败为-1）
         */
        fansCheck: (uid) => {
          const rnd = getRandomNum(0, 1);
          switch (rnd) {
            case 0: {
              return BAPI.x.stat(uid).then((response) => {
                MYDEBUG(`API.x.stat(${uid}) fansCheck`, response);
                if (response.code === 0) {
                  return response.data.follower;
                } else {
                  MY_API.chatLog(`[天选时刻] 获取粉丝数(uid=${uid})失败 ${response.message}`, 'error');
                  return -1;
                }
              })
            }
            case 1: {
              return BAPI.x.card(uid).then((response) => {
                MYDEBUG(`API.x.card(${uid}) fansCheck`, response);
                if (response.code === 0) {
                  return response.data.follower;
                } else {
                  MY_API.chatLog(`[天选时刻] 获取粉丝数(uid=${uid})错误 ${response.message}`, 'error');
                  return -1;
                }
              })
            }
            default: return -1;
          }
        },
        awpush: {
          taskName: {
            POLLING_HOT_ROOMS: "轮询热门直播间",
            POLLING_LIVEROOMS: "轮询已关注的开播直播间",
            POLLING_AREA: "轮询指定分区"
          },
          userInfo: {
            task: undefined,
            secret: undefined,
            area_data: undefined,
            sleep_time: undefined,
            interval: undefined,
            max_room: undefined
          },
          polling_allRoomList: async () => {
            if (MY_API.AnchorLottery.allRoomList.length > MY_API.AnchorLottery.awpush.userInfo.max_room)
              MY_API.AnchorLottery.allRoomList = [...MY_API.AnchorLottery.allRoomList.slice(0, MY_API.AnchorLottery.awpush.userInfo.max_room)]
            MY_API.chatLog(`[天选时刻] 开始检查天选（共${MY_API.AnchorLottery.allRoomList.length}个房间）`, 'success');
            let lastStatus = MY_API.AnchorLottery.awpush.websocket.status;
            for (const room of MY_API.AnchorLottery.allRoomList) {
              // 如果重连成功则不执行之前的任务
              if (lastStatus !== 'open' && MY_API.AnchorLottery.awpush.websocket.status === 'open') return $.Deferred().resolve('return');
              lastStatus = MY_API.AnchorLottery.awpush.websocket.status;
              let p = $.Deferred();
              const uid = MY_API.AnchorLottery.roomidAndUid.hasOwnProperty(room) ? MY_API.AnchorLottery.roomidAndUid[room] : undefined;
              if (!MY_API.CONFIG.ANCHOR_WAIT_REPLY) p.resolve();
              MY_API.AnchorLottery.awpush.check(room, uid).then((re) => {
                if (re) {
                  // 数据格式正确，可以参加
                  let hasPwd = false, fans = { lackFan: false, fanNum: -1 };
                  let p1 = $.Deferred(), p2 = $.Deferred();
                  if (MY_API.CONFIG.ANCHOR_IGNORE_PWDROOM) {
                    MY_API.AnchorLottery.pwdCheck(room).then((res) => {
                      if (res) hasPwd = true; // 加密
                      return p1.resolve();
                    }, () => {
                      MY_API.chatLog('[天选时刻] 直播间加密检查出错，请检查网络', 'error')
                      return p1.resolve();
                    })
                  } else p1.resolve();
                  if (MY_API.CONFIG.ANCHOR_FANS_CHECK) {
                    MY_API.AnchorLottery.getAnchorUid(room).then((uid) => {
                      if (uid === -1) return p2.resolve();
                      MY_API.AnchorLottery.fansCheck(uid).then((res) => {
                        if (res === -1) return p2.resolve();
                        if (res < MY_API.CONFIG.ANCHOR_FANS_LEAST) {
                          fans.lackFan = true;
                          fans.fanNum = res;
                        }
                        return p2.resolve();
                      })
                    })
                  } else p2.resolve();
                  $.when(p1, p2).then(() => {
                    if (hasPwd) {
                      MY_API.chatLog(`[天选时刻] 忽略加密直播间的天选<br>roomid = ${linkMsg(liveRoomUrl + re.roomid, re.roomid)}, id = ${re.id}<br>${re.joinPrice === 0 ? '' : ('所需电池：' + re.joinPrice + '<br>')}奖品：${re.award_name}<br>${MY_API.AnchorLottery.countDown(re.time)}`, 'warning');
                      return p.resolve();
                    }
                    if (fans.lackFan) {
                      MY_API.chatLog(`[天选时刻] 忽略UP粉丝数不足的天选<br>roomid = ${linkMsg(liveRoomUrl + re.roomid, re.roomid)}, id = ${re.id}<br>${re.joinPrice === 0 ? '' : ('所需电池：' + re.joinPrice + '<br>')}UP粉丝数：${fans.fanNum}<br>奖品：${re.award_name}<br>${MY_API.AnchorLottery.countDown(re.time)}`, 'warning');
                      return p.resolve();
                    }
                    MY_API.AnchorLottery.join(re, MY_API.CONFIG.ANCHOR_GOLD_JOIN_TIMES).then(() => p.resolve());
                  })
                } else p.resolve();
              });
              await p;
              await sleep(MY_API.AnchorLottery.awpush.userInfo.interval);
            };
          },
          handleTask: async () => {
            // 用户自己设置的休眠
            const sleepTime = MY_API.AnchorLottery.sleepCheck();
            if (sleepTime) {
              // 休眠
              MYDEBUG('[天选时刻] awpush', `处于休眠时段，${sleepTime}毫秒后再次检查天选`);
              MY_API.AnchorLottery.awpush.websocket.status = 'active_close';
              MY_API.AnchorLottery.awpush.websocket.ws.close();
              MY_API.chatLog(`[天选时刻] 处于休眠时段，将会在<br>${new Date(ts_ms() + sleepTime).toLocaleString()}<br>结束休眠并再次连接awpush`, 'warning');
              return setTimeout(() => MY_API.AnchorLottery.awpush.websocket.run(), sleepTime);
            }
            switch (MY_API.AnchorLottery.awpush.userInfo.task) {
              case "POLLING_HOT_ROOMS": {
                await MY_API.AnchorLottery.getHotRoomList();
                for (const r of MY_API.AnchorLottery.roomidList) {
                  addVal(MY_API.AnchorLottery.allRoomList, r);
                }
                let re = await MY_API.AnchorLottery.awpush.polling_allRoomList();
                if (re === 'return') return;
                else break;
              }
              case "POLLING_LIVEROOMS": {
                await MY_API.AnchorLottery.getLiveUsers();
                MY_API.AnchorLottery.liveRoomList = [];
                for (const i of MY_API.AnchorLottery.liveUserList) {
                  let realRoomId, roomid;
                  const roomidList = i.link.match(/^https?:\/\/live\.bilibili\.com\/(\d+)/),
                    uid = i.uid;
                  if (Array.isArray(roomidList) && roomidList.length >= 2) roomid = roomidList[1];
                  if (!roomid) return MYERROR('[天选时刻] 获取已关注开播直播间号失败', roomidList);
                  if (Number(roomid) <= 10000) {
                    realRoomId = await BAPI.room.get_info(roomid).then((res) => {
                      MYDEBUG(`API.room.get_info roomid=${roomid} res`, res); // 可能是短号，要用长号发弹幕
                      if (res.code === 0) {
                        return res.data.room_id;
                      } else {
                        window.toast(`[天选时刻]获取房间【${roomid}】信息出错 ${res.message}`, 'error');
                        return roomid;
                      }
                    })
                  } else realRoomId = roomid;
                  addVal(MY_API.AnchorLottery.liveRoomList, realRoomId);
                  MY_API.AnchorLottery.roomidAndUid[roomid] = uid;
                  MY_API.AnchorLottery.roomidAndUid[realRoomId] = uid;
                }
                MY_API.chatLog(`[天选时刻] 已关注的开播直播间获取完毕<br>共${MY_API.AnchorLottery.liveRoomList.length}个`, 'success');
                for (const r of MY_API.AnchorLottery.liveRoomList) {
                  addVal(MY_API.AnchorLottery.allRoomList, r);
                }
                await MY_API.AnchorLottery.awpush.polling_allRoomList();
                break;
              }
              case "POLLING_AREA": {
                await MY_API.AnchorLottery.getRoomList(MY_API.AnchorLottery.awpush.userInfo.area_data);
                for (const r of MY_API.AnchorLottery.roomidList) {
                  addVal(MY_API.AnchorLottery.allRoomList, r);
                }
                await MY_API.AnchorLottery.awpush.polling_allRoomList();
                break;
              }
              default: {
                MYERROR("awpush 未知任务", MY_API.AnchorLottery.awpush.userInfo.task);
                return;
              }
            }
            const json = {
              code: "GET_TASK",
              uid: Live_info.uid,
              secret: MY_API.AnchorLottery.awpush.userInfo.secret,
            };
            setTimeout(() => MY_API.AnchorLottery.awpush.websocket.desend(JSON.stringify(json)), MY_API.AnchorLottery.awpush.userInfo.sleep_time);
            // 每两轮请求间的休息时间
            const sleep_time = (MY_API.AnchorLottery.awpush.userInfo.sleep_time / 1000).toFixed(0);
            MY_API.chatLog(`[天选时刻] ${sleep_time}秒后开始执行下一轮任务`);
            MYDEBUG(`awpush ${sleep_time}秒后运行下一轮任务`);
          },
          check: (roomid, uid) => {
            return BAPI.xlive.anchor.check(roomid).then((response) => {
              MYDEBUG(`API.xlive.anchor.check(${roomid}) response`, response);
              if (response.code === 0) {
                if (!response.data) return false;
                if (!MY_API.AnchorLottery.filter.hasChecked(response.data)) return false;
                if (!MY_API.AnchorLottery.filter.time(response.data)) return false;
                if (!MY_API.AnchorLottery.filter.status(response.data)) return false;
                const update_data = {
                  code: "UPDATE_ANCHOR_DATA",
                  uid: Live_info.uid,
                  secret: MY_API.AnchorLottery.awpush.userInfo.secret,
                  data: MY_API.AnchorLottery.filter.delUselessData(response.data)
                };
                MYDEBUG('awpush 上传天选数据: ', update_data);
                MY_API.AnchorLottery.awpush.websocket.desend(JSON.stringify(update_data));
                // 添加至上传列表
                addVal(MY_API.AnchorLottery.lotteryResponseList, response.data.room_id);
                addVal(MY_API.AnchorLottery.BLTHuploadRoomList, response.data.room_id);
                return MY_API.AnchorLottery.filter.further(response.data, uid);
              }
              else {
                MY_API.chatLog(`[天选时刻] 天选检查出错，${response.message}`, 'error');
                return delayCall(() => MY_API.AnchorLottery.check(roomid));
              }
            });
          },
          websocket: {
            wsinit: function () { MY_API.AnchorLottery.awpush.websocket.ws = new WebSocket('wss://andywang.top:3001/ws') }, // 测试时用 localhost, 原为 andywang.top
            ws: null,
            /** open, active_close, close, reconnecting  */
            status: 'close',
            /** 自定义消息发送 - 压缩 */
            desend: function (...arg) {
              let ws = MY_API.AnchorLottery.awpush.websocket.ws;
              if (ws) MY_API.AnchorLottery.awpush.websocket.ws.send(pako.deflate(arg[0]));
              else MYERROR('awpush 暂时无法发送消息, 等待重连...');
            },
            run: () => {
              MY_API.AnchorLottery.awpush.websocket.wsinit();
              let ws = MY_API.AnchorLottery.awpush.websocket.ws;
              let secret, task, area_data, sleep_time, interval, max_room;
              /** 心跳 */
              let heartBeat = {
                timeout: 30e3,
                timeoutObj: null,
                serverTimeoutObj: null,
                reset: function () {
                  clearTimeout(this.timeoutObj);
                  clearTimeout(this.serverTimeoutObj);
                  this.start();
                },
                start: function () {
                  let self = this;
                  this.timeoutObj = setTimeout(function () {
                    ws.send("ping");
                    self.serverTimeoutObj = setTimeout(function () {
                      ws.close();
                    }, self.timeout)
                  }, this.timeout)
                },
                stop: function () {
                  clearTimeout(this.timeoutObj);
                  clearTimeout(this.serverTimeoutObj);
                }
              };
              // 自定义消息发送 - 压缩
              ws.desend = MY_API.AnchorLottery.awpush.websocket.desend;
              // 连接成功
              ws.onopen = function () {
                MY_API.AnchorLottery.awpush.websocket.status = 'open';
                heartBeat.start();
                const verify = {
                  code: "VERIFY_APIKEY",
                  uid: Live_info.uid,
                  apikey: MY_API.CONFIG.ANCHOR_SERVER_APIKEY[Live_info.uid]
                };
                const str = JSON.stringify(verify);
                MYDEBUG('awpush 发送身份验证数据', str);
                ws.desend(str);
              };
              // 收到消息
              ws.onmessage = function (event) {
                MYDEBUG('awpush 收到来自服务端的消息', event.data);
                if (event.data === 'pong') heartBeat.reset();
                else {
                  let json = '';
                  let reader = new FileReader();
                  reader.onload = function () {
                    json = JSON.parse(pako.inflate(reader.result, { to: 'string' }));
                    if (json.code !== 0) return MYERROR('awpush 收到消息中的code不为0，出错', json);
                    MYDEBUG('awpush 解析后消息', json);
                    switch (json.type) {
                      case 'WS_OPEN': {
                        window.toast('[awpush] 连接成功', 'success');
                        break;
                      }
                      case 'HAND_OUT_TASKS': {
                        secret = json.data.secret;
                        task = json.data.task;
                        area_data = json.data.area_data || {};
                        sleep_time = json.data.sleep_time || 30e3;
                        interval = json.data.interval || 500;
                        max_room = json.data.max_room || 500;
                        window.toast(`[awpush] 获得任务: ${MY_API.AnchorLottery.awpush.taskName[task]}${area_data.name ? " - " + area_data.name : ""}`, 'info');
                        MYDEBUG(`awpush HAND_OUT_TASKS 分发任务 获得任务: ${task}, secret: ${secret}, 最大轮询房间数: ${max_room}, 休息时间: ${sleep_time}毫秒, 请求间隔: ${interval}毫秒, 分区信息`, area_data);
                        MY_API.AnchorLottery.awpush.userInfo.task = task;
                        MY_API.AnchorLottery.awpush.userInfo.secret = secret;
                        MY_API.AnchorLottery.awpush.userInfo.area_data = area_data;
                        MY_API.AnchorLottery.awpush.userInfo.sleep_time = sleep_time;
                        MY_API.AnchorLottery.awpush.userInfo.interval = interval;
                        MY_API.AnchorLottery.awpush.userInfo.max_room = max_room;
                        MY_API.AnchorLottery.awpush.handleTask();
                        break;
                      }
                      case 'HAND_OUT_ANCHOR_DATA': {
                        const data = json.data;
                        window.toast(`[awpush] 获得已解析的天选数据 id=${data.id} roomid=${data.room_id}`);
                        MYDEBUG('awpush 获得解析后的天选数据，准备参加', data);
                        if (!MY_API.AnchorLottery.filter.hasChecked(data)) return false;
                        if (!MY_API.AnchorLottery.filter.ignore_room(data.room_id)) return false;
                        if (!MY_API.AnchorLottery.filter.time(data)) return false;
                        if (!MY_API.AnchorLottery.filter.status(data)) return false;
                        const re = MY_API.AnchorLottery.filter.further(data);
                        if (re) {
                          // 数据格式正确，可以参加
                          let hasPwd = false, fans = { lackFan: false, fanNum: -1 };
                          let p1 = $.Deferred(), p2 = $.Deferred();
                          if (MY_API.CONFIG.ANCHOR_IGNORE_PWDROOM) {
                            MY_API.AnchorLottery.pwdCheck(room).then((res) => {
                              if (res) hasPwd = true; // 加密
                              return p1.resolve();
                            }, () => {
                              MY_API.chatLog('[天选时刻] 直播间加密检查出错，请检查网络', 'error')
                              return p1.resolve();
                            })
                          } else p1.resolve();
                          if (MY_API.CONFIG.ANCHOR_FANS_CHECK) {
                            MY_API.AnchorLottery.getAnchorUid(data.room_id).then((uid) => {
                              if (uid === -1) return p2.resolve();
                              MY_API.AnchorLottery.fansCheck(uid).then((res) => {
                                if (res === -1) return p2.resolve();
                                if (res < MY_API.CONFIG.ANCHOR_FANS_LEAST) {
                                  fans.lackFan = true;
                                  fans.fanNum = res;
                                }
                                return p2.resolve();
                              })
                            })
                          } else p2.resolve();
                          $.when(p1, p2).then(() => {
                            if (hasPwd) {
                              MY_API.chatLog(`[天选时刻] 忽略加密直播间的天选<br>roomid = ${linkMsg(liveRoomUrl + re.roomid, re.roomid)}, id = ${re.id}<br>${re.joinPrice === 0 ? '' : ('所需电池：' + re.joinPrice + '<br>')}奖品：${re.award_name}<br>${MY_API.AnchorLottery.countDown(re.time)}`, 'warning');
                            }
                            if (fans.lackFan) {
                              MY_API.chatLog(`[天选时刻] 忽略UP粉丝数不足的天选<br>roomid = ${linkMsg(liveRoomUrl + re.roomid, re.roomid)}, id = ${re.id}<br>${re.joinPrice === 0 ? '' : ('所需电池：' + re.joinPrice + '<br>')}UP粉丝数：${fans.fanNum}<br>奖品：${re.award_name}<br>${MY_API.AnchorLottery.countDown(re.time)}`, 'warning');
                            }
                            MY_API.AnchorLottery.join(re, MY_API.CONFIG.ANCHOR_GOLD_JOIN_TIMES);
                          })
                        }
                        break;
                      }
                      case 'RES_UPDATE_ANCHOR_DATA': {
                        // 上传天选数据成功
                        window.toast(`[awpush] 上传天选数据（id=${json.data.id}）成功`, 'success');
                        break;
                      }
                      default: {
                        window.toast(`[awpush] 未知的消息种类 ${json.type}`, 'warning');
                        MYERROR('awpush 未知的消息种类', json);
                      }
                    }
                  }
                  reader.readAsBinaryString(event.data);
                }
              };
              // 关闭
              ws.onclose = function (event) {
                if (MY_API.AnchorLottery.awpush.websocket.status === 'active_close') {
                  MYDEBUG('awpush 已主动断开连接');
                  window.toast('[awpush] 已主动断开连接', 'warning');
                  return;
                }
                MY_API.AnchorLottery.awpush.websocket.status = 'close';
                heartBeat.stop();
                let json = {};
                try {
                  json = JSON.parse(event.reason);
                } catch (e) { json.data = event.reason; }
                window.toast(`[awpush] ${json.data || '连接已关闭'} 30秒后尝试重连`, 'warning');
                MYDEBUG('awpush 服务端已关闭连接，30秒后尝试重连', event.code, event.reason);
                reconnect();
              };
              /**
               * websocket 重连
               */
              function reconnect() {
                const status = MY_API.AnchorLottery.awpush.websocket.status;
                if (status === 'reconnecting' || status === 'open') return;
                MY_API.AnchorLottery.awpush.websocket.status = 'reconnecting';
                MY_API.AnchorLottery.awpush.websocket.ws = null;
                setTimeout(() => MY_API.AnchorLottery.awpush.websocket.run(), 30e3);
              }
            }
          },
          run: () => {
            // awpush 入口
            MY_API.AnchorLottery.awpush.websocket.run();
          }
        },
        run: async () => {
          if (!MY_API.CONFIG.ANCHOR_LOTTERY || otherScriptsRunning) return $.Deferred().resolve();
          if (medal_info.status.state() === "resolved") MY_API.AnchorLottery.medal_list = [...medal_info.medal_list];
          else {
            MY_API.chatLog('[天选时刻] 粉丝勋章列表未被完全获取，暂停运行', 'error');
            return medal_info.status.then(() => MY_API.AnchorLottery.run());
          }
          MY_API.chatLog(`[天选时刻] 开始获取关注分组信息`);
          if (MY_API.CONFIG.ANCHOR_MOVETO_FOLLOW_TAG || MY_API.CONFIG.ANCHOR_MOVETO_PRIZE_TAG)
            await MY_API.AnchorLottery.getTag([anchorFollowTagName, anchorPrizeTagName]);
          await MY_API.AnchorLottery.getUpInBLTHTag(Live_info.uid, [MY_API.AnchorLottery.anchorFollowTagid, MY_API.AnchorLottery.anchorPrizeTagid]);
          await MY_API.AnchorLottery.getUpInOriginTag(Live_info.uid);
          await MY_API.AnchorLottery.getUpInSpecialTag(Live_info.uid);
          if (MY_API.CONFIG.ANCHOR_UPLOAD_DATA) {
            // 上传至直播间简介
            MY_API.AnchorLottery.uploadData();
          }
          if (MY_API.CONFIG.ANCHOR_UPLOAD_ROOMLIST) {
            // 上传至BLTH-server
            MY_API.AnchorLottery.uploadRoomList();
          }
          if (MY_API.CONFIG.ANCHOR_AWPUSH) {
            // 如果开启了 awpush 中断后续流程
            return MY_API.AnchorLottery.awpush.run();
          }
          function waitForNextRun(Fn, firstRun = false, toNext = false) {
            const sleepTime = MY_API.AnchorLottery.sleepCheck();
            if (sleepTime) { // 休眠
              MYDEBUG('[天选时刻]', `处于休眠时段，${sleepTime}毫秒后再次检查天选`);
              MY_API.chatLog(`[天选时刻] 处于休眠时段，将会在<br>${new Date(ts_ms() + sleepTime).toLocaleString()}<br>结束休眠并继续检查天选`, 'warning');
              return setTimeout(() => Fn(), sleepTime);
            } else {
              const intervalTime = ts_ms() - MY_API.CACHE.AnchorLottery_TS,
                settingInterval = MY_API.CONFIG.ANCHOR_CHECK_INTERVAL * 60000,
                tillNextRun = settingInterval - intervalTime;
              if (toNext) {
                MYDEBUG('[天选时刻]', `将在${settingInterval}毫秒后检查天选`);
                if (firstRun) {
                  MY_API.chatLog(`[天选时刻] <br>将在${MY_API.CONFIG.ANCHOR_CHECK_INTERVAL}分钟后开始检查天选`, 'success');
                } else {
                  MY_API.chatLog(`[天选时刻] 本次检查结束，将在<br>${MY_API.CONFIG.ANCHOR_CHECK_INTERVAL}分钟后继续检查天选`, 'success');
                }
                return setTimeout(() => Fn(), settingInterval);
              } else {
                if (tillNextRun <= 0) return Fn();
                else {
                  MYDEBUG('[天选时刻]', `将在${tillNextRun}毫秒后检查天选`);
                  if (firstRun) {
                    MY_API.chatLog(`[天选时刻] <br>将在${parseInt(tillNextRun / 60000)}分${parseInt((tillNextRun % 60000) / 1000)}秒后开始检查天选`, 'success');
                  } else {
                    MY_API.chatLog(`[天选时刻] 本次检查结束，将在<br>${parseInt(tillNextRun / 60000)}分${parseInt((tillNextRun % 60000) / 1000)}秒后继续检查天选`, 'success');
                  }
                  return setTimeout(() => Fn(), tillNextRun);
                }
              }
            }
          }
          async function getDataAndJoin() {
            const sleepTime = MY_API.AnchorLottery.sleepCheck();
            if (sleepTime) { // 休眠
              MYDEBUG('[天选时刻]', `处于休眠时段，${sleepTime}毫秒后再次检查天选`);
              MY_API.chatLog(`[天选时刻] 处于休眠时段，将会在<br>${new Date(ts_ms() + sleepTime).toLocaleString()}<br>结束休眠并继续检查天选`, 'warning');
              return setTimeout(() => getDataAndJoin(), sleepTime);
            } else {
              if (MY_API.CONFIG.ANCHOR_TYPE_SERVER) { // BLTH-server
                await MY_API.AnchorLottery.getDataFromBLTHserver();
              }
              if (MY_API.CONFIG.ANCHOR_TYPE_POLLING) { // 轮询热门房间
                await MY_API.AnchorLottery.getHotRoomList(MY_API.CONFIG.ANCHOR_IGNORE_AREA ? MY_API.CONFIG.ANCHOR_IGNORE_AREA_LIST : []);
              }
              if (MY_API.CONFIG.ANCHOR_TYPE_LIVEROOM) { // 从直播间简介
                await MY_API.AnchorLottery.getLotteryInfoFromRoom();
              }
              if (MY_API.CONFIG.ANCHOR_TYPE_FOLLOWING) { // 从关注直播间
                await MY_API.AnchorLottery.getLiveUsers();
                MY_API.AnchorLottery.liveRoomList = [];
                for (const i of MY_API.AnchorLottery.liveUserList) {
                  let realRoomId, roomid;
                  const roomidList = i.link.match(/^https?:\/\/live\.bilibili\.com\/(\d+)/),
                    uid = i.uid;
                  if (Array.isArray(roomidList) && roomidList.length >= 2) roomid = roomidList[1];
                  if (!roomid) return MYERROR('[天选时刻] 获取已关注开播直播间号失败', roomidList);
                  if (Number(roomid) <= 10000) {
                    realRoomId = await BAPI.room.get_info(roomid).then((res) => {
                      MYDEBUG(`API.room.get_info roomid=${roomid} res`, res); // 可能是短号，要用长号发弹幕
                      if (res.code === 0) {
                        return res.data.room_id;
                      } else {
                        window.toast(`[天选时刻]获取房间【${roomid}】信息出错 ${res.message}`, 'error');
                        return roomid;
                      }
                    })
                  } else realRoomId = roomid;
                  addVal(MY_API.AnchorLottery.liveRoomList, realRoomId);
                  MY_API.AnchorLottery.roomidAndUid[roomid] = uid;
                  MY_API.AnchorLottery.roomidAndUid[realRoomId] = uid;
                }
                MY_API.chatLog(`[天选时刻] 已关注的开播直播间获取完毕<br>共${MY_API.AnchorLottery.liveRoomList.length}个`, 'success');
              }
              if (MY_API.CONFIG.ANCHOR_TYPE_CUSTOM) { // 自定义直播间
                MY_API.AnchorLottery.customLiveRoomList = MY_API.CONFIG.ANCHOR_CUSTOM_ROOMLIST;
              } else {
                MY_API.AnchorLottery.customLiveRoomList = [];
              }
              // 整理数据并参加
              const id_list = [...MY_API.AnchorLottery.BLTHserverRoomList, ...MY_API.AnchorLottery.customLiveRoomList, ...MY_API.AnchorLottery.liveRoomList, ...MY_API.AnchorLottery.introRoomList, ...MY_API.AnchorLottery.roomidList];
              for (const r of id_list) {
                addVal(MY_API.AnchorLottery.allRoomList, r);
              }
              if (MY_API.AnchorLottery.allRoomList.length > MY_API.CONFIG.ANCHOR_MAXROOM)
                MY_API.AnchorLottery.allRoomList = MY_API.AnchorLottery.allRoomList.splice(0, MY_API.CONFIG.ANCHOR_MAXROOM);
              MY_API.chatLog(`[天选时刻] 开始检查天选（共${MY_API.AnchorLottery.allRoomList.length}个房间）`, 'success');
              for (const room of MY_API.AnchorLottery.allRoomList) {
                let p = $.Deferred();
                const uid = MY_API.AnchorLottery.roomidAndUid.hasOwnProperty(room) ? MY_API.AnchorLottery.roomidAndUid[room] : undefined;
                if (!MY_API.CONFIG.ANCHOR_WAIT_REPLY) p.resolve();
                MY_API.AnchorLottery.check(room, uid).then((re) => {
                  if (re) {
                    // 数据格式正确，可以参加
                    let hasPwd = false, fans = { lackFan: false, fanNum: -1 };
                    let p1 = $.Deferred(), p2 = $.Deferred();
                    if (MY_API.CONFIG.ANCHOR_IGNORE_PWDROOM) {
                      MY_API.AnchorLottery.pwdCheck(room).then((res) => {
                        if (res) hasPwd = true; // 加密
                        return p1.resolve();
                      }, () => {
                        MY_API.chatLog('[天选时刻] 直播间加密检查出错，请检查网络', 'error')
                        return p1.resolve();
                      })
                    } else p1.resolve();
                    if (MY_API.CONFIG.ANCHOR_FANS_CHECK) {
                      MY_API.AnchorLottery.getAnchorUid(room).then((uid) => {
                        if (uid === -1) return p2.resolve();
                        MY_API.AnchorLottery.fansCheck(uid).then((res) => {
                          if (res === -1) return p2.resolve();
                          if (res < MY_API.CONFIG.ANCHOR_FANS_LEAST) {
                            fans.lackFan = true;
                            fans.fanNum = res;
                          }
                          return p2.resolve();
                        })
                      })
                    } else p2.resolve();
                    $.when(p1, p2).then(() => {
                      if (hasPwd) {
                        MY_API.chatLog(`[天选时刻] 忽略加密直播间的天选<br>roomid = ${linkMsg(liveRoomUrl + re.roomid, re.roomid)}, id = ${re.id}<br>${re.joinPrice === 0 ? '' : ('所需电池：' + re.joinPrice + '<br>')}奖品：${re.award_name}<br>${MY_API.AnchorLottery.countDown(re.time)}`, 'warning');
                        return p.resolve();
                      }
                      if (fans.lackFan) {
                        MY_API.chatLog(`[天选时刻] 忽略UP粉丝数不足的天选<br>roomid = ${linkMsg(liveRoomUrl + re.roomid, re.roomid)}, id = ${re.id}<br>${re.joinPrice === 0 ? '' : ('所需电池：' + re.joinPrice + '<br>')}UP粉丝数：${fans.fanNum}<br>奖品：${re.award_name}<br>${MY_API.AnchorLottery.countDown(re.time)}`, 'warning');
                        return p.resolve();
                      }
                      MY_API.AnchorLottery.join(re, MY_API.CONFIG.ANCHOR_GOLD_JOIN_TIMES).then(() => p.resolve());
                    })
                  } else p.resolve();
                });
                await p;
                await sleep(MY_API.CONFIG.ANCHOR_INTERVAL);
              };
              MY_API.CACHE.AnchorLottery_TS = ts_ms();
              MY_API.saveCache();
              return waitForNextRun(getDataAndJoin, false, true);
            }
          }
          return waitForNextRun(getDataAndJoin, true);
        } // run结束
      },
      DANMU_MODIFY: {
        maxLength: 0,
        configJson: {
          DANMU_MODIFY_REGEX: [],
          DANMU_MODIFY_UID: [],
          DANMU_MODIFY_POOL: [],
          DANMU_MODIFY_SIZE: [],
          DANMU_MODIFY_COLOR: []
        },
        handleConfig: () => {
          for (const i in MY_API.DANMU_MODIFY.configJson) {
            MY_API.DANMU_MODIFY.configJson[i] = MY_API.CONFIG[i];
          }
          for (const i in MY_API.DANMU_MODIFY.configJson) {
            if (MY_API.DANMU_MODIFY.configJson[i].length > MY_API.DANMU_MODIFY.maxLength)
              MY_API.DANMU_MODIFY.maxLength = MY_API.DANMU_MODIFY.configJson[i].length;
          }
          for (const i in MY_API.DANMU_MODIFY.configJson) {
            if (MY_API.DANMU_MODIFY.configJson[i].length < MY_API.DANMU_MODIFY.maxLength) {
              let lastIndex = MY_API.DANMU_MODIFY.configJson[i].length - 1;
              for (let c = lastIndex; c < MY_API.DANMU_MODIFY.maxLength - 1; c++) {
                MY_API.DANMU_MODIFY.configJson[i].push(MY_API.DANMU_MODIFY.configJson[i][lastIndex])
              }
            }
          }
        },
        check: (info) => {
          for (let i = 0; i < MY_API.DANMU_MODIFY.maxLength; i++) {
            let regex,
              uid = info[2][0],
              danmu = info[1];
            try { regex = eval(MY_API.DANMU_MODIFY.configJson.DANMU_MODIFY_REGEX[i]) }
            catch (e) { MYDEBUG('bliveproxy', `正则表达式出错 ${MY_API.DANMU_MODIFY.configJson.DANMU_MODIFY_REGEX[i]}`); regex = /^【/; }
            if (regex.test(danmu) || MY_API.DANMU_MODIFY.configJson.DANMU_MODIFY_UID[i] == uid) return i;
          }
          return -1;
        },
        run: () => {
          if (!SP_CONFIG.DANMU_MODIFY) return $.Deferred().resolve();
          MY_API.DANMU_MODIFY.handleConfig();
          // MYDEBUG('MY_API.DANMU_MODIFY.configJson', MY_API.DANMU_MODIFY.configJson);
          bliveproxy.addCommandHandler('DANMU_MSG', command => {
            if (!SP_CONFIG.DANMU_MODIFY) return $.Deferred().resolve();
            let info = command.info;
            MYDEBUG('bliveproxy DANMU_MSG', info);
            let index = MY_API.DANMU_MODIFY.check(info);
            if (index === -1) return $.Deferred().resolve();
            // 显示模式
            info[0][1] = MY_API.DANMU_MODIFY.configJson.DANMU_MODIFY_POOL[index];
            // 尺寸
            info[0][2] *= MY_API.DANMU_MODIFY.configJson.DANMU_MODIFY_SIZE[index];
            // 颜色
            info[0][3] = Number("0x" + MY_API.DANMU_MODIFY.configJson.DANMU_MODIFY_COLOR[index].replace("#", ""));
          })
        }
      }
    };
    MY_API.init().then(() => {
      try {
        let runNext = $.Deferred();
        if (SP_CONFIG.showEula) {
          const eula = GM_getResourceText('eula');
          layer.open({
            title: `${GM_info.script.name}最终用户许可协议`,
            btn: ['同意协议并继续', '不同意'],
            closeBtn: 0,
            area: [String($(window).width() * 0.618) + 'px', String($(window).height() * 0.8) + 'px'],
            content: eula,
            yes: function (index) {
              SP_CONFIG.showEula = false;
              saveSpConfig();
              layer.close(index);
              runNext.resolve();
            },
            btn2: function () {
              layer.msg('脚本已停止运行', {
                time: 3000,
                icon: 2
              });
              window.toast('由于未同意最终用户许可协议，脚本已停止运行。', 'caution');
              SP_CONFIG.showEula = true;
              saveSpConfig();
              runNext.reject();
            }
          });
        } else runNext.resolve();
        runNext.then(() => {
          if (parseInt(Live_info.uid) === 0 || isNaN(parseInt(Live_info.uid)))
            return window.toast('未登录，请先登录再使用脚本', 'caution');
          // 新版本提示信息
          if (MY_API.CONFIG.UPDATE_TIP) MY_API.newMessage(GM_info.script.version);
          MYDEBUG('MY_API.CONFIG', MY_API.CONFIG);
          main(MY_API);
        });
      }
      catch (e) {
        MYERROR('初始化错误', e);
      }
    });
  }

  async function main(API) {
    // 检查更新
    checkUpdate(GM_info.script.version);
    // 修复版本更新产生的兼容性问题
    fixVersionDifferences(API, GM_info.script.version);
    // 清空辣条数量
    let clearStat = () => {
      for (const i in API.GIFT_COUNT) {
        if (i !== 'CLEAR_TS') API.GIFT_COUNT[i] = 0;
      }
      API.GIFT_COUNT.CLEAR_TS = ts_ms();
      API.saveGiftCount();
      $('#giftCount .anchor .statNum').text(API.GIFT_COUNT.ANCHOR_COUNT);
      $('#giftCount .material .statNum').text(API.GIFT_COUNT.MATERIAL_COUNT);
      MYDEBUG('已重置统计')
    }
    if (checkNewDay(API.GIFT_COUNT.CLEAR_TS)) clearStat();
    runExactMidnight(() => clearStat(), '重置统计');
    API.creatSetBox(); // 创建设置框
    API.removeUnnecessary(); // 移除页面元素
    API.DANMU_MODIFY.run(); // 弹幕修改
    const taskList = [
      // 每日任务     
      API.MEDAL_DANMU.run, // 粉丝牌打卡弹幕
      API.GroupSign.run, // 应援团签到
      API.DailyReward.run, // 每日任务
      API.LiveReward.run, // 直播每日任务
      API.Exchange.runS2C, // 银瓜子换硬币
      API.Exchange.runC2S, // 硬币换银瓜子
      API.LOTTERY.run, // 礼物抽奖
      // 其它任务
      API.AUTO_DANMU.run, // 自动发弹幕
      API.LITTLE_HEART.run, // 小心心
      API.Gift.run, // 送礼物
      API.MaterialObject.run, // 实物抽奖
      API.AnchorLottery.run, // 天选时刻
    ];
    otherScriptsRunningCheck.then(() => runAllTasks(5000, 200, taskList));
    if (API.CONFIG.TIME_RELOAD) reset(API.CONFIG.TIME_RELOAD_MINUTE * 60000);// 刷新直播间
    function reset(delay) {
      let resetTimer = setTimeout(() => {
        if (API.raffleId_list.length > 0 || API.guardId_list.length > 0 || API.pkId_list.length > 0) {
          MYDEBUG('[刷新直播间]', '还有礼物没抽，延迟15s后刷新直播间');
          return reset(15000);
        }
        if (checkNewDay(API.CACHE.LittleHeart_TS)) {
          MYDEBUG('[刷新直播间]', '正在获取小心心，10分钟后再次检查');
          clearTimeout(resetTimer);
          return reset(600e3);
        }
        if (API.CONFIG.TIME_AREA_DISABLE && !API.CONFIG.IN_TIME_RELOAD_DISABLE && inTimeArea(API.CONFIG.TIME_AREA_START_H0UR, API.CONFIG.TIME_AREA_END_H0UR, API.CONFIG.TIME_AREA_START_MINUTE, API.CONFIG.TIME_AREA_END_MINUTE)) { // 在不抽奖时段且不抽奖时段不刷新开启
          const resetTime = getIntervalTime(API.CONFIG.TIME_AREA_END_H0UR, API.CONFIG.TIME_AREA_END_MINUTE);
          MYDEBUG('[刷新直播间]', `处于休眠时间段，将在${resetTime}毫秒后刷新直播间`);
          clearTimeout(resetTimer);
          return reset(resetTime);
        }
        W.location.reload();
      }, delay);
    };
  }
  function checkUpdate(version) {
    if (!checkNewDay(noticeJson.lastCheckUpdateTs)) return;
    const headers = {
      "Accept": `text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9`,
      "Upgrade-Insecure-Requests": "1",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-User": "?1",
      "Sec-Fetch-Dest": "document",
      "Accept-Encoding": "gzip, deflate, br",
      "Accept-Language": "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7"
    };
    XHR({
      GM: true,
      anonymous: true,
      method: "GET",
      url: "https://cdn.jsdelivr.net/gh/andywang425/BLTH@master/assets/json/notice.min.json",
      headers: headers,
      responseType: "json"
    }).then(response => {
      MYDEBUG("检查更新 checkUpdate", response);
      if (response.response.status !== 200)
        return window.toast(`[检查更新] 获取notice.json出错 ${response.response.statusText}`, 'caution');
      noticeJson = response.body;
      noticeJson.lastCheckUpdateTs = ts_ms();
      GM_setValue(`noticeJson`, noticeJson);
      const scriptVersion = response.body.version;
      const githubOpenTabOptions = { active: false, insert: true, setParent: true },
        greasyforkOpenTabOptions = { active: true, insert: true, setParent: true };
      if (versionStringCompare(version, scriptVersion) === -1) { // version < scriptVersion
        // 需要更新
        let updateSource, updateURL;
        if (GM_info.script.updateURL === null) {
          updateSource = "Greasy Fork"
          updateURL = "https://greasyfork.org/scripts/406048-b%E7%AB%99%E7%9B%B4%E6%92%AD%E9%97%B4%E6%8C%82%E6%9C%BA%E5%8A%A9%E6%89%8B";
        } else {
          updateSource = "Github";
          updateURL = "https://raw.fastgit.org/andywang425/BLTH/master/B%E7%AB%99%E7%9B%B4%E6%92%AD%E9%97%B4%E6%8C%82%E6%9C%BA%E5%8A%A9%E6%89%8B.user.js";
        }
        let index = layer.confirm(`检测到新版本 <strong>${scriptVersion}</strong>。<br>是否从 ${updateSource} 更新脚本？`, {
          title: '更新脚本',
          btn: ['是', '否']
        }, function () {
          // 更新
          if (updateSource === "Greasy Fork") {
            layer.close(index);
            GM_openInTab(updateURL, greasyforkOpenTabOptions);
          }
          else {
            GM_openInTab(updateURL, githubOpenTabOptions);
            layer.msg('正在更新...', { time: 2000 });
          }
        }, function () {
          // 不更新
        });
      }
    })
  }
  /**
   * 获取粉丝勋章列表
   * @param {Number} page 
   * @returns 
   */
  async function getMedalList(page = 1) {
    if (page === 1) medal_info = { status: $.Deferred(), medal_list: [] };
    let end = false;
    while (true) {
      await BAPI.i.medal(page, 25).then((response) => {
        MYDEBUG('before init() getMedalList: API.i.medal', response);
        if (response.code === 0) {
          medal_info.medal_list = medal_info.medal_list.concat(response.data.fansMedalList);
          if (response.data.pageinfo.curPage < response.data.pageinfo.totalpages) page++;
          else { medal_info.status.resolve(); end = true }
        } else if (response.code === 1024) {
          window.toast(`获取粉丝勋章列表超时 ${response.message}<br>部分功能将无法正常运行`, 'error');
          delayCall(() => getMedalList(page));
          end = true;
        } else {
          window.toast(`获取粉丝勋章列表失败 ${response.message}<br>部分功能将无法正常运行`, 'error');
          delayCall(() => getMedalList(page));
          end = true;
        }
      });
      if (end) {
        runTomorrow(() => getMedalList(), 0, 1, "获取粉丝勋章列表");
        break;
      }
      await sleep(200);
    }
  };
  /**
   * 删除一维数组元素
   * @param val 数组中一个元素的值
   */
  function rmVal(arr, val) {
    const index = findVal(arr, val);
    if (index > -1) return arr.splice(index, 1);
  }
  /**
   * 给一维数组添加不重复的元素
   * @param  val 元素
   * @param  Array 数组
   * @param  mode 1: unshift 2: push
   */
  function addVal(arr, val, mode = 1) {
    if (findVal(arr, val) === -1) {
      if (mode === 1) return arr.unshift(val);
      else return arr.push(val);
    }
  }
  /**
   * 在一维数组中寻找相同元素
   * @param arr 数组
   * @param val 元素
   * @returns index, 若不是数组返回 false
   */
  function findVal(arr, val) {
    try {
      if (!Array.isArray(arr)) return false;
      return arr.findIndex(v => v == val); // 类型不必相同
    } catch (e) {
      MYERROR("findVal 出错", arr, val, e);
    }
  }
  /**
   * 比较版本号大小
   * @param {string} ver1
   * @param {string} ver2
   * @returns {boolean} 若 ver1 > ver2 返回 1, ver1 = ver2 返回 0, ver1 < ver2, 返回 -1
   */
  function versionStringCompare(ver1 = '0', ver2 = '0') {
    function changeVersion2Num(ver) {
      return ver.match(/\d.*/)[0].split('.').reduce((total, value, index) => total + (0.01 ** index) * Number(value), 0);
    }
    const verNum1 = changeVersion2Num(ver1),
      verNum2 = changeVersion2Num(ver2);
    if (verNum1 > verNum2) return 1
    else if (verNum1 < verNum2) return -1
    else return 0;
  }
  /**
   * 模拟鼠标移动
   */
  function mouseMove() {
    MYDEBUG('屏蔽挂机检测', "触发一次MouseEvent(mousemove)")
    document.dispatchEvent(new MouseEvent('mousemove', {
      screenX: Math.floor(Math.random() * screen.availWidth),
      screenY: Math.floor(Math.random() * screen.availHeight),
      clientX: Math.floor(Math.random() * W.innerWidth),
      clientY: Math.floor(Math.random() * W.innerHeight),
      ctrlKey: Math.random() > 0.8,
      shiftKey: Math.random() > 0.8,
      altKey: Math.random() > 0.9,
      metaKey: false,
      button: 0,
      buttons: 0,
      relatedTarget: null,
      region: null,
      detail: 0,
      view: W,
      sourceCapabilities: W.InputDeviceCapabilities ? new W.InputDeviceCapabilities({ fireTouchEvents: false }) : null,
      bubbles: true,
      cancelable: true,
      composed: true
    }));
  }
  /**
   * 执行所有任务
   * @param {Number} sleep 休眠时间
   * @param {Number} interval 任务间隔
   * @param  {list} task 任务
   */
  function runAllTasks(sleep, interval, task) {
    let num = 0;
    setTimeout(() => {
      for (const i of task) {
        setTimeout(() => i(), interval * num++);
      }
    }, sleep);
  }
  /**
   * 修复因版本差异造成的错误
   * @param API MY_API
   */
  function fixVersionDifferences(API, version) {
    // 添加新的修复后需修改版本号
    if (versionStringCompare(SP_CONFIG.storageLastFixVersion, "5.7.2") >= 0) return;
    // 修复变量类型错误
    const configFixList = ['AUTO_GIFT_ROOMID', 'COIN_UID'];
    if (!configFixList.every(i => Array.isArray(API.CONFIG[i]))) {
      for (const i of configFixList) {
        if (!Array.isArray(API.CONFIG[i])) {
          API.CONFIG[i] = String(API.CONFIG[i]).split(",");
        }
      }
    }
    // 修复变量值差异
    if (API.CONFIG.ANCHOR_TYPE == 'ANCHOR_LIVEROOM') {
      API.CONFIG.ANCHOR_TYPE_LIVEROOM = true;
      API.CONFIG.ANCHOR_TYPE_POLLING = false;
    }
    if (API.CONFIG.GIFT_SORT == 'high') API.CONFIG.GIFT_SORT = 'GIFT_SORT_HIGH';
    else if (API.CONFIG.GIFT_SORT == 'low') API.CONFIG.GIFT_SORT = 'GIFT_SORT_LOW'
    // 修复CACHE
    const cache = GM_getValue(`CACHE`) || {};
    const cacheFixList = [['materialobject_ts', 'MaterialObject_TS'], ['medalDanmu_TS', 'MedalDanmu_TS']];
    for (const i of cacheFixList) {
      if (cache.hasOwnProperty(i[0])) API.CACHE[i[1]] = cache[i[0]];
    }
    // localStorage fix
    localStorage.removeItem("im_deviceid_IGIFTMSG");
    // GM storage fix
    const gmDeleteList = ['AnchorRoomidList', 'im_deviceid_', 'blnvConfig', 'UNIQUE_CHECK_CACHE'];
    for (const i of gmDeleteList) {
      GM_deleteValue(i);
    }
    let token = GM_getValue("Token") || {};
    if (token.hasOwnProperty("access_token")) GM_setValue("Token", {});
    const apikey = API.CONFIG.ANCHOR_SERVER_APIKEY;
    if (typeof apikey === "string") {
      API.CONFIG.ANCHOR_SERVER_APIKEY = {};
      API.CONFIG.ANCHOR_SERVER_APIKEY[Live_info.uid] = apikey;
    }
    // save settings
    SP_CONFIG.storageLastFixVersion = version;
    API.saveConfig(false);
    API.saveCache();
    saveSpConfig();
  }
  /**
   * 把localstorage中的设置迁移到GM储存
   * 对版本小于5.6.6.4时保存的设置项进行修复
   */
  function localstorage2gm() {
    if (!localStorage.getItem("IGIFTMSG_CONFIG")) return;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (/IGIFTMSG.*/.test(key)) {
        let val = localStorage.getItem(key);
        try {
          val = JSON.parse(val);
          let length = 0;
          for (const i in val) { length++ }
          if (val.hasOwnProperty("list") && length === 1) val = val.list;
        } catch (e) { }
        const jumpList = ["AnchorRoomidList"]
        if (jumpList.indexOf(key) === -1) GM_setValue(key.replace(/IGIFTMSG_|IGIFTMSG/, ""), val);
        localStorage.removeItem(key); i--;
      }
    }
    W.location.reload();
  }
  /**
   * 保存特殊设置
   */
  function saveSpConfig(printLog = true) {
    if (printLog) MYDEBUG('SP_CONFIG已保存', SP_CONFIG);
    return GM_setValue(`SP_CONFIG`, SP_CONFIG);
  }
  /**
   * layer动画
   * @param {jqdom} jqdom
   * @param {boolean} bool 
   */
  function animChange(jqdom, bool) {
    if (bool) {
      // show => hide
      jqdom.removeClass('layer-anim');
      jqdom.removeClass('layer-anim-00');
      jqdom.addClass('layer-anim');
      jqdom.addClass('layer-anim-close');
    } else {
      // hide => show
      jqdom.removeClass('layer-anim');
      jqdom.removeClass('layer-anim-close');
      jqdom.addClass('layer-anim');
      jqdom.addClass('layer-anim-00');
    }
  }
  /**
   * 合并两个对象，只合并 obj1 中不包含（或为undefined, null）但 obj2 中有的属性 
   * 删除 obj1 有但 obj2 中没有的属性
   */
  function mergeObject(obj1, obj2) {
    function combine(object1, object2) {
      for (let i in object2) {
        if (object1[i] === undefined || object1[i] === null) object1[i] = object2[i];
        else if (!Array.isArray(object1[i]) && typeof object1[i] === 'object') combine(object1[i], object2[i]);
      }
    }
    function del(object1, object2) {
      for (let i in object1) {
        if (object2[i] === undefined || object2[i] === null) delete object1[i];
        else if (!Array.isArray(object1[i]) && typeof object1[i] === 'object') del(object1[i], object2[i]);
      }
    }
    combine(obj1, obj2);
    del(obj1, obj2);
  }
  /**
   * 通过检查某些特性是否存在判断浏览器版本
   * @returns {Array} 0: 提示字符串 1: 等级字符串
   */
  function checkBrowserVersion() {
    if (typeof Array.prototype.findIndex === "undefined")
      return ["浏览器版本过低，挂机助手停止运行", "error"];
    else if (typeof String.prototype.replaceAll === 'undefined')
      return ["浏览器版本略低，挂机助手可以正常运行但建议升级浏览器到最新版", "info"];
    else
      return ["ok", "info"]
  }
  /**
   * 保存文件到本地
   * @param fileName 文件名
   * @param fileContent 文件内容
   */
  function downFile(fileName, fileContent) {
    let elementA = document.createElement("a");
    elementA.setAttribute(
      "href",
      "data:text/plain;charset=utf-8," + encodeURIComponent(JSON.stringify(fileContent))
    );
    elementA.setAttribute("download", fileName);
    elementA.style.display = "none";
    document.body.appendChild(elementA);
    elementA.click();
    document.body.removeChild(elementA);
  }
  /**
   * 导出配置文件
   * @param MY_API_CONFIG MY_API.CONFIG
   * @param SP_CONFIG SP_CONFIG
   */
  function exportConfig(MY_API_CONFIG, SP_CONFIG, AnchorFollowingList) {
    const exportJson = {
      VERSION: GM_info.script.version,
      MY_API_CONFIG: MY_API_CONFIG,
      SP_CONFIG: SP_CONFIG,
      AnchorFollowingList: AnchorFollowingList
    };
    return downFile('BLTH_CONFIG.json', exportJson);
  }
  /**
   * 导入配置文件
   */
  function importConfig() {
    let selectedFile = document.getElementById("BLTH_config_file").files[0];
    let reader = new FileReader();
    reader.onload = function () {
      MYDEBUG("importConfig 文件读取结果：", this.result);
      try {
        readConfigArray[0] = JSON.parse(decodeURIComponent(this.result));
        if (typeof readConfigArray[0] == 'object' && readConfigArray[0]) {
          const list = ["VERSION", "MY_API_CONFIG", "SP_CONFIG"];
          for (const i of list) {
            if (!readConfigArray[0].hasOwnProperty(i)) return wrongFile();
          }
          if (versionStringCompare("5.6.6.3", readConfigArray[0]["VERSION"]) === 1) // 5.6.6.3 > VERSION
            return wrongFile('该配置文件版本过低')
          return readConfigArray[1].resolve();
        } else {
          return wrongFile();
        }
      } catch (e) {
        MYDEBUG('importConfig error：', e);
        return wrongFile();
      }
    };
    reader.readAsText(selectedFile);
    function wrongFile(msg = '文件格式错误') {
      return layer.msg(msg, {
        time: 2500,
        icon: 2
      });
    }
  }
  /**
   * （23,50） 获取与目标时间在一天内的间隔时间,24小时制（毫秒）
   * @param hour 整数 小时
   * @param minute 整数 分钟
   * @param second 整数 秒（可不填）
   * @returns {number} intervalTime
   */
  function getIntervalTime(hour, minute, second) {
    const myDate = new Date();
    const h = myDate.getHours();
    const m = myDate.getMinutes();
    const s = myDate.getSeconds();
    const TargetTime = hour * 3600 * 1e3 + minute * 60 * 1e3 + (!second ? 0 : second * 1e3)
    const nowTime = h * 3600 * 1e3 + m * 60 * 1e3 + s * 1e3;
    const intervalTime = TargetTime - nowTime;
    MYDEBUG("[getIntervalTime]获取间隔时间", `${intervalTime}毫秒`);
    if (intervalTime < 0) {
      return 24 * 3600 * 1e3 + intervalTime
    }
    else {
      return intervalTime
    }
  }
  /**
   * （23,50） 当前时间是否为23:50
   * @param hour 整数 小时
   * @param minute 整数 分钟
   * @param second 整数 秒（可不填）
   * @returns {boolean}
   */
  function isTime(hour, minute, second) {
    let myDate = new Date();
    let h = myDate.getHours();
    let m = myDate.getMinutes();
    let s = myDate.getSeconds();
    if ((h == hour && m == minute && !second) || (h == hour && m == minute && s == second)) {
      return true
    } else {
      MYDEBUG("isTime 错误时间", `目标时间${hour}时${minute}分${second || 0}秒，当前时间${h}时${m}分${s}秒`);
      return false
    }
  }
  /**
   * （2,10,0,1） 当前是否在两点0分到十点1分之间
   * @param sH 整数 起始小时
   * @param eH 整数 终止小时
   * @param sM 整数 起始分钟
   * @param eM 整数 终止分钟
   * @returns {boolean}
   */
  function inTimeArea(sH, eH, sM, eM) {
    if (sH > 23 || eH > 24 || sH < 0 || eH < 1 || sM > 59 || sM < 0 || eM > 59 || eM < 0) {
      return false
    }
    const hourMs = 3600000, minMs = 60000,
      myDate = new Date(),
      nowHour = myDate.getHours(),
      nowMin = myDate.getMinutes(),
      nowTimeTs = nowHour * hourMs + nowMin * minMs,
      targetStartTs = sH * hourMs + sM * minMs,
      targetEndTs = eH * hourMs + eM * minMs;
    if (targetStartTs < targetEndTs) {
      if (nowTimeTs >= targetStartTs && nowTimeTs < targetEndTs)
        return true;
      else return false;
    } else {
      if (nowTimeTs >= targetStartTs || nowTimeTs < targetEndTs)
        return true
      else return false;
    }
  };
  /**
   * 暂停
   * @param millisecond
   * @returns {Promise} resolve
   */
  function sleep(millisecond) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve()
      }, millisecond)
    })
  }
  /**
   * 获取范围中的一个随机整数数（包含最大最小值）
   * @param {Number} min 
   * @param {Number} max 
   */
  function getRandomNum(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }
  /**
   * 概率
   * @param val
   * @returns {boolean}
   */
  function probability(val) {
    if (val <= 0) return false;
    let rad = Math.random();
    return (val / 100) >= rad
  }
  /**
   * 检查是否为新一天
   * 注：并无要求被检查时间戳大于当前时间戳
   * @param ts 被检查的时间戳
   * @param type 检查标准 北京时间（默认）: Beijing 本地时间: local
   * @returns {boolean}
   */
  function checkNewDay(ts, type = 'Beijing') {
    if (ts == 0) return true;
    let t = new Date(ts);
    let d = type === 'Beijing' ? getCHSdate() : new Date();
    let td = t.getDate();
    let dd = d.getDate();
    let now_ts = d.getTime();
    return dd !== td || now_ts - ts > 86400000;
  };
  /**
   * 唯一运行检测
   */
  function onlyScriptCheck() {
    try {
      let UNIQUE_CHECK_CACHE = localStorage.getItem("UNIQUE_CHECK_CACHE") || 0;
      const t = ts_ms();
      if (t - UNIQUE_CHECK_CACHE >= 0 && t - UNIQUE_CHECK_CACHE <= 11e3) {
        // 其他脚本正在运行
        window.toast('检测到其他直播间页面的挂机助手正在运行，无需重复运行的功能将停止运行', 'caution');
        otherScriptsRunning = true;
        return otherScriptsRunningCheck.resolve();
      }
      let timer_unique;
      const uniqueMark = () => {
        timer_unique = setTimeout(() => uniqueMark(), 10e3);
        UNIQUE_CHECK_CACHE = ts_ms();
        localStorage.setItem("UNIQUE_CHECK_CACHE", UNIQUE_CHECK_CACHE)
      };
      W.addEventListener('unload', () => {
        clearTimeout(timer_unique);
        localStorage.setItem("UNIQUE_CHECK_CACHE", 0);
      });
      uniqueMark();
      return otherScriptsRunningCheck.resolve();
    }
    catch (e) {
      MYDEBUG('重复运行检测出错', e);
      return otherScriptsRunningCheck.reject();
    }
  }
  /**
    * 发送推送加通知 (http)
     @param {
      { token: string, title?: string, content: string, topic?: string, template?: string, channel?: string, webhook?: string }
     } data
    */
  function PP_sendMsg(data) {
    return XHR({
      GM: true,
      anonymous: true,
      method: 'POST',
      url: `http://www.pushplus.plus/send`,
      data: $.param(data),
      responseType: 'json'
    })
  }
  /**
   * 发送酷推消息
   * @param Skey 
   * @param content
   * @returns {object}  resolve({response: res, body: res.response})
   */
  function CP_sendMsg(Skey, content) {
    return XHR({
      GM: true,
      anonymous: true,
      method: 'POST',
      url: `https://push.xuthus.cc/send/${Skey}`,
      data: `${content}`,
      responseType: 'json'
    })
  }
  /**
   * 发送Server酱Turbo版通知
   * @param SendKey
   * @param title
   * @param desp
   * @returns {object}  resolve({response: res, body: res.response})
   */
  function ServerTurbo_sendMsg(SendKey, title, desp) { /* openid 暂时不需要*/
    return XHR({
      GM: true,
      anonymous: true,
      method: 'POST',
      url: `https://sctapi.ftqq.com/${SendKey}.send`,
      data: `title=${title}&desp=${desp}`,
      responseType: 'json'
    })
  }
  /**
   * 浏览器提示
   * @param title
   * @param text
   * @param timeout
   */
  function GM_notice(title, text, timeout = 10000) {
    const notificationDetails = {
      title: title,
      text: text,
      timeout: timeout,
      onclick: function () {
        if (logDiv.hasClass("active")) logDiv.click();
      }
    };
    return GM_notification(notificationDetails)
  }
  /**
   * 获取msg[dev_id]
   * @param name 
   * @returns {String} dev_id
   */
  function getMsgDevId(name = NAME) {
    let deviceid = GM_getValue("im_deviceid_".concat(name));
    if (!deviceid) {
      deviceid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (function (name) {
        let randomInt = 16 * Math.random() | 0;
        return ("x" === name ? randomInt : 3 & randomInt | 8).toString(16).toUpperCase()
      }));
      GM_setValue("im_deviceid_".concat(name), deviceid);
    }
    return deviceid
  };
  /**
   * 发起xmlhttpRequest请求（GM函数和浏览器原生）
   * @param XHROptions
   * @returns {object}  resolve({response: res, body: res.response})
   */
  function XHR(XHROptions) {
    return new Promise(resolve => {
      const onerror = (error) => {
        MYERROR('XHR出错', XHROptions, error);
        resolve(undefined);
      };
      if (XHROptions.GM) {
        if (XHROptions.method === 'POST') {
          if (XHROptions.headers === undefined)
            XHROptions.headers = {};
          if (XHROptions.headers['Content-Type'] === undefined)
            XHROptions.headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=utf-8';
        }
        XHROptions.timeout = 30 * 1000;
        XHROptions.onload = res => resolve({ response: res, body: res.response });
        XHROptions.onerror = onerror;
        XHROptions.ontimeout = onerror;
        GM_xmlhttpRequest(XHROptions);
      }
      else {
        const xhr = new XMLHttpRequest();
        xhr.open(XHROptions.method, XHROptions.url);
        if (XHROptions.method === 'POST' && xhr.getResponseHeader('Content-Type') === null)
          xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=utf-8');
        if (XHROptions.cookie)
          xhr.withCredentials = true;
        if (XHROptions.responseType !== undefined)
          xhr.responseType = XHROptions.responseType;
        xhr.timeout = 30 * 1000;
        xhr.onload = ev => {
          const res = ev.target;
          resolve({ response: res, body: res.response });
        };
        xhr.onerror = onerror;
        xhr.ontimeout = onerror;
        xhr.send(XHROptions.data);
      }
    });
  }
})();
