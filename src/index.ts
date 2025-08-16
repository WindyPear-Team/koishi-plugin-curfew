import { Context, Schema } from 'koishi'
import {} from 'koishi-plugin-cron'

export const name = 'curfew'
export const inject = ['cron'] // 依赖 cron 服务

export interface GroupConfig {
  botId: string
  groupId: string
  banTime: string // HH:mm
  unbanTime: string // HH:mm
}

export interface Config {
  groups: GroupConfig[]
}

export const Config: Schema<Config> = Schema.object({
  groups: Schema.array(
    Schema.object({
      botId: Schema.string().description('Bot 的 ID'),
      groupId: Schema.string().description('QQ群号'),
      banTime: Schema.string().role('time').description('每日全员禁言时间'),
      unbanTime: Schema.string().role('time').description('每日解除全员禁言时间'),
    })
  ).description('群组配置列表'),
})

export function apply(ctx: Context, config: Config) {
  for (const group of config.groups) {
    // 全员禁言定时
    const [banHour, banMinute] = group.banTime.split(':').map(Number)
    ctx.cron(`${banMinute} ${banHour} * * *`, async () => {
      const bot = ctx.bots.find(b => b.selfId === group.botId)
      if (!bot) return
      await bot.internal.setGroupWholeBan(group.groupId, true)
      ctx.logger.info(`[curfew] [${bot.selfId}] 已对群 ${group.groupId} 启动全员禁言`)
    })

    // 解除全员禁言定时
    const [unbanHour, unbanMinute] = group.unbanTime.split(':').map(Number)
    ctx.cron(`${unbanMinute} ${unbanHour} * * *`, async () => {
      const bot = ctx.bots.find(b => b.selfId === group.botId)
      if (!bot) return
      await bot.internal.setGroupWholeBan(group.groupId, false)
      ctx.logger.info(`[curfew] [${bot.selfId}] 已对群 ${group.groupId} 解除全员禁言`)
    })
  }
}