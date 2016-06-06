'use strict'
const os = require('os')
const cmd = require('commander')
const socketIo = require('socket.io-client')
const pty = require('ptyw.js')
const key = 'p34axz3bzs'
const url = process.env.SHOWME_URL
  ? process.env.SHOWME_URL : 'https://showme.eu-gb.mybluemix.net'
const shell = os.platform() === 'win32' ? 'cmd.exe' : 'bash'

cmd.usage('[options]')
  .description('Let others watch your terminal session on the web')
  .option('-s, --shell <shell>', 'shell to use, default: ' + shell, shell)
  .on('--help', function () {
    console.log('  Examples:')
    console.log('    showme')
    console.log('    showme -s /bin/csh')
    console.log()
  })
  .parse(process.argv)

if (cmd.args.length) {
  cmd.help()
}

process.title = 'showme'

const socket = socketIo(url + '/' + key, {
  reconnectionAttempts: 5,
  query: 'key=' + key
})
socket
  .on('connect', function () {
    startShell()
  }).on('disconnect', function (err) {
    console.error('disconnected:', err)
    process.exit(1)
  })
  .on('error', function (error) {
    console.error('socket.io error:', error)
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

function startShell () {
  const term = pty.spawn(cmd.shell, [], {
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
      console.error('error:', err)
      process.stdin.setRawMode(false)
      process.exit(1)
    })
    .on('exit', function () {
      process.stdin.setRawMode(false)
      console.log('# closed connection to the cloud')
      process.exit(0)
    })

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

  process.stdin.setRawMode(true)
  socket.emit('size', {
    cols: process.stdout.columns,
    rows: process.stdout.rows
  })
}
