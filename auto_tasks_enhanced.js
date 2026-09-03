/**
 * 网易云音乐自动任务脚本 - 使用 API Enhanced
 * 
 * 功能:
 * - 云贝签到（安卓端 + PC 端）
 * - VIP 乐签打卡
 * - 领取 VIP 成长值
 * - VIP 音乐任务（收藏 + 听歌 + 取消）
 * - 自动发布/删除动态（每日分享歌曲）
 * 
 * 使用说明:
 * 1. 复制 config_example.json 为 config.json
 * 2. 在 config.json 中配置你的 MUSIC_U cookie
 * 3. 运行：node auto_tasks_enhanced.js
 */

const fs = require('fs')
const path = require('path')
const taskRunner = require('./task-runner')
const API = require('@neteasecloudmusicapienhanced/api')
const generateConfig = require('@neteasecloudmusicapienhanced/api/generateConfig')
const apiExtras = require('./api-extras')
Object.assign(API, apiExtras)

const tmpPath = require('os').tmpdir()
const xeapiKeyPath = path.resolve(tmpPath, 'xeapi_public_key')

const {
  vip_info,
  vip_sign_info,
  vip_sign,
  vip_sign_detail,
  yunbei,
  yunbei_sign,
  yunbei_info,
  yunbei_today,
  yunbei_tasks,
  yunbei_tasks_todo,
  yunbei_task_finish,
  yunbei_task_list_v1,
  yunbei_task_finish_v1,
  yunbei_task_recommend_song,
  vip_tasks,
  vip_growthpoint_get,
  vip_growthpoint_getall,
  vip_tasks_v1,
  event_del,
} = require('@neteasecloudmusicapienhanced/api')

// 分享歌曲到动态（使用 weapi 加密，避免 xeapi v3 风控 250 错误）
async function share_resource_safe({ cookie, type = 'song', id, msg = '' }) {
  const request = require('@neteasecloudmusicapienhanced/api/util/request.js')
  return request(
    `/api/share/friends/resource`,
    { type, msg, id },
    { cookie, crypto: 'weapi' }
  )
}

const {
  playlist_detail,
  song_like,
  like,
  scrobble,
  scrobble_v1,
  likelist,
  // 云小编相关 API
  rep_ugc_user_get,
  rep_ugc_user_sign,
  rep_ugc_user_vip,
  rep_ugc_activity_get,
  rep_ugc_activity_collect,
  thinktank_audit_resource_detail,
  thinktank_audit_resource_update,
  middle_play_lottery_remain_chance,
  middle_play_do_lottery,
  // 云小编入站考试 API（审核任务前置条件）
  rep_ugc_exam_info_get,
  rep_ugc_exam_start,
  rep_ugc_exam_question_single_get,
  rep_ugc_exam_submit
} = require('@neteasecloudmusicapienhanced/api')

// 带连字符的函数名需要单独获取
const rep_ugc_user_collect_vip = API['rep_ugc_user_collect-vip']

// 加载配置文件 - 支持环境变量和配置文件两种方式
const configPath = path.join(__dirname, 'config.json')
let config

// 从环境变量加载配置
function loadConfigFromEnv() {
  const musicU = process.env.NETEASE_MUSIC_U || process.env.MUSIC_U
  const serverSendKey = process.env.SERVER_SENDKEY || process.env.SERVER_CHAN_SENDKEY
  const pushPlusToken = process.env.PUSHPLUS_TOKEN || process.env.PUSH_PLUS_TOKEN
  const pushPlusChannel = process.env.PUSHPLUS_CHANNEL || 'wechat'
  const pushPlusWebhook = process.env.PUSHPLUS_WEBHOOK || ''
  
  if (!musicU) {
    return null
  }
  
  return {
    users: [
      {
        nickname: process.env.NETEASE_NICKNAME || '账号 1',
        cookie: musicU.startsWith('MUSIC_U=') ? musicU : `MUSIC_U=${musicU}`
      }
    ],
    enableYunbeiSign: true,
    enableYunbeiSignPC: true,
    enableYunbeiAdTask: true,
    enableYunbeiTaskFinish: true,
    enableVipSign: true,
    enableVipGrowthpoint: true,
    showVipTaskList: true,
    enableVipMusicTasks: true,
    vipMusicPlaylistId: 8402996200,
    vipMusicSongCount: 4,
    enableVipMusicScrobble: true,
    scrobblePlaylistId: 0,
    scrobbleSongCount: 0,
    enableAutoPost: true,
    deletePreviousPost: true,
    postPlaylistId: 8402996200,
    postSongCount: 1,
    enableCloudEditor: true,
    enableCloudEditorTask: true,
    enableCloudEditorLottery: false,
    cloudEditorTaskCount: 10,
    llmApiKey: configData.llmApiKey || '',
    serverSendKey: serverSendKey || '',
    pushPlusToken: pushPlusToken || '',
    pushPlusChannel: pushPlusChannel,
    pushPlusWebhook: pushPlusWebhook
  }
}

// 尝试从环境变量加载配置
config = loadConfigFromEnv()

// 如果环境变量加载成功，同时读取 config.json 以获取降级 Cookie
let cookieFallbackFromFile = null
if (config && fs.existsSync(configPath)) {
  try {
    const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'))
    const fileUsers = configData.users || []
    if (fileUsers.length > 0) {
      cookieFallbackFromFile = fileUsers[0].cookie
    }
  } catch (_) {}
}

// 如果环境变量未配置，则从配置文件加载
if (!config) {
  if (fs.existsSync(configPath)) {
    const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'))
    config = {
      users: (configData.users || []).map(u => ({
        nickname: u.nickname || u.name || '账号 1',
        cookie: u.cookie
      })),
      enableYunbeiSign: configData.enableYunbeiSign !== false,
      enableYunbeiSignPC: configData.enableYunbeiSignPC !== false,
      enableYunbeiAdTask: configData.enableYunbeiAdTask !== false,
      enableYunbeiTaskFinish: configData.enableYunbeiTaskFinish !== false,
      enableVipSign: configData.enableVipSign !== false,
      enableVipGrowthpoint: configData.enableVipGrowthpoint !== false,
      showVipTaskList: configData.showVipTaskList !== false,
      enableVipMusicTasks: configData.enableVipMusicTasks !== false,
      vipMusicPlaylistId: configData.vipMusicPlaylistId || 8402996200,
      vipMusicFallbackPlaylistIds: configData.vipMusicFallbackPlaylistIds || [7785066739, 5453912201],
      vipMusicSongCount: configData.vipMusicSongCount || 4,
      enableVipMusicScrobble: configData.enableVipMusicScrobble !== undefined ? configData.enableVipMusicScrobble : true,
      scrobblePlaylistId: configData.scrobblePlaylistId || 0,
      scrobbleSongCount: configData.scrobbleSongCount !== undefined ? configData.scrobbleSongCount : 0,
      enableAutoPost: configData.enableAutoPost !== false,
      deletePreviousPost: configData.deletePreviousPost !== false,
      postPlaylistId: configData.postPlaylistId || 8402996200,
      postSongCount: configData.postSongCount || 1,
      // 云小编配置
      enableCloudEditor: configData.enableCloudEditor !== false,
      enableCloudEditorTask: configData.enableCloudEditorTask !== false,
      enableCloudEditorLottery: configData.enableCloudEditorLottery === true,
      cloudEditorTaskCount: configData.cloudEditorTaskCount || 10,
      llmApiKey: configData.llmApiKey || '',
      // 推送配置
      serverSendKey: configData.serverSendKey || '',
      pushPlusToken: configData.pushplusToken || '',
      pushPlusChannel: configData.pushplusChannel || 'wechat',
      pushPlusWebhook: configData.pushplusWebhook || ''
    }
  } else {
    console.error('错误：未找到 config.json 配置文件，也未设置环境变量')
    console.error('')
    console.error('使用方法:')
    console.error('  方式 1 - 使用环境变量:')
    console.error('    export NETEASE_MUSIC_U="MUSIC_U=你的 cookie 值"')
    console.error('    export SERVER_SENDKEY="你的 Server 酱 SendKey"')
    console.error('    export PUSHPLUS_TOKEN="你的 PushPlus Token"')
    console.error('    node auto_tasks_enhanced.js')
    console.error('')
    console.error('  方式 2 - 使用配置文件:')
    console.error('    cp config_example.json config.json')
    console.error('    编辑 config.json 填入 MUSIC_U cookie')
    console.error('    node auto_tasks_enhanced.js')
    console.error('')
    process.exit(1)
  }
}

// 数据记录文件路径
const dataFilePath = path.join(__dirname, 'user_data.json')

// Server 酱推送
async function sendServerChan(title, content) {
  if (!config.serverSendKey) return
  
  try {
    const url = `https://sctapi.ftqq.com/${config.serverSendKey}.send`
    const data = new URLSearchParams({
      title: title,
      desp: content
    })
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: data.toString()
    })
    
    const result = await response.json()
    if (result.code === 0) {
      console.log('📱 Server 酱推送成功')
    } else {
      console.log('⚠️ Server 酱推送失败:', result.message)
    }
  } catch (e) {
    console.log('⚠️ Server 酱推送异常:', e.message)
  }
}

