import { balh_config } from "../feature/config";
import { Async } from "../util/async";
import { Converters } from "../util/converters";
import { access_key_param_if_exist } from "./bilibili";

function convertPlayUrl(originUrl: string) {
    let params = new URLSearchParams(originUrl.split('?')[1])
    let queryMap: StringStringObject = {
        appKey: '1d8b6e7d45233436',
        build: '6080000',
        device: 'android',
        mobi_app: 'android',
        platform: 'android',
    }
    params.forEach((value, key) => {
        if (['t', 'sign'].indexOf(key) === -1) {
            queryMap[key] = value
        }
    })
    const result = Converters.generateSign(queryMap, '9b288147e5474dd2aa67085f716c560d')

    let url = new URL(`${balh_config.server}/BPplayurl.php`)
    url.search = result.params
    url.searchParams.append('sign', result.sign)
    url.searchParams.append('module', 'pgc')
    url.searchParams.append('otype', 'json')
    url.searchParams.append('platform', 'android')
    return url.href
}


/**
 * 构建 mobi api 解析链接
 * host 举例: 'https://example.com'
 * 
 * 参考：https://github.com/kghost/bilibili-area-limit/issues/16
 */
export function getMobiPlayUrl(originUrl: String, host: String) {
    // 合成完整 mobi api url
    return `${host}/pgc/player/api/playurl?${generateMobiPlayUrlParams(originUrl)}`
}

export function generateMobiPlayUrlParams(originUrl: String) {
    // 提取参数为数组
    let a = originUrl.split('?')[1].split('&');
    // 参数数组转换为对象
    let theRequest: StringStringObject = {};
    for (let i = 0; i < a.length; i++) {
        let key = a[i].split("=")[0];
        let value = a[i].split("=")[1];
        // 给对象赋值
        theRequest[key] = value;
    }
    // 追加 mobi api 需要的参数
    theRequest.access_key = localStorage.access_key;
    theRequest.appkey = '07da50c9a0bf829f';
    theRequest.build = '5380700';
    theRequest.buvid = 'XY418E94B89774E201E22C5B709861B7712DD';
    theRequest.device = 'android';
    theRequest.force_host = '2';
    theRequest.mobi_app = 'android_b';
    theRequest.platform = 'android_b';
    theRequest.track_path = '0';
    theRequest.device = 'android';
    // theRequest.fnval = '0'; // 强制 FLV
    theRequest.ts = `${~~(Date.now() / 1000)}`;
    // 所需参数数组
    let param_wanted = ['access_key', 'appkey', 'build', 'buvid', 'cid', 'device', 'ep_id', 'fnval', 'fnver', 'force_host', 'fourk', 'mobi_app', 'platform', 'qn', 'track_path', 'ts'];
    // 生成 mobi api 参数字符串
    let mobi_api_params = '';
    for (let i = 0; i < param_wanted.length; i++) {
        mobi_api_params += param_wanted[i] + `=` + theRequest[param_wanted[i]] + `&`;
    }
    // 准备明文
    let plaintext = mobi_api_params.slice(0, -1) + `25bdede4e1581c836cab73a48790ca6e`;
    // 生成 sign
    let ciphertext = hex_md5(plaintext);
    return `${mobi_api_params}sign=${ciphertext}`;
}

