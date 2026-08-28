# =====================================================================
# 本文件作为「独立 GitHub 仓库」部署时，把 charts 包拷贝出去的
# 一键初始化 + 发布脚本（已移除所有敏感信息，仅保留模板命令）。
# 用法：
#   1) 把 packages/@myorg/react-svg-charts 整个目录拷贝到你电脑上的
#      新文件夹（例如 ~/code/react-svg-charts）。
#   2) 打开 macOS 终端执行：  bash scripts/publish-gpr.sh
#   脚本会提示你按步骤操作：创建 GitHub 仓库 → 配置 .npmrc →
#   构建 → 打 tag → 发布到 GitHub Package Registry。
# =====================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

package_name="@myorg/react-svg-charts"
current_dir="$(pwd)"
package_json="./package.json"

if [ ! -f "$package_json" ]; then
  echo -e "${RED}请在 $package_name 包目录内执行此脚本！${NC}"
  echo "    cd path/to/react-svg-charts"
  exit 1
fi

echo -e "${BLUE}
╔══════════════════════════════════════════════════╗
║     发布 $package_name → GitHub Package Registry     ║
╚══════════════════════════════════════════════════╝
${NC}"

echo -e "
${YELLOW}第 0 步 · 在 GitHub 上创建一个新的空仓库${NC}
  1) 浏览器打开  https://github.com/new
  2) Repository name 建议填:  react-svg-charts   (或你想要的名字)
  3) Public / Private 都可以；GPR 发布不限仓库可见性
  4) 不要勾选 \"Initialize this repository with a README\"
  5) 点击 Create repository 后，复制 HTTPS 形式的仓库地址
     例如:  https://github.com/你的用户名/react-svg-charts.git
"
read -rp "请粘贴刚创建的 GitHub 仓库 HTTPS URL: " repo_url
if [ -z "$repo_url" ]; then
  echo -e "${RED}未提供仓库地址，已取消。${NC}"; exit 1
fi

# 从 url 中提取 owner 和 repo_name（仅用于后续提示）
owner=$(echo "$repo_url" | sed -E 's|https://github\.com/([^/]+)/.*/?|\1|')
repo_name=$(echo "$repo_url" | sed -E 's|https://github\.com/[^/]+/([^/.]+).*|\1|')
echo -e "检测到 owner=${GREEN}$owner${NC} repo=${GREEN}$repo_name${NC}"

echo ""
echo -e "${YELLOW}第 1 步 · 生成 Personal Access Token (classic)${NC}
  1) 打开  https://github.com/settings/tokens?type=beta
     或右上角头像 → Settings → Developer settings → Personal access tokens → Tokens (classic)
  2) Generate new token (classic)
  3) Note 填:  publish-${repo_name}-$(date +%Y%m%d)
  4) Expiration 选择一个你能接受的过期时间
  5) 勾选 ✅ write:packages  （同时会自动带上 read:packages 和 repo）
  6) Generate token 后，立刻保存这段字符串（形如 ghp_xxxx），它只会显示一次！
     ${RED}⚠️  不要把它粘贴到聊天对话框里，不要提交到 git，不要截图分享。${NC}
     ${GREEN}✅  推荐做法：写入本机 ~/.npmrc （下一步会教），或者直接通过 macOS Keychain 管理。${NC}
"

echo -e "${YELLOW}第 2 步 · 写入本机全局 ~/.npmrc 认证信息${NC}"
echo "  请把以下 3 行复制到你本机 ~/.npmrc 文件（若没有就新建一个）："
echo ""
echo -e "  ${GREEN}@${owner}:registry=https://npm.pkg.github.com${NC}"
echo -e "  ${GREEN}//npm.pkg.github.com/:_authToken=ghp_这里粘贴上面你的PAT${NC}"
echo -e "  ${GREEN}//npm.pkg.github.com/:always-auth=true${NC}"
echo ""
read -rp "你已经在 ~/.npmrc 写好上面配置了吗？(y/N): " ok_auth
case "$ok_auth" in [yY][eE][sS]|[yY]) ;; *) echo -e "${YELLOW}已取消发布，后续你配置完成后可以再次运行本脚本。${NC}"; exit 0;; esac

