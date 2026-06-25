// api-extras: minimal wrapper for custom modules not in npm public package
const { cookieToJson } = require('@neteasecloudmusicapienhanced/api/util')

let requestModule = null

function wrapModule(fileModule) {
  return function (data = {}) {
    const cookie = typeof data.cookie === 'string'
      ? cookieToJson(data.cookie)
      : data.cookie || {}

    if (!requestModule) {
      requestModule = require('@neteasecloudmusicapienhanced/api/util/request')
    }

    return fileModule(
      { ...data, cookie },
      (...args) => requestModule(...args),
    )
  }
}

module.exports = {
  scrobble: wrapModule(require('./module/scrobble')),
  scrobble_v1: wrapModule(require('./module/scrobble_v1')),
  vip_growthpoint_getall: wrapModule(require('./module/vip_growthpoint_getall')),
  vip_tasks_v1: wrapModule(require('./module/vip_tasks_v1')),
}
