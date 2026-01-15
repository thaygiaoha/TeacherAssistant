
/**
 * @file Google Apps Script backend - Bản JavaScript thuần cho Giáo viên
 * Thầy copy toàn bộ file này dán vào Google Apps Script (Editor)
 */

// Added declarations for Google Apps Script global objects to resolve TypeScript errors
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

    // 1. Lấy Ảnh hoạt động
    var newsData = [];
    if (newsSheet) {
      var data = newsSheet.getRange("A2:B50").getValues();
      for (var i = 0; i < data.length; i++) {
        if (data[i][1]) {
          newsData.push({ title: String(data[i][0] || "Hoạt động"), link: String(data[i][1]) });
        }
      }
    }

    // 2. Lấy Tin tức
    var newsList = [];
    if (newsSheet) {
      var data = newsSheet.getRange("F2:G20").getValues();
      for (var i = 0; i < data.length; i++) {
        if (data[i][0]) {
          newsList.push({ news: String(data[i][0]), link: String(data[i][1]) });
        }
      }
    }

    // 3. Lấy Map ảnh thẻ
    var avatars = {};
    if (xlhkSheet) {
      var data = xlhkSheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        var idKey = String(data[i][1] || "").trim();
        var imgUrl = String(data[i][6] || "").trim();
        if (idKey) avatars[idKey] = imgUrl;
      }
    }

    // 4. Lấy BCH
    var bchNames = [];
    if (newsSheet) {
      var data = newsSheet.getRange("C2:E10").getValues();
      for (var i = 0; i < data.length; i++) {
        if (data[i][0]) {
          var mhs = String(data[i][1] || "").trim();
          bchNames.push({ 
            name: String(data[i][0]), 
            idhs: mhs, 
            position: String(data[i][2]),
            avatarUrl: avatars[mhs] || ""
          });
        }
      }
    }

    // 5. Lấy Quy tắc
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

    // 6. Lấy Logs
    var getLogs = function(sh) {
      if (!sh) return [];
      return sh.getDataRange().getValues();
    };

    // 7. Lấy danh sách học sinh
    var dsSheet = ss.getSheetByName("danhsach");
    var students = [];
    if (dsSheet) {
      var data = dsSheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        var mhs = String(data[i][8] || "").trim();
        students.push({
          stt: data[i][0], name: String(data[i][1]), class: String(data[i][2]), 
          date: String(data[i][3]), gender: String(data[i][4]), 
          phoneNumber: String(data[i][5]), accommodation: String(data[i][6]), 
          cccd: String(data[i][7]), idhs: mhs, avatarUrl: avatars[mhs] || "" 
        });
      }
    }

    var output = JSON.stringify({
      gvcnName: gvcnName,
      appPassword: appPassword,
      newsData: newsData,
      newsList: newsList,
      bchNames: bchNames,
      students: students,
      violations: getRules("bangloi"),
      rewards: getRules("thanhtich").concat(getRules("bch")),
      violationLogs: getLogs(vpSheet),
      rewardLogs: getLogs(thSheet)
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
    var dsSheet = ss.getSheetByName("danhsach");
    if (dsSheet) {
      var lastRow = dsSheet.getLastRow();
      var nextStt = lastRow; // Giả định hàng đầu là header
      dsSheet.appendRow([nextStt, student.name, "", "", "", "", "", "", student.idhs]);
    }

    // Khởi tạo ở các sheet khác
    var targetSheets = ["vipham", "thuong", "tuan", "xeploai", "xeploaihk", "diemdanh"];
    targetSheets.forEach(function(name) {
      var sh = ss.getSheetByName(name);
      if (sh) sh.appendRow([student.name, student.idhs]);
    });
    return ContentService.createTextOutput("SUCCESS");
  }

  if (action === 'sync_all_master') {
    var students = data.payload.students;
    var relatives = data.payload.relatives;
    
    var dsSheet = ss.getSheetByName("danhsach");
    if (dsSheet) {
      if (dsSheet.getLastRow() > 1) dsSheet.getRange(2, 1, dsSheet.getLastRow() - 1, 9).clearContent();
      var dsRows = students.map(function(s) { return [s.stt, s.name, s.class, s.date, s.gender, s.phoneNumber, s.accommodation, s.cccd, s.idhs]; });
      if (dsRows.length > 0) dsSheet.getRange(2, 1, dsRows.length, 9).setValues(dsRows);
    }

    var ntSheet = ss.getSheetByName("nguoithan");
    if (ntSheet) {
      if (ntSheet.getLastRow() > 1) ntSheet.getRange(2, 1, ntSheet.getLastRow() - 1, 10).clearContent();
      var ntRows = relatives.map(function(r) { return [r.idhs, r.namefather, r.phonefather, r.datefather, r.jobfather, r.namemother, r.phonemother, r.datemother, r.jobmother, r.hoancanh]; });
      if (ntRows.length > 0) ntSheet.getRange(2, 1, ntRows.length, 10).setValues(ntRows);
    }

    var targetSheets = ["vipham", "thuong", "tuan", "xeploai", "xeploaihk", "diemdanh"];
    var baseIdentity = students.map(function(s) { return [s.name, s.idhs]; });
    targetSheets.forEach(function(name) {
      var sh = ss.getSheetByName(name);
      if (sh) {
        if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, 2).clearContent();
        if (baseIdentity.length > 0) sh.getRange(2, 1, baseIdentity.length, 2).setValues(baseIdentity);
      }
    });
    return ContentService.createTextOutput("SUCCESS");
  }

  if (action === 'update_record') {
    var sheet = ss.getSheetByName(data.target);
    if (!sheet) return ContentService.createTextOutput("SHEET_NOT_FOUND");
    var rows = sheet.getDataRange().getValues();
    var studentId = String(data.studentId);

    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][1]) === studentId) {
        var targetCol = 3;
        for (var j = 2; j < rows[i].length; j++) {
          if (!rows[i][j]) { targetCol = j + 1; break; }
          targetCol = j + 2;
        }
        if (data.payloads && data.payloads.length > 0) {
          sheet.getRange(i + 1, targetCol, 1, data.payloads.length).setValues([data.payloads]);
        } else {
          sheet.getRange(i + 1, targetCol).setValue(data.payload);
        }
        return ContentService.createTextOutput("SUCCESS");
      }
    }
  }

  if (action === 'reset_week') {
    var sheets = ["vipham", "thuong"];
    sheets.forEach(function(name) {
      var sh = ss.getSheetByName(name);
      if (sh && sh.getLastRow() > 1) {
        var lastCol = sh.getLastColumn();
        if (lastCol >= 3) sh.getRange(2, 3, sh.getLastRow() - 1, lastCol - 2).clearContent();
      }
    });
    return ContentService.createTextOutput("SUCCESS");
  }

  if (action === 'save_final_grading') {
    var weekLabel = String(data.week);
    var results = data.results;
    var target = "xeploai"; 
    if (weekLabel.indexOf('w') === 0) target = "tuan";
    if (weekLabel === "HK1" || weekLabel === "HK2" || weekLabel === "CN") target = "xeploaihk";

    var sh = ss.getSheetByName(target);
    if (!sh) return ContentService.createTextOutput("ERROR");

    var headers = sh.getDataRange().getValues()[0];
    var colIdx = headers.indexOf(weekLabel);
    if (colIdx === -1) {
      colIdx = headers.length;
      sh.getRange(1, colIdx + 1).setValue(weekLabel);
    }

    var rows = sh.getDataRange().getValues();
    results.forEach(function(res) {
      for (var i = 1; i < rows.length; i++) {
        if (String(rows[i][1]) === String(res.idhs)) {
          sh.getRange(i + 1, colIdx + 1).setValue(res.rank || res.score);
          break;
        }
      }
    });
    return ContentService.createTextOutput("SUCCESS");
  }
}
