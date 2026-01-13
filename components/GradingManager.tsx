const finalGrades = useMemo(() => {
    // 1. Khởi tạo bản đồ điểm tra cứu (Xử lý triệt để khoảng trắng và viết hoa)
    const scoreMap: Record<string, number> = {};
    
    state.violations?.forEach((v: any) => {
      const code = String(v.codeRule || "").trim().toUpperCase();
      if (code) scoreMap[code] = -Math.abs(Number(v.points) || 0);
    });
    
    state.rewards?.forEach((r: any) => {
      const code = String(r.codeRule || r.codeBonus || "").trim().toUpperCase();
      if (code) scoreMap[code] = Math.abs(Number(r.points) || 0);
    });

    state.bch?.forEach((b: any) => {
      const code = String(b.codeRule || b.codeTitle || "").trim().toUpperCase();
      if (code) scoreMap[code] = Math.abs(Number(b.points) || 0);
    });

    // 2. Tính điểm cho từng học sinh
    let list = state.students.map((student: any) => {
      let totalScore = 100; // Điểm gốc

      // Hàm quét điểm từ một hàng dữ liệu (bỏ qua cột tên, tìm cột IDHS)
      const calculateFromRow = (logArray: any[]) => {
        const row = logArray?.find((r: any) => {
          // Kiểm tra idhs ở bất kỳ cột nào (thường là cột 1 hoặc 2)
          return String(r.idhs || "").trim() === String(student.idhs).trim() || 
                 Object.values(r).includes(String(student.idhs).trim());
        });

        if (row) {
          Object.entries(row).forEach(([key, val]) => {
            // Không tính điểm cho chính cái ô chứa IDHS hoặc Tên
            if (key === 'idhs' || key === 'name' || String(val) === String(student.name)) return;
            
            const code = String(val).trim().toUpperCase();
            if (scoreMap[code]) {
              totalScore += scoreMap[code];
            }
          });
        }
      };

      if (mode === 'week') {
        calculateFromRow(state.violationLogs);
        calculateFromRow(state.rewardLogs);
      } 
      // ... (Các logic HK và Cả năm giữ nguyên như bản trước)
      
      return { ...student, totalScore };
    });
    
    // ... (Phần xếp hạng giữ nguyên)
