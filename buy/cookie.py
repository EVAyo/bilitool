import json
import re
#cookie.txt 浏览器复制

f = open("cookie.txt", "r", encoding="utf-8")
cookie_str = f.read()
f.close()

print(cookie_str)
cookie_str_re = cookie_str.replace(" ", '')
cookie_str_list = re.split(";", cookie_str_re)
cookie_value_str_list = [tuple(re.split("=", li)) for li in cookie_str_list]
cookie_dict = {key: value for key, value in cookie_value_str_list}
s = open("cookie.json", 'w', encoding="utf-8")
s.write(json.dumps(cookie_dict))
s.close()
