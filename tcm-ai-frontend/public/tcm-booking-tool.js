/**
 * TCM-AI OpenClaw Skill - 挂号工具
 * 
 * 使用 Playwright 在用户本地浏览器执行医院挂号
 * 安装方法：将此文件复制到 ~/.openclaw/skills/tcm-automation/
 */

// 检查是否在 Node.js 环境运行
if (typeof require !== 'undefined') {
  module.exports = { bookHospitalAppointment, parseDate, formatDate }
}

/**
 * 日期字符串转换
 */
function parseDate(dateStr) {
  const today = new Date()
  switch (dateStr) {
    case '今天': return formatDate(today)
    case '明天': return formatDate(new Date(today.getTime() + 86400000))
    case '后天': return formatDate(new Date(today.getTime() + 172800000))
    default: return dateStr
  }
}

function formatDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

/**
 * 检测反自动化保护
 */
function detectBotProtection(pageContent) {
  const signals = ['验证码', '人机验证', '滑块验证', 'captcha', '检测到异常', '自动化软件', 'webdriver', '请先登录', '实名认证']
  const lower = pageContent.toLowerCase()
  for (const s of signals) {
    if (lower.includes(s.toLowerCase())) return { detected: true, signal: s }
  }
  return { detected: false }
}

/**
 * 尝试多种选择器查找元素
 */
async function findElement(page, selectors, timeout = 5000) {
  for (const sel of selectors) {
    try {
      const el = await page.waitForSelector(sel, { timeout: timeout / selectors.length })
      if (el) return el
    } catch (e) { /* 继续 */ }
  }
  return null
}

/**
 * 提取预约号/排队号
 */
function extractBookingNo(text) {
  const m = text.match(/(?:预约号|订单号|挂号号|编号)[：:]\s*([A-Z0-9-]+)/i)
  return m ? m[1] : null
}

function extractQueueNo(text) {
  const m = text.match(/(?:排队|序号)[：:]\s*(\d+)|第\s*(\d+)\s*位/)
  return m ? parseInt(m[1] || m[2], 10) : null
}

/**
 * 主挂号函数
 */
async function bookHospitalAppointment(params, context, onProgress) {
  const { chromium } = require('playwright')
  
  const {
    hospitalUrl = 'https://www.cs4hospital.cn/',
    department,
    date,
    patientName,
    patientId,
    preferredDoctor,
    timeSlot = 'morning'
  } = params
  
  const actualDate = parseDate(date)
  
  onProgress?.({ stage: 'STARTING', message: '正在启动浏览器...' })
  
  const browser = await chromium.launch({ headless: false, args: ['--start-maximized'] })
  const browserContext = await browser.newContext({ viewport: null, locale: 'zh-CN' })
  const page = await browserContext.newPage()
  
  try {
    onProgress?.({ stage: 'NAVIGATING', message: `正在访问 ${hospitalUrl}...` })
    await page.goto(hospitalUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForTimeout(2000)
    
    // 检测反自动化
    const protection = detectBotProtection(await page.content())
    if (protection.detected) {
      onProgress?.({ stage: 'MANUAL_REQUIRED', message: `检测到 ${protection.signal}，需要手动处理` })
      await page.waitForTimeout(60000)
      if (detectBotProtection(await page.content()).detected) {
        return { success: false, error: 'BOT_PROTECTION', message: '需要手动完成验证', manualRequired: true }
      }
    }
    
    onProgress?.({ stage: 'FILLING_FORM', message: '正在填写挂号信息...' })
    
    // 填写科室
    const deptInput = await findElement(page, [
      'input[placeholder*="科室"]', 'input[name*="department"]', '#department', 'select[name*="department"]'
    ])
    if (deptInput) {
      const tag = await deptInput.evaluate(el => el.tagName.toLowerCase())
      if (tag === 'select') await deptInput.selectOption({ label: department })
      else await deptInput.fill(department)
    }
    
    // 填写日期
    const dateInput = await findElement(page, [
      'input[type="date"]', 'input[placeholder*="日期"]', 'input[name*="date"]', '#appointmentDate'
    ])
    if (dateInput) await dateInput.fill(actualDate)
    
    // 选择医生
    if (preferredDoctor) {
      onProgress?.({ stage: 'SELECTING_DOCTOR', message: `正在选择医生 ${preferredDoctor}...` })
      const doc = await page.locator(`text=${preferredDoctor}`).first()
      if (doc) await doc.click()
    }
    
    // 选择时段
    if (timeSlot !== 'any') {
      const slot = await page.locator(`text=${timeSlot === 'morning' ? '上午' : '下午'}`).first()
      if (slot) await slot.click()
    }
    
    // 填写患者信息
    if (patientName) {
      const nameInput = await findElement(page, ['input[placeholder*="姓名"]', 'input[name*="name"]', '#patientName'])
      if (nameInput) await nameInput.fill(patientName)
    }
    
    onProgress?.({ stage: 'WAITING_CONFIRMATION', message: '请检查信息后点击提交按钮' })
    
    // 高亮提交按钮
    const submitBtn = await findElement(page, [
      'button:has-text("提交")', 'button:has-text("确认")', 'button:has-text("预约")', 'button[type="submit"]'
    ])
    if (submitBtn) {
      await submitBtn.evaluate(el => { el.style.boxShadow = '0 0 10px 5px #22c55e' })
    }
    
    // 等待用户提交
    await Promise.race([
      page.waitForNavigation({ timeout: 120000 }),
      page.waitForSelector('.success, [class*="success"]', { timeout: 120000 }),
      page.waitForTimeout(120000)
    ])
    
    // 检查结果
    const resultText = await page.innerText('body')
    const isSuccess = ['预约成功', '挂号成功', '提交成功'].some(s => resultText.includes(s))
    
    if (isSuccess) {
      const screenshot = await page.screenshot({ type: 'png' })
      return {
        success: true,
        bookingNo: extractBookingNo(resultText) || `TCM-${Date.now()}`,
        queueNo: extractQueueNo(resultText),
        appointmentTime: `${actualDate} ${timeSlot === 'morning' ? '上午' : '下午'}`,
        department,
        screenshot: screenshot.toString('base64')
      }
    } else {
      return { success: false, error: 'UNKNOWN_RESULT', message: '无法确认结果，请查看浏览器' }
    }
  } catch (error) {
    return { success: false, error: 'EXECUTION_ERROR', message: error.message }
  } finally {
    setTimeout(() => browser.close().catch(() => {}), 30000)
  }
}