// PushPlus 推送
async function sendPushPlus(title, content) {
  if (!config.pushPlusToken) return
  
  try {
    const url = 'http://www.pushplus.plus/send'
    const data = {
      token: config.pushPlusToken,
      title: title,
      content: content,
      template: 'html',
      channel: config.pushPlusChannel
    }
    
    if (config.pushPlusChannel === 'webhook' && config.pushPlusWebhook) {
      data.webhook = config.pushPlusWebhook
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    
    const result = await response.json()
    if (result.code === 200) {
      console.log('📱 PushPlus 推送成功')
    } else {
      console.log('⚠️ PushPlus 推送失败:', result.msg)
    }
  } catch (e) {
    console.log('⚠️ PushPlus 推送异常:', e.message)
  }
}

// 主函数
async function main() {
  const startTime = new Date()
  
  console.log('='.repeat(60))
  console.log('网易云音乐自动任务 (API Enhanced 版本)')
  console.log('='.repeat(60))
  
  // 初始化 xeapi 公钥（用于 VIP 成长值一键领取）
  if (!fs.existsSync(xeapiKeyPath)) {
    console.log('🔑 初始化 xeapi 公钥...')
    try {
      await generateConfig()
      console.log('✅ xeapi 公钥已就绪')
    } catch (e) {
      console.log(`⚠️ xeapi 公钥初始化失败: ${e.message}`)
    }
  }
  
  runLogs.push(`📅 执行时间：${startTime.toLocaleString('zh-CN')}`)
  runLogs.push('')
  
  for (const user of config.users) {
    console.log(`\n>>> 开始处理用户：${user.nickname}`)
    console.log('-'.repeat(60))
    
    runLogs.push(`👤 用户：${user.nickname}`)
    runLogs.push('-'.repeat(40))
    
    try {
      // 检查 VIP 状态
      console.log(`[${user.nickname}] 检查 VIP 状态...`)
      let vipResult
      try {
        vipResult = await vip_info({ cookie: user.cookie })
      } catch (e) {
        vipResult = e
      }
      if (vipResult.status === 200 && vipResult.body && vipResult.body.code === 200) {
        const hasVip = vipResult.body.data.redVipLevel > 0
        const vipStatus = hasVip ? '已开通' : '未开通'
        console.log(`[${user.nickname}] VIP 状态：${vipStatus}`)
        runLogs.push(`VIP 状态：${vipStatus}`)
      } else if (vipResult.status === 301 || (vipResult.body && vipResult.body.code === 301)) {
        // 环境变量 Cookie 失效时，尝试降级到 config.json 中的 Cookie
        if (cookieFallbackFromFile && cookieFallbackFromFile !== user.cookie) {
          console.log(`[${user.nickname}] 环境变量 Cookie 失效，降级尝试 config.json...`)
          user.cookie = cookieFallbackFromFile
          let retryResult
          try {
            retryResult = await vip_info({ cookie: user.cookie })
          } catch (e) {
            retryResult = e
          }
          if (retryResult.status === 200 && retryResult.body && retryResult.body.code === 200) {
            const hasVip = retryResult.body.data.redVipLevel > 0
            const vipStatus = hasVip ? '已开通' : '未开通'
            console.log(`[${user.nickname}] VIP 状态（config.json 降级）：${vipStatus}`)
            runLogs.push(`VIP 状态：${vipStatus}`)
            // 降级成功，继续后续任务
          } else {
            const errorMsg = `用户未登录 (Cookie 已过期，降级也失败)`
            console.error(`[${user.nickname}] ✗ ${errorMsg}`)
            runLogs.push(`❌ ${errorMsg}`)
            runLogs.push(`提示：请更新 config.json 或环境变量中的 MUSIC_U cookie`)
            throw new Error(errorMsg)
          }
        } else {
          const errorMsg = `用户未登录 (Cookie 已过期)`
          console.error(`[${user.nickname}] ✗ ${errorMsg}`)
          runLogs.push(`❌ ${errorMsg}`)
          runLogs.push(`提示：请更新 config.json 或环境变量中的 MUSIC_U cookie`)
          throw new Error(errorMsg)
        }
      } else {
        const errorMsg = `VIP 状态检查失败：${vipResult.body.message || vipResult.body.code}`
        console.error(`[${user.nickname}] ✗ ${errorMsg}`)
        runLogs.push(`❌ ${errorMsg}`)
        throw new Error(errorMsg)
      }
      
      // 云贝签到（安卓端）
      if (config.enableYunbeiSign) {
        console.log(`[${user.nickname}] 执行云贝签到（安卓端）...`)
        const yunbeiResult = await yunbei({ cookie: user.cookie })
        console.log(`[${user.nickname}] 云贝签到（安卓）结果:`, yunbeiResult.body)
        if (yunbeiResult.body.code === 200) {
          const shells = yunbeiResult.body.data?.shells || 0
          runLogs.push(`☁️ 云贝签到 (安卓): 获得 ${shells} 云贝`)
        } else {
          runLogs.push(`☁️ 云贝签到 (安卓): ${yunbeiResult.body.message || '失败'}`)
        }
      }
      
      // 云贝签到（PC 端）
      if (config.enableYunbeiSignPC) {
        console.log(`[${user.nickname}] 执行云贝签到（PC 端）...`)
        const yunbeiSignResult = await yunbei_sign({ cookie: user.cookie })
        console.log(`[${user.nickname}] 云贝签到（PC）结果:`, yunbeiSignResult.body)
        if (yunbeiSignResult.body.code === 200) {
          const shells = yunbeiSignResult.body.data?.shells || 0
          runLogs.push(`☁️ 云贝签到 (PC): 获得 ${shells} 云贝`)
        } else {
          runLogs.push(`☁️ 云贝签到 (PC): ${yunbeiSignResult.body.message || '失败'}`)
        }
      }

      // 云贝广告任务（听歌得云贝，每日 10 次 × 150 = 1500 云贝）
      if (config.enableYunbeiAdTask) {
        console.log(`[${user.nickname}] 执行云贝广告任务...`)
        try {
          const listRes = await yunbei_task_list_v1({ cookie: user.cookie })
          if (listRes.body.code === 200) {
            const { times = 0, singleAmount = 150 } = listRes.body.data || {}
            const remaining = 10 - times
            if (remaining <= 0) {
              console.log(`[${user.nickname}] 云贝广告任务：今日已完成 ${times} 次`)
              runLogs.push(`☁️ 云贝广告任务: 今日已完成 ${times} 次`)
            } else {
              console.log(`[${user.nickname}] 云贝广告任务：今日已完成 ${times} 次，剩余 ${remaining} 次`)
              let earned = 0
              for (let i = 0; i < remaining; i++) {
                const finishRes = await yunbei_task_finish_v1({ cookie: user.cookie, yunbeiAmount: singleAmount })
                if (finishRes.body.code === 200 && finishRes.body.data) {
                  earned += singleAmount
                  console.log(`[${user.nickname}] 云贝广告任务 第 ${i + 1} 次：+${singleAmount} 云贝`)
                } else {
                  console.log(`[${user.nickname}] 云贝广告任务 第 ${i + 1} 次失败：${finishRes.body.message || finishRes.body.code}`)
                  break
                }
                await sleep(1000)
              }
              runLogs.push(`☁️ 云贝广告任务: 完成 ${remaining} 次，获得 ${earned} 云贝`)
            }
          } else {
            console.log(`[${user.nickname}] 云贝广告任务状态查询失败：${listRes.body.message || listRes.body.code}`)
            runLogs.push(`☁️ 云贝广告任务: 查询失败`)
          }
        } catch (e) {
          console.log(`[${user.nickname}] 云贝广告任务异常：${e.message}`)
          runLogs.push(`☁️ 云贝广告任务: 异常`)
        }
      }

      // 云贝任务完成（所有任务 + todo 任务）
      if (config.enableYunbeiTaskFinish) {
        console.log(`[${user.nickname}] 执行云贝任务完成...`)
        try {
          // 1. 获取所有任务
          const allRes = await yunbei_tasks({ cookie: user.cookie })
          let finishable = []
          if (allRes.body.code === 200) {
            const allTasks = allRes.body.data || []
            // 筛选可领取的任务：已完成但未领取奖励（completed=true, completedPoint=0, userTaskId!=0）
            // 或状态为 100（已完成待领取）
            finishable = allTasks.filter(t =>
              t.userTaskId && t.userTaskId !== 0 &&
              !t.completedPoint &&
              (t.completed || t.status === 100)
            )
            console.log(`[${user.nickname}] 云贝所有任务：${allTasks.length} 个，可领取：${finishable.length} 个`)
          }

          // 2. 获取 todo 任务（可能含额外可完成的）
          const todoRes = await yunbei_tasks_todo({ cookie: user.cookie })
          if (todoRes.body.code === 200) {
            const todos = todoRes.body.data || []
            for (const todo of todos) {
              if (todo.userTaskId && todo.userTaskId !== 0) {
                // 避免重复
                if (!finishable.find(t => t.userTaskId === todo.userTaskId)) {
                  finishable.push({ userTaskId: todo.userTaskId, taskName: todo.taskName, taskPoint: todo.taskPoint, depositCode: todo.depositCode })
                }
              }
            }
          }

          if (finishable.length === 0) {
            console.log(`[${user.nickname}] 云贝任务：无待领取任务`)
            runLogs.push(`☁️ 云贝任务: 无待领取任务`)
          } else {
            let finished = 0
            let earnedPoints = 0
            for (const task of finishable) {
              const finishRes = await yunbei_task_finish({
                cookie: user.cookie,
                userTaskId: task.userTaskId,
                depositCode: task.depositCode || '0'
              })
              if (finishRes.body.code === 200) {
                finished++
                const points = task.taskPoint || 0
                earnedPoints += points
                console.log(`[${user.nickname}] 云贝任务完成：${task.taskName || task.userTaskId} (+${points} 云贝)`)
              } else {
                console.log(`[${user.nickname}] 云贝任务失败：${task.taskName || task.userTaskId} - ${finishRes.body.message || finishRes.body.code}`)
              }
              await sleep(500)
            }
            runLogs.push(`☁️ 云贝任务: 完成 ${finished}/${finishable.length} 个，获得 ${earnedPoints} 云贝`)
          }
        } catch (e) {
          console.log(`[${user.nickname}] 云贝任务异常：${e.message}`)
          runLogs.push(`☁️ 云贝任务: 异常`)
        }
      }
      
      // VIP 音乐任务
      if (config.enableVipMusicTasks) {
        console.log(`[${user.nickname}] 执行 VIP 音乐任务...`)
        runLogs.push(`🎵 VIP 音乐任务：执行中...`)
        await runVipMusicTasks(user.cookie, config.vipMusicPlaylistId, config.vipMusicSongCount, runLogs, config.vipMusicFallbackPlaylistIds, config.enableVipMusicScrobble, config.scrobblePlaylistId, config.scrobbleSongCount)
      }
      
      // VIP 乐签打卡
      if (config.enableVipSign) {
        console.log(`[${user.nickname}] 执行 VIP 乐签打卡...`)
        
        // 获取今日打卡信息
        const signInfo = await vip_sign_info({ cookie: user.cookie })
        const todayRecord = signInfo.body.data?.find(item => item.today && item.recordId > 0)
        
        if (todayRecord) {
          console.log(`[${user.nickname}] ✓ 乐签打卡今日已完成`)
          console.log(`[${user.nickname}]   签到日期：${todayRecord.timeStr}`)
          console.log(`[${user.nickname}]   获得成长值：+${todayRecord.score}`)
          runLogs.push(`🎫 VIP 乐签：已完成 (+${todayRecord.score} 成长值)`)
          if (todayRecord.songCover) {
            runLogs.push(`   签到歌曲：${todayRecord.songId}`)
          }
        } else {
          const vipSignResult = await vip_sign({ cookie: user.cookie })
          if (vipSignResult.body.code === 200) {
            console.log(`[${user.nickname}] ✓ 乐签打卡成功`)
            
            const signInfoAfter = await vip_sign_info({ cookie: user.cookie })
            const todayRecordAfter = signInfoAfter.body.data?.find(item => item.today && item.recordId > 0)
            
            if (todayRecordAfter) {
              console.log(`[${user.nickname}]   签到日期：${todayRecordAfter.timeStr}`)
              console.log(`[${user.nickname}]   获得成长值：+${todayRecordAfter.score}`)
              runLogs.push(`🎫 VIP 乐签：打卡成功 (+${todayRecordAfter.score} 成长值)`)
              if (todayRecordAfter.songCover) {
                runLogs.push(`   签到歌曲：${todayRecordAfter.songName || todayRecordAfter.songId}`)
              }
            } else {
              runLogs.push(`🎫 VIP 乐签：打卡成功`)
            }
          } else if (vipSignResult.body.code === -2) {
            console.log(`[${user.nickname}] ✓ 乐签打卡今日已完成（重复签到提示）`)
            runLogs.push(`🎫 VIP 乐签：已完成`)
          } else {
            console.log(`[${user.nickname}] ✗ 乐签打卡失败:`, vipSignResult.body.message || vipSignResult.body.code)
            runLogs.push(`🎫 VIP 乐签：失败 - ${vipSignResult.body.message || vipSignResult.body.code}`)
          }
        }
        
        // 获取打卡详情（获取最近一次打卡的详细信息）
        const signDetail = await vip_sign_detail({ cookie: user.cookie, timestamp: Date.now() })
        if (signDetail.body.code === 200 && signDetail.body.data) {
          if (signDetail.body.data.records && signDetail.body.data.records.length > 0) {
            const lastSign = signDetail.body.data.records[0]
            console.log(`[${user.nickname}] 📊 最近打卡详情：`)
            console.log(`[${user.nickname}]   日期：${lastSign.timeStr}`)
            console.log(`[${user.nickname}]   歌曲：${lastSign.songName || '未知'}`)
            console.log(`[${user.nickname}]   成长值：+${lastSign.score || 0}`)
            console.log(`[${user.nickname}]   状态：${lastSign.isReceived ? '已领取' : '未领取'}`)
          }
        }
      }
      
      runLogs.push('')
      
      // 获取 VIP 任务列表（新版 /vip/task/v1）
      if (config.showVipTaskList) {
        console.log(`[${user.nickname}] 获取 VIP 任务列表 (/vip/task/v1)...`)
        const vipTasksV1Result = await vip_tasks_v1({ cookie: user.cookie, id: user.id || '' })
        const tasksBody = vipTasksV1Result.body
        if (tasksBody.code === 200 && tasksBody.data) {
          console.log(`[${user.nickname}] = VIP 任务列表 =`)
          const taskList = Array.isArray(tasksBody.data) ? tasksBody.data : (tasksBody.data.missionList || [])
          if (taskList.length > 0) {
            for (const task of taskList) {
              const name = task.name || task.title || task.missionTitle || task.basicMissionDTO?.name || '未知任务'
              const progress = task.progress || task.currentPeriodCompleteNum || 0
              const target = task.target || task.missionTarget || 1
              const reward = task.reward || task.rewardGrowthPoint || task.basicMissionDTO?.rewardGrowthPoint || 0
              const isCompleted = task.isReceived || task.status === 'COMPLETED' || task.missionStatus === 50
              const canReceive = task.canReceive || task.canReceiveGrowthPoint
              console.log(`[${user.nickname}]   ${name}`)
              console.log(`      进度：${progress}/${target} | 奖励：${reward} 成长值 | 状态：${isCompleted ? '✓ 已完成' : '○ 未完成'}${canReceive ? ' [可领取]' : ''}`)
            }
          } else {
            console.log(`[${user.nickname}]   暂无任务数据`)
          }
        } else {
          console.log(`[${user.nickname}] 获取 VIP 任务失败：`, tasksBody.message || tasksBody.code)
        }
      }
      runLogs.push('')
      
      // 领取 VIP 成长值
      if (config.enableVipGrowthpoint) {
        console.log(`[${user.nickname}] 领取 VIP 成长值...`)
        
        // 优先使用一键领取 (xeapi + getall)
        if (vip_growthpoint_getall) {
          console.log(`[${user.nickname}] 使用一键领取 (getall)...`)
          try {
            let growthAllResult
            try {
              growthAllResult = await vip_growthpoint_getall({ cookie: user.cookie })
            } catch (firstErr) {
              // xeapi 密钥可能失效，删除并重新生成后重试一次
              const errMsg = firstErr.message || String(firstErr)
              if (errMsg.includes('xeapi') || errMsg.includes('public key')) {
                console.log(`[${user.nickname}] ⚠️ xeapi 密钥失效，尝试重新生成...`)
                try {
                  if (fs.existsSync(xeapiKeyPath)) fs.unlinkSync(xeapiKeyPath)
                  await generateConfig()
                  console.log(`[${user.nickname}] ✓ xeapi 密钥已重新生成，重试领取...`)
                  growthAllResult = await vip_growthpoint_getall({ cookie: user.cookie })
                } catch (retryErr) {
                  throw retryErr
                }
              } else {
                throw firstErr
              }
            }
            if (growthAllResult.body.code === 200 && growthAllResult.body.data?.result) {
              console.log(`[${user.nickname}] ✓ 一键领取成长值成功`)
              runLogs.push(`💰 一键领取成长值：成功`)
            } else {
              console.log(`[${user.nickname}] ✗ 一键领取成长值失败:`, growthAllResult.body.message || growthAllResult.body.code)
              runLogs.push(`💰 一键领取成长值：失败`)
            }
          } catch (e) {
            console.log(`[${user.nickname}] ✗ 一键领取成长值异常:`, e.message)
            runLogs.push(`💰 一键领取成长值：异常`)
          }
        } else {
          // 降级：使用旧版 weapi 逐任务领取
          const vipTasksResult = await vip_tasks({ cookie: user.cookie })
          if (vipTasksResult.body.code === 200) {
            const needTaskIds = []
            for (const group of vipTasksResult.body.data.taskList) {
              for (const task of group.taskItems) {
                if (task.currentProgress >= task.targetWorth && task.needReceive) {
                  needTaskIds.push(task.taskId)
                }
              }
            }
            
            if (needTaskIds.length > 0) {
              console.log(`[${user.nickname}] 发现 ${needTaskIds.length} 个可领取任务`)
              
              const growthResult = await vip_growthpoint_get({
                cookie: user.cookie,
                ids: needTaskIds.join(',')
              })
              
              if (growthResult.body.code === 200) {
                const total = growthResult.body.data.total || 0
                console.log(`[${user.nickname}] ✓ 领取成长值成功，总计 +${total}`)
                runLogs.push(`💰 领取成长值：+${total}`)
              } else {
                console.log(`[${user.nickname}] ✗ 领取成长值失败:`, growthResult.body.message || growthResult.body.code)
                runLogs.push(`💰 领取成长值：失败`)
              }
            } else {
              console.log(`[${user.nickname}] 暂无可领取的成长值`)
              runLogs.push(`💰 领取成长值：无可领取`)
            }
          }
        }
      }
      
      // 云小编任务（签到、审核、领取会员）
      if (config.enableCloudEditor !== false) {
        await runCloudEditorTasks(user.cookie, user.nickname)
      }
      
      // 自动发布动态
      if (config.enableAutoPost) {
        await autoPostEvent(user.cookie, user.nickname)
      }
      
      console.log(`[${user.nickname}] ✓ 任务完成`)
      runLogs.push(`✅ 任务完成`)
      
    } catch (error) {
      let errorMsg = '未知错误'
      if (error) {
        if (typeof error === 'string') {
          errorMsg = error
        } else if (error.message) {
          errorMsg = error.message
        } else if (error.body?.message) {
          errorMsg = `${error.body.message} (${error.body.code || 'API 错误'})`
        } else {
          try {
            errorMsg = JSON.stringify(error)
          } catch {
            errorMsg = String(error)
          }
        }
      }
      console.error(`[${user.nickname}] ✗ 执行失败：${errorMsg}`)
      runLogs.push(`❌ 执行失败：${errorMsg}`)
      
      // 如果是 Cookie 过期，提示更新
      if (errorMsg.includes('未登录') || errorMsg.includes('301')) {
        console.error(`\n提示：Cookie 已过期，请更新 config.json 中的 MUSIC_U cookie`)
        console.error(`或者设置环境变量：export NETEASE_MUSIC_U="MUSIC_U=你的新 cookie"`)
        runLogs.push(`\n💡 提示：Cookie 已过期，请重新获取并更新配置`)
      }
    }
    
    console.log('-'.repeat(60))
    
    if (user !== config.users[config.users.length - 1]) {
      console.log('等待 5 秒后处理下一个用户...')
      await sleep(5000)
    }
  }
  
  const endTime = new Date()
  const duration = ((endTime - startTime) / 1000).toFixed(1)
  
  console.log('\n' + '='.repeat(60))
  console.log('所有用户任务执行完成!')
  console.log('='.repeat(60))
  
  runLogs.push('')
  runLogs.push(`⏱️ 总耗时：${duration}秒`)
}

// 使用 task-runner 中的公共函数
const { sleep } = taskRunner

// VIP 音乐任务函数
async function runVipMusicTasks(cookie, playlistId, songCount, logs = [], fallbackPlaylistIds = [7785066739, 5453912201], enableScrobble = false, scrobblePlaylistId = 0, scrobbleSongCount = -1) {
  try {
    // 先获取用户信息获取 uid
    const userProfile = await vip_info({ cookie })
    let userId = ''
    if (userProfile.body && userProfile.body.data && userProfile.body.data.userId) {
      userId = userProfile.body.data.userId
    }
    
    // 尝试主歌单和备用歌单
    let currentPlaylistId = playlistId
    let allTracks = []
    let usedFallbackIndex = -1
    
    // 首先尝试主歌单
    console.log(`  获取主歌单 ${playlistId}...`)
    let playlist = await playlist_detail({ id: playlistId })
    
    if (playlist.body.code === 200 && playlist.body.playlist && playlist.body.playlist.tracks) {
      allTracks = playlist.body.playlist.tracks || []
    } else {
      console.log(`  ⚠️ 主歌单 ${playlistId} 获取失败`)
    }
    
    // 如果主歌单无法获取或为空，依次尝试备用歌单
    if (allTracks.length === 0) {
      console.log(`  ⚠️ 主歌单为空或获取失败，尝试备用歌单...`)
      
      for (let i = 0; i < fallbackPlaylistIds.length; i++) {
        const fallbackId = fallbackPlaylistIds[i]
        console.log(`  尝试备用歌单 ${fallbackId}...`)
        playlist = await playlist_detail({ id: fallbackId })
        
        if (playlist.body.code === 200 && playlist.body.playlist && playlist.body.playlist.tracks) {
          allTracks = playlist.body.playlist.tracks || []
          currentPlaylistId = fallbackId
          usedFallbackIndex = i
          if (allTracks.length > 0) {
            console.log(`  ✅ 备用歌单 ${fallbackId} 获取成功，共 ${allTracks.length} 首歌曲`)
            break
          }
        } else {
          console.log(`  ⚠️ 备用歌单 ${fallbackId} 获取失败`)
        }
      }
    }
    
    if (allTracks.length === 0) {
      console.log(`  ✗ 所有歌单都无法获取`)
      logs.push('  ✗ VIP 音乐任务：所有歌单都无法获取')
      return
    }
    
    // 获取所有歌曲 ID（不限制数量）
    const allTrackIds = allTracks.map(t => t.id)
    
    // 收集所有未收藏的歌曲，直到满 songCount 首
    let allUnlikedTracks = []
    let checkedPlaylistIds = [currentPlaylistId]
    
    // 检查已收藏的歌曲，过滤掉已收藏的
    console.log('  检查歌曲收藏状态...')
    try {
      const likedResult = await likelist({ uid: userId, cookie })
      if (likedResult.body.code === 200 && likedResult.body.ids) {
        const likedIds = new Set(likedResult.body.ids)
        allUnlikedTracks = allTracks.filter(t => !likedIds.has(t.id))
      } else {
        allUnlikedTracks = allTracks
      }
    } catch (e) {
      console.log(`  ⚠️ 获取收藏列表失败，处理所有歌曲：${e.message}`)
      allUnlikedTracks = allTracks
    }
    
    // 如果未收藏歌曲不足 songCount，继续从备用歌单收集
    const targetCount = songCount
    let songs = allUnlikedTracks.slice(0, targetCount)
    
    if (allUnlikedTracks.length < targetCount && fallbackPlaylistIds.length > 0) {
      console.log(`  ⚠️ 主歌单未收藏歌曲不足 ${targetCount} 首 (${allUnlikedTracks.length}首)，继续从备用歌单收集...`)
      
      for (const fallbackId of fallbackPlaylistIds) {
        if (songs.length >= targetCount) break
        if (checkedPlaylistIds.includes(fallbackId)) continue
        
        console.log(`  尝试备用歌单 ${fallbackId}...`)
        const fallbackPlaylist = await playlist_detail({ id: fallbackId })
        
        if (fallbackPlaylist.body.code === 200 && fallbackPlaylist.body.playlist && fallbackPlaylist.body.playlist.tracks) {
          checkedPlaylistIds.push(fallbackId)
          const fallbackTracks = fallbackPlaylist.body.playlist.tracks
          const fallbackAllTrackIds = fallbackTracks.map(t => t.id)
          
          try {
            const likedResult = await likelist({ uid: userId, cookie })
            if (likedResult.body.code === 200 && likedResult.body.ids) {
              const likedIds = new Set(likedResult.body.ids)
              const fallbackUnliked = fallbackTracks.filter(t => !likedIds.has(t.id))
              songs = [...songs, ...fallbackUnliked].slice(0, targetCount)
              currentPlaylistId = fallbackId
              console.log(`  ✅ 备用歌单 ${fallbackId} 找到 ${fallbackUnliked.length} 首未收藏歌曲，累计 ${songs.length} 首`)
            }
          } catch (e) {
            console.log(`  ⚠️ 检查歌单 ${fallbackId} 收藏状态失败：${e.message}`)
          }
        } else {
          console.log(`  ⚠️ 备用歌单 ${fallbackId} 获取失败`)
        }
      }
    }
    
    console.log(`🎵 会员雷达歌单 (${currentPlaylistId})，共收集 ${songs.length} 首未收藏歌曲`)
    console.log()
    
    // 如果收集到的歌曲不足 targetCount，继续尝试获取
    if (songs.length < targetCount) {
      console.log(`  ⚠️ 所有歌单加起来也只有 ${songs.length} 首未收藏歌曲，将全部收藏`)
    }
    
    let successCount = 0
    const successTrackIds = []
    
    // 逐首执行收藏
    for (let i = 0; i < songs.length; i++) {
      if (successTrackIds.length >= targetCount) break
      
      const song = songs[i]
      const playTime = Math.floor(song.dt / 1000) + 10
      
      console.log(`  [待收藏 ${successTrackIds.length + 1}/${targetCount}] ${song.name} - ${(song.ar || []).map(a => a.name).join('/')}`)
      console.log('  ' + '-'.repeat(40))
      
      // 1. 收藏歌曲
      console.log('  [1] 收藏歌曲...')
      try {
        const likeResult = await song_like({ cookie, id: song.id, like: true })
        if (likeResult.body.code === 200 || likeResult.body.code === 201) {
          console.log(`    ✓ 收藏成功`)
          successTrackIds.push(song.id)
        } else if (likeResult.body.code === 502) {
          console.log(`    ⊘ 歌曲已收藏，跳过`)
        } else if (likeResult.body.code === 401) {
          console.log(`    ✗ 下架歌曲无法收藏：${likeResult.body.message}`)
        } else {
          console.log(`    ✗ 收藏失败：${likeResult.body.message || '未知错误'}`)
        }
      } catch (e) {
        console.log(`    ✗ 收藏失败：${e.message}`)
      }
      
      // 启用听歌记录时，上传听歌数据（仅当未设置独立打卡歌单时）
      if (enableScrobble && !scrobblePlaylistId && successTrackIds.includes(song.id)) {
        console.log(`  [2] 上传听歌记录 (eapi/weblog)...`)
        try {
          const scrobbleResult = await scrobble({
            cookie,
            id: song.id,
            sourceid: currentPlaylistId,
            time: playTime,
            duration: Math.floor(song.dt / 1000),
          })
          const body = scrobbleResult.body
          if (body.code === 200) {
            console.log(`    ✓ 听歌记录已上报 (${(playTime / 60).toFixed(2)}分钟)`)
          } else {
            console.log(`    ⊘ 听歌记录上报: ${body.msg || body.message || '未知状态'}`)
          }
        } catch (e) {
          console.log(`    ✗ 听歌记录上报失败：${e.message}`)
        }
      }
      
      // 如果不启用听歌记录，在歌曲之间添加 10-15 秒随机延时
      if (!enableScrobble && successTrackIds.length < targetCount && i < songs.length - 1) {
        const delaySeconds = Math.floor(Math.random() * 6) + 10
        console.log(`    ⏱️  等待 ${delaySeconds} 秒后处理下一首...`)
        await sleep(delaySeconds * 1000)
      }
    }
    
    // 检查最终收藏结果
    if (successTrackIds.length < targetCount) {
      if (successTrackIds.length === 0) {
        console.log(`⚠️ 警告：没有成功收藏任何歌曲`)
        logs.push(`🎵 VIP 音乐任务：无成功收藏 (下架/已收藏)`)
      } else {
        console.log(`⚠️ 警告：只成功收藏 ${successTrackIds.length}/${targetCount} 首歌曲`)
        logs.push(`🎵 VIP 音乐任务：成功收藏 ${successTrackIds.length}/${targetCount} 首`)
      }
    } else {
      const scrobbleMsg = enableScrobble ? ' (含听歌记录)' : ''
      console.log(`✅ 成功收藏 ${targetCount} 首歌曲${scrobbleMsg}`)
      logs.push(`🎵 VIP 音乐任务：成功收藏 ${targetCount} 首${scrobbleMsg}`)
    }
    
    // 如果设置了独立打卡歌单，单独进行听歌打卡
    if (enableScrobble && scrobblePlaylistId > 0) {
      console.log(`\n  🎧 开始听歌打卡 (独立歌单: ${scrobblePlaylistId})...`)
      try {
        const scrobbleList = await playlist_detail({ id: scrobblePlaylistId, cookie })
        if (scrobbleList.body.code === 200 && scrobbleList.body.playlist && scrobbleList.body.playlist.tracks) {
          const scrobbleTracks = scrobbleList.body.playlist.tracks
          let scrobbleCount = scrobbleSongCount >= 0 ? scrobbleSongCount : scrobbleTracks.length
          if (scrobbleCount === 0 && scrobbleSongCount >= 0) scrobbleCount = songCount
          const tracksToScrobble = scrobbleTracks.slice(0, scrobbleCount)
          let scrobbleSuccess = 0
          for (let i = 0; i < tracksToScrobble.length; i++) {
            const track = tracksToScrobble[i]
            const playTime = Math.floor(track.dt / 1000) + 10
            console.log(`  [打卡 ${i + 1}/${tracksToScrobble.length}] ${track.name} - ${(track.ar || []).map(a => a.name).join('/')}`)
            try {
              const sr = await scrobble({ cookie, id: track.id, sourceid: scrobblePlaylistId, time: playTime, duration: Math.floor(track.dt / 1000) })
              if (sr.body.code === 200) {
                console.log(`    ✓ 已上报 (${(playTime / 60).toFixed(2)}分钟)`)
                scrobbleSuccess++
              } else {
                console.log(`    ⊘ ${sr.body.msg || sr.body.message || '未知状态'}`)
              }
            } catch (e) {
              console.log(`    ✗ 上报失败：${e.message}`)
            }
          }
          console.log(`  ✓ 听歌打卡完成：${scrobbleSuccess}/${tracksToScrobble.length} 首`)
          logs.push(`🎧 独立打卡 (歌单 ${scrobblePlaylistId})：${scrobbleSuccess}/${tracksToScrobble.length} 首`)
        } else {
          console.log(`  ⚠️ 打卡歌单 ${scrobblePlaylistId} 获取失败`)
        }
      } catch (e) {
        console.log(`  ✗ 独立打卡失败：${e.message}`)
      }
    }

    // 记录收藏的歌曲详情（用于推送通知）
    if (successTrackIds.length > 0) {
      logs.push('')
      logs.push('📋 收藏歌曲列表:')
      songs.forEach((song, index) => {
        if (successTrackIds.includes(song.id)) {
          const songName = `${song.name} - ${(song.ar || []).map(a => a.name).join('/') || '未知歌手'}`
          logs.push(`   ${index + 1}. ${songName}`)
        }
      })
    }
    
    // 2. 收藏完成后延时 5-10 秒
    const finalDelay = Math.floor(Math.random() * 6) + 5
    console.log(`\n  ⏱️  收藏完成，等待 ${finalDelay} 秒后取消收藏...`)
    await sleep(finalDelay * 1000)
    
    // 2. 取消收藏 (使用 like API)
    console.log(`\n  🗑️  开始取消收藏...`)
    
    for (let i = 0; i < successTrackIds.length; i++) {
      const trackId = successTrackIds[i]
      try {
        const unlikeResult = await like({ cookie, id: trackId, like: 'false' })
        
        console.log(`    取消收藏响应：`, JSON.stringify(unlikeResult.body))
        
        if (unlikeResult.body.code === 200) {
          console.log(`    ✓ 取消成功：${trackId}`)
        } else {
          console.log(`    ✗ 取消失败：${trackId} - ${unlikeResult.body.message || '未知错误'}`)
        }
      } catch (e) {
        console.log(`    ✗ 取消异常：${trackId} - ${e.message}`)
      }
      
      if (i < successTrackIds.length - 1) {
        await sleep(500)
      }
    }
    
    console.log('  ✓ VIP 音乐任务完成\n')
    logs.push('🎵 VIP 音乐任务：完成')
  } catch (error) {
    const errorMsg = error ? (error.message || String(error)) : '未知错误'
    console.log(`  ✗ VIP 音乐任务失败：${errorMsg}\n`)
    logs.push(`🎵 VIP 音乐任务：失败 - ${errorMsg}`)
  }
}

// 用户数据管理
function loadUserData() {
  try {
    if (fs.existsSync(dataFilePath)) {
      const data = fs.readFileSync(dataFilePath, 'utf8')
      return JSON.parse(data)
    }
  } catch (e) {
    console.log('[数据] 读取用户数据失败:', e.message)
  }
  return {}
}

function saveUserData(data) {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8')
    return true
  } catch (e) {
    console.log('[数据] 保存用户数据失败:', e.message)
    return false
  }
}

