import {config as dotenv} from 'dotenv'
import {Telegraf, session} from 'telegraf'
import {message} from 'telegraf/filters'
import {code} from 'telegraf/format'
import {ogg} from './ogg.js'
import {OpenAI} from './openai.js'
import {removeFile} from './utils.js'
import {handleTrialRequest, initCommand, processTextToChat} from './logic.js'
import express from 'express'
dotenv()
const app = express()
app.get('/', (req, res) => {
    res.send('hello world')
})

app.listen(3000, () => {
    console.log('work on 3000')
})

export const openai = new OpenAI(process.env.OPENAI_KEY)
const bot = new Telegraf(process.env.TELEGRAM_TOKEN)
const admin_username = 'fedukus'
const admin_userId = '1067565088'
bot.use(session())

bot.command('new', initCommand)

bot.command('start', async (ctx) => {
    await initCommand(ctx)
    await ctx.telegram.sendMessage(admin_userId, 'Бот запущен')
    ctx.replyWithMarkdown(
        '/new — стереть память чату\n' +
        '/count — узнать количество оставшихся запросов'
    )
})

bot.command('count', async (ctx) => {
    const userId = ctx.from.id
    const {trial_count, additional_count} = ctx.session[userId]
    await ctx.reply(`Осталось ${trial_count} бесплатных запросов и ${additional_count} дополнительных`)
})

bot.command('request_more', async (ctx) => {
    const userId = ctx.from.id
    const {trial_count, additional_count} = ctx.session[userId]
    await ctx.telegram.sendMessage(admin_userId, `Пользователь ${ctx.from.username} запросил дополнительные запросы`)
    await ctx.telegram.sendMessage(admin_userId, `/add ${ctx.from.id} 10`)
    await ctx.reply(`Запрос отправлен администратору`)
})
bot.command('add', async (ctx) => {
  try {
    if (ctx.from.username !== admin_username) return
    console.log(ctx.message.text)
    console.log(ctx.session)
    const userId = Number(ctx.message.text.split(' ')[1])
    const count = Number(ctx.message.text.split(' ')[2])
    ctx.session[userId].additional_count += count
    await ctx.reply(`Запросы добавлены`)
    await ctx.telegram.sendMessage(userId, `Вам добавили ${count} запросов`)
  } catch (error) {
    console.log('error')
  }

})
bot.on(message('voice'), async (ctx) => {
    const userId = ctx.from.id
    if (!ctx.session?.[userId]) {
        await initCommand(ctx)
    }
    if(!await handleTrialRequest(ctx))return

    try {
        await ctx.reply(code('Сообщение принял. Жду ответ от сервера...'))
        const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id)
        const userId = String(ctx.message.from.id)
        const oggPath = await ogg.create(link.href, userId)
        const mp3Path = await ogg.toMp3(oggPath, userId)

        removeFile(oggPath)

        const text = await openai.transcription(mp3Path)
        await ctx.reply(code(`Ваш запрос: ${text}`))

        await processTextToChat(ctx, text)
    } catch (e) {
        console.log(`Error while voice message`, e.message)
    }
})

bot.on(message('text'), async (ctx) => {
  
    const userId = ctx.from.id
    if (!ctx.session?.[userId]) {
        await initCommand(ctx)
    }
  ctx.session.num ??= 1
  ctx.session.num += 1
  console.log(ctx.session)
    console.log(ctx.from.username, ctx.from.id)
    if(!await handleTrialRequest(ctx)) return

    try {
        await ctx.reply(code('Сообщение принял. Жду ответ от сервера...'))
        await processTextToChat(ctx, ctx.message.text)
    } catch (e) {
        console.log(`Error while voice message`, e.message)
    }
})

bot.launch()

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
