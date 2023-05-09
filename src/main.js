import {config as dotenv} from 'dotenv'
import {Telegraf, session} from 'telegraf'
import {message} from 'telegraf/filters'
import {code} from 'telegraf/format'
import {ogg} from './ogg.js'
import {OpenAI} from './openai.js'
import {removeFile} from './utils.js'
import {handleTrialRequest, initUser, processTextToChat} from './logic.js'

import express from 'express'
import {Mongodb} from "./mongodb.js";

dotenv()
const app = express()
app.get('/', (req, res) => {
    res.send('hello world')
})

app.listen(3000, () => {
    console.log('work on 3000')
})
export const openai = new OpenAI(process.env.OPENAI_KEY)
export const admin_username = 'fedukus'
export const state = {}
const admin_userId = '1067565088'
export const db = new Mongodb(process.env.MONGODB_URI)
const bot = new Telegraf(process.env.TELEGRAM_TOKEN)
db.connect()
bot.use(session())
bot.use(async (ctx, next) => {
    const userId = ctx.from.id
    if (!state?.[userId]) {
        await initUser(ctx)
    }
    next()
})
bot.command('new', ctx => {
    ctx.session = {messages: []}
    ctx.reply('Память чата стёрта')
})

bot.command('start', async (ctx) => {
    await initUser(ctx)
    await ctx.telegram.sendMessage(admin_userId, 'Бот запущен')
    ctx.replyWithMarkdown(
        '/new — стереть память чату\n' +
        '/count — узнать количество оставшихся запросов'
    )
})

bot.command('count', async (ctx) => {
    const userId = ctx.from.id
    const {trial_count, additional_count} = state[userId]
    await ctx.reply(`Осталось ${trial_count} ежедневных запросов и ${additional_count} дополнительных`)
})

bot.command('request_more', async (ctx) => {
    await ctx.telegram.sendMessage(admin_userId, `Пользователь ${ctx.from.username} запросил дополнительные запросы`)
    await ctx.telegram.sendMessage(admin_userId, `/add_${ctx.from.id}_10`)
    await ctx.reply(`Запрос отправлен администратору`)
})
bot.hears(new RegExp('add.*'), async (ctx) => {
    try {
        if (ctx.from.username !== admin_username) return
        const userId = Number(ctx.message.text.split('_')[1])
        const count = Number(ctx.message.text.split('_')[2])
        state[userId].additional_count += count
        db.updateUser(userId, state[userId])
        await ctx.reply(`Запросы добавлены`)
        await ctx.telegram.sendMessage(userId, `Вам добавили ${count} запросов`)
    } catch (error) {
        console.log('error')
    }
})
bot.on(message('voice'), async (ctx) => {
    if (!await handleTrialRequest(ctx)) return

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
    if (!await handleTrialRequest(ctx)) return

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
