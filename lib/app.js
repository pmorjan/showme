'use strict'
const cmd = require('commander')
const socketIo = require('socket.io-client')
const pty = require('pty')

const defaults = {
  title: 'term-cloud',
  cloudUS: 'https://broadcast.mybluemix.net',
  cloudEU: 'https://broadcast.eu-gb.mybluemix.net',
  ns: '/producer',
  shell: 'bash'
}

cmd.usage('[options]')
  .option('-e, --eu', 'use EU cloud: ' + defaults.cloudEU +
      '\n                          default: ' + defaults.cloudUS)
  .option('-s, --shell <shell>', 'default shell: ' + defaults.shell, defaults.shell)
  .on('--help', function () {
    console.log('  Examples:')
    console.log('    term-cloud')
    console.log('    term-cloud --eu --shell /bin/csh')
    console.log()
  })
  .parse(process.argv)

if (cmd.args.length) {
  cmd.help()
}

let url = cmd.eu ? defaults.cloudEU
  : process.env.CLOUD_URL ? process.env.CLOUD_URL : defaults.cloudUS

process.title = defaults.title

const socket = socketIo(url + defaults.ns, {
  reconnectionAttempts: 5
})
.on('connect', function () {
  startShell()
})
.on('disconnect', function () {
  console.error('disconnected')
  process.exit(1)
})
.on('error', function (error) {
  console.error('socket.io error:', error)
  process.exit(1)
})
.on('id', function (id) {
  console.log('\n# %s  %s\n', url, id)
})
.on('reconnecting', function (count) {
  console.error('trying to connect to %s (%d)', url, count)
})
.on('reconnect_failed', function () {
  console.log('# giving up')
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

  term.on('data', function (data) {
    process.stdout.write(data)
    socket.emit('data', data)
  })
  .on('error', function (err) {
    console.error('error:', err)
    process.stdin.setRawMode(false)
    process.exit(1)
  })
  .on('close', function () {
    process.stdin.setRawMode(false)
    console.log('# closed connection to the cloud')
    process.exit(0)
  })

  process.stdout.on('resize', function () {
    term.resize(process.stdout.columns, process.stdout.rows)
  })

  process.stdin.setRawMode(true)
  process.stdin.pipe(term)
}

