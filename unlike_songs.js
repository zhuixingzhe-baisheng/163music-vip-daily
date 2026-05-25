/**
 * 单独取消收藏工具
 * 用于取消指定歌单或指定歌曲的收藏
 */

const { song_like, user_account, playlist_detail } = require('@neteasecloudmusicapienhanced/api')

// 配置
const config = {
  cookie: 'MUSIC_U=00B09401045DAC703C4FE7538EF65F899CED5B93296BED2A26BD6407CF9932894E933592CCB2443B23DEFFB0DCD7B1AF87D9AFB93BB3ABA0D227426BAFD810BCBE3B7B9490BE83A67C38523C5619BBB3A21CEF949BD183339D052C82AF07FD5DF80939CD87FA9AAD964390450AD4244A86FBA8B5B04CEBE9128794D72B339BF69A8B4A1C04ED88ECC093A53282BD30A15EB2E600822D24A3CEEEED86F241C8B2C9775ABABDC0AC29C1E1BF37907B0FD947FE6CB2928A2E8BAEE327ACF02F6A108D2AC7AC26A55539A721ACC9BF562A5912F70529A3BC68BFE253AFB10E315B1A42175282C0AF81B2443006872E05C9FFAFABC52A700F9E7F11E1F2506EDE457A337232C67B8632E7B7D8B2C2DEE6D873B60EEDD16DA8B99D601C0D06356DC0402B06DF36A49C477176DAC6B6A267D379F480312DC65FAB7F5A642D77F7A21C20C59B6C800E208083C5A9880FA3D79C252FAD8BB9D33EE43A5695D01556D9F103E64EFF55C232928AD69D4116F7A1441E9596ABCCC852ED6C25DADDEA3425F9615F12FA50EE583020A93743C41C8E83BF6242FEDAD4EB605B16384CD85DB4CD1DB1',
  
  // 模式 1: 取消指定歌单的所有收藏
  unlikePlaylist: true,
  playlistId: 8402996200,  // 要取消收藏的歌单 ID
  
  // 模式 2: 取消指定歌曲的收藏
  unlikeSongs: false,
  songIds: [123456, 789012],  // 要取消收藏的歌曲 ID 列表
  
  // 配置
  batchSize: 10,  // 每批处理数量
  delayBetweenSongs: 1000  // 歌曲间延时（毫秒）
}

// 延时函数
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 主函数
async function main() {
  console.log('='.repeat(60))
  console.log('网易云音乐 - 单独取消收藏工具')
  console.log('='.repeat(60))
  
  try {
    // 获取用户信息
    console.log('\n获取用户信息...')
    const account = await user_account({ cookie: config.cookie })
    if (account.body.code !== 200) {
      console.log('✗ 获取用户信息失败')
      return
    }
    
    const userId = account.profile?.userId || account.body?.profile?.userId
    const nickname = account.profile?.nickname || account.body?.profile?.nickname
    console.log(`✓ 当前用户：${nickname} (UID: ${userId})`)
    
    let totalUnliked = 0
    
    // 模式 1: 取消歌单收藏
    if (config.unlikePlaylist) {
      console.log(`\n获取歌单 ${config.playlistId}...`)
      const playlist = await playlist_detail({ 
        cookie: config.cookie,
        id: config.playlistId 
      })
      
      if (playlist.body.code !== 200) {
        console.log('✗ 获取歌单失败')
        return
      }
      
      const tracks = playlist.body.playlist.tracks || []
      if (tracks.length === 0) {
        console.log('✗ 歌单为空')
        return
      }
      
      console.log(`✓ 歌单包含 ${tracks.length} 首歌曲`)
      console.log(`开始取消收藏，每批 ${config.batchSize} 首...\n`)
      
      for (let i = 0; i < tracks.length; i += config.batchSize) {
        const batch = tracks.slice(i, i + config.batchSize)
        console.log(`[批次 ${Math.floor(i/config.batchSize) + 1}] 处理 ${batch.length} 首歌曲:`)
        
        for (const track of batch) {
          try {
            const result = await song_like({
              cookie: config.cookie,
              id: track.id,
              like: false,
              uid: userId
            })
            
            if (result.body.code === 200) {
              console.log(`  ✓ ${track.name} - ${track.ar.map(a => a.name).join('/')}`)
              totalUnliked++
            } else {
              console.log(`  ✗ ${track.name}: 失败 (code: ${result.body.code})`)
            }
            
            await sleep(config.delayBetweenSongs)
          } catch (e) {
            console.log(`  ✗ ${track.name}: ${e.message}`)
          }
        }
        
        // 批次间延时
        if (i + config.batchSize < tracks.length) {
          console.log('  等待 3 秒后继续...\n')
          await sleep(3000)
        }
      }
    }
    
    // 模式 2: 取消指定歌曲收藏
    if (config.unlikeSongs) {
      console.log(`\n开始取消 ${config.songIds.length} 首指定歌曲的收藏...\n`)
      
      for (const songId of config.songIds) {
        try {
          console.log(`处理歌曲 ID: ${songId}`)
          const result = await song_like({
            cookie: config.cookie,
            id: songId,
            like: false,
            uid: userId
          })
          
          if (result.body.code === 200) {
            console.log(`  ✓ 已取消收藏`)
            totalUnliked++
          } else {
            console.log(`  ✗ 失败 (code: ${result.body.code})`)
          }
          
          await sleep(config.delayBetweenSongs)
        } catch (e) {
          console.log(`  ✗ 错误：${e.message}`)
        }
      }
    }
    
    console.log('\n' + '='.repeat(60))
    console.log(`✓ 任务完成，共取消 ${totalUnliked} 首歌曲的收藏`)
    console.log('='.repeat(60))
    
  } catch (error) {
    console.error('✗ 执行失败:', error.message)
  }
}

// 运行
main().catch(console.error)
