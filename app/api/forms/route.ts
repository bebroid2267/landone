import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  console.log('🚀 API /forms POST called')
  
  try {
    console.log('📥 Reading request body...')
    const body = await request.json()
    console.log('📄 Request body:', body)
    
    const { email, monthlyAdSpend, phoneNumber, companyWebsite, userId, formType = 'talk_to_expert' } = body

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

    console.log('✅ All validations passed, inserting into database...')
    // Insert form data into database
    const { data, error } = await supabase
      .from('forms')
      .insert([
        {
          user_id: userId || null,
          email: email.trim(),
          monthly_ad_spend: monthlyAdSpend.trim(),
          phone_number: phoneNumber.trim(),
          company_website: companyWebsite?.trim() || null,
          form_type: formType
        }
      ])
      .select()

    if (error) {
      console.error('❌ Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to save form data' }, 
        { status: 500 }
      )
    }

    console.log('✅ Form data saved successfully:', data)
    return NextResponse.json({ 
      message: 'Form submitted successfully',
      formId: data[0]?.id
    }, { status: 201 })

  } catch (error) {
    console.error('❌ API Error in forms endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const formType = searchParams.get('formType')

    let query = supabase.from('forms').select('*')

    if (userId) {
      query = query.eq('user_id', userId)
    }

    if (formType) {
      query = query.eq('form_type', formType)
    }

    // Order by creation date, newest first
    query = query.order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error('Error fetching forms:', error)
      return NextResponse.json(
        { error: 'Failed to fetch forms' }, 
        { status: 500 }
      )
    }

    return NextResponse.json({ forms: data || [] })

  } catch (error) {
    console.error('Error in forms GET endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}