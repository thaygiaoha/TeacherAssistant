const SPREADSHEET_ID = "1hKbsw8Y_fkMb4hBPRuKClJGx_bRFo9Y4Wei2Ot3R8OI";
function doGet(e) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const action = e.parameter.action;

  // Lấy mật khẩu và tên GVCN dùng chung cho các phản hồi
  const xepLoaiSheet = ss.getSheetByName("xeploaihk");
  const cloudPassword = xepLoaiSheet ? xepLoaiSheet.getRange("F2").getValue().toString() : "123";
  
  const newsSheet = ss.getSheetByName("news");
  const gvcnName = newsSheet ? newsSheet.getRange("H2").getValue() : "Chưa cập nhật";

  // 1. LẤY DỮ LIỆU TỔNG HỢP
  if (action === 'get_initial_data') {
    const getValues = (name) => {
      const sh = ss.getSheetByName(name);
      return sh ? sh.getDataRange().getValues() : [];
    };

    const mapCategory = (data) => {
      if (!data || data.length < 2) return [];
      return data.slice(1).map(row => ({
        codeRule: String(row[1] || "").toUpperCase(),
        points: Number(row[2]) || 0,
        position: String(row[1] || ""), 
        name: String(row[2] || ""),     
        idhs: String(row[0] || "")      
      }));
    };
    const newsSheet = ss.getSheetByName("news");
const newsData = newsSheet ? newsSheet.getDataRange().getValues() : [];

// Lấy danh sách BCH từ cột C (index 2) và cột E (index 4) của sheet news
const bchList = [];
if (newsData.length > 1) {
  for (let i = 1; i < newsData.length; i++) {
    if (newsData[i][2] && newsData[i][4]) { // Nếu có cả tên và chức vụ
      bchList.push({
        name: String(newsData[i][2]),      // Cột C: name
        position: String(newsData[i][4]),  // Cột E: position
        idhs: String(newsData[i][3] || "") // Cột D: idhs (nếu có)
      });
    }
  }
}
const newsDataRaw = newsSheet ? newsSheet.getRange("A2:B50").getValues() : [];
const photos = [];
newsDataRaw.forEach(row => {
  if (row[0] && row[1]) { // Nếu có cả tiêu đề và link ảnh
    photos.push({
      title: String(row[0]),
      link: String(row[1])
    });
  }
});
const rawNews = newsSheet.getRange("F2:G30").getValues();
const newsList = rawNews
  .filter(row => row[0] !== "") // Chỉ lấy những dòng có nội dung tin tức
  .map(row => ({
    news: row[0],  // Nội dung tin ở cột F
    link: row[1]   // Link chi tiết ở cột G (nếu có)
  }));
    const result = {
      gvcnName: gvcnName,
      newsList: newsList,
      appPassword: cloudPassword,
      newsData: photos,
      bchNames: bchList,
      violations: mapCategory(getValues("bangloi")),
      rewards: mapCategory(getValues("thanhtich")),
      bch: mapCategory(getValues("bch")),
      violationLogs: getValues("vipham").slice(1),
      rewardLogs: getValues("thuong").slice(1),
      weeklyScores: getValues("tuan"),
      allRanks: getValues("xeploai")
    };

    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  }

  // 2. LẤY DANH SÁCH HỌC SINH
  if (action === 'pull_students') {
    const dsSheet = ss.getSheetByName("danhsach");
    const getSheetData = (sheet) => {
      if (!sheet) return [];
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      return data.slice(1).map(row => {
        let obj = {};
        headers.forEach((header, index) => { obj[header.toString().trim()] = row[index]; });
        return obj;
      });
    };
    
    return ContentService.createTextOutput(JSON.stringify({
      students: getSheetData(dsSheet),
      appPassword: cloudPassword // Luôn gửi kèm mật khẩu
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const data = JSON.parse(e.postData.contents);
  const action = data.action;

  // LƯU KẾT QUẢ XẾP LOẠI
  if (action === 'save_final_grading') {
    const weekLabel = data.week;
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

    if (weekLabel.startsWith('w')) updateSheet(sheetTuan, true);
    updateSheet(sheetXepLoai, false);
    return ContentService.createTextOutput("SUCCESS");
  }

  // CẬP NHẬT GHI CHÉP (LỖI/THƯỞNG)
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
  
  // ĐỒNG BỘ DANH SÁCH (SYNC ALL)
  if (action === 'sync_all') {
    const { students } = data.payload;
    const targetSheets = ["vipham", "thuong", "tuan", "xeploai", "xeploaihk", "diemdanh"];
    const baseData = students.map(s => [s.name, s.idhs]);
    targetSheets.forEach(name => {
      const sheet = ss.getSheetByName(name);
      if (sheet) {
        if (sheet.getLastRow() > 1) sheet.getRange(2, 1, sheet.getLastRow()-1, 2).clearContent();
        sheet.getRange(2, 1, baseData.length, 2).setValues(baseData);
      }
    });
    return ContentService.createTextOutput("SUCCESS");
  }
}
