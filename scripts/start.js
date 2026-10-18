// Starts the backend and frontend together: npm start
const { spawn } = require('child_process');
const path = require('path');

const root = path.join(__dirname, '..')
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'

const services = [
    {name: 'backend ', dir: 'backend', args: ['start'], color: 36},
    {name: 'frontend', dir: 'frontend', args: ['run', 'dev'], color: 35},
]

const children = services.map(({name, dir, args, color}) => {
    const child = spawn(npm, args, {cwd: path.join(root, dir), shell: process.platform === 'win32', env: process.env})
    const prefix = `\x1b[${color}m[${name}]\x1b[0m `
    const pipe = (stream, out) => stream.on('data', (chunk) => {
        for(const line of chunk.toString().split(/\r?\n/)) if(line.trim()) out.write(prefix + line + '\n')
    })
    pipe(child.stdout, process.stdout)
    pipe(child.stderr, process.stderr)
    child.on('exit', (code) => {
        if(!stopping){
            console.error(`${prefix}stopped (exit code ${code}). Shutting down.`)
            stop(code || 1)
        }
    })
    return child
})

console.log('\nStarting Expense Tracker. Open http://localhost:5173 once both parts are ready. Press Ctrl+C to stop.\n')

let stopping = false
function stop(code = 0) {
    if(stopping) return
    stopping = true
    for(const child of children) if(child.exitCode === null) child.kill('SIGINT')
    setTimeout(() => process.exit(code), 1500)
}
process.on('SIGINT', () => stop(0))
process.on('SIGTERM', () => stop(0))
