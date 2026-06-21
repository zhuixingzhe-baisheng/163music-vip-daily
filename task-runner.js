/**
 * 网易云音乐任务执行器 - 公共模块
 * 提取自 api-server.js 和 auto_tasks_enhanced.js 的公共任务逻辑
 */

const API = require('@neteasecloudmusicapienhanced/api')

const {
  yunbei,
  yunbei_sign,
  vip_sign,
  vip_sign_info,
  vip_sign_detail,
  vip_tasks,
  vip_info,
  playlist_detail,
  song_like,
  scrobble,
  share_resource,
  event_del,
  event,
  likelist
} = API

const getUserStatus = API.user_status || API.server?.user_status || null
const getDailySignin = API.daily_signin || API.server?.daily_signin || null
const getVipTaskSignin = API.vip_task_signin || API.server?.vip_task_signin || null
const getVipGrowthpoint = API.vip_growthpoint_get || API.server?.vip_growthpoint_get || null
const getVipGrowthpointAll = API.vip_growthpoint_getall || API.server?.vip_growthpoint_getall || null
const getPlaylistDetail = API.playlist_detail || API.server?.playlist_detail || null
const getLike = API.song_like || API.like || API.server?.like || null
const getScrobble = API.scrobble || API.server?.scrobble || null

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function getTodayString() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

async function playStateSubmit(cookie, resourceId, resourceType = 'song', progress = 0, playMode = 'list_loop', sessionId = null) {
  if (!sessionId) sessionId = `SESSION_${Date.now()}_${resourceId}`
  const playStateSubmitReq = JSON.stringify({
    resource: { id: String(resourceId), type: resourceType },
    progress, sessionId, playMode
  })
  const response = await fetch('https://music.163.com/api/relay/play/state/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': cookie },
    body: new URLSearchParams({ playStateSubmitReq }).toString()
  })
  return await response.json()
}

async function getVipTasksV1(cookie, userId = '') {
  const data = userId ? { userId } : {}
  const response = await fetch('https://interface.music.163.com/api/middle/vip/mission/user/progress/list', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': cookie, 'User-Agent': 'Mozilla/5.0' },
    body: new URLSearchParams(data).toString()
  })
  return await response.json()
}

async function checkIsLiked(cookie, userId, trackId) {
  try {
    const result = await likelist({ uid: userId, cookie })
    if (result.body.code === 200 && result.body.ids) return result.body.ids.includes(trackId)
    return false
  } catch (e) { return false }
}

async function getUnlikedTracks(cookie, userId, trackIds) {
  try {
    const result = await likelist({ uid: userId, cookie })
    if (result.body.code === 200 && result.body.ids) {
      const likedIds = new Set(result.body.ids)
      return trackIds.filter(id => !likedIds.has(id))
    }
    return trackIds
  } catch (e) { return trackIds }
}

async function getUserId(cookie) {
  try {
    const userProfile = await vip_info({ cookie })
    if (userProfile.body?.data?.userId) return userProfile.body.data.userId
    return ''
  } catch (e) { return '' }
}

function validateMusicU(cookie) {
  const value = cookie.startsWith('MUSIC_U=') ? cookie.substring(8) : cookie
  return value && value.length > 0 && /^[a-zA-Z0-9_%\-]+$/.test(value)
}

function validateServerSendKey(key) {
  if (!key || key.trim() === '') return true
  return key.startsWith('SCT') && key.length >= 10
}

function validatePushplusToken(token) {
  if (!token || token.trim() === '') return true
  return token.length >= 10
}

