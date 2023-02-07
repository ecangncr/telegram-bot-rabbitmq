

const rabbitmqManager = require('./rabbitMqManager')
const waitPort = require('wait-port');
const TelegramBot = require('node-telegram-bot-api');

const init = async () => { 

   const {channel,connection,publishBotMessage}   = await rabbitmqManager.Publisher.initPublisher();

   const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

   const TELEGRAM_BOT_USERNAME = process.env.TELEGRAM_BOT_SLUG
   
   const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, {polling: true})

   bot.onText(/\/start/, async (msg) => {
  
    const chatID = msg.chat.id;

    const telegramMSG = 'Hi!'

    await  publishBotMessage( {  botUserName:TELEGRAM_BOT_USERNAME,
      chatID,
      telegramMSG},{priority:10});
  });

 }

 const RABBITMQ_DEFAULT_PORT=process.env.RABBITMQ_DEFAULT_PORT 
 
 const RABBITMQ_CONTAINER_NAME=process.env.RABBITMQ_CONTAINER_NAME 
 
 const params = {
   host:`${RABBITMQ_CONTAINER_NAME}`,
   port:Number(RABBITMQ_DEFAULT_PORT),
 };
 
 waitPort(params)
   .then(({ open, ipVersion }) => {
     if (open){
       init();
     }
     else console.log('The port did not open before the timeout...');
 
   })
   .catch((err) => {
     console.log(`An unknown error occured while waiting for the port: ${err}`);
   });
 
 
 
