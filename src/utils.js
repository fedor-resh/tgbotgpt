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
export const streamDebounce = getAntispam(500)
export function setMidnightInterval(func){
  const now = new Date()
  const ms_now = +now
  const ms_in_day = 1000*24*60*60
  const ms_before_night = ms_in_day - ms_now%ms_in_day
  func()
  setTimeout(()=>{
    func()
    setInterval(() => {
      func()
    }, ms_before_night)
  }, ms_before_night)
}

export function timeBeforeMidnight(){
  const now = new Date()
  const ms_now = +now
  const ms_in_day = 1000*24*60*60
  return (ms_in_day - ms_now % ms_in_day)/1000/60/60
}

export function isMoreDifference(min, firstDate, secondDate){
  return Math.abs(firstDate - secondDate) > min*60*1000
}

