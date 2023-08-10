import {openai} from "./main.js";
import {users} from './main.js'
import {db} from "./main.js";
import {isMoreDifference, setMidnightInterval, timeBeforeMidnight} from "./utils.js";
import {code, } from "telegraf/format";

export class User {
    messages = []
    trial_count = 10
    additional_count = 0
    // trial_interval = null
}
async function initUsers(){
    const dbUsers = await db.db.collection('users').find({}).toArray()
    dbUsers.forEach(user => {
        users[user.userId] = user
    })
    setMidnightInterval(() => {
        Object.keys(users).forEach(userId => {
            users[userId].trial_count = 10
            db.updateUser(users[userId])
        })
    })
}
export async function initUser(ctx) {
    if(ctx.session) return
    try {
        const userId = ctx.from.id
        ctx.session ??= {messages: []}
        if (users || Object.keys(users).length === 0) {
            await initUsers()
        }
        users[userId] ??= new User()
        await ctx.reply('Жду вашего голосового или текстового сообщения')
    } catch (e) {
        console.log(e)
    }

}


export async function handleTrialRequest(ctx) {
    const userId = ctx.from.id
    const user = users[userId]
    const {trial_count, additional_count} = user
    if (trial_count + additional_count > 0) {
        user[trial_count > 0 ? 'trial_count' : 'additional_count'] -= 1
        db.updateUser(userId, user)
        return true
    } else {
        await ctx.reply('Вы исчерпали лимит ежедневных запросов'+
            `\n${timeBeforeMidnight().toFixed(1)} часов до обнуления лимита`+
            '\n/request_more — запросить дополнительные запросы')
        return false
    }
}


// export async function processTextToChat(ctx, content) {
//     try {
//
//         if (isMoreDifference(30, ctx.session.lastMessageTime||Date.now(), Date.now())) {
//             ctx.session.messages = []
//             ctx.reply(code('context cleared'))
//         }
//         ctx.session.lastMessageTime = Date.now()
//         ctx.session.messages.push({role: openai.roles.USER, content})
//         const response = await openai.chat(ctx.session.messages)
//
//         ctx.session.messages.push({
//             role: openai.roles.ASSISTANT,
//             content: response.content,
//         })
//
//
//         await ctx.replyWithMarkdown(response.content)
//     } catch (e) {
//         console.log('Error while processing text to gpt', e.message)
//         await ctx.reply(code(`Ошибка: GPT задумался и не ответил. Попробуйте почистить контекст командой /new`))
//     }
// }


export async function processTextToChat(ctx, content) {
    try {

        if (isMoreDifference(30, ctx.session.lastMessageTime||Date.now(), Date.now())) {
            ctx.session.messages = []
            ctx.reply(code('context cleared'))
        }
        ctx.session.lastMessageTime = Date.now()
        ctx.session.messages.push({role: openai.roles.USER, content})

        const curMessage = await ctx.replyWithMarkdown('...')
        await openai.updateWhileChatStream(ctx.session.messages, (message, parse=false) => {
            try{
                ctx.telegram.editMessageText(
                    curMessage.chat.id,
                    curMessage.message_id,
                    null,
                    message,
                    {parse_mode: parse ? 'Markdown' : undefined}
                )
            }catch (e) {
                console.log(e)
            }
        })

    } catch (e) {
        console.log('Error while processing text to gpt', e.message)
        await ctx.reply(code(`Ошибка: GPT задумался и не ответил. Попробуйте почистить контекст командой /new`))
    }
}
