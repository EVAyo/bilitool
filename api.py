import time
import json
import hmac
import random
from urllib.parse import urlencode
from typing import Dict, List
from aiohttp import ClientSession

__all__ = 'WebApi', 'WebApiRequestError'


async def calc_sign(data, secret_rule):
    parent_id, area_id, seq_id, room_id = json.loads(data['id'])
    buvid, uuid = json.loads(data['device'])
    key = bytes(data['benchmark'], encoding='utf-8')
    newData = {
        "platform": 'web',
        "parent_id": parent_id,
        "area_id": area_id,
        "seq_id": seq_id,
        "room_id": room_id,
        "buvid": buvid,
        "uuid": uuid,
        "ets": data["ets"],
        "time": data["time"],
        "ts": data["ts"],
    }
    s = json.dumps(newData).replace(" ", "")
    for i in secret_rule:
        if i == 0:
            s = hmac.new(key, bytes(s, encoding='utf-8'),
                         digestmod='MD5').hexdigest()
            continue
        elif i == 1:
            s = hmac.new(key, bytes(s, encoding='utf-8'),
                         digestmod='SHA1').hexdigest()
            continue
        elif i == 2:
            s = hmac.new(key, bytes(s, encoding='utf-8'),
                         digestmod='SHA256').hexdigest()
            continue
        elif i == 3:
            s = hmac.new(key, bytes(s, encoding='utf-8'),
                         digestmod='SHA224').hexdigest()
            continue
        elif i == 4:
            s = hmac.new(key, bytes(s, encoding='utf-8'),
                         digestmod='SHA512').hexdigest()
            continue
        elif i == 5:
            s = hmac.new(key, bytes(s, encoding='utf-8'),
                         digestmod='SHA384').hexdigest()
            continue
        else:
            continue
    return s


class WebApiRequestError(Exception):
    pass


