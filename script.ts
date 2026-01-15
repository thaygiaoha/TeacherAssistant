/**
 * @file Google Apps Script backend - Teacher Assistant Pro
 * Đã sửa lỗi thứ tự hàm và bổ sung đầy đủ các mục thầy yêu cầu
 */

var SPREADSHEET_ID = "16QwNRbM5NppnfFYujPUq1ZweYcqbnetF-z4SvTS01n8";

function doGet(e) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var action = e.parameter.action;
  // --- HÀM RESET TUẦN MỚI (Đã đưa ra ngoài độc lập) ---
  if (action === 'reset_week') {
    var sheetsToReset = ["vipham", "thuong"];
    sheetsToReset.forEach(function(name) {
      var sheet = ss.getSheetByName(name);
      if (sheet) {
        var lastRow = sheet.getLastRow();
        var lastCol = sheet.getLastColumn();
        // Xóa sạch từ hàng 2, cột 3 (C) trở đi đến hết bảng
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
    
    // --- KHAI BÁO CÁC HÀM HỖ TRỢ TRƯỚC ---
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

    var getLogs = function(sheet) {
      if (!sheet) return [];
      return sheet.getDataRange().getValues().slice(1);
    };
    
    // --- BẮT ĐẦU LẤY DỮ LIỆU ---

    // Nội dung 4: Tên GVCN ở H2
    var gvcnName = newsSheet ? String(newsSheet.getRange("H2").getValue()) : "Chưa cập nhật";
    
    // Mật khẩu app ở F2
    var appPassword = xlhkSheet ? String(xlhkSheet.getRange("F2").getValue()) : "123";

    // Nội dung 3: Ảnh hoạt động (A: Nội dung, B: Link)
    var newsData = [];
    if (newsSheet) {
      var dNews = newsSheet.getRange("A2:B40").getValues();
      for (var i = 0; i < dNews.length; i++) {
        if (dNews[i][1]) newsData.push({ title: dNews[i][0] || "Hoạt động", link: dNews[i][1] });
      }
    }

    // Nội dung 3: Tin tức (F: Tiêu đề, G: Link)
    var newsList = [];
    if (newsSheet) {
      var dList = newsSheet.getRange("F2:G20").getValues();
      for (var i = 0; i < dList.length; i++) {
        if (dList[i][0]) newsList.push({ news: dList[i][0], link: dList[i][1] });
      }
    }

    // Lấy Map ảnh thẻ (Cột B là IDHS, Cột G là URL Ảnh)
    var avatars = {};
    if (xlhkSheet) {
      var dAvatars = xlhkSheet.getDataRange().getValues();
      for (var i = 1; i < dAvatars.length; i++) {
        var idKey = String(dAvatars[i][1] || "").trim();
        var imgUrl = String(dAvatars[i][6] || "").trim();
        if (idKey) avatars[idKey] = imgUrl;
      }
    }

    // Lấy Danh sách học sinh
    var dsSheet = ss.getSheetByName("danhsach");
    var students = [];
    if (dsSheet) {
      var dStudents = dsSheet.getDataRange().getValues();
      for (var i = 1; i < dStudents.length; i++) {
        if (!dStudents[i][1]) continue;
        var mhs = String(dStudents[i][8] || "").trim();
        students.push({
          stt: dStudents[i][0], 
          name: String(dStudents[i][1]), 
          class: String(dStudents[i][2]), 
          date: String(dStudents[i][3]), 
          gender: String(dStudents[i][4]), 
          phoneNumber: String(dStudents[i][5]), 
          idhs: mhs, 
          avatarUrl: avatars[mhs] || "" 
        });
      }
    }

    // Nội dung 1: Tách Thưởng và BCH
    var rewards = getRules("thanhtich");
    var bchRules = getRules("bch");

    // Lấy Ban cán sự lớp (C: Tên, D: IDHS, E: Chức vụ)
    var bchNames = [];
    if (newsSheet) {
      var dBCH = newsSheet.getRange("C2:E10").getValues();
      for (var i = 0; i < dBCH.length; i++) {
        if (dBCH[i][0]) {
          var idBch = String(dBCH[i][1]).trim();
          bchNames.push({
            name: dBCH[i][0],
            idhs: idBch,
            position: dBCH[i][2],
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
      bchRules: bchRules,
      violationLogs: getLogs(vpSheet),
      rewardLogs: getLogs(thSheet)
    };

    return ContentService.createTextOutput(JSON.stringify(output)).setMimeType(ContentService.MimeType.JSON);
  }
}

// Hàm doPost giữ nguyên logic của thầy nhưng dọn dẹp biến cho sạch
function doPost(e) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var data = JSON.parse(e.postData.contents);
  var action = data.action;
  if (action === 'sync_all_master') {
  var students = data.payload.students; // Mảng học sinh từ Excel
  var dsSheet = ss.getSheetByName("danhsach");
  
  if (dsSheet && students && students.length > 0) {
    // 1. Xóa trắng dữ liệu cũ từ hàng 2
    var lastRowDs = dsSheet.getLastRow();
    if (lastRowDs >= 2) dsSheet.getRange(2, 1, lastRowDs - 1, 9).clearContent();
    
    // 2. Chuẩn bị mảng dữ liệu để ghi hàng loạt (Tối ưu tốc độ)
    var matrix = students.map(function(s, idx) {
      return [idx + 1, s.name, s.class, s.date || "", s.gender || "Nam", s.phoneNumber || "", "", "", s.idhs];
    });
    
    // 3. Ghi vào sheet danhsach
    dsSheet.getRange(2, 1, matrix.length, 9).setValues(matrix);
    
    // 4. Đồng bộ sang các sheet nề nếp (Cột A: Tên, Cột B: IDHS)
    var syncMatrix = students.map(function(s) { return [s.name, s.idhs]; });
    var targets = ["vipham", "thuong", "tuan", "xeploai", "xeploaihk", "diemdanh"];
    
    targets.forEach(function(name) {
      var sh = ss.getSheetByName(name);
      if (sh) {
        var lr = sh.getLastRow();
        if (lr >= 2) sh.getRange(2, 1, lr - 1, 2).clearContent();
        sh.getRange(2, 1, syncMatrix.length, 2).setValues(syncMatrix);
      }
    });
  }
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
