# GitHub 仓库设置脚本
# 创建仓库后，把下面的 YOUR_USERNAME 替换成你的 GitHub 用户名，然后运行这个脚本

# 设置你的 GitHub 用户名
$GITHUB_USERNAME = "YOUR_USERNAME"  # 替换为你的 GitHub 用户名
$REPO_NAME = "gameAgent"

# 添加远程仓库
git remote add origin "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"

# 推送到 GitHub
git push -u origin main

Write-Host "✅ 代码已推送到 GitHub!" -ForegroundColor Green
Write-Host "🌐 访问: https://github.com/$GITHUB_USERNAME/$REPO_NAME" -ForegroundColor Cyan
