# =====================================================================
# 发布 vite-react-demo 独立包 → Gitee Package Registry（npm.gitee.com）
#
# 与 GitHub 版 publish-gpr.sh 对应：Gitee 也有自己的 npm 私有包服务。
# 用法：在项目根目录执行：
#   bash scripts/publish-gitee.sh
#
# 脚本会：
#   1) 提示你在 Gitee 生成 Personal Access Token（gitee_ 前缀）
#   2) 写入本机 ~/.npmrc 的 Gitee registry 认证
#   3) 本地构建全部 12 个包（6 React + 6 Vue）
#   4) 可选：更新 package.json 的 publishConfig.registry
#   5) 推送到 Gitee 仓库（可选）
#   6) 批量 npm publish 到 npm.gitee.com
#
# 前置条件：
#   - Node >= 21（推荐 nvm use 24）
#   - 已在 https://gitee.com/profile/personal_access_tokens 生成 PAT
#     权限至少勾选：projects、packages（Gitee Package Registry）
#   - 使用的 Gitee 用户名（owner）即为你的用户名，例如 jim_gjw
# =====================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo -e "${BLUE}
╔════════════════════════════════════════════════════════╗
║     发布独立 npm 包 → Gitee Package Registry             ║
║     registry:  https://npm.gitee.com                      ║
╚════════════════════════════════════════════════════════╝
${NC}"

# 0. 收集 owner 信息
echo ""
echo -e "${YELLOW}第 0 步 · 获取你的 Gitee 用户名${NC}"
echo "  你的 Gitee 用户名（个人主页 URL 最后一段），例如 jim_gjw"
read -rp "  请输入 Gitee 用户名: " GITEE_OWNER
if [ -z "$GITEE_OWNER" ]; then
  echo -e "${RED}用户名不能为空，已取消。${NC}"; exit 1
fi

echo ""
echo -e "${YELLOW}第 1 步 · 生成 Gitee 私人令牌（PAT）${NC}"
echo "  1) 打开  https://gitee.com/profile/personal_access_tokens"
echo "  2) 点击「生成新令牌」"
echo "  3) 描述填: publish-vite-react-demo-packages-$(date +%Y%m%d)"
echo "  4) 权限勾选: ☑️ projects ☑️ packages（发布包必须） ☑️ user_info"
echo "  5) 点击提交并输入密码，复制生成的令牌字符串（形如 gitee_xxxxxxxxxxxxxxx）"
echo -e "     ${RED}⚠️  只显示一次，不要提交到 git！${NC}"
read -rp "  你已经生成并保存了 PAT 吗？(y/N): " ok_pat
case "$ok_pat" in [yY][eE][sS]|[yY]) ;; *) echo -e "${YELLOW}已取消，后续你生成 PAT 后再次运行本脚本即可。${NC}"; exit 0;; esac

# 1. 写入 ~/.npmrc
echo ""
echo -e "${YELLOW}第 2 步 · 写入本机 ~/.npmrc 的 Gitee registry 认证${NC}"
echo "  请把以下 3 行复制到你本机 ~/.npmrc（若没有就新建）："
echo ""
echo -e "  ${GREEN}@${GITEE_OWNER}:registry=https://npm.gitee.com/${NC}"
echo -e "  ${GREEN}//npm.gitee.com/:_authToken=gitee_这里粘贴上面的PAT${NC}"
echo -e "  ${GREEN}//npm.gitee.com/:always-auth=true${NC}"
echo ""
read -rp "  你已写好 ~/.npmrc 配置了吗？(y/N): " ok_auth
case "$ok_auth" in [yY][eE][sS]|[yY]) ;; *) echo -e "${YELLOW}已取消。${NC}"; exit 0;; esac

# 2. 确认发布范围（全部 12 个 / 仅 React 6 / 仅 Vue 6）
echo ""
echo -e "${YELLOW}第 3 步 · 选择发布范围${NC}"
echo "  1) 全部 12 个包（6 React + 6 Vue）"
echo "  2) 仅 React 6 个包"
echo "  3) 仅 Vue 6 个包"
read -rp "  请选择 (默认 1): " scope
scope="${scope:-1}"

REACT_PKGS="react-styles-reset react-core-hooks react-ui-basic react-media-tools react-admin-shell react-svg-charts"
VUE_PKGS="vue-styles-reset vue-core-composables vue-ui-basic vue-media-tools vue-admin-shell vue-svg-charts"
case "$scope" in
  1) TARGETS="$REACT_PKGS $VUE_PKGS" ;;
  2) TARGETS="$REACT_PKGS" ;;
  3) TARGETS="$VUE_PKGS" ;;
  *) echo -e "${RED}无效选项。${NC}"; exit 1 ;;
esac
echo -e "  将发布 ${GREEN}$(echo "$TARGETS" | wc -w)${NC} 个包：$(echo "$TARGETS" | tr '\n' ' ')"

