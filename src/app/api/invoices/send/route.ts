import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * API to send an invoice PDF via Resend
 */
export async function POST(req: Request) {
  try {
    const { 
      invoice_number, 
      customer_email, 
      customer_name, 
      pdf_base64, 
      seller_name 
    } = await req.json()

    if (!customer_email) {
      return NextResponse.json(
        { success: false, error: 'Recipient email is missing' },
        { status: 400 }
      )
    }

    if (!pdf_base64) {
      return NextResponse.json(
        { success: false, error: 'PDF attachment is missing' },
        { status: 400 }
      )
    }

    // Clean base64 string if it has the data: URI prefix
    const base64Content = pdf_base64.replace(/^data:application\/pdf;base64,/, '')

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

    const { data, error } = await resend.emails.send({
      from: `Twenty 7 Shop <${fromEmail}>`,
      to: [customer_email],
      subject: `Invoice #${invoice_number} from ${seller_name || 'Twenty 7 Shop'}`,
      text: `Hello ${customer_name},\n\nPlease find your invoice #${invoice_number} attached to this email.\n\nBest regards,\n${seller_name || 'Twenty 7 Shop'}`,
      attachments: [
        {
          filename: `Invoice_${invoice_number}.pdf`,
          content: base64Content,
        },
      ],
    })

    if (error) {
      console.error('Resend Error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Send Email API error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
