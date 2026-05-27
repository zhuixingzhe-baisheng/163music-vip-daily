/**
 * 网易云音乐自动任务 - 青龙面板版本
 * 
 * 功能:
 * - 云贝签到（安卓端 + PC 端）
 * - VIP 乐签打卡
 * - 领取 VIP 成长值
 * - VIP 音乐任务（收藏 + 听歌 + 取消）
 * - 自动发布/删除动态（每日分享歌曲）
 * 
 * 青龙环境变量:
 * - NetEase_MusicU: MUSIC_U cookie（必填）
 * - NetEase_Nickname: 用户昵称（可选，默认"主账号"）
 * - NetEase_EnableYunbeiSign: 云贝签到 - 安卓端（可选，默认 true）
 * - NetEase_EnableYunbeiSignPC: 云贝签到-PC 端（可选，默认 true）
 * - NetEase_EnableVipSign: VIP 乐签打卡（可选，默认 true）
 * - NetEase_EnableVipGrowthpoint: VIP 成长值领取（可选，默认 true）
 * - NetEase_ShowVipTaskList: 显示 VIP 任务列表（可选，默认 true）
 * - NetEase_EnableVipMusicTasks: VIP 音乐任务（可选，默认 true）
 * - NetEase_VipMusicPlaylistId: 会员雷达歌单 ID（可选，默认 8402996200）
 * - NetEase_VipMusicSongCount: 处理歌曲数量（可选，默认 3）
 * - NetEase_EnableAutoPost: 自动发布动态（可选，默认 true）
 * - NetEase_DeletePreviousPost: 删除上次动态（可选，默认 true）
 * - NetEase_PostPlaylistId: 发布动态歌单 ID（可选，默认 8402996200）
 * - NetEase_PostSongCount: 每次发布歌曲数（可选，默认 1）
 * - NetEase_ServerSendKey: Server 酱推送 SendKey（可选）
 * 
 * 依赖：
 * - @neteasecloudmusicapienhanced/api
 */

const $ = new Env('网易云音乐自动任务')

const {
  yunbei,
  yunbei_sign,
  vip_sign,
  vip_sign_info,
  vip_tasks,
  vip_growthpoint_get,
  musician_tasks,
  vip_info,
  playlist_detail,
  song_like,
  scrobble,
  share_resource,
  event_del
} = require('@neteasecloudmusicapienhanced/api')

// 数据记录文件路径
const fs = require('fs')
const path = require('path')
const dataFilePath = path.join(__dirname, 'user_data.json')

// 从环境变量获取配置
function getConfig(key, defaultValue) {
  const value = process.env[key]
  if (value === undefined || value === '') {
    return defaultValue
  }
  // 布尔值转换
  if (typeof defaultValue === 'boolean') {
    return value.toLowerCase() === 'true' || value === '1'
  }
  // 数字转换
  if (typeof defaultValue === 'number') {
    const num = Number(value)
    return isNaN(num) ? defaultValue : num
  }
  return value
}

// 配置
const config = {
  users: [
    {
      cookie: getConfig('NetEase_MusicU', ''),
      nickname: getConfig('NetEase_Nickname', '主账号')
    }
  ],
  enableYunbeiSign: getConfig('NetEase_EnableYunbeiSign', true),
  enableYunbeiSignPC: getConfig('NetEase_EnableYunbeiSignPC', true),
  enableVipSign: getConfig('NetEase_EnableVipSign', true),
  enableVipGrowthpoint: getConfig('NetEase_EnableVipGrowthpoint', true),
  showVipTaskList: getConfig('NetEase_ShowVipTaskList', true),
  enableVipMusicTasks: getConfig('NetEase_EnableVipMusicTasks', true),
  vipMusicPlaylistId: getConfig('NetEase_VipMusicPlaylistId', 8402996200),
  vipMusicSongCount: getConfig('NetEase_VipMusicSongCount', 3),
  enableAutoPost: getConfig('NetEase_EnableAutoPost', true),
  deletePreviousPost: getConfig('NetEase_DeletePreviousPost', true),
  postPlaylistId: getConfig('NetEase_PostPlaylistId', 8402996200),
  postSongCount: getConfig('NetEase_PostSongCount', 1),
  serverSendKey: getConfig('NetEase_ServerSendKey', '')
}

// 检查必要配置
if (!config.users[0].cookie) {
  console.log('❌ 错误：未设置 MUSIC_U cookie')
  console.log('请在青龙面板添加环境变量：NetEase_MusicU')
  process.exit(1)
}