function getTodayString() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

// 自动发布/删除动态
async function autoPostEvent(cookie, nickname) {
  if (!config.enableAutoPost) return

  console.log(`[${nickname}] 执行自动发布动态...`)

  const userData = loadUserData()
  const today = getTodayString()

  // 初始化用户数据
  if (!userData[nickname]) {
    userData[nickname] = {
      lastPostDate: null,
      lastPostId: null,
      lastPostSongId: null,
      lastPostSongName: null,
      lastPostScript: null
    }
  }

  const userRecord = userData[nickname]

  // 检查今天是否已被其他脚本发布（防止 task-runner.js 与 auto_tasks_enhanced.js 冲突）
  if (userRecord.lastPostDate === today && userRecord.lastPostScript && userRecord.lastPostScript !== 'auto_tasks_enhanced') {
    console.log(`  ⊘ 今日已由 ${userRecord.lastPostScript} 发布动态，跳过避免冲突`)
    console.log(`    上次发布：${userRecord.lastPostSongName || '未知歌曲'}`)
    runLogs.push(`📝 自动动态：今日已由${userRecord.lastPostScript}发布，跳过`)
    return
  }

  // 检查今天是否已由本脚本发布（必须在删除操作之前，避免删除今日动态后又跳过发布）
  if (userRecord.lastPostDate === today) {
    console.log(`  ⊘ 今日 (${today}) 已发布动态，跳过`)
    console.log(`    上次发布：${userRecord.lastPostSongName || '未知歌曲'}`)
    saveUserData(userData)
    runLogs.push('📝 自动动态：今日已发布，跳过')
    return
  }

  // 检查是否需要删除上一次的动态（昨日的旧动态）
  if (config.deletePreviousPost && userRecord.lastPostId) {
    console.log(`  发现上次动态 (ID: ${userRecord.lastPostId})，准备删除...`)
    try {
      const delResult = await event_del({
        cookie,
        evId: userRecord.lastPostId
      })

      if (delResult.body.code === 200) {
        console.log(`  ✓ 动态已删除 (${userRecord.lastPostSongName || '未知歌曲'})`)
        userRecord.lastPostId = null
        userRecord.lastPostSongId = null
        userRecord.lastPostSongName = null
      } else {
        console.log(`  ✗ 删除失败：${delResult.body.message || delResult.body.code}`)
      }
    } catch (e) {
      console.log(`  ✗ 删除异常：${e.message}`)
    }

    await sleep(1000)
  }

  // 获取歌单
  try {
    console.log(`  获取歌单 ${config.postPlaylistId}...`)
    const playlist = await playlist_detail({
      cookie,
      id: config.postPlaylistId
    })

    if (playlist.body.code !== 200) {
      console.log(`  ✗ 获取歌单失败`)
      runLogs.push('📝 自动动态：获取歌单失败')
      return
    }

    const playlistData = playlist.body.playlist || playlist.body
    const tracks = playlistData.tracks || []

    if (tracks.length === 0) {
      console.log(`  ✗ 歌单为空`)
      runLogs.push('📝 自动动态：歌单为空')
      return
    }

    // 随机选择歌曲
    const songCount = Math.min(config.postSongCount, tracks.length)
    const selectedSongs = []
    const usedIndexes = new Set()

    while (selectedSongs.length < songCount) {
      const index = Math.floor(Math.random() * tracks.length)
      if (!usedIndexes.has(index)) {
        selectedSongs.push(tracks[index])
        usedIndexes.add(index)
      }
    }

    const song = selectedSongs[0]
    const songId = song.id
    const songName = `${song.name} - ${song.ar?.[0]?.name || '未知歌手'}`

    console.log(`  选择歌曲：${songName}`)

    // 发布动态
    console.log(`  发布动态...`)
    const postResult = await share_resource_safe({
      cookie,
      type: 'song',
      id: songId,
      msg: `今日推荐：${songName} #网易云音乐`
    })

    if (postResult.body.code === 200) {
      const eventId = postResult.body.id || postResult.body.data?.id
      userRecord.lastPostDate = today
      userRecord.lastPostId = String(eventId)
      userRecord.lastPostSongId = String(songId)
      userRecord.lastPostSongName = songName
      userRecord.lastPostScript = 'auto_tasks_enhanced'

      console.log(`  ✓ 动态发布成功`)
      console.log(`    动态 ID: ${userRecord.lastPostId}`)
      console.log(`    歌曲：${songName}`)
      console.log(`    日期：${today}`)

      runLogs.push(`📝 自动动态：发布成功 - ${songName}`)
      saveUserData(userData)
    } else {
      console.log(`  ✗ 发布失败：${postResult.body.message || postResult.body.code}`)
      runLogs.push(`📝 自动动态：发布失败 - ${postResult.body.message || postResult.body.code}`)
    }

    await sleep(1500)
  } catch (e) {
    const errMsg = e.body?.message || e.message || String(e)
    console.log(`  ✗ 发布异常：${errMsg}`)
    runLogs.push(`📝 自动动态：异常 - ${errMsg}`)
  }

  saveUserData(userData)
}

