'use strict'
const os = require('os')

const socketIo = require('socket.io-client')
const pty = require('ptyw.js')

const key = 'p34axz3bzs'
const url = process.env.SHOWME_URL || 'https://showme.eu-gb.mybluemix.net'
let shell = os.platform() === 'win32' ? 'cmd.exe' : 'bash'

if (process.argv.length > 2) {
  switch (process.argv[2]) {
    case '-h':
      console.log('Usage: showme [shell]')
      process.exit(0)
      break
    default: shell = process.argv[2]
  }
}

process.title = 'showme'

if (!process.stdin.isTTY) {
  console.error('error: no TTY context')
  process.exit(1)
}

const socket = socketIo(url + '/' + key, {
  reconnectionAttempts: 5,
  query: 'key=' + key
})
socket
  .on('connect', function () {
    spawnShell()
  })
  .on('disconnect', function (err) {
    console.error('disconnected:', err)
    process.exit(1)
  })
  .on('error', function (err) {
    console.error('socket.io error:', err)
    process.exit(1)
  })
  .on('uid', function (uid) {
    const re = /^[0-9a-f]{8}$/
    if (typeof uid === 'string' && re.test(uid)) {
      console.log('\n# %s/%s\n', url, uid)
    } else {
      console.error('# received invalid uid')
      process.exit(1)
    }
  })
  .on('reconnecting', function (count) {
    console.error('trying to connect to %s (%d)', url, count)
  })
  .on('reconnect_failed', function () {
    console.error('# giving up')
    process.exit(1)
  })

function spawnShell () {
  const term = pty.spawn(shell, [], {
    name: process.env.TERM,
    cols: process.stdout.columns,
    rows: process.stdout.rows,
    cwd: process.cwd(),
    env: process.env
  })
  term
    .on('data', function (data) {
      process.stdout.write(data)
      socket.emit('data', data)
    })
    .on('error', function (err) {
      process.stdin.setRawMode(false)
      if (err.code === 'EIO' && err.errno === 'EIO' && err.syscall === 'read') {
        // ignore error on close evt
        console.log('# session closed')
        process.exit(0)
      } else {
        console.error('error:', err)
        process.exit(1)
      }
    })
    .on('exit', function () {
      process.stdin.setRawMode(false)
      console.log('# session closed')
      process.exit(0)
    })

  process.stdin.setRawMode(true)

  process.stdin.on('data', function (data) {
    term.write(data)
  })

  process.stdout.on('resize', function () {
    term.resize(process.stdout.columns, process.stdout.rows)
    socket.emit('size', {
      cols: process.stdout.columns,
      rows: process.stdout.rows
    })
  })

  socket.emit('size', {
    cols: process.stdout.columns,
    rows: process.stdout.rows
  })
}
