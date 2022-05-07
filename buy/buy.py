import requests
import json
import time
import re


class BUY:
    def __init__(self, zb_id, cookie_file, app_v1, app_v2, system, phone):
        self.zb_id, self.app_v1, self.app_v2 = zb_id, app_v1, app_v2
        self.system, self.phone = system, phone
        self.cookie = json.loads(open(cookie_file, "r", encoding="utf-8").read())

        header_value = f"Build/{self.cookie['Buvid']} " if 'Buvid' in self.cookie else ""
        mozilla1 = f"Mozilla/5.0 (Linux; Android {system}; {phone} Build/{phone}; wv) AppleWebKit/537.36 (KHTML, like Gecko)"
        value_1_1 = f"Version/4.0 Chrome/74.0.3729.136 Mobile Safari/537.36 os/android model/{phone}"
        value_1_2 = f"build/{app_v1} osVer/{system} sdkInt/{29} network/2 BiliApp/{app_v1}"
        value_1_3 = f"mobi_app/android channel/html5_search_baidu {header_value}innerVer/{app_v1}"
        value_1_4 = f"c_locale/zh_CN s_locale/zh_CN 6.27.0 os/android model/{phone} mobi_app/android build/{app_v1}"
        value_1_5 = f"channel/html5_search_baidu innerVer/{app_v1} osVer/{system} network/2"
        user_agent_1 = f"{mozilla1} {value_1_1} {value_1_2} {value_1_3} {value_1_4} {value_1_5}"
        mozilla2 = f"Mozilla/5.0 BiliDroid/{app_v2} (bbcallen@gmail.com) os/android model/{phone}"
        value_2_1 = f"mobi_app/android build/{app_v1} channel/html5_search_baidu innerVer/{app_v1} osVer/{system} network/2"
        user_agent_2 = f"{mozilla2} {value_2_1}"

        self.header_1 = {
            "Accept-Encoding": "gzip",
            "User-Agent": user_agent_1,
            "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
            "native_api_from": "h5",
            "Referer": f"https://www.bilibili.com/h5/mall/suit/detail?id={zb_id}&navhide=1",
            "X-CSRF-TOKEN": str(self.cookie['bili_jct']),
            "Connection": "Keep-Alive",
            "Host": "api.bilibili.com"
        }

        self.header_2 = {
            "Accept-Encoding": "gzip",
            "User-Agent": user_agent_2,
            "Content-Type": "application/json",
            "APP-KEY": "android",
            "buildId": self.app_v1,
            "Connection": "Keep-Alive",
            "Host": "pay.bilibili.com"
        }
        if "Buvid" in self.cookie:
            self.header_2['Buvid'] = self.cookie['Buvid']

        self.header = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:95.0) Gecko/20100101 Firefox/95.0"}

        self.down_order_data = {
            "item_id": f"{self.zb_id}",
            "platform": "android",
            "currency": "bp",
            "add_month": -1,
            "buy_num": 1,
            "coupon_token": "",
            "hasBiliapp": "true",
            "csrf": f"{self.cookie['bili_jct']}"
        }

        if not self.verify_cookie():
            input("cookie失效")

        print(
            f"装扮id:{self.zb_id}\n"
            f"cookie:{self.cookie}\n"
            f"app版本1:{self.app_v1}\n"
            f"app版本2:{self.app_v2}\n"
            f"系统版本:{self.system}\n"
            f"手机型号:{self.phone}\n"
            f"访问头1:{self.header_1}\n"
            f"访问头2:{self.header_2}\n"
            f"访问头3:{self.header}\n"
            f"下单表单:{self.down_order_data}"
        )

    def verify_cookie(self):
        nav_url = "https://api.bilibili.com/x/web-interface/nav"
        r1 = requests.get(nav_url, cookies=self.cookie, headers=self.header)
        if r1.json()['code'] != 0:
            return False
        print(r1.text)
        return True

    def down_order(self):
        """ 下单 """
        api = "https://api.bilibili.com/x/garb/trade/create"
        a = 0
        while a < 10:
            r1 = requests.post(api, headers=self.header_1, cookies=self.cookie, data=self.down_order_data)
            print(r1.text)
            if r1.json()['code'] != 0:
                a += 1
                continue
            return r1.json()['data']['order_id']
        return False

    def confirm_order(self, order_id):
        """ 确认订单 """
        a = 0
        api = "https://api.bilibili.com/x/garb/trade/confirm"
        data = {"order_id": f"{order_id}", "csrf": f"{self.cookie['bili_jct']}"}
        while True:
            a += 1
            print(f"获取pay_data... {a}")
            r1 = requests.post(api, headers=self.header_1, cookies=self.cookie, data=data)
            print(r1.text)
            pay_data = r1.json()['data']['pay_data']
            if not pay_data:
                continue
            pay_json = json.loads(pay_data)
            return pay_json

    def get_pay_data(self, data):
        """ 获取付款验证表单以及cookie """
        url_api = "https://pay.bilibili.com/payplatform/pay/pay"
        data1 = {
            "appName": "tv.danmaku.bili",
            "appVersion": self.app_v1,
            "payChannelId": "99",
            "sdkVersion": "1.4.9",  # 如果这个改变那是不会付款成功的
            "device": "ANDROID",
            "payChannel": "bp",
            "network": "WiFi"
        }
        data1.update(data)
        response = requests.post(url_api, headers=self.header_2, json=data1)
        print(response.text)
        cookie_str = re.split(";", response.headers['Set-Cookie'])[0]
        cookie_pay = {"payzone": cookie_str.replace("payzone=", "")}
        pay_data = json.loads(response.json()['data']['payChannelParam'])
        return cookie_pay, pay_data

    def pay(self, cookie_pay, data):
        api = "https://pay.bilibili.com/paywallet/pay/payBp"
        r1 = requests.post(api, cookies=cookie_pay, json=data, headers=self.header_2)
        print(r1.text)

    def start_pay(self, pay=False):
        order_id = self.down_order()
        if order_id is False:
            print("无了")
            return "无了"
        print(order_id)
        pay_json = self.confirm_order(order_id)
        cookie_pay, pay_data = self.get_pay_data(pay_json)
        print(cookie_pay, pay_data)
        """ 付款, 用的时候再开, 只要验证sdkVersion是否正确就行 """
        if pay:
            self.pay(cookie_pay, pay_data)