export function fixMobiPlayUrlJson(originJson: object) {
    interface PlayUrlResult {
        type: string
        timelength: number
        accept_description: string[]
        accept_quality: number[]
        support_formats: [{
            quality: number
            need_login?: boolean
        }]
        format: string
        dash: {
            duration: number
            minBufferTime: number
            min_buffer_time: number
            video: [{
                baseUrl: string
                codecs: string
                sar: string
                startWithSAP: number
                start_with_sap: number
                mimeType: string
                mime_type: string
                frameRate: string
                frame_rate: string
                width: number
                height: number
                segment_base?: {
                    initialization: string
                    index_range: string
                }
                SegmentBase?: {
                    Initialization: string
                    indexRange: string
                }
            }]
            audio: [{
                baseUrl: string
                codecs: string
                startWithSAP: number
                start_with_sap: number
                mimeType: string
                mime_type: string
                segment_base?: {
                    initialization: string
                    index_range: string
                }
                SegmentBase?: {
                    Initialization: string
                    indexRange: string
                }
            }]
        }
    }
    const codecsMap: StringStringObject = {
        30112: 'avc1.640028',  // 1080P+
        30102: 'hev1.1.6.L120.90',  // HEVC 1080P+
        30080: 'avc1.640028',  // 1080P
        30077: 'hev1.1.6.L120.90',  // HEVC 1080P
        30064: 'avc1.64001F',  // 720P
        30066: 'hev1.1.6.L120.90',  // HEVC 720P
        30032: 'avc1.64001E',  // 480P
        30033: 'hev1.1.6.L120.90',  // HEVC 480P
        30011: 'hev1.1.6.L120.90',  // HEVC 360P
        30016: 'avc1.64001E',  // 360P
        30280: 'mp4a.40.2',  // 高码音频
        30232: 'mp4a.40.2',  // 中码音频
        30216: 'mp4a.40.2',  // 低码音频
        'nb2-1-30016': 'avc1.64001E',  // APP源 360P
        'nb2-1-30032': 'avc1.64001F',  // APP源 480P
        'nb2-1-30064': 'avc1.640028',  // APP源 720P
        'nb2-1-30080': 'avc1.640032',  // APP源 1080P
        'nb2-1-30216': 'mp4a.40.2',  // APP源 低码音频
        'nb2-1-30232': 'mp4a.40.2',  // APP源 中码音频
        'nb2-1-30280': 'mp4a.40.2'  // APP源 高码音频
    }
    const resolutionMap: { [k: string]: [w: number, h: number] } = {
        30112: [1920, 1080],  // 1080P+
        30102: [1920, 1080],  // HEVC 1080P+
        30080: [1920, 1080],  // 1080P
        30077: [1920, 1080],  // HEVC 1080P
        30064: [1280, 720],  // 720P
        30066: [1280, 720],  // HEVC 720P
        30032: [852, 480],  // 480P
        30033: [852, 480],  // HEVC 480P
        30011: [640, 360],  // HEVC 360P
        30016: [640, 360],  // 360P
    }
    const frameRateMap: StringStringObject = {
        30112: '16000/672',
        30102: '16000/672',
        30080: '16000/672',
        30077: '16000/656',
        30064: '16000/672',
        30066: '16000/656',
        30032: '16000/672',
        30033: '16000/656',
        30011: '16000/656',
        30016: '16000/672'
    }

    function getSegmentBase(url: string, id: string): [string, string] {
        // 从 window 中读取已有的值
        if (window.__segment_base_map__) {
            if (window.__segment_base_map__.hasOwnProperty(id)) {
                // console.log('SegmentBase read from cache ', window.__segment_base_map__[id])
                return window.__segment_base_map__[id]
            }
        }

        // 同步模式下 xhr 无法设置 responseType  https://stackoverflow.com/questions/9855127/setting-xmlhttprequest-responsetype-forbidden-all-of-a-sudden
        let xhr = new XMLHttpRequest();
        xhr.overrideMimeType('text/plain; charset=x-user-defined');
        xhr.open('GET', url, false)  // 同步模式
        xhr.setRequestHeader('Range', 'bytes=0-6000')  // 下载前 6000 字节数据用于查找 sidx 位置
        xhr.send(null)  // 发送请求
        // 数据读取为 arraybuffer
        let data = Uint8Array.from(xhr.response, c => c.charCodeAt(0));  // 不用管这句红蚯蚓
        // 转换成 hex
        let hex_data = Array.prototype.map.call(data, x => ('00' + x.toString(16)).slice(-2)).join('')
        let indexRangeStart = hex_data.indexOf('73696478') / 2 - 4  // 73696478 是 'sidx' 的 hex ，前面还有 4 个字节才是 sidx 的开始
        let indexRagneEnd = hex_data.indexOf('6d6f6f66') / 2 - 5  // 6d6f6f66 是 'moof' 的 hex，前面还有 4 个字节才是 moof 的开始，-1为sidx结束位置
        let result: [string, string] = ['0-' + String(indexRangeStart - 1), String(indexRangeStart) + '-' + String(indexRagneEnd)]

        // 储存在 window，切换清晰度不用重新解析
        if (window.__segment_base_map__) {
            window.__segment_base_map__[id] = result
        } else {
            window.__segment_base_map__ = {}
            window.__segment_base_map__[id] = result
        }
        // console.log('get SegmentBase', result)
        return result
    }

    let result: PlayUrlResult = JSON.parse(JSON.stringify(originJson))

    result.dash.duration = Math.round(result.timelength / 1000) + 1  // 最后result数据会很奇怪的 -1，所以 +1 补上
    result.dash.minBufferTime = 1.5
    result.dash.min_buffer_time = 1.5

    // 填充视频流数据
    result.dash.video.forEach((video) => {
        let i = /(nb2-1-)?\d{5}\.m4s/.exec(video.baseUrl)
        let video_id: string
        if (i !== null) {
            video_id = i[0].replace('.m4s', '')
        } else {
            video_id = '30080'
        }

        video.codecs = codecsMap[video_id]
        video_id = video_id.replace('nb2-1-', '')

        video.width = resolutionMap[video_id][0]
        video.height = resolutionMap[video_id][1]
        video.mimeType = 'video/mp4'
        video.mime_type = 'video/mp4'
        video.frameRate = frameRateMap[video_id]
        video.frame_rate = frameRateMap[video_id]
        video.sar = "1:1"
        video.startWithSAP = 1
        video.start_with_sap = 1

        let segmentBase = getSegmentBase(video.baseUrl, video_id)
        video.segment_base = {
            initialization: segmentBase[0],
            index_range: segmentBase[1]
        }
        video.SegmentBase = {
            Initialization: segmentBase[0],
            indexRange: segmentBase[1]
        }
    });

    // 填充音频流数据
    result.dash.audio.forEach((audio) => {
        let i = /\d{5}\.m4s/.exec(audio.baseUrl)
        let audio_id: string
        if (i !== null) {
            audio_id = i[0].replace('.m4s', '')
        } else {
            audio_id = '30280'
        }
        audio.codecs = codecsMap[audio_id]
        audio.mimeType = 'audio/mp4'
        audio.mime_type = 'audio/mp4'

        let segmentBase = getSegmentBase(audio.baseUrl, audio_id)
        audio.segment_base = {
            initialization: segmentBase[0],
            index_range: segmentBase[1]
        }
        audio.SegmentBase = {
            Initialization: segmentBase[0],
            indexRange: segmentBase[1]
        }
    });

    return result
}