// 延时函数
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

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

// 主函数
async function main() {
  const logs = []
  
  console.log('='.repeat(60))
  console.log('网易云音乐自动任务 (青龙面板版本)')
  console.log('='.repeat(60))
  
  for (const user of config.users) {
    const userLogs = []
    console.log(`\n>>> 开始处理用户：${user.nickname}`)
    console.log('-'.repeat(60))
    
    try {
      // 检查 VIP 状态
      console.log(`[${user.nickname}] 检查 VIP 状态...`)
      const vipResult = await vip_info({ cookie: user.cookie })
      if (vipResult.body.code === 200) {
        const hasVip = vipResult.body.data.redVipLevel > 0
        const vipStatus = hasVip ? '已开通' : '未开通'
        console.log(`[${user.nickname}] VIP 状态：${vipStatus}`)
        userLogs.push(`VIP 状态：${vipStatus}`)
      }
      
      // 云贝签到（安卓端）
      if (config.enableYunbeiSign) {
        console.log(`[${user.nickname}] 执行云贝签到（安卓端）...`)
        const yunbeiResult = await yunbei({ cookie: user.cookie })
        console.log(`[${user.nickname}] 云贝签到（安卓）结果:`, yunbeiResult.body)
        if (yunbeiResult.body.code === 200) {
          const shells = yunbeiResult.body.data.shells || 0
          userLogs.push(`云贝签到：+${shells} 云贝`)
        }
      }
      
      // 云贝签到（PC 端）
      if (config.enableYunbeiSignPC) {
        console.log(`[${user.nickname}] 执行云贝签到（PC 端）...`)
        const yunbeiSignResult = await yunbei_sign({ cookie: user.cookie })
        console.log(`[${user.nickname}] 云贝签到（PC）结果:`, yunbeiSignResult.body)
        if (yunbeiSignResult.body.code === 200 && !yunbeiSignResult.body.data.sign) {
          userLogs.push(`云贝签到 (PC)：今日已签`)
        }
      }
      
      // VIP 音乐任务
      if (config.enableVipMusicTasks) {
        console.log(`[${user.nickname}] 执行 VIP 音乐任务...`)
        await runVipMusicTasks(user.cookie, config.vipMusicPlaylistId, config.vipMusicSongCount)
      }
      
      // VIP 乐签打卡
      if (config.enableVipSign) {
        console.log(`[${user.nickname}] 执行 VIP 乐签打卡...`)
        
        const signInfo = await vip_sign_info({ cookie: user.cookie })
        const todayRecord = signInfo.body.data?.find(item => item.today && item.recordId > 0)
        
        if (todayRecord) {
          console.log(`[${user.nickname}] ✓ 乐签打卡今日已完成`)
          console.log(`[${user.nickname}]   签到日期：${todayRecord.timeStr}`)
          console.log(`[${user.nickname}]   获得成长值：+${todayRecord.score}`)
          userLogs.push(`VIP 乐签：+3 成长值`)
          if (todayRecord.songCover) {
            console.log(`[${user.nickname}]   签到歌曲：${todayRecord.songId}`)
            console.log(`[${user.nickname}]   歌曲封面：${todayRecord.songCover}`)
          }
        } else {
          const vipSignResult = await vip_sign({ cookie: user.cookie })
          if (vipSignResult.body.code === 200) {
            console.log(`[${user.nickname}] ✓ 乐签打卡成功`)
            userLogs.push(`VIP 乐签：+3 成长值`)
            
            const signInfoAfter = await vip_sign_info({ cookie: user.cookie })
            const todayRecordAfter = signInfoAfter.body.data?.find(item => item.today && item.recordId > 0)
            
            if (todayRecordAfter) {
              console.log(`[${user.nickname}]   签到日期：${todayRecordAfter.timeStr}`)
              console.log(`[${user.nickname}]   获得成长值：+${todayRecordAfter.score}`)
              if (todayRecordAfter.songCover) {
                console.log(`[${user.nickname}]   签到歌曲：${todayRecordAfter.songId}`)
                console.log(`[${user.nickname}]   歌曲封面：${todayRecordAfter.songCover}`)
              }
            } else {
              console.log(`[${user.nickname}]   成长值已到账，歌曲信息稍后更新`)
            }
          } else {
            console.log(`[${user.nickname}] ✗ 乐签打卡失败:`, vipSignResult.body.message || vipSignResult.body.code)
          }
        }
      }
      
      // 获取 VIP 任务列表
      if (config.showVipTaskList) {
        console.log(`[${user.nickname}] 获取 VIP 任务列表...`)
        const vipTasksResult = await vip_tasks({ cookie: user.cookie })
        if (vipTasksResult.body.code === 200) {
          console.log(`[${user.nickname}] = VIP 任务列表 =`)
          for (const group of vipTasksResult.body.data.taskList) {
            for (const task of group.taskItems) {
              const name = task.name || task.description
              if (name) {
                console.log(`[${user.nickname}] ${name} | 进度：${task.currentProgress}/${task.targetWorth} | 成长值：+${task.growthPoint}`)
              }
            }
          }
        }
      }
      
      // 领取 VIP 成长值
      if (config.enableVipGrowthpoint) {
        console.log(`[${user.nickname}] 领取 VIP 成长值...`)
        
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
            } else {
              console.log(`[${user.nickname}] ✗ 领取成长值失败:`, growthResult.body.message || growthResult.body.code)
            }
          } else {
            console.log(`[${user.nickname}] 暂无可领取的成长值`)
          }
        }
      }
      
      // 自动发布动态
      if (config.enableAutoPost) {
        await autoPostEvent(user.cookie, user.nickname)
      }
      
      console.log(`[${user.nickname}] ✓ 任务完成`)
      logs.push(`${user.nickname}: ${userLogs.join(' | ')}`)
      
    } catch (error) {
      console.error(`[${user.nickname}] ✗ 执行失败:`, error.message)
      logs.push(`${user.nickname}: 执行失败 - ${error.message}`)
    }
    
    console.log('-'.repeat(60))
    
    if (user !== config.users[config.users.length - 1]) {
      console.log('等待 5 秒后处理下一个用户...')
      await sleep(5000)
    }
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('所有用户任务执行完成!')
  console.log('='.repeat(60))
  
  // 发送 Server 酱推送
  if (config.serverSendKey && logs.length > 0) {
    const title = '网易云音乐任务完成'
    const content = logs.join('\n\n')
    await sendServerChan(title, content)
  }
}

