import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export const getStatusColor = (status: string) => {
  const normalized = status?.toLowerCase()
  switch (normalized) {
    case 'nuevo':
      return 'bg-blue-100 text-blue-800';
    case 'contactado':
      return 'bg-yellow-100 text-yellow-800';
    case 'en_progreso':
      return 'bg-indigo-100 text-indigo-800';
    case 'ganado':
      return 'bg-green-100 text-green-800';
    case 'perdido':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Formatear teléfono (quitar espacios, guiones, etc)
export function formatPhone(phone: string): string {
  return phone.replace(/\D/g, '').replace(/^34/, '')
}

// Validar teléfono español
export function isValidSpanishPhone(phone: string): boolean {
  const cleaned = formatPhone(phone)
  return /^[67]\d{8}$/.test(cleaned)
}

// Generar link de WhatsApp
export function getWhatsAppLink(phone: string, message?: string): string {
  const clean = formatPhone(phone)
  const encoded = message ? encodeURIComponent(message) : ''
  return `https://wa.me/34${clean}${encoded ? `?text=${encoded}` : ''}`
}

// Obtener plantilla de mensaje por status
export function getWhatsAppTemplate(leadName: string, status: string): string {
  const templates = {
    nuevo: `Hola ${leadName}, soy de CodeTix. Vi tu solicitud de presupuesto. ¿Te viene bien hablar ahora?`,
    contactado: `Hola ${leadName}, te contacto para coordinar una reunión y mostrarte nuestro portfolio.`,
    en_progreso: `Hola ${leadName}, seguimos trabajando en tu solicitud. ¿Tienes alguna duda?`,
    ganado: `Hola ${leadName}, gracias por confiar en CodeTix. Seguimos en contacto.`,
    perdido: `Hola ${leadName}, quedo atento si deseas retomar la conversación más adelante.`,
  }
  const normalized = status?.toLowerCase() as keyof typeof templates
  return templates[normalized] || `Hola ${leadName}, te contacto desde CodeTix.`
}

// Formatear fecha relativa
export function formatRelativeTime(date: string | Date): string {
  const now = new Date()
  const then = new Date(date)
  const diffMs = now.getTime() - then.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Ahora'
  if (diffMins < 60) return `Hace ${diffMins}m`
  if (diffHours < 24) return `Hace ${diffHours}h`
  if (diffDays < 7) return `Hace ${diffDays}d`
  
  return then.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
}

// Obtener emoji del status
export function getStatusEmoji(status: string): string {
  const emojis = {
    nuevo: '🆕',
    contactado: '📞',
    en_progreso: '📈',
    ganado: '✅',
    perdido: '❌',
  }
  const normalized = status?.toLowerCase() as keyof typeof emojis
  return emojis[normalized] || '📋'
}

// Obtener label legible del status
export function getStatusLabel(status: string): string {
  const labels = {
    nuevo: 'Nuevo',
    contactado: 'Contactado',
    en_progreso: 'En progreso',
    ganado: 'Ganado',
    perdido: 'Perdido',
  }
  const normalized = status?.toLowerCase() as keyof typeof labels
  return labels[normalized] || status
}

// Calcular tasa de conversión
export function calculateConversionRate(won: number, total: number): number {
  if (total === 0) return 0
  return Math.round((won / total) * 100)
}

// Validar email
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// Generar iniciales del nombre
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Formatear número con separadores
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('es-ES').format(num)
}

// Generar color aleatorio para avatares
export function generateColorFromString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const colors = [
    'bg-red-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
  ]
  return colors[Math.abs(hash) % colors.length]
}

// Sleep utility para rate limiting
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Sanitizar input de usuario
export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '')
}