export namespace BiliPlusApi {
    export interface ViewResult {
        code?: number
        title: string
        list: [{ page: string, cid: string, part: string }]
        bangumi?: { season_id: string }
    }
    export const view = function (aid: string, update = true) {
        return Async.ajax<ViewResult>(`${balh_config.server}/api/view?id=${aid}&update=${update}${access_key_param_if_exist()}`);
    }

    export interface SeasonResult {
        code?: number
        result: {
            title: string
            evaluate: string
            cover: string
            play_count: number
            favorites: number
            danmaku_count: number
            episodes: [{
                index: number
                index_title: string
                /** epInfo.cid */
                danmaku: string
                /** epInfo.aid */
                av_id: string
                page: string
                /** epInfo.id */
                episode_id: string
                cover: string
            }],
            seasons: [{
                season_id: string
                title: string
            }],
            media?: {
                media_id: number
            }
        }
    }
    export const season = function (season_id: string) {
        return Async.ajax<SeasonResult>(`${balh_config.server}/api/bangumi?season=${season_id}${access_key_param_if_exist()}`);
    }
    export interface PlayUrlResult {
        code: number,
        durl: { url: string }[],
        timelength: number,
    }
    // https://www.biliplus.com/BPplayurl.php?otype=json&cid=30188339&module=bangumi&qn=16&src=vupload&vid=vupload_30188339
    // qn = 16, 能看
    export const playurl = function (cid: string, qn = 16, bangumi = true) {
        return Async.ajax<PlayUrlResult>(`${balh_config.server}/BPplayurl.php?otype=json&cid=${cid}${bangumi ? '&module=bangumi' : ''}&qn=${qn}&src=vupload&vid=vupload_${cid}${access_key_param_if_exist()}`);
    }
    // https://www.biliplus.com/api/h5play.php?tid=33&cid=31166258&type=vupload&vid=vupload_31166258&bangumi=1
    export const playurl_for_mp4 = (cid: string, bangumi = true) => Async.ajax(`${balh_config.server}/api/h5play.php?tid=33&cid=${cid}&type=vupload&vid=vupload_${cid}&bangumi=${bangumi ? 1 : 0}${access_key_param_if_exist()}`)
        .then(text => ((text as string).match(/srcUrl=\{"mp4":"(https?.*)"\};/) || ['', ''])[1]); // 提取mp4的url

}