// 云小编任务
async function runCloudEditorTasks(cookie, nickname) {
  console.log(`[${nickname}] 执行云小编任务...`)

  // 1. 云小编签到
  try {
    const signRes = await rep_ugc_user_sign({ cookie })
    if (signRes.body.code === 200) {
      console.log(`  ✓ 云小编签到成功`)
      runLogs.push('☁️ 云小编：签到成功')
    } else {
      console.log(`  ⊘ 云小编签到：${signRes.body.message || signRes.body.code}`)
      runLogs.push(`☁️ 云小编：${signRes.body.message || signRes.body.code}`)
    }
  } catch (e) {
    console.log(`  ✗ 云小编签到异常：${e.message}`)
    runLogs.push(`☁️ 云小编：签到异常 - ${e.message}`)
  }

  await sleep(1000)

  // 2. 获取活动信息
  let activityId = '5001'
  try {
    const actRes = await rep_ugc_activity_get({ cookie })
    if (actRes.body.code === 200 && actRes.body.data?.activityId) {
      activityId = String(actRes.body.data.activityId)
    }
  } catch (e) {}

  // 3. 获取用户详情
  let userPoints = 0
  try {
    const userRes = await rep_ugc_user_get({ cookie })
    if (userRes.body.code === 200) {
      userPoints = userRes.body.data?.availablePoints ?? 0
      console.log(`  ℹ️ 当前积分：${userPoints}`)
    }
  } catch (e) {
    console.log(`  ℹ️ 获取用户详情失败：${e.message}`)
  }

  await sleep(500)

  // 4. 完成审核任务
  if (config.enableCloudEditorTask !== false) {
    const taskTypes = [
      { type: '1', name: '歌曲曲风审核', examType: 'musicalStyleEnter' },
      { type: '2', name: '歌曲语种审核', examType: 'languageEnter' },
      { type: '3', name: '歌曲原唱审核', examType: 'oriSingerEnter' },
      { type: '4', name: '情绪标签审核', examType: 'emotionEnter' }
    ]
    const maxTasks = config.cloudEditorTaskCount || 10

    for (const { type, name, examType } of taskTypes) {
      // 4a. 完成入站考试
      let examPassed = false
      try {
        examPassed = await doExamFlow(cookie, examType, name)
      } catch (e) {
        console.log(`  ℹ️ ${name}：考试异常：${e.message}`)
      }

      if (!examPassed) {
        console.log(`  ⊘ ${name}：未通过入站考试，跳过审核任务`)
        continue
      }

      // 4b. 考试通过，开始审核任务
      let taskCount = 0
      console.log(`  📝 ${name}：开始审核...`)
      while (taskCount < maxTasks) {
        try {
          const detailRes = await thinktank_audit_resource_detail({ cookie, type })
          if (detailRes.body.code !== 200) {
            console.log(`    ⊘ ${name}：${detailRes.body.message || detailRes.body.code}`)
            break
          }

          const taskData = detailRes.body.data
          const taskId = taskData?.taskId
          if (!taskId) {
            console.log(`    ℹ️ ${name}：没有更多任务了（完成 ${taskCount} 个）`)
            break
          }

          // 智能审核：用 smartExamAnswer 判断标签是否正确
          const question = {
            questionContent: taskData.initResult,
            artists: taskData.artists,
            lyric: taskData.lyric,
            resName: taskData.resName
          }
          const answer = await smartExamAnswer(question, examType)
          const judgement = answer === 'A' ? '1' : '2'
          console.log(`    📝 ${name} 第 ${taskCount + 1} 个任务：${taskData.resName} - ${taskData.artists} | 标签"${taskData.initResult}" → ${judgement === '1' ? '同意' : '否决'}`)

          const updateRes = await thinktank_audit_resource_update({
            cookie, type, taskId, judgement
          })

          if (updateRes.body.code === 200) {
            taskCount++
            await sleep(1500)
          } else {
            console.log(`    ✗ 提交失败：${updateRes.body.message || updateRes.body.code}`)
            break
          }
        } catch (e) {
          console.log(`    ✗ ${name}异常：${e.message || e}`)
          break
        }
      }
      if (taskCount > 0) {
        console.log(`  ✓ ${name}：完成 ${taskCount} 个任务`)
      }
      await sleep(500)
    }

    // 5. 领取任务积分
    try {
      const collectRes = await rep_ugc_activity_collect({ cookie, activityId })
      if (collectRes.body.code === 200) {
        console.log(`  ✓ 云小编：领取任务积分成功`)
        runLogs.push('☁️ 云小编：领取任务积分成功')
      } else {
        console.log(`  ⊘ 云小编：领取任务积分：${collectRes.body.message || collectRes.body.code}`)
      }
    } catch (e) {
      console.log(`  ✗ 领取任务积分异常：${e.message}`)
    }

    // 重新获取积分
    try {
      const userRes = await rep_ugc_user_get({ cookie })
      if (userRes.body.code === 200) {
        userPoints = userRes.body.data?.availablePoints ?? 0
        console.log(`  ℹ️ 任务完成后积分：${userPoints}`)
      }
    } catch (e) {}

    await sleep(1000)
  }

  // 6. 领取会员（积分达50可领1日黑胶）
  try {
    const vipRes = await rep_ugc_user_vip({ cookie })
    if (vipRes.body.code === 200) {
      const status = vipRes.body.data?.status
      if (status === 10 || status === 20) {
        const collectRes = await rep_ugc_user_collect_vip({ cookie, activityId: '5001' })
        if (collectRes.body.code === 200) {
          console.log(`  🎉 云小编：成功领取1日黑胶会员！`)
          runLogs.push('☁️ 云小编：领取1日黑胶会员成功')
        } else {
          console.log(`  ✗ 领取会员失败：${collectRes.body.message || collectRes.body.code}`)
          runLogs.push(`☁️ 云小编：领取会员失败`)
        }
      } else if (status === 30) {
        console.log(`  ⊘ 云小编：今日已领取会员，明天再来`)
      } else {
        console.log(`  ⊘ 云小编：积分不足（${userPoints}/50），无法领取会员`)
      }
    }
  } catch (e) {
    console.log(`  ✗ 云小编会员领取异常：${e.message}`)
    runLogs.push(`☁️ 云小编：会员领取异常 - ${e.message}`)
  }

  await sleep(1000)

  // 7. 每日抽奖（消耗200积分，每日最多3次）
  if (config.enableCloudEditorLottery === true) {
    try {
      const remainRes = await middle_play_lottery_remain_chance({ cookie })
      if (remainRes.body.code === 200) {
        const remainChance = typeof remainRes.body.data === 'number' ? remainRes.body.data : (remainRes.body.data?.remainChance || remainRes.body.data?.chance || 0)
        console.log(`  🎰 云小编：今日剩余抽奖次数 ${remainChance}`)
        if (remainChance > 0 && userPoints >= 200) {
          let drawCount = 0
          while (drawCount < remainChance && drawCount < 3) {
            const lotteryRes = await middle_play_do_lottery({ cookie, drawCount: '1' })
            if (lotteryRes.body.code === 200) {
              const prize = lotteryRes.body.data?.prizeName || lotteryRes.body.data?.awardName || '未知'
              console.log(`  🎰 云小编：第 ${drawCount + 1} 次抽奖：${prize}`)
              runLogs.push(`☁️ 云小编：抽奖获得 ${prize}`)
              drawCount++
              await sleep(1000)
            } else {
              console.log(`  ✗ 抽奖失败：${lotteryRes.body.message || lotteryRes.body.code}`)
              break
            }
          }
        } else if (remainChance > 0 && userPoints < 200) {
          console.log(`  ⊘ 云小编：积分不足（${userPoints}/200），无法抽奖`)
        }
      }
    } catch (e) {
      console.log(`  ✗ 云小编抽奖异常：${e.message}`)
    }
  }
}

