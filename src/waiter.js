import {code} from "telegraf/format";

export class Waiter {
    interval = null
    msg = null
    ctx = null
    text_to_wait = 'Loading.'

    async start(ctx) {

        this.msg = await ctx.reply(code(this.text_to_wait))
        let dotsCount = 0
        this.interval = setInterval(async () => {
            dotsCount += 1
            const dots = '.'.repeat(dotsCount % 3)
            try {
                await ctx.telegram.editMessageText(
                    this.msg.chat.id,
                    this.msg.message_id,
                    null,
                    code(this.text_to_wait + dots)
                )
            } catch (e) {
                console.log(e)
            }
        }, 500)
        this.ctx = ctx

    }

    async stop() {
        clearInterval(this.interval)
        setTimeout(async () => {
            try {
                await this.ctx.telegram.editMessageText(
                    this.msg.chat.id,
                    this.msg.message_id,
                    null,
                    code(this.text_to_wait + '...'),
                )
            } catch (e) {
            }
        }, 100)
    }
}

