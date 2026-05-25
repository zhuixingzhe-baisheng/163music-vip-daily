# 单独取消收藏工具使用说明

## 功能说明

该工具用于单独取消网易云音乐歌曲的收藏，支持两种模式：
1. **歌单模式**：取消指定歌单中的所有歌曲收藏
2. **歌曲模式**：取消指定歌曲 ID 列表的收藏

## 使用方法

### 1. 配置参数

编辑 `unlike_songs.js` 文件中的 `config` 对象：

```javascript
const config = {
  // 必填：网易云音乐 Cookie
  cookie: 'MUSIC_U=xxxxxxxxxxxxx',
  
  // 模式 1: 取消指定歌单的所有收藏
  unlikePlaylist: true,           // 是否启用歌单模式
  playlistId: 8402996200,         // 要取消收藏的歌单 ID
  
  // 模式 2: 取消指定歌曲的收藏
  unlikeSongs: false,             // 是否启用歌曲模式
  songIds: [123456, 789012],      // 要取消收藏的歌曲 ID 列表
  
  // 配置
  batchSize: 10,                  // 每批处理数量（歌单模式）
  delayBetweenSongs: 1000         // 歌曲间延时（毫秒）
}
```

### 2. 运行脚本

```bash
node unlike_songs.js
```

## 配置示例

### 示例 1: 取消整个歌单的收藏

```javascript
const config = {
  cookie: 'MUSIC_U=xxxxxxxxxxxxx',
  unlikePlaylist: true,
  playlistId: 8402996200,
  unlikeSongs: false,
  songIds: [],
  batchSize: 10,
  delayBetweenSongs: 1000
}
```

### 示例 2: 取消指定歌曲的收藏

```javascript
const config = {
  cookie: 'MUSIC_U=xxxxxxxxxxxxx',
  unlikePlaylist: false,
  playlistId: 0,
  unlikeSongs: true,
  songIds: [65528, 123456, 789012],  // 指定歌曲 ID
  batchSize: 10,
  delayBetweenSongs: 1000
}
```

### 示例 3: 同时使用两种模式

```javascript
const config = {
  cookie: 'MUSIC_U=xxxxxxxxxxxxx',
  unlikePlaylist: true,
  playlistId: 8402996200,
  unlikeSongs: true,
  songIds: [65528, 123456],  // 额外取消这些歌曲
  batchSize: 10,
  delayBetweenSongs: 1000
}
```

## 运行示例

```
============================================================
网易云音乐 - 单独取消收藏工具
============================================================

获取用户信息...
✓ 当前用户：不疯枉年少 (UID: 2099276552)

获取歌单 8402996200...
✓ 歌单包含 31 首歌曲
开始取消收藏，每批 10 首...

[批次 1] 处理 10 首歌曲:
  ✓ 越来越不懂 - 蔡健雅
  ✓ 成都 - 赵雷
  ✓ 走马 - 陈粒
  ...
  等待 3 秒后继续...

[批次 2] 处理 10 首歌曲:
  ✓ 多想在平庸的生活拥抱你 - 隔壁老樊
  ...

============================================================
✓ 任务完成，共取消 31 首歌曲的收藏
============================================================
```

## 配置说明

| 参数 | 类型 | 说明 | 推荐值 |
|------|------|------|--------|
| `cookie` | string | 网易云音乐 Cookie | 必填 |
| `unlikePlaylist` | boolean | 是否取消歌单收藏 | true/false |
| `playlistId` | number | 歌单 ID | 根据需求设置 |
| `unlikeSongs` | boolean | 是否取消指定歌曲 | true/false |
| `songIds` | array | 歌曲 ID 列表 | 根据需求设置 |
| `batchSize` | number | 每批处理数量 | 10-20 |
| `delayBetweenSongs` | number | 歌曲间延时（毫秒） | 1000-2000 |

## 注意事项

1. **Cookie 安全**：不要将 Cookie 分享给他人
2. **请求频率**：已内置延时，请勿设置过快
3. **批量处理**：建议每批 10-20 首，避免请求过快
4. **账号风控**：大批量取消可能触发风控，请谨慎使用

## 获取歌曲 ID

### 方法 1: 从网页版获取
1. 打开歌曲页面
2. URL 中的数字即为歌曲 ID
   - 例如：https://music.163.com/#/song?id=65528
   - 歌曲 ID: 65528

### 方法 2: 从歌单获取
运行脚本查看歌单中的歌曲 ID

## 常见问题

### Q: 如何获取 Cookie？
A: 参考主项目的 README.md 中的"获取 Cookie"章节

### Q: 取消失败怎么办？
A: 检查 Cookie 是否过期，或降低批量处理速度

### Q: 可以取消多个歌单吗？
A: 多次修改配置并运行脚本，或修改脚本支持多歌单

---

**更新日期**: 2026-05-25  
**版本**: v1.0.0
