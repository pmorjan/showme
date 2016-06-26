'use strict'
const os = require('os')
const socketIo = require('socket.io-client')
const pty = require('ptyw.js')
const key = 'p34axz3bzs'
const url = process.env.SHOWME_URL
  ? process.env.SHOWME_URL : 'https://showme.eu-gb.mybluemix.net'

let shell = os.platform() === 'win32' ? 'cmd.exe' : 'bash'

if (process.argv.length > 2) {
  switch(process.argv[2]) {
    case '-h':
      console.log('Usage: showme [shell]')
      break
    default: shell = process.argv[2]
  }
}

process.title = 'showme'

const socket = socketIo(url + '/' + key, {
  reconnectionAttempts: 5,
  query: 'key=' + key
})
socket
  .on('connect', () => {
    spawnShell()
  }).on('disconnect', err => {
    console.error('disconnected:', err)
    process.exit(1)
  })
  .on('error', error => {
    console.error('socket.io error:', error)
    process.exit(1)
  })
  .on('uid', uid => {
    const re = /^[0-9a-f]{8}$/
    if (typeof uid === 'string' && re.test(uid)) {
      console.log('\n# %s/%s\n', url, uid)
    } else {
      console.error('# received invalid uid')
      process.exit(1)
    }
  })
  .on('reconnecting', count => {
    console.error('trying to connect to %s (%d)', url, count)
  })
  .on('reconnect_failed', () => {
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
    .on('data', data => {
      process.stdout.write(data)
      socket.emit('data', data)
    })
    .on('error', err => {
      console.error('error:', err)
      process.stdin.setRawMode(false)
      process.exit(1)
    })
    .on('exit', () => {
      process.stdin.setRawMode(false)
      console.log('# closed connection to the cloud')
      process.exit(0)
    })

  process.stdin.setRawMode(true)

  process.stdin.on('data', data => {
    term.write(data)
  })

  process.stdout.on('resize', () => {
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
