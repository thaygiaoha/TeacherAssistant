/**
 * @file Google Apps Script backend - Tổng hợp từ File 1 & File 2
 * Thầy copy toàn bộ file này dán vào Google Apps Script (Editor)
 */

var SPREADSHEET_ID = "16QwNRbM5NppnfFYujPUq1ZweYcqbnetF-z4SvTS01n8";

function doGet(e) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var action = e.parameter.action;

  // --- HÀM RESET TUẦN MỚI (Lấy từ File 2 - Độc lập và sạch sẽ) ---
  if (action === 'reset_week') {
    var sheetsToReset = ["vipham", "thuong"];
    sheetsToReset.forEach(function(name) {
      var sheet = ss.getSheetByName(name);
      if (sheet) {
        var lastRow = sheet.getLastRow();
        var lastCol = sheet.getLastColumn();
        if (lastRow >= 2 && lastCol >= 3) {
          sheet.getRange(2, 3, lastRow - 1, lastCol - 2).clearContent();
        }
      }
    });
    return ContentService.createTextOutput(JSON.stringify({"status": "success"}))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'get_initial_data') {
    var newsSheet = ss.getSheetByName("news");
    var xlhkSheet = ss.getSheetByName("xeploaihk");
    var vpSheet = ss.getSheetByName("vipham");
    var thSheet = ss.getSheetByName("thuong");

    // --- CÁC HÀM HỖ TRỢ ---
    var getRules = function(sheetName) {
      var sh = ss.getSheetByName(sheetName);
      if (!sh) return [];
      var d = sh.getDataRange().getValues();
      var res = [];
      for (var i = 1; i < d.length; i++) {
        if (!d[i][0]) continue;
        res.push({ nameRule: String(d[i][0]), codeRule: String(d[i][1]), points: Number(d[i][2]) });
      }
      return res;
    };

    var getLogs = function(sh) {
      if (!sh) return [];
      return sh.getDataRange().getValues().slice(1);
    };

    // --- BẮT ĐẦU LẤY DỮ LIỆU ---
    var gvcnName = newsSheet ? String(newsSheet.getRange("H2").getValue()) : "Chưa cập nhật";
    var appPassword = xlhkSheet ? String(xlhkSheet.getRange("F2").getValue()) : "123";

    // 1. Ảnh hoạt động
    var newsData = [];
    if (newsSheet) {
      var dataNews = newsSheet.getRange("A2:B50").getValues();
      for (var i = 0; i < dataNews.length; i++) {
        if (dataNews[i][1]) {
          newsData.push({ title: String(dataNews[i][0] || "Hoạt động"), link: String(dataNews[i][1]) });
        }
      }
    }

    // 2. Tin tức
    var newsList = [];
    if (newsSheet) {
      var dataList = newsSheet.getRange("F2:G20").getValues();
      for (var i = 0; i < dataList.length; i++) {
        if (dataList[i][0]) {
          newsList.push({ news: String(dataList[i][0]), link: String(dataList[i][1]) });
        }
      }
    }

    // 3. Map ảnh thẻ
    var avatars = {};
    if (xlhkSheet) {
      var dataAvatars = xlhkSheet.getDataRange().getValues();
      for (var i = 1; i < dataAvatars.length; i++) {
        var idKey = String(dataAvatars[i][1] || "").trim();
        var imgUrl = String(dataAvatars[i][6] || "").trim();
        if (idKey) avatars[idKey] = imgUrl;
      }
    }

    // 4. Danh sách học sinh (Giữ cấu trúc đầy đủ của File 1)
    var dsSheet = ss.getSheetByName("danhsach");
    var students = [];
    if (dsSheet) {
      var dataDS = dsSheet.getDataRange().getValues();
      for (var i = 1; i < dataDS.length; i++) {
        if (!dataDS[i][1]) continue;
        var mhs = String(dataDS[i][8] || "").trim();
        students.push({
          stt: dataDS[i][0], name: String(dataDS[i][1]), class: String(dataDS[i][2]), 
          date: String(dataDS[i][3]), gender: String(dataDS[i][4]), 
          phoneNumber: String(dataDS[i][5]), accommodation: String(dataDS[i][6]), 
          cccd: String(dataDS[i][7]), idhs: mhs, avatarUrl: avatars[mhs] || "" 
        });
      }
    }

    // 5. Thưởng và BCH (Lấy logic File 2: tách riêng để không bị trùng lặp)
    var rewards = getRules("thanhtich");
    var bchRules = getRules("bch");

    // 6. Ban cán sự lớp
    var bchNames = [];
    if (newsSheet) {
      var dataBCH = newsSheet.getRange("C2:E10").getValues();
      for (var i = 0; i < dataBCH.length; i++) {
        if (dataBCH[i][0]) {
          var idBch = String(dataBCH[i][1]).trim();
          bchNames.push({ 
            name: String(dataBCH[i][0]), 
            idhs: idBch, 
            position: String(dataBCH[i][2]),
            avatarUrl: avatars[idBch] || ""
          });
        }
      }
    }

    var output = {
      gvcnName: gvcnName,
      appPassword: appPassword,
      newsData: newsData,
      newsList: newsList,
      bchNames: bchNames,
      students: students,
      violations: getRules("bangloi"),
      rewards: rewards,
      bchRules: bchRules, // Bổ sung bchRules từ File 2
      violationLogs: getLogs(vpSheet),
      rewardLogs: getLogs(thSheet)
    };

    return ContentService.createTextOutput(JSON.stringify(output)).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var data = JSON.parse(e.postData.contents);
  var action = data.action;

  // --- 1. CHÈN HỌC SINH LẺ (Dùng logic File 2 vì có hỗ trợ chèn vị trí bất kỳ) ---
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
      dsSheet.getRange(targetRow, 1, 1, 9).setValues([[stt || (lastRow), student.name, "", "", "", "", "", "", student.idhs]]);
      
      // Đánh lại số thứ tự
      var rowsDS = dsSheet.getLastRow();
      for(var i=2; i<=rowsDS; i++) dsSheet.getRange(i, 1).setValue(i-1);
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

  // --- 2. ĐỒNG BỘ TỪ EXCEL (Dùng logic File 1 vì thầy xác nhận nó xử lý Import tốt) ---
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

    var targetSheetsSync = ["vipham", "thuong", "tuan", "xeploai", "xeploaihk", "diemdanh"];
    var baseIdentity = students.map(function(s) { return [s.name, s.idhs]; });
    targetSheetsSync.forEach(function(name) {
      var sh = ss.getSheetByName(name);
      if (sh) {
        if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, 2).clearContent();
        if (baseIdentity.length > 0) sh.getRange(2, 1, baseIdentity.length, 2).setValues(baseIdentity);
      }
    });
    return ContentService.createTextOutput("SUCCESS");
  }

  // --- 3. CẬP NHẬT ĐIỂM/LỖI (Giữ logic ổn định của File 1) ---
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

  // --- 4. LƯU XẾP LOẠI CUỐI CÙNG ---
  if (action === 'save_final_grading') {
    var weekLabel = String(data.week);
    var results = data.results;
    var target = "xeploai"; 
    if (weekLabel.indexOf('w') === 0) target = "tuan";
    if (weekLabel === "HK1" || weekLabel === "HK2" || weekLabel === "CN") target = "xeploaihk";

    var shGrade = ss.getSheetByName(target);
    if (!shGrade) return ContentService.createTextOutput("ERROR");

    var headers = shGrade.getDataRange().getValues()[0];
    var colIdx = headers.indexOf(weekLabel);
    if (colIdx === -1) {
      colIdx = headers.length;
      shGrade.getRange(1, colIdx + 1).setValue(weekLabel);
    }

    var rowsGrade = shGrade.getDataRange().getValues();
    results.forEach(function(res) {
      for (var i = 1; i < rowsGrade.length; i++) {
        if (String(rowsGrade[i][1]) === String(res.idhs)) {
          shGrade.getRange(i + 1, colIdx + 1).setValue(res.rank || res.score);
          break;
        }
      }
    });
    return ContentService.createTextOutput("SUCCESS");
  }
}
