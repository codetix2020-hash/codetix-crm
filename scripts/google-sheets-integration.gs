/**
 * CodeTix CRM - Google Sheets Integration
 * 
 * Este script envía leads desde Google Sheets al CRM automáticamente
 * 
 * SETUP:
 * 1. Abre tu Google Sheet
 * 2. Extensions → Apps Script
 * 3. Pega este código
 * 4. Cambia YOUR_CRM_BASE_URL por tu dominio real
 * 5. Guarda y ejecuta sendLeadToCRM() manualmente para probar
 * 
 * COLUMNAS DEL SHEET (1-based):
 * A: Nombre del negocio  → business_name
 * B: Nombre de contacto → name
 * C: Teléfono           → phone
 * D: Ciudad             → city
 * E: Sector             → sector
 * F: Notas              → notes
 * G: Estado CRM (uso interno del script)
 * H: ID CRM (uso interno del script)
 */

// ⚙️ CONFIGURACIÓN
const CONFIG = {
  CRM_BASE_URL: 'https://YOUR_CRM_BASE_URL.vercel.app',
  CRM_API_KEY: 'YOUR_CRM_API_KEY', // Reemplaza por PropertiesService o valor seguro
};

const CRM_API_URL = CONFIG.CRM_BASE_URL + '/api/leads';

const ALLOWED_LEAD_FIELDS = [
  'id',
  'business_name',
  'name',
  'phone',
  'sector',
  'city',
  'status',
  'assigned_to',
  'notes',
  'created_at',
];

const COLUMN_INDEX = {
  business_name: 0,
  name: 1,
  phone: 2,
  city: 3,
  sector: 4,
  notes: 5,
  status: null,
  id: null,
  assigned_to: null,
  created_at: null,
};

const STATUS_COLUMN = 7; // Columna G (1-based)
const RESPONSE_COLUMN = 8; // Columna H (1-based)
const DEFAULT_STATUS = 'nuevo';

const toCellString = (value) => {
  if (value === null || value === undefined) return null;
  if (Object.prototype.toString.call(value) === '[object Date]') {
    return value.toISOString();
  }
  const str = value.toString().trim();
  return str.length ? str : null;
};

const isValidISODate = (value) => {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
};

const getFieldValue = (row, field) => {
  const index = COLUMN_INDEX[field];
  if (typeof index !== 'number') return null;
  return toCellString(row[index]);
};

const buildLeadPayload = (row) => {
  const lead = {
    business_name: getFieldValue(row, 'business_name'),
    name: getFieldValue(row, 'name'),
    phone: getFieldValue(row, 'phone'),
    sector: getFieldValue(row, 'sector'),
    city: getFieldValue(row, 'city'),
    notes: getFieldValue(row, 'notes'),
    status: getFieldValue(row, 'status') || DEFAULT_STATUS,
    id: getFieldValue(row, 'id'),
    assigned_to: getFieldValue(row, 'assigned_to'),
    created_at: getFieldValue(row, 'created_at'),
  };

  if (!lead.business_name && !lead.name && !lead.phone) {
    return null;
  }

  const payload = {};
  ALLOWED_LEAD_FIELDS.forEach((field) => {
    const value = lead[field];
    if (value === null || value === undefined) return;
    if (field === 'created_at' && !isValidISODate(value)) return;
    payload[field] = value;
  });

  return payload;
};

/**
 * Envía el lead de la última fila al CRM
 */
function sendLeadToCRM() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const lastRow = sheet.getLastRow();
  
  // Validar que hay datos
  if (lastRow < 2) {
    Logger.log('No hay datos para enviar');
    return;
  }
  
  // Obtener datos de la última fila
  const range = sheet.getRange(lastRow, 1, 1, sheet.getLastColumn());
  const data = range.getValues()[0];

  const lead = buildLeadPayload(data);
  if (!lead) {
    Logger.log('Fila ignorada: se necesita al menos business_name, name o phone');
    return;
  }
  
  Logger.log('Enviando lead: ' + JSON.stringify(lead));
  
  // Enviar al CRM
  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + CONFIG.CRM_API_KEY,
    },
    payload: JSON.stringify({ leads: [lead] }),
    muteHttpExceptions: true,
  };
  
  try {
    const response = UrlFetchApp.fetch(CRM_API_URL, options);
    const statusCode = response.getResponseCode();
    const result = JSON.parse(response.getContentText());
    
    // Marcar resultado en columna G
    const statusCell = sheet.getRange(lastRow, STATUS_COLUMN);
    
    if (statusCode === 200 && result.success) {
      statusCell.setValue('✅ Enviado');
      statusCell.setBackground('#d4edda');
      Logger.log('Lead enviado exitosamente');
      
      // Opcional: guardar respuesta recibida en columna H
      sheet.getRange(lastRow, RESPONSE_COLUMN).setValue(JSON.stringify(result));
    } else {
      statusCell.setValue('❌ Error: ' + (result.error || 'Desconocido'));
      statusCell.setBackground('#f8d7da');
      Logger.log('Error al enviar: ' + (result.error || response.getContentText()));
    }
    
  } catch (error) {
    Logger.log('Error de conexión: ' + error.toString());
    const statusCell = sheet.getRange(lastRow, 7);
    statusCell.setValue('❌ Error de conexión');
    statusCell.setBackground('#f8d7da');
  }
}

