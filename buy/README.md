```pip install requests```


不用login.py不用装下面两

```pip install opencv-python```

```pip install opencv-python qrcode pillow pyzbar```


cookie建议使用安卓5配合fiddler抓一次

~~运行main.py~~

~~修改value.py的zb_id改变购买对象~~

buy.py添加了等待,不需要再在开售前5秒启动了

运行buy.py 并修改值

我为什么总感觉这个多线程反而会慢,而且大概率触发26120 👀

抢装扮常见错误码(仅限下单接口返回)

| code        |message           |
| ----------- | ---------------  |
| 0           | 成功             |
| 403         | 恭喜封号          |
| 26101       | 商品不存在        |
| 26105       | 商品售罄          |
| 26120       | 操作频繁          |
| 26123       | 锁前排了捏        |
| 26125       | 得加钱           |
| 26127       | 商品不存在(未开售)|
| 26410       | 不在活动范围内    |
| 69949       | 常见于概念版抢装扮 |

