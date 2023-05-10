import {openai} from "./main.js";
import {state} from './main.js'
import {db} from "./main.js";

export class User {
    messages = []
    trial_count = 10
    additional_count = 0
    // trial_interval = null
}

export async function initUser(ctx) {
  try{
    const userId = ctx.from.id
    ctx.session ??= {messages:[]}
    if (Object.keys(state).length === 0) {
        const users = await db.db.collection('users').find({}).toArray()
        users.forEach(user => {
            state[user.userId] = user
            state[user.userId].trial_count = 10
            db.updateUser(state[user.userId])
            setInterval(() => {
                state[user.userId].trial_count = 10
                db.updateUser(state[user.userId])
            }, 1000 * 60 * 60 * 24)
        })
    }
    if (!state[userId]) {
        state[userId] = new User()
        db.updateUser(state[userId])
        setInterval(() => {
            state[userId].trial_count = 10
            db.updateUser(state[userId])
        }, 1000 * 60 * 60 * 24)
    }
    await ctx.reply('Жду вашего голосового или текстового сообщения')
  }catch(e){
    console.log(e)
  }

}


export async function handleTrialRequest(ctx) {
    const userId = ctx.from.id
    const user = state[userId]
    const {trial_count, additional_count} = user
    if (trial_count + additional_count > 0) {
        user[trial_count > 0 ? 'trial_count' : 'additional_count'] -= 1
        db.updateUser(userId, user)
        await ctx.reply(`Осталось ${trial_count + additional_count - 1} запросов`)
        return true
    } else {
        await ctx.reply('Вы исчерпали лимит ежедневных запросов\n/request_more — запросить дополнительные запросы')
        return false
    }
}

export async function processTextToChat(ctx, content) {
    try {
        ctx.session.messages.push({role: openai.roles.USER, content})

        const response = await openai.chat(ctx.session.messages)

        ctx.session.messages.push({
            role: openai.roles.ASSISTANT,
            content: response.content,
        })

        await ctx.replyWithMarkdown(response.content)
    } catch (e) {
        console.log('Error while processing text to gpt', e.message)
    }
}

