
/**
 * GOOGLE APPS SCRIPT SOURCE
 * Dán code này vào phần App Script của Google Sheet của bạn
 */

// Fix: Added global declarations for Google Apps Script types to satisfy the TypeScript compiler
declare var SpreadsheetApp: any;
declare var ContentService: any;

const SPREADSHEET_ID = "16QwNRbM5NppnfFYujPUq1ZweYcqbnetF-z4SvTS01n8";

function doPost(e) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const data = JSON.parse(e.postData.contents);
  
  if (data.action === 'sync') {
    const storageSheet = ss.getSheetByName('AppData') || ss.insertSheet('AppData');
    storageSheet.clear();
    storageSheet.getRange(1, 1).setValue(JSON.stringify(data.payload));
    return ContentService.createTextOutput("SUCCESS").setMimeType(ContentService.MimeType.TEXT);
  }
}

function doGet(e) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const action = e.parameter.action;
  
  if (action === 'pull') {
    const storageSheet = ss.getSheetByName('AppData');
    const data = storageSheet ? storageSheet.getRange(1, 1).getValue() : "{}";
    return ContentService.createTextOutput(data).setMimeType(ContentService.MimeType.JSON);
  }
}
