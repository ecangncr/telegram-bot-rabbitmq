

## Priority-based Telegram Bot Using RabbitMQ

This Priority-based Telegram Bot Using RabbitMQ is designed to allow high message sending capacity and efficient processing of messages. The publisher and consumer structure ensures that messages are effectively managed and sent to the appropriate bots. Multiple bots can use the same queue

This centralized approach to message management improves the overall performance and efficiency of the system as messages are sent and processed efficiently. 

A prioritized queuing system assigns priority levels to messages, ensuring that important messages are processed first and less critical messages are handled in their turn. This results in a more organized and streamlined message delivery process with higher message sending capacity.


In case of an error when sending a message in this queue system, the following retry process is carried out:

```js
    
[
    {'messages-retry-1': 5000 },
    {'messages-retry-2': 20000 },
    {'messages-retry-3': 50000 },
    {'messages-retry-4': 120000 },
]
```

According to the system's order, the system waits for 5000 milliseconds for the messages-retry-1 and tries to send it again. If the error occurs again, the same process is repeated until the last element of the array. If the message still fails to send even after waiting for 120000 milliseconds in the last element of the array, the message will be removed from the queue.

If you want to change the waiting time of messages in case of error, you can look at the messageTtl section in rabbitMqManager.js file.

```js
await channel.assertQueue('messages-retry-1', { durable: true, deadLetterExchange: 'DLX-MESSAGES', messageTtl: 5000 })
```

## Priority
In this priority queue system, messages can be assigned a priority level between 1 and 10, with 1 being the lowest priority and 10 being the highest priority. The priority level determines the order in which the messages are processed in the queue. Messages with higher priority levels will be processed first, while those with lower priority levels will be processed later. This allows for important messages to be prioritized and processed immediately, while less important messages can be handled in due course.

## Example

```js
bot.onText(/\/start/, async (msg) => {
  
    const chatID = msg.chat.id;

    const telegramMSG = 'Hi!'

    await  publishBotMessage({  botUserName:"TELEGRAM_BOT_USERNAME",
      chatID,
      telegramMSG},{priority:10});
});

```

## Rate Limiter

If you want to add rate limiter to your bot you can check my other repo;

[Telegram Rate Limiter](https://github.com/ecangncr/telegram-rate-limiter)