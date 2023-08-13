import {openai} from "./index.js";
import {users} from './index.js'
import {db} from "./index.js";
import {code, } from "telegraf/format";

export class User {
    messages = []
    trial_count = 10
    additional_count = 0
}
async function initUsers(){
    try{
        const dbUsers = await db.db.collection('users').find({}).toArray()
        dbUsers.forEach(user => {
            users[user.userId] = user
        })
    }catch (e) {}
}
export async function initUser(ctx) {
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
    const user = users[userId] || {}
    const {trial_count, additional_count} = user
    if (trial_count + additional_count > 0) {
        user[trial_count > 0 ? 'trial_count' : 'additional_count'] -= 1
        db.updateUser(userId, user)
        return true
    } else {
        await ctx.reply('Вы исчерпали лимит ежедневных запросов \n /request_more — запросить дополнительные запросы')
        return false
    }
}



export async function processTextToChat(ctx, content) {
    try {
        ctx.session.messages.push({role: openai.roles.USER, content})

        await openai.updateWhileChatStream(ctx)

    } catch (e) {
        console.log('Error while processing text to gpt', e.message)
        await ctx.reply(code(`Ошибка: GPT задумался и не ответил. Попробуйте почистить контекст командой /new`))
    }
}
