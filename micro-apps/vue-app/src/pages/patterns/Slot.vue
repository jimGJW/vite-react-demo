<!-- ============================================================
     Vue 3 · 插槽演示（默认 / named / scoped）
     自包含三种容器组件：CardContainer / PageCard / DataList
     ============================================================ -->
<template>
  <div class="slot-demo">
    <!-- ① 默认插槽 -->
    <el-tag type="primary" effect="dark" style="margin-bottom: 6px">
      ① 默认插槽：slot /
    </el-tag>
    <CardContainer title="🎯 欢迎来到你的工作台">
      <div class="welcome">
        <p>今天是美好的一天。子组件通过 &#60;slot /&#62; 直接渲染这整段。</p>
        <div style="display: flex; gap: 8px">
          <el-button>开始工作</el-button>
          <el-button type="primary">查看通知 3</el-button>
        </div>
      </div>
    </CardContainer>

    <!-- ② 命名插槽 -->
    <el-tag type="danger" effect="dark" style="margin: 18px 0 6px">
      ② 命名插槽：header / default / footer
    </el-tag>
    <PageCard>
      <template #header>
        <div class="h-left">
          <el-avatar :size="40" style="background:#409eff">A</el-avatar>
          <div style="margin-left:10px">
            <div class="spc-title">Alice Chen</div>
            <div class="spc-sub">前端工程师 · 5 年经验</div>
          </div>
        </div>
        <div class="h-right">
          <el-button size="small">设置</el-button>
          <el-button size="small" type="primary" :plain="liked"
                     :type="liked ? 'info' : 'primary'"
                     @click="liked = !liked">
            {{ liked ? '已关注 ♥' : '关注 ♡' }}
          </el-button>
        </div>
      </template>

      <p style="margin: 0; line-height: 1.8">
        正在写一个 <el-tag>Vue</el-tag> + <el-tag>Vite</el-tag> +
        <el-tag type="primary">.vue SFC</el-tag> 混合项目，
        使用 <code style="background:#f4f7fb;padding:1px 4px;border-radius:4px">
        #header / #footer 命名插槽</code> 分发内容。
      </p>

      <template #footer="{ commentCount, shareCount, viewCount }">
        <div class="foot">
          <span>💬 评论：{{ commentCount }}</span>
          <span>🔁 转发：{{ shareCount }}</span>
          <span>👀 浏览：{{ viewCount }}</span>
          <el-rate v-model.number="rate" size="small" style="font-size: 14px" />
        </div>
      </template>
    </PageCard>

    <!-- ③ 作用域插槽 -->
    <el-tag type="success" effect="dark" style="margin: 18px 0 6px">
      ③ 作用域插槽：#default="{ row, index }"
    </el-tag>
    <DataList :data="products" empty="商品已售罄">
      <template #default="{ row, index }">
        <div class="row">
          <div class="row__l">
            <el-tag type="primary" effect="plain">#{{ index + 1 }} {{ row.id }}</el-tag>
            <strong style="margin-left:6px">{{ row.name }}</strong>
            <el-rate :model-value="row.rating" disabled size="small" style="margin-left:6px;font-size:12px"/>
          </div>
          <el-tag type="warning" effect="dark">¥{{ row.price }}</el-tag>
        </div>
      </template>
    </DataList>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import CardContainer from './CardContainer.vue'
import PageCard       from './PageCard.vue'
import DataList       from './DataList.vue'

const liked = ref(false)
const rate  = ref(4)
const products = ref([
  { id: 'A1', name: '键盘',    price: 199,  rating: 5 },
  { id: 'B2', name: '鼠标',    price: 129,  rating: 4 },
  { id: 'C3', name: '显示器',  price: 1499, rating: 5 },
  { id: 'D4', name: 'USB Hub', price: 89,   rating: 3 },
])
</script>

<style scoped>
.slot-demo { width: 100%; }
.welcome p { margin: 0 0 10px; line-height: 1.8; }
.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.row__l { display: flex; align-items: center; gap: 2px; flex-wrap: wrap; }

/* header/footer 内部样式（作用在模板自身） */
.h-left  { display: flex; align-items: center; }
.h-right { display: flex; align-items: center; gap: 8px; }
.spc-title { font-weight: 600; }
.spc-sub   { font-size: 12px; color: #909399; }
.foot { display: flex; align-items: center; flex-wrap: wrap; gap: 16px; }
</style>
