var fs = require('fs');
var Bot = require('node-telegram-bot-api');
var login = require("facebook-chat-api");

if (!process.env.TELEGRAM_USER_ID || !process.env.TELEGRAM_TOKEN)
    return console.log("Please define this env variables -- TELEGRAM_USER_ID - TELEGRAM_TOKEN");

var owner = {username: process.env.TELEGRAM_USER_ID, chat_id: process.env.CHAT_ID || undefined};
var maxThreadNb = 10;

function getUsage() {
    return "I'm a Facebook bot. I help you to communicate with your old Facebook friends through Telegram !\n"
        + " I will forward every of your FB messages. I will also forward your answers if you select to reply their messages.\n\n"
        + "Available commands:\n"
        + "/threadlist - List the latest conversations you had with your friends.\n"
        + "/cancel - Cancel the current command.\n"
        + "\n\nMore Informations: https://github.com/Kreastr/FacebookBot";
}

var chat = new Array();
var friends = {};
var threadListTmp;
var currentThreadId;


// Start Telegram Bot
var bot = new Bot(process.env.TELEGRAM_TOKEN, {polling: true});

//listen telegram message

function doAuth(msg)
{
	console.log("New message in Telegram")
	console.log(msg)
	if (msg.from.username== owner.username)
		if (owner.chat_id == undefined)
                owner.chat_id = msg.chat.id; 
           return true;
	bot.sendMessage( ""+msg.chat.id, "I don't know you, "+msg.from.username);
	return false;
}

function initListeners()
{
	bot.onText(/\/echo (.+)/, (msg, match) => {
	  const chatId = msg.chat.id;
	  const resp = match[1]; // the captured "whatever"
	  if (!doAuth(msg)) return;
	  // send back the matched "whatever" to the chat
	  bot.sendMessage(chatId, resp);
	});

	bot.onText(/\/threadlist/, (msg, match) => {
	  const chatId = msg.chat.id;
	  if (!doAuth(msg)) return;	
		
	  api.getThreadList(0, maxThreadNb, function callback(err, arr) {

                        var ft = require('./lib/findThread');
                        var fbids = ft.getParticipantsIds(arr);
                        currentThreadId = undefined; //reset current thread

                        api.getUserInfo(fbids, function (err, ret) {
                            if (err) return console.error(err);

                            ft.createThreads(arr, ret, function (conversatioNames, newThreadListTmp) {
                                threadListTmp = newThreadListTmp;
                                bot.sendMessage(msg.chat.id, "Who is the recipient ?",{
                                    reply_markup: {
                                        keyboard: conversatioNames
                                    }
                                })
                            });
                        });
                    });

	});

	bot.onText(/\/cancel/, (msg, match) => {
	  const chatId = msg.chat.id;
	  if (!doAuth(msg)) return;	
		reset();
                bot.sendMessage(
                            msg.chat.id,
                            "Command canceled.",{
                            reply_markup: {
                                hide_keyboard: true
                            }
                        });
	});
	
	bot.on('message', (msg) => {
	  const chatId = msg.chat.id;
	  if (!doAuth(msg)) return;	

	  if (currentThreadId != undefined) {
                    if (msg.photo != undefined) {
                        bot.getFile(msg.photo[msg.photo.length - 1].file_id,{
                            dir: '/'
                        }).then( function(arr) {
                            api.sendMessage({attachment: fs.createReadStream(arr.destination)}, currentThreadId, function (err, api) {
                                fs.unlink(arr.destination, function (err) {
                                    if (err) throw err;
                                });
                            });
                            });
                        });
                    } else {
                        api.sendMessage(msg.text,
                            currentThreadId, function (err, api) {
                                if (err) return console.error(err);
                            });
                    }
           } else if (threadListTmp != undefined) { //Check if owner have send a good recipient name
                    currentThreadId = undefined;
                    for (var x = 0; x < threadListTmp.length; x++) {
                        if (threadListTmp[x].name == msg.text)
                            currentThreadId = threadListTmp[x].threadID;
                    }

                    if (currentThreadId != undefined)
                        bot.sendMessage(
                                msg.chat.id,
                                "What is the message for him ?",{
                                reply_markup: {
                                    hide_keyboard: true
                                }
                            });
                    else
                        bot.sendMessage(
                                msg.chat.id,
                                "I do not know him, Please give me a correct name or /cancel."
                            );
          } else {
                    bot.sendMessage(msg.chat.id,
                            getUsage(),{
                            disable_web_page_preview: true
                        });
                }
    
	});	  
}

initListeners();

login({email: process.env.FACEBOOK_USERNAME, password: process.env.FACEBOOK_PASSWORD}, async function (err, api) {
    if (err) return console.error(err);

    await retrieveFriendsFromFacebook(api);

    //listen message from FB and forward to telegram

    if (!owner.chat_id) {
        console.error("No chat id found.");
    } else {
        api.listen(function callback(err, message) {
            if (err) {
                console.error("Errors on facebook listening", err);
            }
            else if (message) {
                // gets the fb user name given his id
                const senderName = friends[message.senderID] || message.senderID;

                if (message.attachments.length > 0) {
                    sendAttachmentsToTelegram(bot, senderName, message);
                } else {
                    sendTextMessageToTelegram(bot, senderName, message, message.body);
                }
            } else {
                console.log("no message from facebook");
            }

        });
    }
});

const retrieveFriendsFromFacebook = async function (api) {

    return await api.getFriendsList(async function callback(err, arr) {
        if (err) {
            return console.error(err);
        }
        for (let i = 0; i < arr.length; i++) {
            friends[arr[i].userID] = arr[i].fullName;
        }
        console.log("Facebook friend list retrieved", arr.length);
        return arr.length;
    });
};

const sendTextMessageToTelegram = function (bot, senderName, message, text) {
    let forwardmsg = senderName + ": " + text;
    if (message.isGroup) {
        forwardmsg = message.threadID + ": " + forwardmsg;
    }

    bot.sendMessage(owner.chat_id, forwardmsg,)
};

const sendAttachmentsToTelegram = function (bot, senderName, message) {
    for (let i = 0; i < message.attachments.length; i++) {
        const attachment = message.attachments[i];
        // To simplify, it sends attachments as urls
        if (!!attachment.url) {
            sendTextMessageToTelegram(bot, senderName, message, attachment.type + " - " + attachment.url);
        } else {
            console.log(attachment.type, JSON.stringify(attachment));
            const text = "attachment type still not managed: " + attachment.type;
            sendTextMessageToTelegram(bot, senderName, message, text);
        }


    }
}

function reset() {
    currentThreadId = undefined;
    threadListTmp = undefined;
}