// VIP 音乐任务函数
async function runVipMusicTasks(cookie, playlistId, songCount) {
  try {
    const playlist = await playlist_detail({ id: playlistId })
    if (playlist.body.code !== 200) {
      console.log(`  ✗ 获取歌单失败`)
      return
    }
    
    const tracks = playlist.body.playlist.tracks || []
    if (tracks.length === 0) {
      console.log(`  ✗ 歌单为空`)
      return
    }
    
    const songs = tracks.slice(0, songCount).map(t => ({
      id: t.id,
      name: t.name,
      artists: t.ar.map(a => a.name).join(','),
      dt: t.dt
    }))
    
    console.log(`  准备处理 ${songs.length} 首歌曲:`)
    songs.forEach((song, i) => {
      const duration = (song.dt / 1000 / 60).toFixed(2)
      console.log(`    ${i + 1}. ${song.name} - ${song.artists} (${duration}分钟)`)
    })
    console.log()
    
    // 逐首执行：收藏→播放→等待→取消收藏
    for (let i = 0; i < songs.length; i++) {
      const song = songs[i]
      console.log(`  [歌曲 ${i + 1}/${songs.length}] ${song.name} - ${song.artists}`)
      console.log('  ' + '-'.repeat(40))
      
      // 1. 收藏歌曲
      console.log('  [1] 收藏歌曲...')
      try {
        const likeResult = await song_like({ cookie, id: song.id, like: true })
        if (likeResult.body.code === 200 || likeResult.body.code === 201) {
          console.log(`    ✓ 收藏成功`)
        }
      } catch (e) {
        console.log(`    ✗ 收藏失败：${e.message}`)
      }
      
      await sleep(1000)
      
      // 2. 上传听歌记录
      console.log('  [2] 上传听歌记录...')
      try {
        const playTime = Math.floor(song.dt / 1000)
        const scrobbleResult = await scrobble({
          cookie,
          id: song.id,
          sourceid: playlistId,
          time: playTime
        })
        if (scrobbleResult.body.code === 200) {
          const timeStr = (playTime / 60).toFixed(2)
          console.log(`    ✓ 听歌记录已上传 (${timeStr}分钟)`)
        }
      } catch (e) {
        console.log(`    ✗ 上传失败：${e.message}`)
      }
      
      await sleep(1000)
      
      // 3. 等待 30-60 秒（随机）
      const waitTime = Math.floor(Math.random() * 30000) + 30000
      console.log(`  [3] 等待 ${Math.floor(waitTime / 1000)} 秒...`)
      await sleep(waitTime)
      
      // 4. 取消收藏
      console.log('  [4] 取消收藏...')
      try {
        const unlikeResult = await song_like({ 
          cookie, 
          id: song.id, 
          like: false
        })
        if (unlikeResult.body.code === 200) {
          console.log(`    ✓ 取消收藏成功`)
        } else {
          console.log(`    ✗ 取消收藏失败 (code: ${unlikeResult.body.code})`)
        }
      } catch (e) {
        console.log(`    ✗ 取消收藏失败：${e.message}`)
      }
      
      console.log()
      await sleep(1000)
    }
    
    // 检查并领取成长值
    console.log('  [5] 检查并领取成长值...')
    const tasks = await vip_tasks({ cookie })
    if (tasks.body.code === 200) {
      const likeTask = tasks.body.data.taskList
        .flatMap(g => g.taskItems)
        .find(t => (t.name || t.description || '').includes('收藏'))
      
      if (likeTask && likeTask.currentProgress >= likeTask.targetWorth && likeTask.needReceive) {
        const rewardResult = await vip_growthpoint_get({
          cookie,
          ids: likeTask.taskId
        })
        if (rewardResult.body.code === 200 && rewardResult.body.data) {
          console.log(`    ✓ 领取成功 +${likeTask.growthPoint}`)
        }
      } else {
        console.log(`    ⊘ 无成长值可领取`)
      }
    }
    
    console.log('  ✓ VIP 音乐任务完成\n')
  } catch (error) {
    console.log(`  ✗ VIP 音乐任务失败：${error.message}\n`)
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
      return
    }

    const playlistData = playlist.body.playlist || playlist.body
    const tracks = playlistData.tracks || []

    if (tracks.length === 0) {
      console.log(`  ✗ 歌单为空`)
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

      saveUserData(userData)
    } else {
      console.log(`  ✗ 发布失败：${postResult.body.message || postResult.body.code}`)
    }

    await sleep(1500)
  } catch (e) {
    console.log(`  ✗ 发布异常：${e.message}`)
  }

  saveUserData(userData)
}

