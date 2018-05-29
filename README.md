# FacebookBot
A Facebook bot for Telegram.

[![dependencies](https://img.shields.io/david/Liryna/facebookbot.svg?style=flat-square)](https://david-dm.org/Liryna/facebookbot)[![npm version](http://img.shields.io/npm/v/facebookbot.svg?style=flat-square)](https://www.npmjs.com/package/facebookbot)
>I'm a Facebook bot. I help you to communicate with your old Facebook friends through Telegram ! I will forward every of your FB messages. I will also forward your answers if you select to reply their messages.

## Install
- Create your Telegram bot, follow the instruction [here](https://core.telegram.org/bots#3-how-do-i-create-a-bot).
- Clone this repository.
- Install nodejs package.
```
cd FacebookBot
npm install
```

##Usage
- This bot requires some additional information in your environment variables.
```
TELEGRAM_USER_ID="your telegram user id"
TELEGRAM_TOKEN="the token of your bot that BotFather gave you"
FACEBOOK_USERNAME="your facebook username"
FACEBOOK_PASSWORD="your facebook password"
```
- Run it.
```
node facebookbot.js
```
- The bot cannot establish a conversation to you directly, you need to write him first. Use your Telegram Client to say him "Hello".
- The Available commands to send to your bot:
```
/threadlist - List the latest conversations you had with your friends.
/cancel - Cancel the current command.
```

## Dependencies

This bot use [ravkr/facebook-chat-api](https://github.com/ravkr/facebook-chat-api) and [yagop/node-telegram-bot-api](https://github.com/yagop/node-telegram-bot-api).
