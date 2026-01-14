const SPREADSHEET_ID = "1hKbsw8Y_fkMb4hBPRuKClJGx_bRFo9Y4Wei2Ot3R8OI";

// HÀM GET: Tải dữ liệu về App
function doGet(e) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const action = e.parameter.action;
  
  // 1. Lấy mật khẩu từ ô F2 sheet xeploaihk
  const xlhkSheet = ss.getSheetByName("xeploaihk");
  const cloudPassword = xlhkSheet ? xlhkSheet.getRange("F2").getValue().toString() : "123";

  // 2. Lấy tên GVCN từ ô H2 sheet news
  const newsSheet = ss.getSheetByName("news");
  const gvcnName = newsSheet ? newsSheet.getRange("H2").getValue().toString() : "Nguyễn Văn Hà";

  if (action === 'pull_students' || action === 'get_initial_data') {
    const dsSheet = ss.getSheetByName("danhsach");
    const ntSheet = ss.getSheetByName("nguoithan");
    
    // Tạo bản đồ ảnh từ sheet xeploaihk (Cột B: IDHS - index 1, Cột G: Link Ảnh - index 6)
    // 1. Lấy bản đồ ảnh từ sheet xeploaihk
    const photoMap = {};
    if (xlhkSheet) {
      const xlData = xlhkSheet.getDataRange().getValues();
      xlData.slice(1).forEach(row => {
        // Cột B (index 1) là IDHS, Cột G (index 6) là Link ảnh
        const rawId = String(row[1] || "").trim().toUpperCase(); 
        if (rawId) {
          photoMap[rawId] = String(row[6] || "").trim();
        }
      });
    }

    // 2. Lấy danh sách học sinh từ sheet danhsach
    const students = dsSheet ? dsSheet.getDataRange().getValues().slice(1).map(row => {
      // Cột I (index 8) là IDHS
      const studentId = String(row[8] || "").trim().toUpperCase();
      
      return {
        stt: row[0],
        name: row[1],
        class: row[2],
        date: row[3],
        gender: row[4],
        idhs: studentId,
        // So khớp mã IDHS đã được chuẩn hóa
        imglink: photoMap[studentId] || "" 
      };
    }) : [];
    // Lấy thông tin người thân
    const relatives = ntSheet ? ntSheet.getDataRange().getValues().slice(1).map(row => ({
      idhs: String(row[0]), 
      namefather: row[1], 
      phonefather: row[2], 
      datefather: row[3], 
      jobfather: row[4], 
      namemother: row[5], 
      phonemother: row[6], 
      datemother: row[7], 
      jobmother: row[8], 
      hoancanh: row[9]
    })) : [];

    return ContentService.createTextOutput(JSON.stringify({
      students: students,
      relatives: relatives,
      appPassword: cloudPassword,
      gvcnName: gvcnName // Tên lấy từ H2 sheet news
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// HÀM POST: Đẩy dữ liệu lên Sheet (Giữ nguyên logic cũ)
function doPost(e) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return ContentService.createTextOutput("Lỗi JSON").setMimeType(ContentService.MimeType.TEXT);
  }

  const action = data.action;
  const payload = data.payload;

  if (action === 'sync_all') {
    const students = payload.students || [];
    const relatives = payload.relatives || [];
    
    const dsSheet = ss.getSheetByName("danhsach");
    const ntSheet = ss.getSheetByName("nguoithan");

    if (dsSheet && students.length > 0) {
      if (dsSheet.getLastRow() > 1) dsSheet.getRange(2, 1, dsSheet.getLastRow() - 1, 9).clearContent();
      const dsRows = students.map(s => [
        s.stt || "", s.name || "", s.class || "", s.date || "", s.gender || "", 
        s.phoneNumber || "", s.accommodation || "", s.cccd || "", String(s.idhs || "")
      ]);
      dsSheet.getRange(2, 1, dsRows.length, 9).setValues(dsRows);
    }

    if (ntSheet && relatives.length > 0) {
      if (ntSheet.getLastRow() > 1) ntSheet.getRange(2, 1, ntSheet.getLastRow() - 1, 10).clearContent();
      const ntRows = relatives.map(r => [
        String(r.idhs || ""), r.namefather || "", r.phonefather || "", r.datefather || "", 
        r.jobfather || "", r.namemother || "", r.phonemother || "", r.datemother || "", 
        r.jobmother || "", r.hoancanh || ""
      ]);
      ntSheet.getRange(2, 1, ntRows.length, 10).setValues(ntRows);
    }

    const targetSheets = ["vipham", "thuong", "tuan", "xeploai", "xeploaihk", "diemdanh"];
    if (students.length > 0) {
      const baseData = students.map(s => [s.name || "", String(s.idhs || "")]);
      targetSheets.forEach(name => {
        const sh = ss.getSheetByName(name);
        if (sh) {
          // Chỉ clear 2 cột đầu để giữ cột Ảnh (G) và mật khẩu (F)
          if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, 2).clearContent();
          sh.getRange(2, 1, baseData.length, 2).setValues(baseData);
        }
      });
    }
    return ContentService.createTextOutput("SUCCESS");
  }
}
function testPermission() {
  SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("news").getRange("H2").getValue();
  console.log("Cấp quyền thành công!");
}

