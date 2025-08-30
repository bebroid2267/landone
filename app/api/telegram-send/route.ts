import { NextRequest, NextResponse } from 'next/server'
import fetch from 'node-fetch'

/**
 * Telegram Bot Configuration
 * 
 * Для настройки Telegram бота:
 * 1. Создайте бота через @BotFather в Telegram
 * 2. Получите токен бота и добавьте в .env.local как TELEGRAM_BOT_TOKEN
 * 3. Узнайте Chat ID (можно получить через @userinfobot или API)
 * 4. Добавьте Chat ID в .env.local как TELEGRAM_CHAT_ID
 * 
 * Пример .env.local:
 * TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
 * TELEGRAM_CHAT_ID=123456789
 */
const TOKEN = process.env.TELEGRAM_BOT_TOKEN || '123456:ABC-DEF...'
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '123456789'

export async function POST(request: NextRequest) {
  console.log('🚀 API /telegram-send POST called')
  
  try {
    console.log('📥 Reading request body...')
    const body = await request.json()
    console.log('📄 Request body:', body)
    
    const { 
      email, 
      monthlyAdSpend, 
      phoneNumber, 
      companyWebsite, 
      formType = 'talk_to_expert' 
    } = body

    console.log('🔍 Validating required fields...')
    // Validate required fields
    if (!email || !monthlyAdSpend || !phoneNumber) {
      console.log('❌ Missing required fields')
      return NextResponse.json(
        { error: 'Missing required fields: email, monthlyAdSpend, phoneNumber' }, 
        { status: 400 }
      )
    }

    console.log('📧 Validating email format...')
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.log('❌ Invalid email format')
      return NextResponse.json(
        { error: 'Invalid email format' }, 
        { status: 400 }
      )
    }

    console.log('✅ All validations passed, preparing Telegram message...')
    
    // Формируем сообщение для Telegram
    const text = `💬 <b>Новая заявка с сайта</b>\n`
               + `👤 <b>Имя/Email:</b> ${email}\n`
               + `📧 <b>Email:</b> ${email}\n`
               + `💰 <b>Месячный рекламный бюджет:</b> ${monthlyAdSpend}\n`
               + `📱 <b>Телефон:</b> ${phoneNumber}\n`
               + `🌐 <b>Веб-сайт компании:</b> ${companyWebsite || 'Не указан'}\n`
               + `📝 <b>Тип формы:</b> ${formType}`

    console.log('📤 Sending message to Telegram...')
    
    // Отправляем сообщение в Telegram
    const telegramResponse = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        chat_id: CHAT_ID, 
        text, 
        parse_mode: 'HTML' 
      })
    })

    const telegramResult = await telegramResponse.json()
    console.log('📥 Telegram API response:', telegramResult)

    if (!telegramResponse.ok) {
      console.error('❌ Telegram API error:', telegramResult)
      return NextResponse.json(
        { error: 'Failed to send message to Telegram' }, 
        { status: 500 }
      )
    }

    console.log('✅ Message sent to Telegram successfully')
    return NextResponse.json({ 
      message: 'Form submitted successfully and sent to Telegram',
      telegramMessageId: telegramResult.result?.message_id
    }, { status: 200 })

  } catch (error) {
    console.error('❌ API Error in telegram-send endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}