// 错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的 Promise 拒绝:', reason)
})

// 运行主函数
main()
  .catch(error => {
    console.error('主程序错误:', error)
    process.exit(1)
  })
  .finally(() => {
    $.done()
  })

/**
 * 青龙 Env 函数
 */
function Env(name, opts) {
  class Http {
    constructor(env) {
      this.env = env
    }

    send(opts, method = 'GET') {
      opts = typeof opts === 'string' ? { url: opts } : opts
      let sender = this.get
      if (method === 'POST') {
        sender = this.post
      }
      return sender.call(this, opts)
    }

    get(opts) {
      return this.send.call(this.env, opts)
    }

    post(opts) {
      return this.send.call(this.env, opts)
    }
  }

  return new (class {
    constructor(name, opts) {
      this.name = name
      this.http = new Http(this)
      this.data = null
      this.dataFile = 'box.dat'
      this.logs = []
      this.isMute = false
      this.isNeedRewrite = false
      this.logSeparator = '\n'
      this.encoding = 'utf-8'
      this.startTime = new Date().getTime()
      Object.assign(this, opts)
      this.log('', `🔔${this.name}, 开始!`)
    }

    isNode() {
      return true
    }

    isQuanX() {
      return false
    }

    isSurge() {
      return false
    }

    isJavaScript() {
      return false
    }

    loaddata() {
      return {}
    }

    writedata() {
      return {}
    }

    lodash_get(source, path, defaultValue = undefined) {
      const paths = path.replace(/\[(\d+)\]/g, '.$1').split('.')
      let result = source
      for (const p of paths) {
        result = Object.prototype.hasOwnProperty.call(result, p) ? result[p] : defaultValue
        if (result === undefined) break
      }
      return result
    }

    log(...logs) {
      if (logs.length > 0) {
        this.logs = [...this.logs, ...logs]
      }
      console.log(logs.join(this.logSeparator))
    }

    logErr(err, msg) {
      const isPrintSack = true
      if (!isPrintSack) {
        this.log('', `❗️${this.name}, 错误!`, err, msg)
      } else {
        this.log('', `❗️${this.name}, 错误!`, msg)
      }
    }

    wait(time) {
      return new Promise(resolve => setTimeout(resolve, time))
    }

    done(opts = {}) {
      const costs = new Date().getTime() - this.startTime
      this.log('', `🔔${this.name}, 结束! 🕛 ${costs} ms`)
    }
  })(name, opts)
}