// 语种检测：根据歌词和歌手名判断歌曲语种
function detectLanguage(lyric, artists) {
  if (!lyric && !artists) return null

  const cleanLyric = (lyric || '')
    .replace(/\[[\d:.\]]+\]/g, '')
    .replace(/\[[^\]]*\]/g, '')
    .trim()

  const count = (re) => (cleanLyric.match(re) || []).length

  const stats = {
    hangul: count(/[\uAC00-\uD7AF]/g),
    hiragana: count(/[\u3040-\u309F]/g),
    katakana: count(/[\u30A0-\u30FF]/g),
    cjk: count(/[\u4E00-\u9FFF]/g),
    cyrillic: count(/[\u0400-\u04FF]/g),
    thai: count(/[\u0E00-\u0E7F]/g),
    latin: count(/[a-zA-Z]/g),
    vietnamese: count(/[ăâđêôơưĂÂĐÊÔƠƯ]/g),
    portuguese: count(/[ãõçâêôáéíóúÃÕÇÂÊÔÁÉÍÓÚ]/g),
    spanish: count(/[ñ¿¡áíúóéÑ]/g),
    french: count(/[éèêàçùûôîœÉÈÊÀÇÙÛÔÎŒ]/g),
    german: count(/[äöüßÄÖÜ]/g),
  }
  const kana = stats.hiragana + stats.katakana

  // 1. 韩文优先
  if (stats.hangul > 5) return '韩语'
  // 2. 日文假名
  if (kana > 5) return '日语'
  // 3. 西里尔文 → 俄语
  if (stats.cyrillic > 5) return '俄语'
  // 4. 泰文
  if (stats.thai > 5) return '泰语'
  // 5. 中文字符占优且无韩日文字 → 华语/粤语
  if (stats.cjk > 10 && stats.cjk > stats.latin) {
    const cantoneseChars = /[\u55ba\u55f0\u54c1\u5605\u5602\u5622\u5566\u5593\u5511\u563f\u54a6\u563e\u5687\u5497\u5491\u549d\u5510\u559a\u563b\u5638]/
    if (cantoneseChars.test(cleanLyric)) return '粤语'
    return '华语'
  }
  // 6. 拉丁字母系细分
  if (stats.latin > 10) {
    if (stats.vietnamese > 3) return '越南语'
    if (stats.portuguese > 3 && stats.spanish < 2) return '葡萄牙语'
    if (stats.spanish > 3) return '西班牙语'
    if (stats.french > 3) return '法语'
    if (stats.german > 2) return '德语'
    return '英语'
  }

  // 7. 歌手名辅助判断
  if (artists) {
    if (/[\uAC00-\uD7AF]/.test(artists)) return '韩语'
    if (/[\u3040-\u309F\u30A0-\u30FF]/.test(artists)) return '日语'
    if (/[\u0400-\u04FF]/.test(artists)) return '俄语'
  }

  return null
}

