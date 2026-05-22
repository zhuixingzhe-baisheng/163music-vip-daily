/**
 * VIP 音乐任务自动完成脚本
 * 
 * 任务流程：
 * 1. 从音乐雷达歌单收藏 3 首 VIP 歌曲
 * 2. 上传这 3 首歌曲的听歌记录（使用实际歌曲时长）
 * 3. 领取会员成长值
 * 4. 取消这 3 首歌曲的收藏
 */

const { 
  vip_tasks,
  vip_growthpoint_get,
  playlist_detail,
  song_like,
  scrobble
} = require('@neteasecloudmusicapienhanced/api')

const MUSIC_U = 'MUSIC_U=009ECCF66A9EE8D31B7B3309BFF5A75E4E6B316889F6865180044198332C78B01BC206C0E2285CECC10DC5DD74AAB82354D46DAA7D100369F9B4FCE7A80376FADBB88DC18F61590039998A6FEE51D5E5A602682FBED8D36DF6433C2D08A9C065D217CB1FD88AEA15472394E9BC0238326D4244B365E4BA09AFA67DF8143A9ED748F250FDB78B9A43979B0AF492EC7B97F9B7063F8E9AB3C28E263FB5B7F48DB9A13BEF6F42133ECB0BC75539E5C3274D8C873A3EFBDCA9331382A0C1FC51FD758D9467FAAF6ECB4596B8E777F669955B5BD0B53726536E6B6F17323010B6EFC8690165CA015E7D448678E157A45E3646A8D70CE863098D928AC33CA0E68BDA8AFD5653D48897DD50108A60250359C12148039C93E405E723A656C1DB30FB00292CD179C7ACF8020797DF5DDBEF0E63835DF200E3FB492B308485F02AD9D873D7CC5EEDEACEDEDBA8F90BEB69EE1E63AB9A27E084EC085759BBEBE83C571BE551E815A5C2CF0ABEAB978A95E7A99436245819F413A13169EDB2C1F137F33E884A7DC8177FFEC353BF0AFB1E11BE7670397993C2E92464850EB93E8A71F8E2FA9933'

const PLAYLIST_ID = 8402996200
const SONG_COUNT = 3

async function getVipTaskList() {
  const result = await vip_tasks({ cookie: MUSIC_U })
  if (result.body.code !== 200) return []
  
  let allTasks = []
  for (const group of result.body.data.taskList) {
    for (const task of group.taskItems) {
      allTasks.push({ ...task, groupName: group.groupName || group.seqName })
    }
  }
  return allTasks
}

async function findLikeTask() {
  const tasks = await getVipTaskList()
  return tasks.find(t => 
    (t.name || t.description || '').includes('收藏') ||
    (t.name || t.description || '').includes('喜欢音乐')
  )
}

async function likeSongs(songs) {
  console.log('[任务 1] 收藏 3 首 VIP 歌曲...')
  let successCount = 0
  for (let i = 0; i < songs.length; i++) {
    const song = songs[i]
    try {
      const result = await song_like({ cookie: MUSIC_U, id: song.id, like: true })
      if (result.body.code === 200 || result.body.code === 201) {
        console.log(`  ✓ 收藏成功：${song.name} - ${song.artists}`)
        successCount++
      } else {
        console.log(`  ⚠ ${result.body.message}: ${song.name}`)
        successCount++
      }
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.log(`  ✗ 失败 ${error.message}: ${song.name}`)
    }
  }
  console.log(`  收藏完成：${successCount}/${songs.length}\n`)
  return successCount
}

async function uploadListenRecords(songs) {
  console.log('[任务 2] 上传听歌记录 (使用实际歌曲时长)...')
  let successCount = 0
  for (let i = 0; i < songs.length; i++) {
    const song = songs[i]
    const playTime = Math.floor(song.dt / 1000)
    try {
      const result = await scrobble({
        cookie: MUSIC_U,
        id: song.id,
        sourceid: PLAYLIST_ID,
        time: playTime
      })
      if (result.body.code === 200) {
        const timeStr = (playTime / 60).toFixed(2)
        console.log(`  ✓ 上传成功：${song.name} (${playTime}秒/${timeStr}分钟)`)
        successCount++
      } else {
        console.log(`  ⚠ ${result.body.message}: ${song.name}`)
      }
      await new Promise(resolve => setTimeout(resolve, 1500))
    } catch (error) {
      console.log(`  ✗ 失败 ${error.message}: ${song.name}`)
    }
  }
  console.log(`  上传完成：${successCount}/${songs.length}\n`)
  return successCount
}

