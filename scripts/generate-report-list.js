const fs = require('fs');
const path = require('path');

// 生成报告列表
function generateReportList() {
  const reportDir = path.join(__dirname, '../frontend/report');
  const buildDir = path.join(__dirname, '../build/frontend/report');
  
  try {
    // 确保构建目录存在
    if (!fs.existsSync(buildDir)) {
      fs.mkdirSync(buildDir, { recursive: true });
    }

    const files = fs.readdirSync(reportDir);
    const reports = files
      .filter(file => file.endsWith('.html') && !file.includes('static'))
      .map(file => {
        const dateMatch = file.match(/(\d{4}-\d{2}-\d{2})/);
        const date = dateMatch ? dateMatch[1] : '';
        
        return {
          name: file,
          date: date,
          path: `/app-report/report/${file}`
        };
      });

    // 写入报告列表文件到两个位置
    const reportListContent = JSON.stringify({
      code: 200,
      message: 'success',
      data: reports
    }, null, 2);

    // 写入到构建目录
    fs.writeFileSync(path.join(buildDir, 'report-list.json'), reportListContent);
    
    // 写入到前端目录（用于本地开发）
    fs.writeFileSync(path.join(reportDir, 'report-list.json'), reportListContent);

    console.log('Report list generated successfully');
  } catch (err) {
    console.error('Error generating report list:', err);
    process.exit(1);
  }
}

generateReportList(); 