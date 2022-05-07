import threading
import requests
import qrcode
import json
import time
import cv2
import re
import os

# 就是让你登陆用的, 不需要的话只用装opencv
class Login:
    header = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:95.0) Gecko/20100101 Firefox/95.0"}
    response = None
    qr_code_path = None
    cookie_path = None
    login_key = None
    login_url = None
    cookie = None

    def __init__(self, qr_code_save_path="./", cookie_save_path="./", del_qr_code=True):
        self.qr_code_save_path = qr_code_save_path
        self.cookie_save_path = cookie_save_path
        self.del_qr_code = del_qr_code

        self.login_thread = threading.Thread(target=self.verify_login_thread)
        start_time = time.time()
        self.start_login()
        end_time = time.time()
        print(f"登陆用时:{round(end_time - start_time)}秒")

    def get_login_key_and_login_url(self):
        url = "https://passport.bilibili.com/qrcode/getLoginUrl"
        r1 = requests.get(url, headers=self.header).json()
        self.login_key = r1['data']['oauthKey']
        self.login_url = r1['data']['url']
        return self.login_key, self.login_url

    def get_qr_code(self):
        self.qr_code_path = f"{self.qr_code_save_path}/{self.login_key}.png"
        qr_code = qrcode.make(self.login_url)
        qr_code.save(self.qr_code_path)
        return self.qr_code_path

    def verify_login(self):
        url = "https://passport.bilibili.com/qrcode/getLoginInfo"
        data = {"oauthKey": self.login_key}
        self.response = requests.post(url, headers=self.header, data=data)
        return self.response

    def verify_login_thread(self):
        while True:
            r1 = self.verify_login()
            print(r1.json())
            if r1.json()['status'] is True:
                break
            time.sleep(3)
        return

    def open_qr_code(self):
        while self.login_thread.is_alive():
            img = cv2.imread(self.qr_code_path)
            cv2.imshow(self.login_key, img)
            cv2.waitKey(1)
        cv2.destroyAllWindows()
        if self.del_qr_code:
            os.remove(self.qr_code_path)

    def handle_cookie(self):
        response_json = self.response.json()
        cookie_url = response_json['data']['url']
        cookie_str = re.findall(r"\?.+", cookie_url)[0][1:]
        cookie_list = re.split("&", cookie_str)
        key_value_list = [tuple(re.split("=", li)) for li in cookie_list][:-1]
        self.cookie = {key: value for key, value in key_value_list}
        return self.cookie

    def save_cookie(self):
        cookie_name = self.cookie['DedeUserID']
        cookie_str = json.dumps(self.cookie)
        with open(self.cookie_save_path + f"/{cookie_name}.json", "w", encoding="utf-8") as f:
            f.write(cookie_str)
        f.close()

    def verify_cookie(self):
        nav_url = "https://api.bilibili.com/x/web-interface/nav"
        r1 = requests.get(nav_url, cookies=self.cookie, headers=self.header)
        print(r1.text)

    def start_login(self):
        self.get_login_key_and_login_url()
        self.get_qr_code()
        self.login_thread.start()
        self.open_qr_code()
        if self.response.json()['status'] is True:
            self.handle_cookie()
            self.save_cookie()
        else:
            print("登陆失败")


login = Login()
print(login.cookie)
