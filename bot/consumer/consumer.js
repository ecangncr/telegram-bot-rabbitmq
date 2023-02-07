

const rabbitmqManager = require('./rabbitMqManager');
const waitPort = require('wait-port');
const axios = require('axios');

const init = async () => {

const getTokenByUserName = (_botUserName) => {

  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

  const TELEGRAM_BOT_SLUG = process.env.TELEGRAM_BOT_SLUG

   const botUserNameList = [
     { botUserName: TELEGRAM_BOT_SLUG,token: TELEGRAM_BOT_TOKEN },
   ];

   const bot = botUserNameList.find(bot => bot.botUserName === _botUserName);
   if(bot) return bot.token;
   return null;
}

  function botSendMessage(msg,channel) {

     const {botUserName,chatID,telegramMSG} = JSON.parse(msg.content.toString()).message;
 
     const URL = 'https://api.telegram.org/bot';

     const botToken = getTokenByUserName(botUserName);

     if(!botToken){

      return Promise.reject();

     }

    return axios.post(`${URL}${botToken}/sendMessage`,
     {
          chat_id: chatID,
          text: telegramMSG
     })
     .then((response) => { 
         return Promise.resolve();
     }).catch(err=>{
      return Promise.reject();
    })
     
   }
   
 const handleConsumeBotMessage = async ({msg,channel,connection}) => {

        return (
          new Promise((resolve, reject) => {
            if (msg.fields.redelivered) {
              reject('Message was redelivered, so something wrong happened');
              return;
            }

            botSendMessage(msg, channel)
              .then(resolve)
              .catch(reject)
          }))
            .then(() => {
              channel.ack(msg);
            })
            .catch(handleRejectedMsg);

         function handleRejectedMsg(err) {
           return rabbitmqManager.Consumer.sendMsgToRetry({ msg, channel });
         }
 }

 const { consumeBotMessage} = await rabbitmqManager.Consumer.initConsumer();

 consumeBotMessage(handleConsumeBotMessage);

}

const RABBITMQ_DEFAULT_PORT=process.env.RABBITMQ_DEFAULT_PORT;
 
const RABBITMQ_CONTAINER_NAME=process.env.RABBITMQ_CONTAINER_NAME ;

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



  