// LLM 调用（智谱 GLM-4-Flash，带重试）
async function askLLM(prompt) {
  const apiKey = config.llmApiKey
  if (!apiKey) return null

  const maxRetries = 3
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'glm-4-flash',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          max_tokens: 10
        })
      })
      const data = await res.json()
      const content = data?.choices?.[0]?.message?.content?.trim()
      if (content) return content
      if (attempt < maxRetries - 1) {
        console.log(`    ⚠️ LLM 第 ${attempt + 1} 次无响应，重试中...`)
        await sleep(2000)
      }
    } catch (e) {
      console.log(`    ⚠️ LLM 第 ${attempt + 1} 次调用失败：${e.message}`)
      if (attempt < maxRetries - 1) {
        await sleep(2000)
      }
    }
  }
  return null
}

// LLM 判断曲风/情绪标签
async function llmJudgeLabel(question, examType) {
  const { questionContent, artists, lyric, resName } = question
  const cleanLyric = (lyric || '')
    .replace(/\[[\d:.\]]+\]/g, '')
    .replace(/\[[^\]]*\]/g, '')
    .trim()
    .substring(0, 500)

  const taskDesc = examType === 'musicalStyleEnter'
    ? '歌曲风格（曲风）'
    : '情绪标签'

  let labelDefs = ''
  if (examType === 'emotionEnter') {
    labelDefs = `
网易云情绪标签定义（严格依据此标准判断）：
- 愤怒：曲风流派为重型金属、垃圾摇滚，节奏偏快约140-150+BPM，嘶哑人声。说唱/嘻哈不属于愤怒。
- 热血：令人感觉全身血液沸腾、充满力量和勇气。日系动漫/游戏燃曲通常属于热血。节奏感强、激昂的日文歌大概率是热血。
- 惊悚：令人恐惧害怕，适合恐怖片/鬼屋的氛围音乐。
- 抑郁：情绪低落、厌恶活动，曲调惯用小调，表达消极无奈。小调歌曲、异域风情旋律。
- 悲伤：包含悲伤旋律、失恋、爱而不得，引发悲伤情绪。小调、慢板、哀伤歌词。
- 孤独：歌词表达一个人寂寞独处、与社会隔离疏远的状态。
- 治愈：温暖、舒适、给人安慰的感觉。
- 平静：缓慢柔和、轻柔节奏，让人感到宁静放松。
- 清新：干净利落、色彩鲜艳、简单单纯、甜美阳光，"小清新"风格。
- 浪漫：柔和旋律、温暖和声、表达爱情或浪漫情感。
- 抒情：以情感表达为主，旋律优美、情感细腻。
- 爱情歌词表达对爱情的向往或正在经历爱情的感受。
- 搞笑：幽默、滑稽、令人发笑。
- 正能量：积极向上、催人奋进、充满希望。
- 大气：气势恢宏、磅礴大气。
- 苦情：通过遗憾与伤痛的歌词，表达爱情挫折、失落等苦情情绪。
- 洒脱：潇洒自然、不拘束，对感情看开看透、坦白面对。
- 放松：轻松自在、无压力感。

重要提示：
1. 日文歌曲如果节奏快、激昂、有动漫感，大概率是"热血"标签，应判A(正确)
2. 说唱/嘻哈歌曲通常不是"愤怒"，愤怒只限金属/垃圾摇滚
3. 判断时以歌词内容和歌曲整体氛围为准`
  } else if (examType === 'musicalStyleEnter') {
    labelDefs = `
网易云曲风标签定义：
- 嘻哈说唱：注重韵律和节奏，以碎拍和采样为主要制作手段
- 电子：以电子合成器、音乐软件产生的电子声响制作
- 摇滚：以鼓和贝斯强调节奏，嘶哑人声，吉他失真
- 民谣：新民谣，简单旋律与格式，歌词选取民生题材
- 爵士：集体即兴，摇摆律动(Swing)，七和弦基础
- 蓝调：Blues音阶、12-bar-blues和声进行，shuffle律动
- 金属：极激烈鼓点(双踩)、严重失真吉他riff、穿透力人声
- 古典：西方古典音乐，文艺复兴至现代，按时期分类
- 乡村：融合传统民谣、凯尔特、福音、蓝调，曲调流畅简单
- 雷鬼：牙买加流行音乐，融合美国节奏布鲁斯
- 节奏布鲁斯：融合蓝调、爵士、福音，分灵魂乐和放克
- 二次元：与日本动画、漫画、游戏相关，含同人、虚拟歌姬
- 国风：中国传统文化元素的流行音乐
- 中国音乐：中国特色音乐，含民歌、民族器乐、戏曲
- 原声带：影视游戏作品原声音频（非日本动画游戏）`
  }

  const prompt = `你是一位专业的网易云音乐审核员。请判断歌曲的${taskDesc}标签是否正确。
${labelDefs}

歌曲名：${resName}
歌手：${artists}
歌词片段：${cleanLyric}
待审核标签：${questionContent}

请仅回答 A 或 B：
A = 标签正确（该标签确实符合这首歌）
B = 标签错误（该标签不符合这首歌）

回答：`

  const result = await askLLM(prompt)
  if (result && result.startsWith('A')) {
    console.log(`    🤖 LLM 判断${taskDesc}：${questionContent} → A(对)`)
    return 'A'
  } else if (result && result.startsWith('B')) {
    console.log(`    🤖 LLM 判断${taskDesc}：${questionContent} → B(错)`)
    return 'B'
  }
  console.log(`    🤖 LLM 无有效响应（${result}），随机作答`)
  return Math.random() > 0.5 ? 'A' : 'B'
}

