# Сервер Zoo Throw (до 6 игроков на сервер)

Нужен Node.js 18+.

```
npm install
npm start          # слушает порт из PORT, по умолчанию 8080
```

Игра подключается по WebSocket. На Яндекс Играх страница открыта по https,
поэтому сервер должен быть доступен по **wss://** (с HTTPS-сертификатом).

Как поднять за 5 минут (любой из вариантов):
- Render.com / Railway / Fly.io: создать Web Service из этой папки, команда `npm start`.
  Они сами дают адрес `https://имя.onrender.com` → в игре пишем `wss://имя.onrender.com`.
- Свой VPS: `node server.js` за nginx с сертификатом Let's Encrypt.

Адрес вписывается в `index.html` игры:

```
window.ZOO_SERVER = 'wss://имя.onrender.com';
```

Если сервер недоступен, игра сама переходит в одиночный режим.
Проверка, что сервер жив: открыть `https://имя.onrender.com` — ответит `zoo-throw ok`.