async function executeUserTasks(user, config, options = {}) {
  const { logger = console, onProgress = null } = options
  const timestamp = Date.now()
  const result = { account: user.nickname, type: 'success', summary: '任务执行完成', details: [], timestamp }
  const cookie = user.cookie

  try {
    // 1. 获取用户状态
    try {
      if (getUserStatus) {
        const userStatus = await getUserStatus({ cookie })
        if (userStatus.body.code === 200 && userStatus.body.profile) {
          const nickname = userStatus.body.profile.nickname || user.nickname
          const level = userStatus.body.profile.level || 0
          const message = `👤 登录成功：${nickname} (Lv.${level})`
          logger.log(message); result.details.push(message)
          if (onProgress) onProgress({ type: 'info', message })
        }
      }
    } catch (e) { logger.error('获取用户信息失败:', e.message) }

    // 2. 云贝签到（安卓端）
    if (config.enableYunbeiSign !== false && getDailySignin) {
      try {
        const signRes = await getDailySignin({ cookie, type: 1 })
        const signData = signRes.body
        if (signData.code === 200 || signData.code === -2) {
          const yunbei = signData.yunbei || 0
          const message = `✅ 云贝签到（安卓端）：获得 ${yunbei} 云贝`
          logger.log(message); result.details.push(message)
          if (onProgress) onProgress({ type: 'task', message })
        } else if (signData.msg?.includes('已经签到')) {
          const message = '⚠️ 云贝签到（安卓端）：今日已签到'
          logger.log(message); result.details.push(message)
          if (onProgress) onProgress({ type: 'task', message })
        } else { throw new Error(signData.msg || '签到失败') }
      } catch (e) {
        const message = `❌ 云贝签到（安卓端）：${e.message}`
        logger.error(message); result.details.push(message)
        if (onProgress) onProgress({ type: 'error', message })
      }
    }

    // 3. 云贝签到（PC 端）
    if (config.enableYunbeiSignPC !== false && getDailySignin) {
      try {
        const signRes = await getDailySignin({ cookie, type: 0 })
        const signData = signRes.body
        if (signData.code === 200 || signData.code === -2) {
          const yunbei = signData.yunbei || 0
          const message = `✅ 云贝签到（PC 端）：获得 ${yunbei} 云贝`
          logger.log(message); result.details.push(message)
          if (onProgress) onProgress({ type: 'task', message })
        } else if (signData.msg?.includes('已经签到')) {
          const message = '⚠️ 云贝签到（PC 端）：今日已签到'
          logger.log(message); result.details.push(message)
          if (onProgress) onProgress({ type: 'task', message })
        } else { throw new Error(signData.msg || '签到失败') }
      } catch (e) {
        const message = `❌ 云贝签到（PC 端）：${e.message}`
        logger.error(message); result.details.push(message)
        if (onProgress) onProgress({ type: 'error', message })
      }
    }

    // 4. VIP 乐签打卡
    if (config.enableVipSign !== false && getVipTaskSignin) {
      try {
        const signRes = await getVipTaskSignin({ cookie })
        const signData = signRes.body
        if (signData.code === 200) {
          const message = '✅ VIP 乐签打卡：成功'
          logger.log(message); result.details.push(message)
          if (onProgress) onProgress({ type: 'task', message })
        } else if (signData.code === -2 || signData.message?.includes('今日已打卡')) {
          const message = '⚠️ VIP 乐签打卡：今日已打卡'
          logger.log(message); result.details.push(message)
          if (onProgress) onProgress({ type: 'task', message })
        } else { throw new Error(signData.message || 'VIP 打卡失败') }
      } catch (e) {
        const message = `❌ VIP 乐签打卡：${e.message}`
        logger.error(message); result.details.push(message)
        if (onProgress) onProgress({ type: 'error', message })
      }
    }

    // 5. VIP 成长值领取
    if (config.enableVipGrowthpoint !== false) {
      try {
        // 优先使用一键领取 (xeapi + getall)
        if (getVipGrowthpointAll) {
          const growthAllRes = await getVipGrowthpointAll({ cookie })
          if (growthAllRes.body.code === 200 && growthAllRes.body.data?.result) {
            const message = '✅ VIP 成长值：一键领取成功'
            logger.log(message); result.details.push(message)
            if (onProgress) onProgress({ type: 'task', message })
          } else {
            throw new Error(growthAllRes.body.message || '一键领取失败')
          }
        } else if (getVipGrowthpoint) {
          const growthRes = await getVipGrowthpoint({ cookie })
          const growthData = growthRes.body
          if (growthData.code === 200) {
            const growthpoint = growthData.data?.vip_growthpoint || 0
            const message = `✅ VIP 成长值领取：获得 ${growthpoint} 成长值`
            logger.log(message); result.details.push(message)
            if (onProgress) onProgress({ type: 'task', message })
          } else if (growthData.code === -2 || growthData.message?.includes('暂无')) {
            const message = 'ℹ️ VIP 成长值领取：暂无可领取的成长值'
            logger.log(message); result.details.push(message)
            if (onProgress) onProgress({ type: 'info', message })
          } else { throw new Error(growthData.message || '领取成长值失败') }
        }
      } catch (e) {
        const message = `❌ VIP 成长值领取：${e.message}`
        logger.error(message); result.details.push(message)
        if (onProgress) onProgress({ type: 'error', message })
      }
    }

    // 6. VIP 音乐任务
    if (config.enableVipMusicTasks !== false) {
      const playlistId = config.vipMusicPlaylistId || 8402996200
      const songCount = config.vipMusicSongCount || 4
      const fallbackPlaylistIds = config.vipMusicFallbackPlaylistIds || [7785066739, 5453912201]
      const enableScrobble = config.enableVipMusicScrobble === true

      try {
        let currentPlaylistId = playlistId
        const getPlDetail = getPlaylistDetail || playlist_detail
        let playlistRes = await getPlDetail({ id: playlistId, cookie })
        let playlistData = playlistRes.body

        if (playlistData.code !== 200 || !playlistData.playlist || !playlistData.playlist.trackIds) {
          throw new Error('获取歌单失败')
        }

        // 获取歌单所有歌曲 ID（不限制数量）
        let allTrackIds = playlistData.playlist.trackIds.map(t => t.id)
        const userId = await getUserId(cookie)
        
        // 检查所有歌曲的收藏状态，找出未收藏的
        let unlikedTrackIds = await getUnlikedTracks(cookie, userId, allTrackIds)
        
        // 从未收藏的歌曲中挑选 songCount 首
        const tracksToLike = unlikedTrackIds.slice(0, songCount)

        // 如果所有歌曲都已收藏，尝试备用歌单
        if (tracksToLike.length === 0) {
          logger.log(`⚠️ 歌单 ${playlistId} 中的所有歌曲都已收藏，尝试切换备用歌单`)
          for (const fallbackId of fallbackPlaylistIds) {
            logger.log(`  尝试备用歌单 ${fallbackId}...`)
            currentPlaylistId = fallbackId
            playlistRes = await getPlDetail({ id: fallbackId, cookie })
            playlistData = playlistRes.body
            if (playlistData.code !== 200 || !playlistData.playlist || !playlistData.playlist.trackIds) {
              logger.log(`  ⚠️ 备用歌单 ${fallbackId} 获取失败`)
              continue
            }
            allTrackIds = playlistData.playlist.trackIds.map(t => t.id)
            unlikedTrackIds = await getUnlikedTracks(cookie, userId, allTrackIds)
            const fallbackTracksToLike = unlikedTrackIds.slice(0, songCount)
            if (fallbackTracksToLike.length > 0) {
              tracksToLike.length = 0
              tracksToLike.push(...fallbackTracksToLike)
              logger.log(`  ✅ 备用歌单 ${fallbackId} 找到 ${tracksToLike.length} 首未收藏歌曲`)
              break
            } else {
              logger.log(`  ⚠️ 备用歌单 ${fallbackId} 中的所有歌曲也已收藏`)
            }
          }
          if (tracksToLike.length === 0) {
            const message = '⚠️ 所有歌单的歌曲都已收藏，跳过本次任务'
            logger.log(message); result.details.push(message)
            if (onProgress) onProgress({ type: 'info', message })
            return
          }
        }

        logger.log(`🎵 会员雷达歌单 (${currentPlaylistId})，未收藏歌曲 ${unlikedTrackIds.length} 首，本次挑选 ${tracksToLike.length} 首`)
        let collectedCount = 0

        for (let i = 0; i < tracksToLike.length; i++) {
          const trackId = tracksToLike[i]
          try {
            const likeRes = await song_like({ cookie, id: trackId, like: true })
            if (likeRes.body.code === 200 || likeRes.body.code === 201) {
              collectedCount++
              logger.log(`  ✅ 收藏歌曲：${trackId}`)

              // 不启用听歌记录时，添加 10-15 秒延时
              if (!enableScrobble && i < tracksToLike.length - 1) {
                const delaySeconds = Math.floor(Math.random() * 6) + 10
                logger.log(`  ⏱️  等待 ${delaySeconds} 秒后处理下一首...`)
                await sleep(delaySeconds * 1000)
              }

              // 启用听歌记录时，执行完整流程
              if (enableScrobble) {
                logger.log(`  🎧 准备上传听歌状态...`)
                const trackInfo = playlistData.playlist.tracks.find(t => t.id === trackId)
                if (trackInfo) {
                  const playTime = Math.floor(trackInfo.dt / 1000)
                  const sessionId = `SESSION_${Date.now()}_${trackId}`
                  await playStateSubmit(cookie, trackId, 'song', 0, 'list_loop', sessionId)
                  await sleep(1000)
                  await sleep(Math.min(playTime * 1000, 60000))
                  await playStateSubmit(cookie, trackId, 'song', playTime, 'list_loop', sessionId)
                  await sleep(1000)
                  const scrobbleResult = await (getScrobble || scrobble)({ cookie, id: trackId, sourceid: currentPlaylistId, time: playTime })
                  if (scrobbleResult.body.code === 200) {
                    logger.log(`  ✅ 听歌记录已上传 (${(playTime / 60).toFixed(2)}分钟)`)
                  }
                }
              }
            } else if (likeRes.body.code === 502) {
              logger.log(`  ⊘ 歌曲 ${trackId} 已收藏，跳过`)
            }
          } catch (e) {
            logger.error(`  ❌ 收藏歌曲失败：${trackId}`, e.message)
          }
        }

        const scrobbleMsg = enableScrobble ? ' (含听歌记录)' : ''
        const message = `✅ VIP 音乐任务：收藏 ${collectedCount}/${songCount} 首歌曲${scrobbleMsg} (歌单：${currentPlaylistId})`
        logger.log(message); result.details.push(message)
        if (onProgress) onProgress({ type: 'task', message })
      } catch (e) {
        const message = `❌ VIP 音乐任务：${e.message}`
        logger.error(message); result.details.push(message)
        if (onProgress) onProgress({ type: 'error', message })
      }
    }

    // 7. 自动发布动态
    if (config.enableAutoPost !== false) {
      const postSongCount = Math.max(1, Math.min(3, config.postSongCount || 1))
      const playlistId = config.postPlaylistId || 8402996200
      if (config.deletePreviousPost) {
        try {
          const eventsRes = await event({ pagesize: 1, cookie })
          if (eventsRes.body.code === 200 && eventsRes.body.events?.length > 0) {
            const lastEventId = eventsRes.body.events[0].id
            const delRes = await event_del({ evId: lastEventId, cookie })
            if (delRes.body.code === 200) {
              const message = '🗑️ 删除上次动态：成功'
              logger.log(message); result.details.push(message)
              if (onProgress) onProgress({ type: 'task', message })
            }
          }
        } catch (e) { logger.warn(`⚠️ 删除上次动态失败：${e.message}`) }
      }
      try {
        const getPlDetail = getPlaylistDetail || playlist_detail
        const playlistRes = await getPlDetail({ id: playlistId, cookie })
        const playlistData = playlistRes.body
        if (playlistData.code === 200 && playlistData.playlist?.trackIds) {
          const shareRes = await share_resource({ type: 'playlist', id: playlistId, msg: '每日推荐', cookie })
          if (shareRes.body.code === 200) {
            const message = `✅ 自动发布动态：分享歌单 ${playlistId}`
            logger.log(message); result.details.push(message)
            if (onProgress) onProgress({ type: 'task', message })
          }
        } else { throw new Error('获取歌单失败') }
      } catch (e) {
        const message = `❌ 自动发布动态：${e.message}`
        logger.error(message); result.details.push(message)
        if (onProgress) onProgress({ type: 'error', message })
      }
    }

    // 完成总结
    if (result.details.length > 0) {
      const summaryMessage = `🎉 ${user.nickname} - 任务执行完成`
      logger.log(summaryMessage)
      if (onProgress) onProgress({ type: 'success', message: summaryMessage })
    }
    return result
  } catch (error) {
    const errorMessage = `❌ 账号 ${user.nickname} 执行失败：${error.message}`
    logger.error(errorMessage)
    result.type = 'error'; result.summary = errorMessage
    if (onProgress) onProgress({ type: 'error', message: errorMessage })
    return result
  }
}

