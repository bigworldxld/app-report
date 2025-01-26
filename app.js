//express_demo.js 文件
var express = require('express');
var app = express();
var fs = require('fs');
var path = require('path');
var os = require('os');
var { spawn, exec } = require('child_process');
var net = require('net');
const basePath = '/app-report';  // GitHub Pages 项目名称

// 存储已添加的静态资源路径
let addedStaticPaths = new Set();

// 存储 Appium 服务器进程
let appiumProcess = null;

// 获取本机IP地址
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const interface of interfaces[name]) {
            // 跳过内部IP和非IPv4地址
            if (interface.internal || interface.family !== 'IPv4') {
                continue;
            }
            return interface.address;
        }
    }
    return '127.0.0.1'; // 如果没有找到，返回localhost
}

// 初始化静态资源文件夹
function initializeStaticFolders() {
    const reportDir = path.join(__dirname, 'frontend/report');
    
    try {
        const files = fs.readdirSync(reportDir);
        const imagesFolders = files.filter(file => {
            const fullPath = path.join(reportDir, file);
            return file.startsWith('images') && fs.statSync(fullPath).isDirectory();
        });

        // 添加基础静态资源路由（只添加一次）
        if (!addedStaticPaths.has('static')) {
            app.use(`${basePath}/report/static`, express.static(path.join(__dirname, 'frontend/report/static')));
            addedStaticPaths.add('static');
        }

        // 添加所有 images 前缀的文件夹作为静态资源
        imagesFolders.forEach(folder => {
            const routePath = `${basePath}/report/${folder}`;
            // 检查是否已经添加过该路径
            if (!addedStaticPaths.has(routePath)) {
                const folderPath = path.join(__dirname, 'frontend/report', folder);
                app.use(routePath, express.static(folderPath));
                addedStaticPaths.add(routePath);
                console.log(`[${new Date().toLocaleTimeString()}] 新增静态资源路径: ${routePath} -> ${folderPath}`);
            }
        });

    } catch (err) {
        console.error('初始化静态资源文件夹失败:', err);
    }
}

// 首次执行初始化
initializeStaticFolders();

// 每秒检查一次新的静态资源文件夹
setInterval(initializeStaticFolders, 1000);

app.get('/', function (req, res) {
   res.sendFile(__dirname+"/frontend/index.html");
})

app.get('/config', function (req, res) {
  res.sendFile(__dirname+"/frontend/config.html");
})

// 获取所有报告文件列表
app.get(`${basePath}/report`, function (req, res) {
  const reportDir = path.join(__dirname, 'frontend/report');
  
  try {
    const files = fs.readdirSync(reportDir);
    const reports = files
      .filter(file => file.endsWith('.html') && !file.includes('static'))
      .map(file => {
        // 使用正则表达式匹配文件名中的日期
        const dateMatch = file.match(/(\d{4}-\d{2}-\d{2})/);
        const date = dateMatch ? dateMatch[1] : '';
        
        return {
          name: file,
          date: date,
          path: `${basePath}/report/${file}`
        };
      });

    res.json({
      code: 200,
      message: 'success',
      data: reports
    });
  } catch (err) {
    console.error('读取报告目录失败:', err);
    res.json({
      code: 500,
      message: '读取报告目录失败',
      data: []
    });
  }
});

// 直接访问报告文件
app.get(`${basePath}/report/:filename`, function (req, res) {
  const filename = req.params.filename;
  const reportPath = path.join(__dirname, 'frontend/report', filename);

  // 检查文件是否存在
  if (!fs.existsSync(reportPath)) {
    return res.status(404).send('报告文件不存在');
  }

  // 发送文件
  res.sendFile(reportPath);
});

// 检查端口是否被占用
function checkPort(port) {
    return new Promise((resolve) => {
        const server = net.createServer();
        
        server.once('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                resolve(true); // 端口被占用
            }
        });
        
        server.once('listening', () => {
            server.close();
            resolve(false); // 端口未被占用
        });
        
        server.listen(port);
    });
}

// 停止已运行的 Appium 进程
function killAppiumProcess() {
    return new Promise((resolve) => {
        if (process.platform === 'win32') {
            // Windows
            exec('netstat -ano | findstr :4723', (error, stdout) => {
                if (stdout) {
                    const lines = stdout.split('\n');
                    lines.forEach(line => {
                        const parts = line.trim().split(/\s+/);
                        const pid = parts[parts.length - 1];
                        if (pid) {
                            exec(`taskkill /F /PID ${pid}`);
                        }
                    });
                }
                resolve();
            });
        } else {
            // Linux/Mac
            exec('lsof -i:4723 | grep LISTEN', (error, stdout) => {
                if (stdout) {
                    const pid = stdout.split(/\s+/)[1];
                    if (pid) {
                        exec(`kill -9 ${pid}`);
                    }
                }
                resolve();
            });
        }
    });
}

// 启动 Appium 服务器
app.get(`${basePath}/api/appium/start`, async function (req, res) {
    try {
        // 检查端口占用
        const isPortBusy = await checkPort(4723);
        const localIP = getLocalIP();
        if (isPortBusy) {
            // 如果端口被占用，先尝试停止已有进程
            await killAppiumProcess();
            // 等待端口释放
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // 启动 Python 脚本
        appiumProcess = spawn('python', ['run_appium_server.py']);
        
        // 处理输出
        appiumProcess.stdout.on('data', (data) => {
            console.log(`Appium 输出: ${data}`);
        });
        
        appiumProcess.stderr.on('data', (data) => {
            console.error(`Appium 错误: ${data}`);
        });
        
        // 等待服务器启动
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        res.json({
            status: 'success',
            ip: localIP,
            message: 'Appium 服务器已启动'
        });
    } catch (error) {
        console.error('启动 Appium 服务器失败:', error);
        res.status(500).json({
            status: 'error',
            message: '启动 Appium 服务器失败'
        });
    }
});

// 停止 Appium 服务器
app.get(`${basePath}/api/appium/stop`, async function (req, res) {
    try {
        if (appiumProcess) {
            appiumProcess.kill();
            appiumProcess = null;
        }
        
        // 确保进程被完全终止
        await killAppiumProcess();
        
        res.json({
            status: 'success',
            message: 'Appium 服务器已停止'
        });
    } catch (error) {
        console.error('停止 Appium 服务器失败:', error);
        res.status(500).json({
            status: 'error',
            message: '停止 Appium 服务器失败'
        });
    }
});

var server = app.listen(8081, function () {
  const localIP = getLocalIP();
  const port = server.address().port;
  
  console.log('\n应用已启动:');
  console.log('-------------------');
  console.log(`本地访问: http://localhost:${port}`);
  console.log(`局域网访问: http://${localIP}:${port}`);
  console.log('-------------------\n');
});