# 3. 构建
echo ""
echo -e "${YELLOW}第 4 步 · 本地构建目标包${NC}"
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 24 2>/dev/null || true
node -v

case "$scope" in
  1) npm run pkg:all:build ;;
  2) npm run pkg:all:build-react ;;
  3) npm run pkg:all:build-vue ;;
esac

# 4. 询问是否改 publishConfig（指向 Gitee registry）并改包作用域为 @GITEE_OWNER
echo ""
echo -e "${YELLOW}第 5 步 · 是否把各包的 publishConfig 指向 Gitee Package Registry，并把作用域改为 @$GITEE_OWNER?${NC}"
echo "  当前作用域是 @myorg；如果要发布到 Gitee npm.gitee.com，一般推荐作用域与 Gitee 用户名一致即 @$GITEE_OWNER"
echo "  例如 @myorg/react-styles-reset → @$GITEE_OWNER/react-styles-reset"
read -rp "  自动更新所有目标包的 name + repository + publishConfig？(Y/n): " auto_update
case "$auto_update" in ''|[yY][eE][sS]|[yY])
  for PKG in $TARGETS; do
    PKG_SHORT_NAME="${PKG#*-}"  # 去掉 react- / vue- 前缀
    # 保留短名，比如 react-styles-reset → styles-reset 但这会丢失前缀。
    # 更实用：完整保留 PKG 名称，仅作用域从 @myorg → @$GITEE_OWNER
    PKG_DIR="$ROOT_DIR/packages/@myorg/$PKG"
    PKG_FILE="$PKG_DIR/package.json"
    NEW_NAME="@${GITEE_OWNER}/${PKG}"
    node -e "
      const fs = require('fs');
      const p = JSON.parse(fs.readFileSync('$PKG_FILE', 'utf8'));
      p.name = '$NEW_NAME';
      p.repository = {
        type: 'git',
        url: 'https://gitee.com/$GITEE_OWNER/vite-react-demo.git',
        directory: 'packages/@myorg/$PKG',
      };
      p.publishConfig = {
        access: 'public',
        registry: 'https://npm.gitee.com',
      };
      fs.writeFileSync('$PKG_FILE', JSON.stringify(p, null, 2) + '\n', 'utf8');
    "
    echo -e "  ${GREEN}→ $PKG 已更新: name=$NEW_NAME${NC}"
  done
  ;;
*)
  echo "  跳过 package.json 更新，你可以手动修改。"
  ;;
esac

# 5. 推送代码到 Gitee（可选）
echo ""
echo -e "${YELLOW}第 6 步 · 推送代码到 Gitee 仓库（可选但推荐）${NC}"
read -rp "  执行 git push（origin 当前已配置双推，会同时推到 GitHub + Gitee）？(Y/n): " do_push
case "$do_push" in ''|[yY][eE][sS]|[yY])
  BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo main)
  git push origin "$BRANCH" --tags || true
  ;;
*) echo "  跳过 git push。" ;;
esac

# 6. 批量发布
echo ""
echo -e "${YELLOW}第 7 步 · 批量发布到 Gitee Package Registry${NC}"
echo "  若发布报错，先确认："
echo "    · ~/.npmrc 的 token 是否正确、是否勾选了 packages 权限"
echo "    · Gitee 包作用域是否与 PAT 所有者一致（@${GITEE_OWNER}）"

FAIL_PKGS=""
for PKG in $TARGETS; do
  PKG_DIR="$ROOT_DIR/packages/@myorg/$PKG"
  echo ""
  echo -e "  ${BLUE}▶ 发布 $PKG${NC}"
  if (cd "$PKG_DIR" && npm publish --access public --registry https://npm.gitee.com); then
    echo -e "  ${GREEN}✅ $PKG 发布成功${NC}"
  else
    echo -e "  ${RED}❌ $PKG 发布失败，继续下一个…${NC}"
    FAIL_PKGS="$FAIL_PKGS $PKG"
  fi
done

echo ""
if [ -z "$FAIL_PKGS" ]; then
  echo -e "${GREEN}
╔══════════════════════════════════════════════════════╗
║  ✅ 全部目标包发布成功！                                 ║
║                                                         ║
║  其他项目安装方法：先在项目目录新建 .npmrc，加入两行：    ║
║    @${GITEE_OWNER}:registry=https://npm.gitee.com        ║
║    //npm.gitee.com/:_authToken=gitee_你的PAT            ║
║                                                         ║
║  然后执行（示例，按需替换包名和作用域）：                  ║
║    npm install @${GITEE_OWNER}/react-styles-reset        ║
║    npm install @${GITEE_OWNER}/vue-styles-reset          ║
╚══════════════════════════════════════════════════════╝
${NC}"
else
  echo -e "${RED}
╔══════════════════════════════════════════════════════╗
║  ⚠️  以下包发布失败，请检查日志后重试：                  ║
║    $FAIL_PKGS
╚══════════════════════════════════════════════════════╝
${NC}"
  exit 1
fi
