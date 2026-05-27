/**
 * 网易云自动任务脚本 - 使用 API Enhanced
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

// 加载配置文件
const configPath = path.join(__dirname, 'config.json')
let config

if (fs.existsSync(configPath)) {
  const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'))
  config = {
    users: configData.users || [],
    enableYunbeiSign: configData.enableYunbeiSign !== false,
    enableYunbeiSignPC: configData.enableYunbeiSignPC !== false,
    enableVipSign: configData.enableVipSign !== false,
    enableVipGrowthpoint: configData.enableVipGrowthpoint !== false,
    showVipTaskList: configData.showVipTaskList !== false,
    enableVipMusicTasks: configData.enableVipMusicTasks !== false,
    vipMusicPlaylistId: configData.vipMusicPlaylistId || 8402996200,
    vipMusicSongCount: configData.vipMusicSongCount || 3,
    enableAutoPost: configData.enableAutoPost !== false,
    deletePreviousPost: configData.deletePreviousPost !== false,
    postPlaylistId: configData.postPlaylistId || 8402996200,
    postSongCount: configData.postSongCount || 1
  }
} else {
  console.error('错误：未找到 config.json 配置文件')
  console.error('请复制 config_example.json 为 config.json 并配置你的 MUSIC_U cookie')
  console.error('示例：cp config_example.json config.json')
  process.exit(1)
}

// 数据记录文件路径
const dataFilePath = path.join(__dirname, 'user_data.json')

// 主函数
async function main() {
  console.log('='.repeat(60))
  console.log('网易云音乐自动任务 (API Enhanced 版本)')
  console.log('='.repeat(60))
  
  for (const user of config.users) {
    console.log(`\n>>> 开始处理用户：${user.nickname}`)
    console.log('-'.repeat(60))
    
    try {
      // 检查 VIP 状态
      console.log(`[${user.nickname}] 检查 VIP 状态...`)
      const vipResult = await vip_info({ cookie: user.cookie })
      if (vipResult.body.code === 200) {
        const hasVip = vipResult.body.data.redVipLevel > 0
        console.log(`[${user.nickname}] VIP 状态：${hasVip ? '已开通' : '未开通'}`)
      }
      
      // 云贝签到（安卓端）
      if (config.enableYunbeiSign) {
        console.log(`[${user.nickname}] 执行云贝签到（安卓端）...`)
        const yunbeiResult = await yunbei({ cookie: user.cookie })
        console.log(`[${user.nickname}] 云贝签到（安卓）结果:`, yunbeiResult.body)
      }
      
      // 云贝签到（PC 端）
      if (config.enableYunbeiSignPC) {
        console.log(`[${user.nickname}] 执行云贝签到（PC 端）...`)
        const yunbeiSignResult = await yunbei_sign({ cookie: user.cookie })
        console.log(`[${user.nickname}] 云贝签到（PC）结果:`, yunbeiSignResult.body)
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
          if (todayRecord.songCover) {
            console.log(`[${user.nickname}]   签到歌曲：${todayRecord.songId}`)
            console.log(`[${user.nickname}]   歌曲封面：${todayRecord.songCover}`)
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
      
    } catch (error) {
      console.error(`[${user.nickname}] ✗ 执行失败:`, error.message)
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
}

// 延时函数
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// VIP 音乐任务函数
async function runVipMusicTasks(cookie, playlistId, songCount) {
  try {
    // 先获取用户信息获取 uid
    const userProfile = await vip_info({ cookie })
    let userId = ''
    if (userProfile.body && userProfile.body.data && userProfile.body.data.userId) {
      userId = userProfile.body.data.userId
    }
    
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
main().catch(error => {
  console.error('主程序错误:', error)
  process.exit(1)
})