async function getVipTaskList(cookie, userId = '', logger = console) {
  try {
    logger.log('获取 VIP 任务列表 (/vip/task/v1)...')
    const vipTasksV1Result = await getVipTasksV1(cookie, userId)
    if (vipTasksV1Result.code === 200 && vipTasksV1Result.data) {
      logger.log('= VIP 任务列表 =')
      const taskList = Array.isArray(vipTasksV1Result.data) ? vipTasksV1Result.data : (vipTasksV1Result.data.missionList || [])
      if (taskList.length > 0) {
        for (const task of taskList) {
          const name = task.name || task.title || task.missionTitle || task.basicMissionDTO?.name || '未知任务'
          const progress = task.progress || task.currentPeriodCompleteNum || 0
          const target = task.target || task.missionTarget || 1
          const reward = task.reward || task.rewardGrowthPoint || task.basicMissionDTO?.rewardGrowthPoint || 0
          const isCompleted = task.isReceived || task.status === 'COMPLETED' || task.missionStatus === 50
          const canReceive = task.canReceive || task.canReceiveGrowthPoint
          logger.log(`  ${name}`)
          logger.log(`      进度：${progress}/${target} | 奖励：${reward} 成长值 | 状态：${isCompleted ? '✓ 已完成' : '○ 未完成'}${canReceive ? ' [可领取]' : ''}`)
        }
      } else { logger.log('  暂无任务数据') }
      return taskList
    } else {
      logger.error('获取 VIP 任务失败:', vipTasksV1Result.message || vipTasksV1Result.code)
      return []
    }
  } catch (error) { logger.error('获取 VIP 任务列表失败:', error.message); return [] }
}

module.exports = {
  sleep, getTodayString, playStateSubmit, getVipTasksV1,
  validateMusicU, validateServerSendKey, validatePushplusToken,
  executeUserTasks, getVipTaskList, checkIsLiked, getUnlikedTracks, getUserId
}
