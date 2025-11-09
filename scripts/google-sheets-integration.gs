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
 * COLUMNAS REQUERIDAS:
 * A: Nombre
 * B: Teléfono
 * C: Email
 * D: Ciudad
 * E: Código Postal
 * F: Notas
 * G: Estado (se actualiza automáticamente)
 */

// ⚙️ CONFIGURACIÓN
const CONFIG = {
  CRM_BASE_URL: 'https://YOUR_CRM_BASE_URL.vercel.app',
  CRM_API_KEY: 'YOUR_CRM_API_KEY', // Reemplaza por PropertiesService o valor seguro
};

const CRM_API_URL = CONFIG.CRM_BASE_URL + '/api/leads';

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
  const range = sheet.getRange(lastRow, 1, 1, 6);
  const data = range.getValues()[0];
  
  // Validar que hay al menos nombre
  if (!data[0] || data[0].toString().trim() === '') {
    Logger.log('El nombre es obligatorio');
    return;
  }
  
  // Construir objeto lead
  const lead = {
    name: data[0].toString().trim(),
    phone: data[1] ? data[1].toString().trim() : null,
    email: data[2] ? data[2].toString().trim() : null,
    city: data[3] ? data[3].toString().trim() : null,
    postal_code: data[4] ? data[4].toString().trim() : null,
    source: 'Google Sheets',
    notes: data[5] ? data[5].toString().trim() : null,
  };
  
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
    const statusCell = sheet.getRange(lastRow, 7);
    
    if (statusCode === 200 && result.success) {
      statusCell.setValue('✅ Enviado');
      statusCell.setBackground('#d4edda');
      Logger.log('Lead enviado exitosamente');
      
      // Opcional: guardar respuesta recibida en columna H
      sheet.getRange(lastRow, 8).setValue(JSON.stringify(result.received || result));
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
    const statusCell = sheet.getRange(row, 7);
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
    const statusCell = sheet.getRange(row, 7);
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
    'Nombre *',
    'Teléfono',
    'Email',
    'Ciudad',
    'Código Postal',
    'Notas',
    'Estado CRM',
    'ID CRM'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.getRange(1, 1, 1, headers.length).setBackground('#4285f4');
  sheet.getRange(1, 1, 1, headers.length).setFontColor('#ffffff');
  
  // Ajustar anchos de columna
  sheet.setColumnWidth(1, 150); // Nombre
  sheet.setColumnWidth(2, 120); // Teléfono
  sheet.setColumnWidth(3, 180); // Email
  sheet.setColumnWidth(4, 150); // Ciudad
  sheet.setColumnWidth(5, 100); // CP
  sheet.setColumnWidth(6, 200); // Notas
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
    ['Juan Pérez', '+34600111222', 'juan@test.com', 'Vilanova i la Geltrú', '08800', 'Interesado en web'],
    ['María García', '+34600333444', 'maria@test.com', 'Barcelona', '08015', 'Necesita chatbot'],
    ['Pedro López', '+34600555666', 'pedro@test.com', 'Sitges', '08870', 'Consulta sobre SEO']
  ];
  
  sheet.getRange(lastRow + 1, 1, testLeads.length, 6).setValues(testLeads);
  
  SpreadsheetApp.getUi().alert('✅ Se agregaron 3 leads de prueba');
}