class WebApi:
    @staticmethod
    def _check(res_json):
        if res_json['code'] != 0:
            raise WebApiRequestError(res_json['message'])

    @classmethod
    async def _get(cls, session: ClientSession, *args, **kwds):
        async with session.get(*args, **kwds) as res:
            res_json = await res.json()
            cls._check(res_json)
            return res_json['data']

    @classmethod
    async def _post(cls, session: ClientSession, *args, **kwds):
        async with session.post(*args, **kwds) as res:
            res_json = await res.json()
            cls._check(res_json)
            return res_json['data']

    @classmethod
    async def post_enter_room_heartbeat(cls,
                                        session: ClientSession, csrf: str, buvid: str, uuid: str,
                                        room_id: int, parent_area_id: int, area_id: int) -> Dict:
        url = 'https://live-trace.bilibili.com/xlive/data-interface/v1/x25Kn/E'

        headers = {
            'Referer': f'https://live.bilibili.com/{room_id}',
            'Content-Type': 'application/x-www-form-urlencoded',
        }

        data = {
            'id': f'[{parent_area_id}, {area_id}, 0, {room_id}]',
            'device': f'["{buvid}", "{uuid}"]',
            'ts': int(time.time()) * 1000,
            'is_patch': 0,
            'heart_beat': [],
            'ua': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) '
                  'Chrome/80.0.3987.163 Safari/537.36',
            'csrf_token': csrf,
            'csrf': csrf,
            'visit_id': '',
        }

        return await cls._post(session, url, headers=headers, data=urlencode(data))

    @classmethod
    async def post_in_room_heartbeat(cls,
                                     session: ClientSession, csrf: str, buvid: str, uuid: str,
                                     room_id: int, parent_area_id: int, area_id: int,
                                     sequence: int, interval: int, ets: int,
                                     secret_key: str, secret_rule: list) -> Dict:
        url = 'https://live-trace.bilibili.com/xlive/data-interface/v1/x25Kn/X'

        headers = {
            'Referer': f'https://live.bilibili.com/{room_id}',
            'Content-Type': 'application/x-www-form-urlencoded',
        }

        data = {
            'id': f'[{parent_area_id}, {area_id}, {sequence}, {room_id}]',
            'device': f'["{buvid}", "{uuid}"]',
            'ets': ets,
            'benchmark': secret_key,
            'time': interval,
            'ts': int(time.time()) * 1000,
            'ua': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) '
                  'Chrome/80.0.3987.163 Safari/537.36',
        }

        data.update({
            'csrf_token': csrf,
            'csrf': csrf,
            'visit_id': '',
            's': await calc_sign(data, secret_rule),
        })

        return await cls._post(session, url, headers=headers, data=urlencode(data))

    @classmethod
    async def get_medal(cls, session: ClientSession, page=1, page_size=10) -> Dict:
        url = 'https://api.live.bilibili.com/i/api/medal'

        params = {
            'page': page,
            'pageSize': page_size,
        }

        return await cls._get(session, url, params=params)

    @classmethod
    async def get_info(cls, session: ClientSession, room_id: int) -> Dict:
        url = 'https://api.live.bilibili.com/room/v1/Room/get_info'
        return await cls._get(session, url, params={'room_id': room_id})

    @classmethod
    async def get_info_by_room(cls, session: ClientSession, room_id: int) -> Dict:
        url = 'https://api.live.bilibili.com/xlive/web-room/v1/index/getInfoByRoom'
        return await cls._get(session, url, params={'room_id': room_id})

    @classmethod
    async def get_gift(cls, session: ClientSession) -> List:
        url = 'https://api.live.bilibili.com/xlive/web-room/v1/gift/bag_list'
        return (await cls._get(session, url))['list']

    @classmethod
    async def send_msg(cls, session: ClientSession, room_id: int, csrf: str) -> Dict:
        url = 'https://api.live.bilibili.com/msg/send'
        danmu = ['(⌒▽⌒)', '（￣▽￣）', '(=・ω・=)', '(｀・ω・´)', '(〜￣△￣)〜', '(･∀･)', '(°∀°)ﾉ', '(￣3￣)', '╮(￣▽￣)╭', '_(:3」∠)_',
                 '(^・ω・^ )', '(●￣(ｴ)￣●)', 'ε=ε=(ノ≧∇≦)ノ', '⁄(⁄ ⁄•⁄ω⁄•⁄ ⁄)⁄', '←◡←']
        data = {
            "bubble": "0",
            "msg": random.choice(danmu),
            "color": "5816798",
            "mode": "1",
            "fontsize": "25",
            "rnd": int(time.time()),
            "roomid": room_id,
            "csrf": csrf,
            "csrf_token": csrf
        }
        headers = {
            'Referer': f'https://live.bilibili.com/',
            'Content-Type': 'application/x-www-form-urlencoded',
        }
        return await cls._post(session, url, headers=headers, data=urlencode(data))

    @classmethod
    async def send_gifts(cls, session: ClientSession, uid, bag_id, gift_id, gift_num, ruid, room_id, csrf):
        url = 'https://api.live.bilibili.com/xlive/revenue/v1/gift/sendBag'
        data = {
            "uid": uid,
            "gift_id": gift_id,
            "ruid": ruid,
            "send_ruid": "0",
            "gift_num": gift_num,
            "bag_id": bag_id,
            "platform": "pc",
            "biz_code": "Live",
            "biz_id": room_id,
            "rnd": int(time.time()),
            "storm_beat_id": "0",
            "metadata": "",
            "price": "0",
            "csrf_token": csrf,
            "csrf": csrf,
            "visit_id": ""
        }
        headers = {
            'Referer': f'https://live.bilibili.com/',
            'Content-Type': 'application/x-www-form-urlencoded',
        }
        return await cls._post(session, url, headers=headers, data=urlencode(data))

    @classmethod
    async def get_fans_medal(cls, session: ClientSession):
        url = 'https://api.live.bilibili.com/fans_medal/v1/FansMedal/get_list_in_room'
        return await cls._get(session, url)

    @classmethod
    async def do_sign(cls, session: ClientSession):
        url = 'https://api.live.bilibili.com/xlive/web-ucenter/v1/sign/DoSign'
        return await cls._get(session, url)

    @classmethod
    async def get_room_id(cls, session: ClientSession, mid):
        url = 'https://api.live.bilibili.com/room/v1/Room/getRoomInfoOld'
        return await cls._get(session, url, params={'mid': mid})

    @classmethod
    async def secret_player(cls, session: ClientSession, csrf):
        url = 'https://api.bilibili.com/x/relation/modify'
        data = {
            "fid": random.choice(['672342685', '672346917', '672328094', '351609538', '672353429']),
            "act": 1,
            "re_src": 11,
            "csrf": csrf
        }
        return await cls._post(session, url, data=urlencode(data))
