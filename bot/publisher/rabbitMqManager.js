const AmqpClient = require('amqplib');
const contentTypeJson = 'application/json';
const contentEncoding = 'utf8';

const telegramBotMessageQuery = "botMessage"

const initAmqp = async () => {

    const RABBITMQ_CONTAINER_NAME=process.env.RABBITMQ_CONTAINER_NAME;

    const RABBITMQ_DEFAULT_USER=process.env.RABBITMQ_DEFAULT_USER;

    const RABBITMQ_DEFAULT_PASS=process.env.RABBITMQ_DEFAULT_PASS;

    const connection = await AmqpClient.connect(`amqp://${RABBITMQ_DEFAULT_USER}:${RABBITMQ_DEFAULT_PASS}@${RABBITMQ_CONTAINER_NAME}`);

    const channel = await connection.createChannel();

    await channel.prefetch(1);

    return {channel,connection};

}

const initPublisher = async () => {

    const {connection,channel} = await initAmqp();

    await assertExchanges();

    await assertQueues();

    await bindExchangesToQueues();


    async function assertExchanges() {
            await channel.assertExchange('MESSAGE_CREATED', 'direct', { durable: true });
            
            await channel.assertExchange('TTL-MESSAGES', 'direct', { durable: true });
            await channel.assertExchange('DLX-MESSAGES', 'fanout', { durable: true });
        
      }

    async function assertQueues() {
        await channel.assertQueue(telegramBotMessageQuery, { durable: true,maxPriority:10})
        await channel.assertQueue('messages-retry-1', { durable: true, deadLetterExchange: 'DLX-MESSAGES', messageTtl: 5000 });
        await channel.assertQueue('messages-retry-2', { durable: true, deadLetterExchange: 'DLX-MESSAGES', messageTtl: 20000 });
        await channel.assertQueue('messages-retry-3', { durable: true, deadLetterExchange: 'DLX-MESSAGES', messageTtl: 50000 });
        await channel.assertQueue('messages-retry-4', { durable: true, deadLetterExchange: 'DLX-MESSAGES', messageTtl: 120000 });
          
      }
    
    async function bindExchangesToQueues() {
        await channel.bindQueue(telegramBotMessageQuery, 'MESSAGE_CREATED', 'MESSAGE_CREATED');
        await channel.bindQueue(telegramBotMessageQuery, 'DLX-MESSAGES');
        await channel.bindQueue('messages-retry-1', 'TTL-MESSAGES', 'retry-1');
        await channel.bindQueue('messages-retry-2', 'TTL-MESSAGES', 'retry-2');
        await channel.bindQueue('messages-retry-3', 'TTL-MESSAGES', 'retry-3');
        await channel.bindQueue('messages-retry-4', 'TTL-MESSAGES', 'retry-4');

    }


    const publishBotMessage = async (message,opt) => {
        const options = {
            contentEncoding,
            contentType: contentTypeJson,
            persistent: true,
            ...opt
          };

        const content = Buffer.from(JSON.stringify({message}))

        return channel.publish('MESSAGE_CREATED', "MESSAGE_CREATED", content, options);

    }
   
    return {channel,connection,publishBotMessage}

}


const initConsumer = async () => {

    const {connection,channel} = await initAmqp();

    const consumeBotMessage = async(callback,isOverLimit)=>{

        return channel.consume(telegramBotMessageQuery,msg => {


            return callback({msg,connection,channel},isOverLimit);


        });




    }

    return {
        consumeBotMessage,
        sendMsgToRetry
    }

}

function sendMsgToRetry(args) {
    const channel = args.channel;
    const msg = args.msg;
  
    channel.ack(msg);
  
    // Unpack content, update and pack it back
    function getAttemptAndUpdatedContent(msg) {
      let content = JSON.parse(msg.content.toString(contentEncoding));
      content.try_attempt = ++content.try_attempt || 1;
      const attempt = content.try_attempt;
      content = Buffer.from(JSON.stringify(content), contentEncoding);
  
      return { attempt, content };
    }
  
    const { attempt, content } = getAttemptAndUpdatedContent(msg);
  
    if (attempt <= 4) {
      const routingKey = `retry-${attempt}`;
      const options = {
        contentEncoding,
        contentType: contentTypeJson,
        persistent: true,
      };
  
      Object.keys(msg.properties).forEach(key => {
        options[key] = msg.properties[key];
      });

      return channel.publish('TTL-MESSAGES', routingKey, content, options);
    }
    else {
      console.log("Error: retry > 4 :",JSON.parse(msg.content.toString()))
    }
  
    return Promise.resolve();
  }

module.exports = {

    Publisher:{initPublisher},
    Consumer:{initConsumer,sendMsgToRetry}
}