'use strict'
const os = require('os')
const cmd = require('commander')
const socketIo = require('socket.io-client')
const pty = require('ptyw.js')

const key = 'p34axz3bzr'

const defaults = {
  title: 'showme',
  clouds: {
    us: 'https://showme.mybluemix.net',
    eu: 'https://showme.eu-gb.mybluemix.net'
  },
  shell: os.platform() === 'win32' ? 'cmd.exe' : 'bash',
  cloud: 'eu'
}

cmd.usage('[options]')
  .description('Let others watch your terminal session live via HTTP')
  .option('-c, --cloud [us|eu]', 'which cloud to use - default: eu ')
  .option('-s, --shell <shell>', 'default shell: ' + defaults.shell, defaults.shell)
  .on('--help', function () {
    console.log('  Examples:')
    console.log('    showme')
    console.log('    showme -c eu --shell /bin/csh')
    console.log()
  })
  .parse(process.argv)

if (cmd.args.length || (cmd.cloud && !defaults.clouds[cmd.cloud])) {
  cmd.help()
}
let url = cmd.cloud ? defaults.clouds[cmd.cloud]
  : process.env.SHOWME_URL ? process.env.SHOWME_URL : defaults.clouds[defaults.cloud]

process.title = defaults.title

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
  .on('id', function (id) {
    const re = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    if (typeof id === 'string' && re.test(id)) {
      console.log('\n# %s/%s\n', url, id)
    } else {
      console.error('# received invalid id')
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
