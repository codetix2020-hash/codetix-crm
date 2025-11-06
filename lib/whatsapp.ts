// WhatsApp Business API integration
// Compatible con 360dialog y Twilio

type WhatsAppProvider = '360dialog' | 'twilio'

interface WhatsAppMessage {
  to: string
  message: string
  template?: string
  templateParams?: string[]
}

interface WhatsAppResponse {
  success: boolean
  messageId?: string
  error?: string
}

class WhatsAppService {
  private provider: WhatsAppProvider
  private apiKey: string
  private apiUrl: string
  private phoneId?: string

  constructor() {
    this.provider = (process.env.WHATSAPP_PROVIDER || '360dialog') as WhatsAppProvider
    this.apiKey = process.env.WHATSAPP_API_KEY || ''
    this.apiUrl = process.env.WHATSAPP_API_URL || ''
    this.phoneId = process.env.WHATSAPP_PHONE_ID
  }

  // Enviar mensaje de texto simple
  async sendMessage({ to, message }: WhatsAppMessage): Promise<WhatsAppResponse> {
    try {
      if (this.provider === '360dialog') {
        return await this.send360DialogMessage(to, message)
      } else {
        return await this.sendTwilioMessage(to, message)
      }
    } catch (error: any) {
      console.error('WhatsApp send error:', error)
      return { success: false, error: error.message }
    }
  }

  // Enviar plantilla (para mensajes fuera de la ventana de 24h)
  async sendTemplate({ to, template, templateParams = [] }: WhatsAppMessage): Promise<WhatsAppResponse> {
    try {
      if (this.provider === '360dialog') {
        return await this.send360DialogTemplate(to, template!, templateParams)
      } else {
        return await this.sendTwilioTemplate(to, template!, templateParams)
      }
    } catch (error: any) {
      console.error('WhatsApp template send error:', error)
      return { success: false, error: error.message }
    }
  }

  // ========== 360dialog Implementation ==========
  private async send360DialogMessage(to: string, message: string): Promise<WhatsAppResponse> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'D360-API-KEY': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: `34${to.replace(/\D/g, '')}`,
        type: 'text',
        text: {
          body: message
        }
      })
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to send message')
    }

    return {
      success: true,
      messageId: data.messages?.[0]?.id
    }
  }

  private async send360DialogTemplate(
    to: string, 
    template: string, 
    params: string[]
  ): Promise<WhatsAppResponse> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'D360-API-KEY': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: `34${to.replace(/\D/g, '')}`,
        type: 'template',
        template: {
          name: template,
          language: {
            code: 'es'
          },
          components: [
            {
              type: 'body',
              parameters: params.map(p => ({ type: 'text', text: p }))
            }
          ]
        }
      })
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to send template')
    }

    return {
      success: true,
      messageId: data.messages?.[0]?.id
    }
  }

  // ========== Twilio Implementation ==========
  private async sendTwilioMessage(to: string, message: string): Promise<WhatsAppResponse> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: `whatsapp:${fromNumber}`,
          To: `whatsapp:+34${to.replace(/\D/g, '')}`,
          Body: message
        })
      }
    )

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to send message')
    }

    return {
      success: true,
      messageId: data.sid
    }
  }

  private async sendTwilioTemplate(
    to: string, 
    template: string, 
    params: string[]
  ): Promise<WhatsAppResponse> {
    // Twilio usa Content SIDs para plantillas
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: `whatsapp:${fromNumber}`,
          To: `whatsapp:+34${to.replace(/\D/g, '')}`,
          ContentSid: template,
          ContentVariables: JSON.stringify(
            params.reduce((acc, param, i) => ({ ...acc, [`${i + 1}`]: param }), {})
          )
        })
      }
    )

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to send template')
    }

    return {
      success: true,
      messageId: data.sid
    }
  }

  // Verificar que el servicio está configurado
  isConfigured(): boolean {
    return !!(this.apiKey && this.apiUrl)
  }
}

export const whatsappService = new WhatsAppService()

// Helper para notificar a un agente sobre un nuevo lead
export async function notifyAgentNewLead(
  agentPhone: string,
  leadName: string,
  leadPhone: string,
  leadCity?: string
) {
  const message = `🔔 Nuevo Lead Asignado\n\nNombre: ${leadName}\nTeléfono: ${leadPhone}${leadCity ? `\nCiudad: ${leadCity}` : ''}\n\n¡Contáctalo pronto!`
  
  return await whatsappService.sendMessage({
    to: agentPhone,
    message
  })
}

// Helper para recordatorio si el lead no fue contactado
export async function sendFollowUpReminder(
  agentPhone: string,
  leadName: string,
  hoursWaiting: number
) {
  const message = `⏰ Recordatorio\n\nEl lead ${leadName} lleva ${hoursWaiting}h sin contactar.\n\n¿Necesitas ayuda con este lead?`
  
  return await whatsappService.sendMessage({
    to: agentPhone,
    message
  })
}