class START(BUY):
    def get_open_time(self):
        api = f"https://api.bilibili.com/x/garb/mall/item/suit/v2?item_id={self.zb_id}"
        r1 = requests.get(api, headers=self.header).json()
        if r1['code'] != 0:
            print("错误")
            return None
        return int(r1['data']['item']['properties']['sale_time_begin'])

    def bili_time(self):
        api = 'http://api.bilibili.com/x/report/click/now'
        r1 = requests.get(api, headers=self.header).json()
        return int(r1['data']['now'])

    def get_zb_number(self):
        url = f"https://api.bilibili.com/x/garb/v3/user/asset?part=suit&item_id={self.zb_id}"
        r1 = requests.get(url, headers=self.header, cookies=self.cookie).json()
        code = r1['code']
        if code != 0:
            print("空")
            return None, None
        number = r1['data']['fan']['number']
        name = r1['data']['fan']['name']
        print(name, number)
        return name, number

    def wait_time(self, open_time):
        now_time = time.time()
        remaining = round(open_time - now_time)
        while remaining >= 10:
            now_time = time.time()
            remaining = round(open_time - now_time)
            print(remaining, "秒后开售()")
            time.sleep(1)

    def start_buy(self, pay: bool = False):
        open_time = self.get_open_time()
        self.wait_time(open_time)
        while True:
            bili_now_time = self.bili_time()
            time_string = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(bili_now_time))
            print("b站时间:", time_string)
            if bili_now_time >= open_time:
                s = time.time()
                self.start_pay(pay=pay)
                e = time.time()
                print(f"-------购买完成 耗时:{e - s}秒-------")
                break
            time.sleep(0.3)


zb_ = START("装扮id", "cookie文件路径", "app详细版本", "app版本", "安卓系统版本", "手机型号")
# "装扮id", "cookie文件路径", "app详细版本", "app版本", "安卓系统版本", "手机型号"
# 演示 START("3898", "./test.json", "6580300", "6.58.0", "10.0.0", "HMA-AL00")
zb_.start_buy(pay=False)  # pay=True时会实现付款, False时则不会, False主要测试sdkVersion用
zb_.get_zb_number()