// 智能考试答题
async function smartExamAnswer(question, examType) {
  const { questionContent, artists, lyric, resName } = question

  if (examType === 'languageEnter') {
    const detected = detectLanguage(lyric, artists)
    if (detected) {
      const match = detected === questionContent
      console.log(`    🔍 歌词检测语种：${detected}，标签：${questionContent} → ${match ? 'A(对)' : 'B(错)'}`)
      return match ? 'A' : 'B'
    }
    console.log(`    🔍 无法检测语种，随机作答`)
    return Math.random() > 0.5 ? 'A' : 'B'
  }

  if (examType === 'oriSingerEnter') {
    if (artists && questionContent) {
      const normalize = s => s.toLowerCase().replace(/[\s\u00a0]/g, '')
      const a = normalize(artists)
      const q = normalize(questionContent)
      const match = a.includes(q) || q.includes(a)
      console.log(`    🔍 歌手：${artists}，标签原唱：${questionContent} → ${match ? 'A(对)' : 'B(错)'}`)
      return match ? 'A' : 'B'
    }
    return Math.random() > 0.5 ? 'A' : 'B'
  }

  // 曲风/情绪标签使用 LLM 判断
  if (examType === 'musicalStyleEnter' || examType === 'emotionEnter') {
    if (config.llmApiKey) {
      return await llmJudgeLabel(question, examType)
    }
    console.log(`    🔍 未配置 LLM API Key，随机作答`)
    return Math.random() > 0.5 ? 'A' : 'B'
  }

  return Math.random() > 0.5 ? 'A' : 'B'
}

