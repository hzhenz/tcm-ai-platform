/**
 * TCM-AI OpenClaw Skill - 服药提醒工具
 * 
 * 在用户系统日历中添加服药提醒事件
 * 支持 Windows (Outlook), macOS (Calendar), Linux (GNOME Calendar)
 */

if (typeof require !== 'undefined') {
  module.exports = { addMedicationReminder, generateICS }
}

const { exec } = require('child_process')
const { writeFileSync, unlinkSync } = require('fs')
const { tmpdir } = require('os')
const { join } = require('path')

/**
 * 生成 ICS 格式的日历事件
 */
function generateICS(events) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TCM-AI-Platform//Medication Reminder//CN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ]
  
  for (const event of events) {
    const uid = `tcm-med-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
    const dtstart = formatICSDateTime(event.start)
    const dtend = formatICSDateTime(new Date(event.start.getTime() + 15 * 60 * 1000)) // 15分钟
    
    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${formatICSDateTime(new Date())}`,
      `DTSTART:${dtstart}`,
      `DTEND:${dtend}`,
      `SUMMARY:💊 ${event.title}`,
      `DESCRIPTION:${escapeICS(event.description || '')}`,
      `LOCATION:${escapeICS(event.location || '')}`,
      'BEGIN:VALARM',
      'TRIGGER:-PT5M',
      'ACTION:DISPLAY',
      `DESCRIPTION:服药提醒：${event.title}`,
      'END:VALARM',
      'END:VEVENT'
    )
  }
  
  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

function formatICSDateTime(date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function escapeICS(text) {
  return text.replace(/[\\;,\n]/g, match => {
    if (match === '\n') return '\\n'
    return '\\' + match
  })
}

/**
 * 解析时间字符串为 Date 对象
 */
function parseTime(dateStr, timeStr) {
  const [hour, minute] = timeStr.split(':').map(Number)
  const date = new Date(dateStr)
  date.setHours(hour, minute, 0, 0)
  return date
}

/**
 * 添加服药提醒
 */
async function addMedicationReminder(params, context, onProgress) {
  const {
    medicineName,
    dosage = '',
    frequency = '每日三次',
    times = ['08:00', '12:00', '18:00'],
    startDate = new Date().toISOString().split('T')[0],
    durationDays = 7,
    notes = ''
  } = params
  
  onProgress?.({ stage: 'GENERATING', message: '正在生成提醒事件...' })
  
  // 生成所有事件
  const events = []
  const start = new Date(startDate)
  
  for (let day = 0; day < durationDays; day++) {
    const currentDate = new Date(start.getTime() + day * 86400000)
    const dateStr = currentDate.toISOString().split('T')[0]
    
    for (const time of times) {
      const eventTime = parseTime(dateStr, time)
      
      // 跳过已过去的时间
      if (eventTime < new Date()) continue
      
      events.push({
        title: `${medicineName}${dosage ? ` - ${dosage}` : ''}`,
        start: eventTime,
        description: `${frequency}\n${notes}`.trim(),
        location: ''
      })
    }
  }
  
  if (events.length === 0) {
    return {
      success: false,
      error: 'NO_FUTURE_EVENTS',
      message: '所有提醒时间已过期，请调整开始日期'
    }
  }
  
  onProgress?.({ 
    stage: 'CREATING', 
    message: `正在创建 ${events.length} 个提醒事件...` 
  })
  
  // 生成 ICS 文件
  const icsContent = generateICS(events)
  const icsPath = join(tmpdir(), `tcm-reminder-${Date.now()}.ics`)
  
  try {
    writeFileSync(icsPath, icsContent, 'utf-8')
    
    // 根据平台打开日历
    const platform = process.platform
    let openCommand
    let calendarName
    
    if (platform === 'win32') {
      // Windows: 使用默认程序打开 .ics
      openCommand = `start "" "${icsPath}"`
      calendarName = 'Outlook/系统日历'
    } else if (platform === 'darwin') {
      // macOS: 使用 Calendar.app
      openCommand = `open "${icsPath}"`
      calendarName = 'Apple Calendar'
    } else {
      // Linux: 尝试 xdg-open
      openCommand = `xdg-open "${icsPath}"`
      calendarName = 'System Calendar'
    }
    
    onProgress?.({ stage: 'OPENING_CALENDAR', message: `正在打开 ${calendarName}...` })
    
    await new Promise((resolve, reject) => {
      exec(openCommand, (error) => {
        if (error) reject(error)
        else resolve()
      })
    })
    
    // 等待用户确认导入
    onProgress?.({ 
      stage: 'WAITING_IMPORT', 
      message: '请在弹出的日历应用中确认导入提醒' 
    })
    
    // 延迟删除临时文件
    setTimeout(() => {
      try { unlinkSync(icsPath) } catch (e) { /* 忽略 */ }
    }, 60000)
    
    return {
      success: true,
      eventsCreated: events.length,
      calendarName,
      icsPath,
      startDate,
      endDate: new Date(start.getTime() + (durationDays - 1) * 86400000).toISOString().split('T')[0],
      times
    }
    
  } catch (error) {
    // 清理临时文件
    try { unlinkSync(icsPath) } catch (e) { /* 忽略 */ }
    
    return {
      success: false,
      error: 'CALENDAR_ERROR',
      message: error.message
    }
  }
}

// ============== 替代方案：直接写入系统日历 ==============

/**
 * Windows: 使用 PowerShell 写入 Outlook 日历
 */
async function addToOutlookCalendar(events) {
  const psScript = `
$outlook = New-Object -ComObject Outlook.Application
$calendar = $outlook.GetNamespace("MAPI").GetDefaultFolder(9)

${events.map(e => `
$appointment = $outlook.CreateItem(1)
$appointment.Subject = "${e.title}"
$appointment.Body = "${e.description}"
$appointment.Start = "${e.start.toISOString()}"
$appointment.Duration = 15
$appointment.ReminderSet = $true
$appointment.ReminderMinutesBeforeStart = 5
$appointment.Save()
`).join('\n')}

Write-Output "Created ${events.length} appointments"
`
  
  return new Promise((resolve, reject) => {
    exec(`powershell -Command "${psScript.replace(/"/g, '\\"')}"`, (error, stdout) => {
      if (error) reject(error)
      else resolve({ success: true, output: stdout })
    })
  })
}

/**
 * macOS: 使用 AppleScript 写入 Calendar
 */
async function addToAppleCalendar(events) {
  const appleScript = `
tell application "Calendar"
  tell calendar "日历"
    ${events.map(e => `
    make new event with properties {summary:"${e.title}", start date:date "${e.start.toLocaleString('en-US')}", end date:date "${new Date(e.start.getTime() + 900000).toLocaleString('en-US')}"}
    `).join('\n')}
  end tell
end tell
`
  
  return new Promise((resolve, reject) => {
    exec(`osascript -e '${appleScript.replace(/'/g, "\\'")}'`, (error, stdout) => {
      if (error) reject(error)
      else resolve({ success: true, output: stdout })
    })
  })
}
