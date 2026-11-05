#!/usr/bin/env node
/**
 * Sets the admin password (asked twice, not shown):
 *
 *   npm run admin:password                       (DATA_DIR as the admin uses it: /var/lib/villa-nest on the Pi)
 *   echo 'mật-khẩu' | npm run admin:password      (from a script)
 *
 * A new password signs out every browser signed in (within a few seconds).
 */
import { createInterface } from 'node:readline'
import { MIN_LENGTH, setPassword } from './password.mjs'
import { DATA_DIR } from './store.mjs'

/** A line from the terminal without echoing it (or from a pipe). */
function ask(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: process.stdin.isTTY })
    if (process.stdin.isTTY) {
      // (the characters typed are not shown)
      rl._writeToOutput = (text) => {
        if (text.startsWith(question)) process.stdout.write(question)
      }
    }
    rl.question(question, (answer) => {
      rl.close()
      if (process.stdin.isTTY) process.stdout.write('\n')
      resolve(answer)
    })
  })
}

const first = await ask(`Mật khẩu trang quản trị (ít nhất ${MIN_LENGTH} ký tự): `)
if (first.length < MIN_LENGTH) {
  console.error(`✗ Mật khẩu cần ít nhất ${MIN_LENGTH} ký tự.`)
  process.exit(1)
}
if (process.stdin.isTTY) {
  const again = await ask('Nhập lại mật khẩu: ')
  if (again !== first) {
    console.error('✗ Hai lần nhập không giống nhau.')
    process.exit(1)
  }
}
await setPassword(first)
console.log(`✓ Đã đặt mật khẩu (${DATA_DIR}/admin/password.json). Các máy đang đăng nhập sẽ phải đăng nhập lại.`)
