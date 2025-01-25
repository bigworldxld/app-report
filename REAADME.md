## 安装环境
npm install -g express


## 大文件上传
初始化git仓库（如果还没有）
git init

添加远程仓库
git remote add origin https://github.com/<your-username>/<repository-name>.git

git lfs install
git lfs track "*.psd"
git add .gitattributes
git add file.psd
git commit -m "Add design file"
git push origin main

## 重置依赖
首先删除 node_modules 文件夹（如果存在）：
rm -rf node_modules
删除 package-lock.json（如果存在）：
rm package-lock.json
清除 npm 缓存：
npm cache clean --force
重新安装依赖：
npm install
启动应用：
npm start

## 设置gthub
启用GitHub Pages：
进入GitHub仓库设置
找到"Pages"选项
在"Source"部分选择"gh-pages"分支
保存设置
验证部署：
等待GitHub Actions完成部署（可以在Actions标签页查看进度）
部署完成后，访问 https://<your-github-username>.github.io/<repository-name>
如果是个人站点，直接访问 https://<your-github-username>.github.io
6. 注意事项：
确保仓库设置中的Actions权限已启用
第一次部署可能需要等待几分钟
如果遇到问题，检查GitHub Actions日志
然后你需要在 GitHub 仓库设置中进行以下配置：
a. 进入你的仓库设置（Settings）
b. 点击左侧菜单的 "Pages"
c. 在 "Build and deployment" 部分：
Source: 选择 "GitHub Actions"
d. 回到左侧菜单，点击 "Actions" -> "General"
e. 在 "Workflow permissions" 部分：
选择 "Read and write permissions"
勾选 "Allow GitHub Actions to create and approve pull requests"
f. 点击 "Save" 保存更改
