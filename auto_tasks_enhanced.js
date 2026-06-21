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

const {
  vip_info,
  vip_sign_info,
  vip_sign,
  vip_sign_detail,
  yunbei,
  yunbei_sign,
  vip_tasks,
  vip_growthpoint_get,
  vip_growthpoint_getall,
  event_del,
  share_resource,
  playlist_detail,
  song_like,
  like,
  scrobble,
  likelist
} = require('@neteasecloudmusicapienhanced/api')

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
    enableVipSign: true,
    enableVipGrowthpoint: true,
    showVipTaskList: true,
    enableVipMusicTasks: true,
    vipMusicPlaylistId: 8402996200,
    vipMusicSongCount: 4,
    enableVipMusicScrobble: false,
    enableAutoPost: true,
    deletePreviousPost: true,
    postPlaylistId: 8402996200,
    postSongCount: 1,
    serverSendKey: serverSendKey || '',
    pushPlusToken: pushPlusToken || '',
    pushPlusChannel: pushPlusChannel,
    pushPlusWebhook: pushPlusWebhook
  }
}

// 尝试从环境变量加载配置
config = loadConfigFromEnv()

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
      enableVipSign: configData.enableVipSign !== false,
      enableVipGrowthpoint: configData.enableVipGrowthpoint !== false,
      showVipTaskList: configData.showVipTaskList !== false,
      enableVipMusicTasks: configData.enableVipMusicTasks !== false,
      vipMusicPlaylistId: configData.vipMusicPlaylistId || 8402996200,
      vipMusicFallbackPlaylistIds: configData.vipMusicFallbackPlaylistIds || [7785066739, 5453912201],
      vipMusicSongCount: configData.vipMusicSongCount || 4,
      enableVipMusicScrobble: configData.enableVipMusicScrobble !== undefined ? configData.enableVipMusicScrobble : false,
      enableAutoPost: configData.enableAutoPost !== false,
      deletePreviousPost: configData.deletePreviousPost !== false,
      postPlaylistId: configData.postPlaylistId || 8402996200,
      postSongCount: configData.postSongCount || 1,
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
      const vipResult = await vip_info({ cookie: user.cookie })
      if (vipResult.body.code === 200) {
        const hasVip = vipResult.body.data.redVipLevel > 0
        const vipStatus = hasVip ? '已开通' : '未开通'
        console.log(`[${user.nickname}] VIP 状态：${vipStatus}`)
        runLogs.push(`VIP 状态：${vipStatus}`)
      } else if (vipResult.body.code === 301) {
        const errorMsg = `用户未登录 (Cookie 已过期)`
        console.error(`[${user.nickname}] ✗ ${errorMsg}`)
        runLogs.push(`❌ ${errorMsg}`)
        runLogs.push(`提示：请更新 config.json 或环境变量中的 MUSIC_U cookie`)
        throw new Error(errorMsg)
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
      
      // VIP 音乐任务
      if (config.enableVipMusicTasks) {
        console.log(`[${user.nickname}] 执行 VIP 音乐任务...`)
        runLogs.push(`🎵 VIP 音乐任务：执行中...`)
        await runVipMusicTasks(user.cookie, config.vipMusicPlaylistId, config.vipMusicSongCount, runLogs, config.vipMusicFallbackPlaylistIds, config.enableVipMusicScrobble)
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
        const vipTasksV1Result = await taskRunner.getVipTasksV1(user.cookie, user.id || '')
        if (vipTasksV1Result.code === 200 && vipTasksV1Result.data) {
          console.log(`[${user.nickname}] = VIP 任务列表 =`)
          const taskList = Array.isArray(vipTasksV1Result.data) ? vipTasksV1Result.data : (vipTasksV1Result.data.missionList || [])
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
          console.log(`[${user.nickname}] 获取 VIP 任务失败：`, vipTasksV1Result.message || vipTasksV1Result.code)
        }
      }
      runLogs.push('')
      
      // 领取 VIP 成长值
      if (config.enableVipGrowthpoint) {
        console.log(`[${user.nickname}] 领取 VIP 成长值...`)
        
        // 优先使用一键领取 (xeapi + getall)
        if (vip_growthpoint_getall) {
          console.log(`[${user.nickname}] 使用一键领取 (getall)...`)
          const growthAllResult = await vip_growthpoint_getall({ cookie: user.cookie })
          if (growthAllResult.body.code === 200 && growthAllResult.body.data?.result) {
            console.log(`[${user.nickname}] ✓ 一键领取成长值成功`)
            runLogs.push(`💰 一键领取成长值：成功`)
          } else {
            console.log(`[${user.nickname}] ✗ 一键领取成长值失败:`, growthAllResult.body.message || growthAllResult.body.code)
            runLogs.push(`💰 一键领取成长值：失败`)
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
const { sleep, playStateSubmit } = taskRunner

// VIP 音乐任务函数
async function runVipMusicTasks(cookie, playlistId, songCount, logs = [], fallbackPlaylistIds = [7785066739, 5453912201], enableScrobble = false) {
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
      const playTime = Math.floor(song.dt / 1000)
      
      console.log(`  [待收藏 ${successTrackIds.length + 1}/${targetCount}] ${song.name} - ${song.artists}`)
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
      console.log(`✅ 成功收藏 ${targetCount} 首歌曲`)
      logs.push(`🎵 VIP 音乐任务：成功收藏 ${targetCount} 首`)
    }
    
    // 记录收藏的歌曲详情（用于推送通知）
    if (successTrackIds.length > 0) {
      logs.push('')
      logs.push('📋 收藏歌曲列表:')
      songs.forEach((song, index) => {
        if (successTrackIds.includes(song.id)) {
          const songName = `${song.name} - ${song.artists || '未知歌手'}`
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
      lastPostSongName: null
    }
  }

  const userRecord = userData[nickname]

  // 检查是否需要删除上一次的动态
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

  // 检查今天是否已发布
  if (userRecord.lastPostDate === today) {
    console.log(`  ⊘ 今日 (${today}) 已发布动态，跳过`)
    console.log(`    上次发布：${userRecord.lastPostSongName || '未知歌曲'}`)
    saveUserData(userData)
    runLogs.push('📝 自动动态：今日已发布，跳过')
    return
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
    const postResult = await share_resource({
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
    console.log(`  ✗ 发布异常：${e.message}`)
    runLogs.push(`📝 自动动态：异常 - ${e.message}`)
  }

  saveUserData(userData)
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
  
  // 推送通知（发送运行日志）
  const title = '网易云音乐任务执行报告'
  const content = runLogs.join('\n') + '\n\n执行时间：' + new Date().toLocaleString('zh-CN')
  
  await Promise.all([
    sendServerChan(title, content),
    sendPushPlus(title, content)
  ])
}

runWithPush()