/**
 * Envía múltiples leads (las últimas N filas sin estado)
 * @param {number} maxRows - Número máximo de filas a procesar
 */
function sendMultipleLeads(maxRows = 10) {
  const sheet = SpreadsheetApp.getActiveSheet();
  const lastRow = sheet.getLastRow();
  
  let processed = 0;

  // Procesar desde la última fila hacia arriba
  for (let row = lastRow; row >= 2 && processed < maxRows; row--) {
    const statusCell = sheet.getRange(row, STATUS_COLUMN);
    const status = statusCell.getValue();
    
    // Solo procesar filas sin estado
    if (!status || status === '') {
      // Seleccionar esta fila temporalmente
      sheet.setActiveRange(sheet.getRange(row, 1));
      
      // Enviar
      sendLeadToCRM();
      
      processed++;
      
      // Pausa para no saturar la API
      Utilities.sleep(1000);
    }
  }
  
  Logger.log('Procesadas ' + processed + ' filas');
}

/**
 * Trigger automático cuando se edita la hoja
 * Para activar: Triggers → Add Trigger → onEdit → On edit
 */
function onEdit(e) {
  const range = e.range;
  const sheet = range.getSheet();
  const row = range.getRow();
  const col = range.getColumn();

  // Solo procesar si se editó columna A (nombre) y no es la primera fila
  if (col === 1 && row > 1) {
    const statusCell = sheet.getRange(row, STATUS_COLUMN);
    const currentStatus = statusCell.getValue();
    
    // Solo auto-enviar si no tiene estado previo
    if (!currentStatus || currentStatus === '') {
      // Esperar 2 segundos para dar tiempo a completar otras columnas
      Utilities.sleep(2000);
      sendLeadToCRM();
    }
  }
}

/**
 * Crear menú personalizado
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('📊 CodeTix CRM')
    .addItem('🚀 Enviar Lead Actual', 'sendLeadToCRM')
    .addItem('📤 Enviar Múltiples (10)', 'sendMultipleLeads')
    .addItem('🧪 Probar Conexión', 'testConnection')
    .addToUi();
}

/**
 * Probar la conexión con el CRM
 */
function testConnection() {
  const url = CONFIG.CRM_BASE_URL + '/api/debug';
  
  try {
    const response = UrlFetchApp.fetch(url, { method: 'get', muteHttpExceptions: true });
    const result = JSON.parse(response.getContentText());
    
    if (response.getResponseCode() === 200) {
      SpreadsheetApp.getUi().alert(
        '✅ Conexión exitosa\n\n' +
        'Status: ' + result.status + '\n' +
        'Env: ' + result.env + '\n' +
        'API Key: ' + result.leadsApiKey
      );
    } else {
      SpreadsheetApp.getUi().alert('❌ Error de conexión\n\nCódigo: ' + response.getResponseCode());
    }
  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Error\n\n' + error.toString());
  }
}

/**
 * Configurar sheet con headers si es nuevo
 */
function setupSheet() {
  const sheet = SpreadsheetApp.getActiveSheet();
  
  // Verificar si ya tiene headers
  const firstRow = sheet.getRange(1, 1, 1, 8).getValues()[0];
  if (firstRow[0] !== '') {
    Logger.log('La hoja ya tiene datos');
    return;
  }
  
  // Configurar headers
  const headers = [
    'Negocio *',
    'Contacto',
    'Teléfono',
    'Ciudad',
    'Sector',
    'Notas',
    'Estado CRM',
    'ID CRM'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.getRange(1, 1, 1, headers.length).setBackground('#4285f4');
  sheet.getRange(1, 1, 1, headers.length).setFontColor('#ffffff');
  
  // Ajustar anchos de columna
  sheet.setColumnWidth(1, 180); // Negocio
  sheet.setColumnWidth(2, 150); // Contacto
  sheet.setColumnWidth(3, 120); // Teléfono
  sheet.setColumnWidth(4, 150); // Ciudad
  sheet.setColumnWidth(5, 140); // Sector
  sheet.setColumnWidth(6, 220); // Notas
  sheet.setColumnWidth(7, 120); // Estado
  sheet.setColumnWidth(8, 250); // ID
  
  // Congelar primera fila
  sheet.setFrozenRows(1);
  
  SpreadsheetApp.getUi().alert('✅ Hoja configurada correctamente\n\nYa puedes agregar leads!');
}

/**
 * Agregar datos de prueba
 */
function addTestData() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const lastRow = sheet.getLastRow();
  
  const testLeads = [
    ['Tienda Creativa', 'Juan Pérez', '+34600111222', 'Vilanova i la Geltrú', 'Marketing', 'Interesado en web'],
    ['Consultoría Digital', 'María García', '+34600333444', 'Barcelona', 'Consultoría', 'Necesita chatbot'],
    ['Restaurante El Puerto', 'Pedro López', '+34600555666', 'Sitges', 'Hostelería', 'Consulta sobre SEO']
  ];
  
  sheet.getRange(lastRow + 1, 1, testLeads.length, 6).setValues(testLeads);
  
  SpreadsheetApp.getUi().alert('✅ Se agregaron 3 leads de prueba');
}
