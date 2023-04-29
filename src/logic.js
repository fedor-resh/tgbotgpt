import { openai } from './openai.js'

export const INITIAL_SESSION = () => ({
  messages: [],
})

export async function initCommand(ctx) {
  const userId = ctx.from.id
  ctx.session[userId] = INITIAL_SESSION()
  await ctx.reply('Жду вашего голосового или текстового сообщения')
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
