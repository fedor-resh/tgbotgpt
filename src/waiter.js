import {code} from "telegraf/format";

export class Waiter {
    interval = null
    msg = null
    ctx = null
    text_to_wait = 'Loading'
    async start(ctx) {
        this.msg = await ctx.reply(code(this.text_to_wait))
      this.ctx = ctx
        let dotsCount = 0
        this.interval = setInterval(async () => {
            dotsCount += 1
            edit(dotsCount)
        }, 500)
        
    }

    async edit(dotsCount){
      const dots = '.'.repeat(dotsCount % 4)
      try {
        await ctx.telegram.editMessageText(
          this.msg.chat.id,
          this.msg.message_id,
          null,
          code(this.text_to_wait + dots)
        )
      } catch (error) {}
    }

    async stop() {
        clearInterval(this.interval)
        setTimeout(async () => {
          edit(3)
        }, 100)
    }
}
