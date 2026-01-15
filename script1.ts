
/**
 * @file Google Apps Script backend - Teacher Assistant Pro
 * Ngôn ngữ: JavaScript
 */

// Added declarations for Google Apps Script globals to satisfy TypeScript compiler
var SPREADSHEET_ID = "16QwNRbM5NppnfFYujPUq1ZweYcqbnetF-z4SvTS01n8";

function doGet(e) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var action = e.parameter.action;

  if (action === 'get_initial_data') {
    var newsSheet = ss.getSheetByName("news");
    var xlhkSheet = ss.getSheetByName("xeploaihk");
    var vpSheet = ss.getSheetByName("vipham");
    var thSheet = ss.getSheetByName("thuong");
    
    var gvcnName = newsSheet ? String(newsSheet.getRange("H2").getValue()) : "Chưa cập nhật";
    var appPassword = xlhkSheet ? String(xlhkSheet.getRange("F2").getValue()) : "123";

    // Lấy Map ảnh thẻ (Cột B là IDHS, Cột G là URL Ảnh)
    var avatars = {};
    if (xlhkSheet) {
      var data = xlhkSheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        var idKey = String(data[i][1] || "").trim();
        var imgUrl = String(data[i][6] || "").trim();
        if (idKey) avatars[idKey] = imgUrl;
      }
    }

    var dsSheet = ss.getSheetByName("danhsach");
    var students = [];
    if (dsSheet) {
      var data = dsSheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (!data[i][1]) continue;
        var mhs = String(data[i][8] || "").trim();
        students.push({
          stt: data[i][0], name: String(data[i][1]), class: String(data[i][2]), 
          date: String(data[i][3]), gender: String(data[i][4]), 
          phoneNumber: String(data[i][5]), idhs: mhs, avatarUrl: avatars[mhs] || "" 
        });
      }
    }

    var getRules = function(sheetName) {
      var sh = ss.getSheetByName(sheetName);
      if (!sh) return [];
      var d = sh.getDataRange().getValues();
      var res = [];
      for (var i = 1; i < d.length; i++) {
        res.push({ nameRule: String(d[i][0]), codeRule: String(d[i][1]), points: Number(d[i][2]) });
      }
      return res;
    };

    var output = JSON.stringify({
      gvcnName: gvcnName,
      appPassword: appPassword,
      students: students,
      violations: getRules("bangloi"),
      rewards: getRules("thanhtich").concat(getRules("bch")),
      violationLogs: vpSheet ? vpSheet.getDataRange().getValues() : [],
      rewardLogs: thSheet ? thSheet.getDataRange().getValues() : [],
      bchNames: newsSheet ? newsSheet.getRange("C2:E10").getValues().filter(r => r[0]).map(r => ({name: r[0], idhs: r[1], position: r[2], avatarUrl: avatars[r[1]] || ""})) : []
    });

    return ContentService.createTextOutput(output).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var data = JSON.parse(e.postData.contents);
  var action = data.action;

  if (action === 'add_single_student') {
    var student = data.payload;
    var stt = parseInt(student.stt);
    var dsSheet = ss.getSheetByName("danhsach");
    
    if (dsSheet) {
      var lastRow = dsSheet.getLastRow();
      var targetRow = (stt && stt > 0 && stt <= lastRow) ? stt + 1 : lastRow + 1;
      
      if (stt && stt > 0 && targetRow <= lastRow) {
        dsSheet.insertRowBefore(targetRow);
      }
      dsSheet.getRange(targetRow, 1, 1, 9).setValues([[stt || lastRow, student.name, "", "", "", "", "", "", student.idhs]]);
      
      var rows = dsSheet.getLastRow();
      for(var i=2; i<=rows; i++) dsSheet.getRange(i, 1).setValue(i-1);
    }

    var targets = ["vipham", "thuong", "tuan", "xeploai", "xeploaihk", "diemdanh"];
    targets.forEach(function(name) {
      var sh = ss.getSheetByName(name);
      if (sh) {
        var rowToInsert = (stt && stt > 0) ? stt + 1 : sh.getLastRow() + 1;
        if (stt && stt > 0 && rowToInsert <= sh.getLastRow()) sh.insertRowBefore(rowToInsert);
        sh.getRange(rowToInsert, 1, 1, 2).setValues([[student.name, student.idhs]]);
      }
    });
    return ContentService.createTextOutput("SUCCESS");
  }

  if (action === 'save_final_grading') {
    var weekLabel = String(data.week);
    var results = data.results; 
    
    var shRank = ss.getSheetByName("xeploai");
    if (shRank) saveToSheet(shRank, weekLabel, results, "rank");

    var shScore = ss.getSheetByName("tuan");
    if (shScore) saveToSheet(shScore, weekLabel, results, "score");

    return ContentService.createTextOutput("SUCCESS");
  }

  if (action === 'update_record') {
    var sheet = ss.getSheetByName(data.target);
    if (!sheet) return ContentService.createTextOutput("ERROR");
    var rows = sheet.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][1]) === String(data.studentId)) {
        var targetCol = 3;
        for (var j = 2; j < rows[i].length; j++) {
          if (!rows[i][j]) { targetCol = j + 1; break; }
          targetCol = j + 2;
        }
        if (data.payloads) sheet.getRange(i+1, targetCol, 1, data.payloads.length).setValues([data.payloads]);
        else if (data.payload) sheet.getRange(i+1, targetCol).setValue(data.payload);
        return ContentService.createTextOutput("SUCCESS");
      }
    }
  }
}

function saveToSheet(sheet, label, results, field) {
  var headers = sheet.getDataRange().getValues()[0];
  var colIdx = headers.indexOf(label);
  if (colIdx === -1) {
    colIdx = headers.length;
    sheet.getRange(1, colIdx + 1).setValue(label);
  }
  var rows = sheet.getDataRange().getValues();
  results.forEach(function(res) {
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][1]) === String(res.idhs)) {
        sheet.getRange(i + 1, colIdx + 1).setValue(res[field]);
        break;
      }
    }
  });
}
