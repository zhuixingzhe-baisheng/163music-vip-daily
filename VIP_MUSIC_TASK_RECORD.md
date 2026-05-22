# VIP 音乐任务全流程记录

**执行日期**: 2026-05-22  
**任务目标**: 完成网易云音乐 VIP 音乐相关任务，领取会员成长值

---

## 📋 任务流程

### 1. 从音乐雷达收藏三首 VIP 歌曲

**歌单信息**:
- 歌单名称：会员雷达
- 歌单 ID: `8402996200`
- 创建者：云音乐 VIP
- 歌曲总数：31 首

**收藏的歌曲**:

| 序号 | 歌曲 ID | 歌曲名 | 歌手 | 状态 |
|------|---------|--------|------|------|
| 1 | 165361 | 不分手的恋爱 | 汪苏泷 | ✅ 收藏成功 |
| 2 | 1459935719 | 我看过 | 周星星 | ✅ 收藏成功 |
| 3 | 30953009 | See You Again | Wiz Khalifa, Charlie Puth | ✅ 收藏成功 |

**API 调用**:
```javascript
await song_like({
  cookie: MUSIC_U,
  id: songId,
  like: true
})
```

---

### 2. 上传这三首 VIP 歌曲的听歌记录

**播放参数**:
- 播放时长：240 秒 (4 分钟/首)
- 来源歌单：会员雷达 (ID: 8402996200)
- 播放状态：playend (完整播放)

**API 调用**:
```javascript
await scrobble({
  cookie: MUSIC_U,
  id: songId,
  sourceid: PLAYLIST_ID,
  time: PLAY_DURATION  // 240 秒
})
```

**请求数据结构**:
```javascript
{
  logs: JSON.stringify([{
    action: 'play',
    json: {
      download: 0,
      end: 'playend',
      id: songId,
      sourceId: PLAYLIST_ID,
      time: 240,
      type: 'song',
      wifi: 0,
      source: 'list',
      mainsite: 1,
      content: ''
    }
  }])
}
```

---

### 3. 领取会员成长值

**任务状态**: ⏭ 跳过（当前无收藏任务）

**说明**:
- "收藏三首歌曲"是网易云音乐平台配置的限时任务
- 不在当前 VIP 任务列表中
- 任务可能在特定时间刷新出现

**API 调用** (当任务存在时):
```javascript
// 1. 获取 VIP 任务列表
const tasks = await vip_tasks({ cookie: MUSIC_U })

// 2. 查找收藏任务
const likeTask = tasks.find(t => 
  (t.name || t.description || '').includes('收藏')
)

// 3. 领取成长值
await vip_growthpoint_get({
  cookie: MUSIC_U,
  ids: likeTask.taskId
})
```

**预期奖励**: +3 成长值 (参考其他任务奖励)

---

### 4. 取消三首 VIP 歌曲收藏

**API 调用**:
```javascript
await song_like({
  cookie: MUSIC_U,
  id: songId,
  like: false
})
```

**执行结果**:
| 歌曲 ID | 歌曲名 | 状态 |
|---------|--------|------|
| 165361 | 不分手的恋爱 | ✅ 取消成功 |
| 1459935719 | 我看过 | ✅ 取消成功 |
| 30953009 | See You Again | ✅ 取消成功 |

---

## 🔧 使用的 API

| API 名称 | 模块文件 | 功能说明 |
|---------|---------|---------|
| `vip_tasks` | `vip_tasks.js` | 获取 VIP 任务列表 |
| `vip_growthpoint_get` | `vip_growthpoint_get.js` | 领取会员成长值 |
| `playlist_detail` | `playlist_detail.js` | 获取歌单详情 |
| `song_like` | `like.js` | 收藏/取消收藏歌曲 |
| `scrobble` | `scrobble.js` | 上传听歌记录 |

---

## 📊 执行统计

| 项目 | 数值 |
|------|------|
| 收藏歌曲数 | 3 首 |
| 听歌记录数 | 3 条 |
| 总播放时长 | 720 秒 (12 分钟) |
| 取消收藏数 | 3 首 |
| 获得成长值 | 0 (任务未出现) |
| 期望成长值 | +3/天 (任务出现时) |

---

## 📁 相关文件

| 文件名 | 用途 |
|-------|------|
| `vip_music_tasks_automated.js` | 自动化执行脚本 |
| `upload_listen_record.js` | 单独上传听歌记录 |
| `fav_from_playlist.js` | 从歌单收藏歌曲 |
| `check_and_create_task.js` | 检查任务并收藏 |

---

## 🎯 任务发现

### 收藏任务特性
1. **限时任务**: 不是永久存在，会在特定时间刷新
2. **不可创建**: 无法通过 API 手动创建任务
3. **平台配置**: 由网易云音乐平台统一配置
4. **可能条件**:
   - 新用户专属任务
   - 每日/每周轮换任务
   - 完成其他任务后解锁

### 听歌记录特性
1. **即时生效**: 上传后可立即在 APP 查看
2. **时长要求**: 建议每首歌曲播放≥240 秒
3. **来源记录**: 记录播放来源歌单
4. **播放状态**: 支持 playend, pause, stop 等状态

---

## 📅 建议执行计划

### 每日执行
```bash
# 早上 8:00 - 签到 + 任务
node /workspace/auto_tasks_enhanced.js

# 晚上 20:00 - 音乐任务
node /workspace/vip_music_tasks_automated.js
```

### 每周检查
- 周一：检查 VIP 任务列表更新
- 周三：检查听歌排行
- 周五：检查成长值进度

### 每月总结
- 统计获得成长值总数
- 检查任务完成连续性
- 优化执行策略

---

## 🔍 调试信息

### 成功标志
- ✅ API 返回 `code === 200`
- ✅ 收藏/取消操作返回成功
- ✅ 听歌记录上传成功
- ✅ 成长值领取成功（有 data 字段）

### 常见错误
| 错误码 | 说明 | 处理 |
|-------|------|------|
| 201 | 已收藏/已执行 | 正常，继续 |
| 400 | 参数错误 | 检查请求参数 |
| 401 | Cookie 过期 | 更新 Cookie |
| 404 | 资源不存在 | 跳过该歌曲 |

---

## 📝 注意事项

1. **Cookie 安全**: 不要泄露 MUSIC_U
2. **请求频率**: 每首歌曲间隔 1-1.5 秒
3. **任务时效**: 及时领取成长值，可能过期
4. **歌单更新**: 会员雷达歌单内容可能变化
5. **API 兼容**: 使用 API Enhanced v4.32.1+

---

## 📖 参考资料

- [API Enhanced 文档](./README_ENHANCED.md)
- [VIP 任务 API](./网易云_VIP_成长值请求分析.md)
- [自动任务脚本](./auto_tasks_enhanced.js)

---

**最后更新**: 2026-05-22  
**维护状态**: ✅ 正常执行
