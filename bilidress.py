import requests
import urllib3
import json
import datetime
import time

urllib3.disable_warnings()

sav = 0
tim = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
# tim = "2022-05-7 16:46:39"
time1 = datetime.datetime.strptime(tim, "%Y-%m-%d %H:%M:%S")
while True:
  url = "https://api.bilibili.com/x/garb/rank/fan/recent?item_id=37594"
  payload={}
  headers = {
    'Host': 'api.bilibili.com',
    'cookie': 'SESSDATA=12345',
    'accept': 'application/json, text/plain, */*',
    'referer': 'https://www.bilibili.com/h5/mall/suit/detail?navhide=1&from=home&id=34077&native.theme=1',
    'content-type': 'application/json',
    'user-agent': 'Mozilla/5.0 (Linux; Android 11; M2004J7AC Build/RP1A.200720.011; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/100.0.4896.127 Mobile Safari/537.36 os/android model/M2004J7AC build/6620300 osVer/11 sdkInt/30 network/2 BiliApp/6620300 mobi_app/android channel/1472_ss_smss_bs_244 Buvid/XY3D9AD3BDB2599C7D5CBB9041C95DB8FD16E sessionID/2ad96806 innerVer/6620300 c_locale/zh_CN s_locale/zh_CN disable_rcmd/0 6.62.0 os/android model/M2004J7AC mobi_app/android build/6620300 channel/1472_ss_smss_bs_244 innerVer/6620300 osVer/11 network/2'
  }

  response = requests.request("GET", url, headers=headers, verify=False)
  res = json.loads(response.text)
  res = res['data']['rank']
  num = res[0]['number']
  tim = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
  time2 = datetime.datetime.strptime(tim, "%Y-%m-%d %H:%M:%S")
  if num > sav:
    sav = num
    dift = time2 - time1
    hour = str(dift).split(':')[0]
    minutes = str(dift).split(':')[1]
    secs = str(dift).split(':')[2]
    total_time = str(int(hour)*24+int(minutes))+'分钟'+str(secs)+'秒'
    time1 = time2
  if num >= 68860:
    text = "当前号码{},距离上次售出时间{}".format(sav, total_time)
    tgurl = "https://api.telegram.org/bot12345/sendMessage"
    data = {"chat_id": "12345", 
            "text": text,
            "disable_web_page_preview": "true"}
    proxies={
        'http':"http://127.0.0.1:7890",
        'https':"http://127.0.0.1:7890"
        }
    requests.request("POST", tgurl, proxies=proxies, data=data, verify=False)

  if num >= 68860:
    tokenurl = 'https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=12345&corpsecret=12345'
    getr = requests.get(tokenurl)
    access_token = getr.json().get('access_token')
    data =     {
       "touser" : "@all",
       "msgtype" : "textcard",
       "agentid" : "1000002",
       "textcard" : {
                "title" : "装扮通知:{}".format(num),
                "description" : text,
                "url" : "URL",
                "btntxt":"点我干嘛"
       },
       "enable_id_trans": 0,
       "enable_duplicate_check": 1,
       "duplicate_check_interval": 1800
    }
    posturl = "https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token={}".format(access_token)
    requests.post(posturl, data=json.dumps(data))
  time.sleep(30)
