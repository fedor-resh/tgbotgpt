import {unlink} from 'fs/promises'

export async function removeFile(path) {
  try {
    await unlink(path)
  } catch (e) {
    console.log('Error while removing file', e.message)
  }
}

function getAntispam(delay) {
  let flag = true
  return () => {
    if (!flag) return false
    flag = false
    setTimeout(() => flag = true, delay)
    return true
  }
}
export const antispam = getAntispam(5000)
export const streamDebounce = getAntispam(1000)
