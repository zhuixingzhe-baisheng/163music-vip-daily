/**
 * 网易云自动任务脚本 - 使用 API Enhanced
 * 
 * 功能:
 * - 云贝签到
 * - VIP 乐签打卡
 * - 领取 VIP 成长值
 * - VIP 音乐任务 (收藏 + 听歌 + 取消)
 */

const {
  yunbei,
  vip_sign,
  vip_sign_info,
  vip_tasks,
  vip_growthpoint_get,
  musician_tasks,
  vip_info,
  playlist_detail,
  song_like,
  scrobble
} = require('@neteasecloudmusicapienhanced/api')

// 配置
const config = {
  users: [
    {
      // 用户配置（支持多用户）
      cookie: 'MUSIC_U=00B09401045DAC703C4FE7538EF65F899CED5B93296BED2A26BD6407CF9932894E933592CCB2443B23DEFFB0DCD7B1AF87D9AFB93BB3ABA0D227426BAFD810BCBE3B7B9490BE83A67C38523C5619BBB3A21CEF949BD183339D052C82AF07FD5DF80939CD87FA9AAD964390450AD4244A86FBA8B5B04CEBE9128794D72B339BF69A8B4A1C04ED88ECC093A53282BD30A15EB2E600822D24A3CEEEED86F241C8B2C9775ABABDC0AC29C1E1BF37907B0FD947FE6CB2928A2E8BAEE327ACF02F6A108D2AC7AC26A55539A721ACC9BF562A5912F70529A3BC68BFE253AFB10E315B1A42175282C0AF81B2443006872E05C9FFAFABC52A700F9E7F11E1F2506EDE457A337232C67B8632E7B7D8B2C2DEE6D873B60EEDD16DA8B99D601C0D06356DC0402B06DF36A49C477176DAC6B6A267D379F480312DC65FAB7F5A642D77F7A21C20C59B6C800E208083C5A9880FA3D79C252FAD8BB9D33EE43A5695D01556D9F103E64EFF55C232928AD69D4116F7A1441E9596ABCCC852ED6C25DADDEA3425F9615F12FA50EE583020A93743C41C8E83BF6242FEDAD4EB605B16384CD85DB4CD1DB1',
      nickname: '主账号'
    }
  ],
  // 功能开关
  enableYunbeiSign: true,
  enableVipSign: true,
  enableVipGrowthpoint: true,
  showVipTaskList: true,
  
  // VIP 音乐任务
  enableVipMusicTasks: true,  // 是否启用 VIP 音乐任务 (收藏 + 听歌 + 取消)
  vipMusicPlaylistId: 8402996200,  // 会员雷达歌单 ID
  vipMusicSongCount: 3  // 处理的歌曲数量
}

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
      
      // 云贝签到
      if (config.enableYunbeiSign) {
        console.log(`[${user.nickname}] 执行云贝签到...`)
        const yunbeiResult = await yunbei({ cookie: user.cookie })
        console.log(`[${user.nickname}] 云贝签到结果:`, yunbeiResult.body)
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
        const todayRecord = signInfo.body.data?.find(item => item.today && item.score > 0)
        
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
            const todayRecordAfter = signInfoAfter.body.data?.find(item => item.today && item.score > 0)
            
            if (todayRecordAfter) {
              console.log(`[${user.nickname}]   签到日期：${todayRecordAfter.timeStr}`)
              console.log(`[${user.nickname}]   获得成长值：+${todayRecordAfter.score}`)
              if (todayRecordAfter.songCover) {
                console.log(`[${user.nickname}]   签到歌曲：${todayRecordAfter.songId}`)
                console.log(`[${user.nickname}]   歌曲封面：${todayRecordAfter.songCover}`)
              }
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
    
    // 1. 收藏歌曲
    console.log('  [1] 收藏歌曲...')
    for (const song of songs) {
      try {
        const result = await song_like({ cookie, id: song.id, like: true })
        if (result.body.code === 200 || result.body.code === 201) {
          console.log(`    ✓ ${song.name}`)
        }
        await sleep(1000)
      } catch (e) {
        console.log(`    ✗ ${song.name}: ${e.message}`)
      }
    }
    
    // 2. 上传听歌记录
    console.log('  [2] 上传听歌记录...')
    for (const song of songs) {
      try {
        const playTime = Math.floor(song.dt / 1000)
        const result = await scrobble({
          cookie,
          id: song.id,
          sourceid: playlistId,
          time: playTime
        })
        if (result.body.code === 200) {
          const timeStr = (playTime / 60).toFixed(2)
          console.log(`    ✓ ${song.name} (${timeStr}分钟)`)
        }
        await sleep(1500)
      } catch (e) {
        console.log(`    ✗ ${song.name}: ${e.message}`)
      }
    }
    
    // 3. 检查并领取成长值
    console.log('  [3] 领取成长值...')
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
    
    // 4. 取消收藏
    console.log('  [4] 取消收藏...')
    for (const song of songs) {
      try {
        const result = await song_like({ cookie, id: song.id, like: false })
        if (result.body.code === 200) {
          console.log(`    ✓ ${song.name}`)
        }
        await sleep(1000)
      } catch (e) {
        console.log(`    ✗ ${song.name}: ${e.message}`)
      }
    }
    
    console.log('  ✓ VIP 音乐任务完成\n')
  } catch (error) {
    console.log(`  ✗ VIP 音乐任务失败：${error.message}\n`)
  }
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
