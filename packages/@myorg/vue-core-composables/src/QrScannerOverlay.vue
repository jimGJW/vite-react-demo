<script setup>
/** 扫码弹窗的全屏遮罩 UI（由 openQrScanner() 命令式挂载，一般无需直接使用） */
const props = defineProps({
  videoId: { type: String, required: true },
  uploadId: { type: String, required: true },
  loadingId: { type: String, required: true },
})
const emit = defineEmits(['close', 'upload'])

/** 触发隐藏的 file input，从相册选择图片 */
function pickImage() {
  document.getElementById(props.uploadId)?.click()
}
</script>

<template>
  <div
    :style="{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.92)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
    }"
  >
    <button
      aria-label="关闭扫码"
      :style="{
        position: 'absolute', top: '24px', right: '24px',
        width: '36px', height: '36px', borderRadius: '50%',
        border: 'none', fontSize: '20px', cursor: 'pointer',
        zIndex: 100, background: 'rgba(255,255,255,0.15)', color: '#fff',
      }"
      @click="emit('close')"
    >
      ✕
    </button>

    <div :style="{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }">
      <video
        :id="videoId"
        :style="{ width: '100%', height: '100%', objectFit: 'cover' }"
        playsinline muted
      />
      <div
        :style="{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '72vw', maxWidth: '340px', height: '72vw', maxHeight: '340px',
          border: '2px solid #00ff44', borderRadius: '10px',
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
        }"
      >
        <div :style="{ position: 'absolute', top: '-2px', left: '-2px', width: '20px', height: '20px', borderTop: '2px solid #00ff44', borderLeft: '2px solid #00ff44' }" />
        <div :style="{ position: 'absolute', top: '-2px', right: '-2px', width: '20px', height: '20px', borderTop: '2px solid #00ff44', borderRight: '2px solid #00ff44' }" />
        <div :style="{ position: 'absolute', bottom: '-2px', left: '-2px', width: '20px', height: '20px', borderBottom: '2px solid #00ff44', borderLeft: '2px solid #00ff44' }" />
        <div :style="{ position: 'absolute', bottom: '-2px', right: '-2px', width: '20px', height: '20px', borderBottom: '2px solid #00ff44', borderRight: '2px solid #00ff44' }" />
      </div>
    </div>

    <span
      :id="loadingId"
      :style="{
        visibility: 'hidden', color: '#fff', position: 'absolute',
        bottom: '140px', fontSize: '14px',
      }"
    >图片识别中...</span>

    <input
      :id="uploadId" type="file" accept="image/*" :style="{ display: 'none' }"
      @change="emit('upload', $event)"
    />
    <button
      aria-label="从相册选择图片"
      :style="{
        position: 'absolute', bottom: '24px', width: '48px', height: '48px',
        borderRadius: '50%', border: 'none', fontSize: '20px', cursor: 'pointer',
        background: 'rgba(255,255,255,0.15)', color: '#fff',
      }"
      @click="pickImage"
    >
      🖼
    </button>
    <div :style="{ color: '#fff', position: 'absolute', bottom: '82px', fontSize: '14px' }">
      将二维码放入框内扫描
    </div>
  </div>
</template>
