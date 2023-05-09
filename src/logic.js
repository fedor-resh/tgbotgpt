import { openai } from "./main.js";
import {state} from './main.js'
export class User {
  messages = []
  trial_count = 10
  additional_count = 0
}

export async function initCommand(ctx) {
  const userId = ctx.from.id
  ctx.session = ctx.session || state
  ctx.session[userId] = new User()
  ctx.session.trialInterval = setInterval(() => {
    ctx.session[userId].trial_count = 10
  }, 1000 * 60 * 60 * 24)
  await ctx.reply('Жду вашего голосового или текстового сообщения')
}
export async function handleTrialRequest(ctx) {
    const userId = ctx.from.id
    const {trial_count, additional_count} = ctx.session[userId]
    if (trial_count + additional_count > 0) {
        ctx.session[userId][trial_count > 0?'trial_count':'additional_count'] -= 1
        await ctx.reply(`Осталось ${trial_count + additional_count - 1} запросов`)
        return true
    } else {
        await ctx.reply(
            `Вы исчерпали лимит бесплатных запросов
            /request_more — запросить дополнительные запросы`
        )
        return false
    }
}
export async function processTextToChat(ctx, content) {
  try {
    const userId = ctx.from.id
    ctx.session[userId].messages.push({ role: openai.roles.USER, content })

    const response = await openai.chat(ctx.session[userId].messages)

    ctx.session[userId].messages.push({
      role: openai.roles.ASSISTANT,
      content: response.content,
    })

    await ctx.replyWithMarkdown(response.content)
  } catch (e) {
    console.log('Error while proccesing text to gpt', e.message)
  }
}
