const SPREADSHEET_ID = "16QwNRbM5NppnfFYujPUq1ZweYcqbnetF-z4SvTS01n8";

function doGet(e) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const action = e.parameter.action;

  // 1. LẤY DỮ LIỆU ĐỂ TÍNH TOÁN (Gộp tất cả vào 1 lần gọi để App nhanh hơn)
  if (action === 'get_initial_data') {
    const getValues = (name) => {
      const sh = ss.getSheetByName(name);
      return sh ? sh.getDataRange().getValues() : [];
    };

    // Lấy danh mục mã (Chuyển sang dạng Object để App dễ dùng)
    const mapCategory = (data) => data.slice(1).map(row => ({
      codeRule: String(row[1]).toUpperCase(),
      points: Number(row[2]) || 0
    }));

    // Lấy dữ liệu ghi chép (Logs) - Trả về mảng các mảng để App tự quét IDHS
    const violationLogs = getValues("vipham");
    const rewardLogs = getValues("thuong");
    const weeklyScores = getValues("tuan");
    const allRanks = getValues("xeploai");
    var newsSheet = ss.getSheetByName("news");
    var gvcnName = newsSheet.getRange("H2").getValue();
    var xepLoaiSheet = ss.getSheetByName("xeploaihk");
    var cloudPassword = xepLoaiSheet.getRange("F2").getValue().toString();

    const result = {
      gvcnName: gvcnName,
      appPassword: cloudPassword,
      violations: mapCategory(getValues("bangloi")),
      rewards: mapCategory(getValues("thanhtich")),
      bch: mapCategory(getValues("bch")),
      violationLogs: violationLogs.slice(1), // Bỏ tiêu đề
      rewardLogs: rewardLogs.slice(1),
      weeklyScores: weeklyScores, // Giữ tiêu đề để lấy w1, w2...
      allRanks: allRanks
    };

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // 2. LẤY DANH SÁCH HỌC SINH (Giữ nguyên của thầy)
  if (action === 'pull_students') {
    const dsSheet = ss.getSheetByName("danhsach");
    const ntSheet = ss.getSheetByName("nguoithan");
    const getSheetData = (sheet) => {
      if (!sheet) return [];
      const data = sheet.getDataRange().getValues();
      if (data.length < 2) return [];
      const headers = data[0];
      return data.slice(1).map(row => {
        let obj = {};
        headers.forEach((header, index) => { obj[header.toString().trim()] = row[index]; });
        return obj;
      });
    };
    return ContentService.createTextOutput(JSON.stringify({
      students: getSheetData(dsSheet),
      relatives: getSheetData(ntSheet)
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const data = JSON.parse(e.postData.contents);
  const action = data.action;

  // LƯU KẾT QUẢ XẾP LOẠI (Tuần/HK/Cả năm)
  if (action === 'save_final_grading') {
    const weekLabel = data.week; // w1, w2, HK1, HK2, CN
    const finalResults = data.results;
    
    const sheetTuan = ss.getSheetByName("tuan");
    const sheetXepLoai = ss.getSheetByName("xeploai");

    function updateSheet(sheet, isScoreMode) {
      if (!sheet) return;
      const fullData = sheet.getDataRange().getValues();
      const headers = fullData[0];
      
      let colIdx = headers.indexOf(weekLabel);
      if (colIdx === -1) {
        colIdx = headers.length;
        sheet.getRange(1, colIdx + 1).setValue(weekLabel);
      }

      finalResults.forEach(res => {
        for (let i = 1; i < fullData.length; i++) {
          if (String(fullData[i][1]) === String(res.idhs)) {
            sheet.getRange(i + 1, colIdx + 1).setValue(isScoreMode ? res.score : res.rank);
            break;
          }
        }
      });
    }

    // Nếu lưu tuần thì ghi cả điểm và hạng, nếu lưu HK/CN thì chỉ ghi hạng vào sheet xeploai
    if (weekLabel.startsWith('w')) {
      updateSheet(sheetTuan, true);
    }
    updateSheet(sheetXepLoai, false);
    
    return ContentService.createTextOutput("SUCCESS");
  }

  // CẬP NHẬT LỖI/THƯỞNG/ĐIỂM DANH (Giữ nguyên logic ghi ngang của thầy)
  if (action === 'update_record') {
    const sheet = ss.getSheetByName(data.target);
    if (!sheet) return ContentService.createTextOutput("SHEET_NOT_FOUND");
    const rows = sheet.getDataRange().getValues();
    const studentId = String(data.studentId);

    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][1]) === studentId) {
        let targetCol = 3;
        for (let j = 2; j < rows[i].length; j++) {
          if (!rows[i][j]) { targetCol = j + 1; break; }
          targetCol = j + 2;
        }
        
        if (data.target === 'vipham') {
          const codes = data.payloads.filter(c => c).map(c => c.toUpperCase());
          sheet.getRange(i + 1, targetCol, 1, codes.length).setValues([codes]);
        } else {
          sheet.getRange(i + 1, targetCol).setValue(data.payload);
        }
        return ContentService.createTextOutput("SUCCESS");
      }
    }
  }
  
  // SYNC_ALL (Giữ nguyên code của thầy)
  if (action === 'sync_all') {
    const { students } = data.payload;
    const targetSheets = ["vipham", "thuong", "tuan", "xeploai", "xeploaihk", "diemdanh"];
    const baseData = students.map(s => [s.name, s.idhs]);
    targetSheets.forEach(name => {
      const sheet = ss.getSheetByName(name);
      if (sheet) {
        sheet.getRange(2, 1, sheet.getLastRow() > 1 ? sheet.getLastRow()-1 : 1, 2).clearContent();
        sheet.getRange(2, 1, baseData.length, 2).setValues(baseData);
      }
    });
    return ContentService.createTextOutput("SUCCESS");
  }
}