echo ""
echo -e "${YELLOW}第 3 步 · 把 package.json 里的包作用域改为你的 GitHub owner${NC}"
echo -e "  当前 name: ${RED}$(node -e 'console.log(require("./package.json").name)')${NC}"
echo -e "  即将改成: ${GREEN}@${owner}/${repo_name}${NC}  （如不想改名直接回车跳过）"
read -rp "是否按这个新名字自动更新 package.json 的 name/repository.url？(Y/n): " rename
case "$rename" in ''|[yY][eE][sS]|[yY])
  NEW_NAME="@${owner}/${repo_name}"
  # 用 node -e 改 JSON，避免 jq 依赖
  node -e "
    const fs = require('fs');
    const p = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    p.name = '$NEW_NAME';
    p.repository = { type: 'git', url: '$repo_url' };
    p.publishConfig = { access: 'public', registry: 'https://npm.pkg.github.com' };
    fs.writeFileSync('./package.json', JSON.stringify(p, null, 2) + '\n', 'utf8');
  "
  echo -e "${GREEN}已更新 package.json：name=$NEW_NAME，publishConfig 指向 GitHub Package Registry${NC}"
  ;;
esac

echo ""
echo -e "${YELLOW}第 4 步 · 本地初始化 git 仓库并提交当前版本${NC}"
if [ ! -d .git ]; then
  git init -b main
  # 仅做仓库级 user 配置，不污染全局（如果用户已经有全局配置则不会覆盖）
  echo "  (请确认本机 Git user.name / user.email 已设置，否则提交会报错："
  echo "     git config --global user.name \"你的名字\""
  echo "     git config --global user.email \"you@example.com\")"
  git add -A
  git commit -m "chore(release): initial commit, ready for v1.0.0" || true
else
  echo "  .git 目录已存在，跳过 git init。"
fi

# 绑定远程
if git remote get-url origin >/dev/null 2>&1; then
  echo -e "  ${YELLOW}origin 已存在，改为指向: $repo_url${NC}"
  git remote set-url origin "$repo_url"
else
  git remote add origin "$repo_url"
fi
echo -e "  ${BLUE}$(git remote -v)${NC}"

echo ""
echo -e "${YELLOW}第 5 步 · 构建并打语义化版本 tag${NC}"
. ~/.nvm/nvm.sh 2>/dev/null || true
nvm use 24 2>/dev/null || true
npm install --legacy-peer-deps --no-audit --no-fund || npm install --no-audit --no-fund
npm run build

# 读取当前版本号
VERSION=$(node -e 'console.log(require("./package.json").version)')
echo -e "  当前版本号：${GREEN}v${VERSION}${NC}"
read -rp "  使用 v${VERSION} 作为 tag？回车确认，或输入新版本号: " new_ver
new_ver="${new_ver:-$VERSION}"
if [ "$new_ver" != "$VERSION" ]; then
  node -e "const fs=require('fs'); const p=JSON.parse(fs.readFileSync('./package.json','utf8')); p.version='$new_ver'; fs.writeFileSync('./package.json', JSON.stringify(p,null,2)+'\n');"
  git add package.json && git commit -m "chore(release): v${new_ver}" || true
fi
git tag -a "v${new_ver}" -m "release v${new_ver}" || true
echo -e "  已打 tag: ${GREEN}v${new_ver}${NC}"

echo ""
echo -e "${YELLOW}第 6 步 · 推送到 GitHub（首次推送需要 HTTPS 鉴权）${NC}"
echo "  如果 git push 要求输入 Username/Password："
echo "    Username = 你的 GitHub 用户名"
echo "    Password = 你第 1 步生成的 PAT（ghp_xxxx）"
echo ""
git push -u origin main --tags

echo ""
echo -e "${YELLOW}第 7 步 · 发布到 GitHub Package Registry${NC}"
npm publish

echo -e "
${GREEN}
╔═══════════════════════════════════════════════════════════╗
║  ✅  发布完成！                                           ║
║                                                           ║
║  其他项目安装方法：创建 ~/.npmrc，加入两行：              ║
║    @${owner}:registry=https://npm.pkg.github.com           ║
║    //npm.pkg.github.com/:_authToken=ghp_你的PAT           ║
║                                                           ║
║  然后执行：                                                ║
║    npm install @${owner}/${repo_name} react react-dom       ║
╚═══════════════════════════════════════════════════════════╝
${NC}
"
