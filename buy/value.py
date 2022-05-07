import json

zb_id = "33182"  # 装扮id(33182: 草莓大福)
cookie = json.loads(open("cookie.json", "r", encoding="utf-8").read())
system = "10.0.0"  # 安卓系统版本
app_v = "6580300"  # APP版本1
app_innerver = "6.58.0"  # APP版本2
phone = "HMA-AL00"  # 手机型号


Buvid_value_1 = f"Build/{cookie['Buvid']} " if 'Buvid' in cookie else ""


mozilla1 = f"Mozilla/5.0 (Linux; Android {system}; {phone} Build/{phone}; wv) AppleWebKit/537.36 (KHTML, like Gecko)"
value_1_1 = f"Version/4.0 Chrome/74.0.3729.136 Mobile Safari/537.36 os/android model/{phone}"
value_1_2 = f"build/{app_v} osVer/{system} sdkInt/{29} network/2 BiliApp/{app_v}"
value_1_3 = f"mobi_app/android channel/html5_search_baidu {Buvid_value_1}innerVer/{app_v}"
value_1_4 = f"c_locale/zh_CN s_locale/zh_CN 6.27.0 os/android model/{phone} mobi_app/android build/{app_v}"
value_1_5 = f"channel/html5_search_baidu innerVer/{app_v} osVer/{system} network/2"

mozilla2 = f"Mozilla/5.0 BiliDroid/{app_innerver} (bbcallen@gmail.com) os/android model/{phone}"
value_2_1 = f"mobi_app/android build/{app_v} channel/html5_search_baidu innerVer/{app_v} osVer/{system} network/2"


user_agent_1 = f"{mozilla1} {value_1_1} {value_1_2} {value_1_3} {value_1_4} {value_1_5}"
user_agent_2 = f"{mozilla2} {value_2_1}"

head = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:95.0) Gecko/20100101 Firefox/95.0"}

header_1 = {
    "Accept-Encoding": "gzip",
    "User-Agent": user_agent_1,
    "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
    "native_api_from": "h5",
    "Referer": f"https://www.bilibili.com/h5/mall/suit/detail?id={zb_id}&navhide=1",
    "X-CSRF-TOKEN": str(cookie['bili_jct']),
    "Connection": "Keep-Alive",
    "Host": "api.bilibili.com"
}

header_2 = {
    "Accept-Encoding": "gzip",
    "User-Agent": user_agent_2,
    "Content-Type": "application/json",
    "APP-KEY": "android",
    "buildId": app_v,
    "Connection": "Keep-Alive",
    "Host": "pay.bilibili.com"
}
if "Buvid" in cookie:
    header_2['Buvid'] = cookie['Buvid']


# print(header_1)
# print(header_2)