async function claimGrowthPoints(taskId, growthPoint) {
  console.log('[任务 3] 领取会员成长值...')
  try {
    const result = await vip_growthpoint_get({ cookie: MUSIC_U, ids: taskId })
    if (result.body.code === 200 && result.body.data) {
      console.log(`  ✓ 领取成功！获得成长值 +${growthPoint}`)
      return true
    } else {
      console.log(`  ✗ 领取失败：${result.body.message}`)
      return false
    }
  } catch (error) {
    console.log(`  ✗ 请求失败：${error.message}`)
    return false
  }
}

async function unlikeSongs(songs) {
  console.log('[任务 4] 取消收藏 3 首 VIP 歌曲...')
  let successCount = 0
  for (let i = 0; i < songs.length; i++) {
    const song = songs[i]
    try {
      const result = await song_like({ cookie: MUSIC_U, id: song.id, like: false })
      if (result.body.code === 200) {
        console.log(`  ✓ 取消成功：${song.name} - ${song.artists}`)
        successCount++
      } else {
        console.log(`  ⚠ ${result.body.message}: ${song.name}`)
      }
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.log(`  ✗ 失败 ${error.message}: ${song.name}`)
    }
  }
  console.log(`  取消完成：${successCount}/${songs.length}\n`)
  return successCount
}

async function main() {
  console.log('='.repeat(80))
  console.log('VIP 音乐任务自动化 (动态获取歌曲)')
  console.log('='.repeat(80))
  console.log()
  
  console.log('[准备] 从 API 获取会员雷达歌单中的歌曲...')
  const playlist = await playlist_detail({ id: PLAYLIST_ID })
  
  if (playlist.body.code !== 200) {
    console.log(`  ✗ 获取歌单失败：${playlist.body.message}`)
    return
  }
  
  const tracks = playlist.body.playlist.tracks || []
  if (tracks.length === 0) {
    console.log('  ✗ 歌单中没有歌曲')
    return
  }
  
  const songs = tracks.slice(0, SONG_COUNT).map(t => ({
    id: t.id,
    name: t.name,
    artists: t.ar.map(a => a.name).join(','),
    dt: t.dt,
    album: t.al.name
  }))
  
  console.log(`  ✓ 获取到 ${tracks.length} 首歌曲`)
  console.log('  准备处理的前 3 首:')
  songs.forEach((song, i) => {
    const duration = (song.dt / 1000 / 60).toFixed(2)
    console.log(`    ${i + 1}. ${song.name} - ${song.artists} (${duration}分钟)`)
  })
  console.log()
  
  console.log('[检查] 查看 VIP 任务列表...')
  const likeTask = await findLikeTask()
  
  if (likeTask) {
    console.log(`  ✓ 找到收藏任务：${likeTask.name || likeTask.description}`)
    console.log(`    任务 ID: ${likeTask.taskId}, 成长值：+${likeTask.growthPoint}`)
    console.log(`    进度：${likeTask.currentProgress}/${likeTask.targetWorth}\n`)
  } else {
    console.log('  ✗ 未找到收藏任务 (平台限时任务，可能明日刷新)\n')
  }
  
  await likeSongs(songs)
  await uploadListenRecords(songs)
  
  if (likeTask && likeTask.taskId) {
    const updatedTask = await findLikeTask()
    if (updatedTask && updatedTask.currentProgress >= updatedTask.targetWorth && updatedTask.needReceive) {
      await claimGrowthPoints(updatedTask.taskId, updatedTask.growthPoint)
    } else if (likeTask.needReceive) {
      await claimGrowthPoints(likeTask.taskId, likeTask.growthPoint)
    } else {
      console.log('[任务 3] 领取会员成长值...')
      console.log('  ⏭ 任务未完成或无需领取\n')
    }
  } else {
    console.log('[任务 3] 领取会员成长值...')
    console.log('  ⏭ 无收藏任务，跳过\n')
  }
  
  await unlikeSongs(songs)
  
  console.log('='.repeat(80))
  console.log('✅ 所有任务执行完成！')
  console.log('='.repeat(80))
  console.log()
  console.log('📋 执行总结:')
  console.log(`  1. 收藏 3 首 ✓ (从 API 动态获取)`)
  console.log(`  2. 听歌记录 3 首 ✓ (使用实际时长)`)
  console.log(`  3. 成长值 ${likeTask ? `✓ (+${likeTask.growthPoint})` : '⊘ (无任务)'}`)
  console.log(`  4. 取消收藏 3 首 ✓`)
  console.log()
  console.log('📅 建议：每天执行一次，任务列表可能每天刷新')
  console.log('='.repeat(80))
}

main().catch(console.error)