// 入站考试完整流程
async function doExamFlow(cookie, examType, name) {
  const maxRetries = 3 // 最多重考3次

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // 1. 检查考试状态
    const infoRes = await rep_ugc_exam_info_get({ cookie, examType })
    if (infoRes.body.code !== 200) {
      console.log(`  ℹ️ ${name}：考试状态查询失败：${infoRes.body.message || infoRes.body.code}`)
      return false
    }

    const examData = infoRes.body.data
    const process = examData?.process

    // 已通过
    if (examData?.hasPassExamination) {
      console.log(`  ✓ ${name}：已通过入站考试`)
      return true
    }

    // 考试已结束但未通过
    if (process === 'whole_exam_end') {
      if (attempt < maxRetries - 1) {
        console.log(`  📝 ${name}：考试未通过，准备第 ${attempt + 2} 次考试...`)
        // 查看上次结果
        if (examData?.taskId) {
          try {
            const resultRes = await rep_ugc_exam_result_get({ cookie, examType, taskId: examData.taskId })
            if (resultRes.body.code === 200) {
              const r = resultRes.body.data
              console.log(`    ℹ️ 上次结果：正确 ${r?.wrightNum || '?'} 题，正确率 ${r?.wrightRate || '?'}`)
            }
          } catch (e) {}
        }
        // 开始新考试
        const startRes = await rep_ugc_exam_start({ cookie, examType })
        if (startRes.body.code !== 200) {
          console.log(`  ⊘ ${name}：开始考试失败：${startRes.body.message || startRes.body.code}`)
          return false
        }
        const taskId = startRes.body.data?.taskId
        if (!taskId) {
          console.log(`  ⊘ ${name}：未获取到 taskId`)
          return false
        }
        await sleep(500)
        await doExamRound(cookie, examType, taskId, name)
        await sleep(500)
        continue
      } else {
        console.log(`  ⊘ ${name}：考试未通过，已重考 ${maxRetries} 次，请在客户端手动完成`)
        return false
      }
    }

    // 考试进行中或未开始
    let taskId = examData?.taskId
    if (!taskId) {
      // 未开始，启动新考试
      console.log(`  📝 ${name}：开始入站考试...`)
      const startRes = await rep_ugc_exam_start({ cookie, examType })
      if (startRes.body.code !== 200) {
        console.log(`  ⊘ ${name}：开始考试失败：${startRes.body.message || startRes.body.code}`)
        return false
      }
      taskId = startRes.body.data?.taskId
      if (!taskId) {
        console.log(`  ⊘ ${name}：未获取到 taskId`)
        return false
      }
    } else {
      console.log(`  📝 ${name}：入站考试进行中，继续答题...`)
    }

    await sleep(500)
    await doExamRound(cookie, examType, taskId, name)
    await sleep(500)
  }

  // 最终检查
  const finalRes = await rep_ugc_exam_info_get({ cookie, examType })
  if (finalRes.body.code === 200 && finalRes.body.data?.hasPassExamination) {
    console.log(`  ✓ ${name}：入站考试通过`)
    return true
  }
  return false
}

// 一轮考试答题
async function doExamRound(cookie, examType, taskId, name) {
  let answeredCount = 0

  while (true) {
    try {
      const questionRes = await rep_ugc_exam_question_single_get({ cookie, examType, taskId })
      if (questionRes.body.code !== 200) {
        break
      }

      const question = questionRes.body.data
      if (!question?.questionId) {
        break
      }

      // 智能答题
      const answer = await smartExamAnswer(question, examType)
      console.log(`    📝 ${name} 第 ${answeredCount + 1} 题：${answer === 'A' ? '对' : '错'} (${question.resName} - ${question.artists})`)

      const submitRes = await rep_ugc_exam_submit({
        cookie, examType, taskId,
        questionId: question.questionId, answer
      })

      if (submitRes.body.code === 200) {
        const correct = submitRes.body.data?.result
        if (correct === true) {
          console.log(`    ✅ 答对`)
        } else if (correct === false) {
          console.log(`    ❌ 答错：${(submitRes.body.data?.analysis || '').substring(0, 80)}`)
        }
        answeredCount++
        await sleep(800)
      } else {
        break
      }
    } catch (e) {
      break
    }
  }

  if (answeredCount > 0) {
    console.log(`    ℹ️ ${name}：本轮答完 ${answeredCount} 题`)
  }
}

// 收集运行日志
let runLogs = []

// 错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的 Promise 拒绝:', reason)
  runLogs.push(`❌ 未处理错误：${reason}`)
})

// 运行主函数
async function runWithPush() {
  runLogs = []
  
  try {
    await main()
    runLogs.push('✅ 所有任务执行完成')
  } catch (error) {
    const errorMsg = error ? (error.message || String(error)) : '未知错误'
    console.error('主程序错误:', errorMsg)
    runLogs.push(`❌ 执行失败：${errorMsg}`)
  }
  
  // 写入日志文件
  try {
    const logsDir = path.join(__dirname, 'logs')
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true })
    }
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10) // YYYY-MM-DD
    const logPath = path.join(logsDir, `${dateStr}.txt`)
    const content = runLogs.join('\n') + '\n\n执行时间：' + now.toLocaleString('zh-CN') + '\n' + '='.repeat(60) + '\n\n'
    fs.appendFileSync(logPath, content, 'utf8')
    console.log(`日志已写入：${logPath}`)
  } catch (e) {
    console.error(`写入日志文件失败：${e.message}`)
  }

  // 推送通知（发送运行日志）
  const title = '网易云音乐任务执行报告'
  const content = runLogs.join('\n') + '\n\n执行时间：' + new Date().toLocaleString('zh-CN')
  
  await Promise.all([
    sendServerChan(title, content),
    sendPushPlus(title, content)
  ])
}

runWithPush()
