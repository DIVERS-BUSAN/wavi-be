import requests

url = 'http://apis.data.go.kr/6260000/BusanWaterImrsnInfoService/getWaterImrsnInfo'
params ={'serviceKey' : 'CUgAdYOLCfoqKexlPeZVx03VXdUx2BkGpmIF0hjRMyUix4QJjJZ21TjP38Xy1IJy27nP06/ETwOGxfX5TEs+tw==', 'pageNo' : '1', 'numOfRows' : '20', 'resultType' : 'json' }

response = requests.get(url, params=params)
print(response.content)