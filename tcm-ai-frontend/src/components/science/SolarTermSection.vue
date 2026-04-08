<template>
  <div ref="containerRef" class="no-scroll-container">

    <!-- 动态色块切入层 -->
    <div 
      :class="['color-block-transition', `color-block-${activeIndex}`]"
      :style="{ 
        background: activeProject.themeColor,
        opacity: activationProgress * 0.5,
        transform: `translateX(${-100 + activationProgress * 100}%)`
      }"
    ></div>

    <!-- 上方全屏详情区：首屏常显，滚动时切换内容 -->
    <div
      :key="`detail-${activeIndex}`"
      class="detail-immerse-container"
      :style="{
        opacity: Math.min(1, 0.9 + activationProgress * 0.1),
        transform: `scale(${0.96 + activationProgress * 0.04})`
      }"
    >
        <div class="detail-left" :style="{ '--theme-color': activeProject.themeColor }">
          <img 
            :src="activeProject.image" 
            class="detail-image" 
            alt="detail" 
          />
        </div>

        <div class="detail-right">
          <div class="era-badge-large" :style="{ background: activeProject.themeColor }">
            {{ activeProject.era }}
          </div>
          <h1 class="detail-title">{{ activeProject.title }}</h1>
          <p class="detail-desc">{{ activeProject.desc }}</p>
          <div class="detail-divider"></div>
          <p class="detail-achievement">{{ activeProject.achievement }}</p>
          <div class="detail-tags">
            <span 
              v-for="tag in activeProject.tags" 
              :key="tag" 
              class="detail-tag"
              :style="{ '--tag-accent': activeProject.themeColor }"
            >
              {{ tag }}
            </span>
          </div>
        </div>
      </div>

    <!-- 滚动触发指示区 -->
    <div class="scroll-indicator" v-if="activationProgress < 0.3">
      <div class="indicator-text">向下滚动探索</div>
      <div class="indicator-arrow"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import bianqueImg from '../../assets/bianque.jpg';
import huatuoImg from '../../assets/huatuo.jpg';
import zhangzhongjingImg from '../../assets/zhangzhongjing.jpg';
import huangfumiImg from '../../assets/huangfumi.jpg';
import yetianshiImg from '../../assets/yetianshi.jpg';
import sunsimiaoImg from '../../assets/sunsimiao.jpg';
import xuexueImg from '../../assets/xuexue.jpg';
import songciImg from '../../assets/songci.jpg';
import lishhizhenImg from '../../assets/lishhizhen.jpg';
import gehongImg from '../../assets/gehong.jpg';

// 中国古代十大名医
const projects = [
  { 
    title: '扁鹊',
    era: '春秋战国时期',
    desc: '奠定中医诊法基础，后世尊为脉学与诊断学先驱。',
    achievement: '相传开创望闻问切体系，医名远播诸侯。',
    tags: ['望闻问切', '脉诊', '战国名医'],
    image: bianqueImg,
    themeColor: 'rgba(179, 123, 82, 0.64)' 
  },
  { 
    title: '华佗',
    era: '东汉时期',
    desc: '外科与针灸并重，临证灵活，善治急症与疑难。',
    achievement: '相传创麻沸散与五禽戏，被誉外科先驱。',
    tags: ['外科', '麻沸散', '五禽戏'],
    image: huatuoImg,
    themeColor: 'rgba(139, 164, 141, 0.62)' 
  },
  { 
    title: '张仲景',
    era: '东汉末年',
    desc: '系统总结外感与杂病诊治法则，理论严谨。',
    achievement: '著《伤寒杂病论》，奠定辨证论治核心框架。',
    tags: ['伤寒论', '辨证论治', '医圣'],
    image: zhangzhongjingImg,
    themeColor: 'rgba(173, 148, 100, 0.62)' 
  },
  { 
    title: '皇甫谧',
    era: '魏晋时期',
    desc: '重视经络与腧穴体系整理，推动针灸学科化。',
    achievement: '编撰《针灸甲乙经》，为针灸经典奠基。',
    tags: ['针灸甲乙经', '经络', '魏晋名医'],
    image: huangfumiImg,
    themeColor: 'rgba(130, 146, 166, 0.6)'
  },
  {
    title: '叶桂',
    era: '清代',
    desc: '温病学代表人物，重视卫气营血辨证层次。',
    achievement: '发展温病理论体系，对热病辨治影响深远。',
    tags: ['温病学', '卫气营血', '临证大家'],
    image: yetianshiImg,
    themeColor: 'rgba(164, 132, 170, 0.6)'
  },
  {
    title: '孙思邈',
    era: '唐代',
    desc: '强调医德与临床并重，主张大医精诚。',
    achievement: '著《千金要方》《千金翼方》，惠及后世。',
    tags: ['千金方', '医德', '药食并治'],
    image: sunsimiaoImg,
    themeColor: 'rgba(176, 121, 98, 0.62)'
  },
  {
    title: '薛生白',
    era: '清代',
    desc: '温热病证治见长，注重病机层次与转归。',
    achievement: '丰富温病辨证经验，影响江南医派发展。',
    tags: ['温热', '辨证', '清代医家'],
    image: xuexueImg,
    themeColor: 'rgba(116, 148, 151, 0.6)'
  },
  {
    title: '宋慈',
    era: '南宋',
    desc: '重证据与实录，推动法医学实践体系化。',
    achievement: '著《洗冤集录》，为法医学经典著作。',
    tags: ['法医学', '洗冤集录', '实证精神'],
    image: songciImg,
    themeColor: 'rgba(129, 124, 168, 0.6)'
  },
  {
    title: '李时珍',
    era: '明朝时期',
    desc: '系统校勘本草，强调药物源流与临床应用。',
    achievement: '编著《本草纲目》，集大成于药物学。',
    tags: ['本草纲目', '药物学', '明代医药'],
    image: lishhizhenImg,
    themeColor: 'rgba(164, 93, 92, 0.64)'
  },
  {
    title: '葛洪',
    era: '东晋',
    desc: '兼擅医药与方术，重视急救与实用方药。',
    achievement: '著《肘后备急方》，对急救医学贡献卓著。',
    tags: ['肘后备急方', '急救', '东晋医家'],
    image: gehongImg,
    themeColor: 'rgba(100, 141, 121, 0.62)'
  }
];

const containerRef = ref(null);
const activeIndex = ref(0);
const activeProject = computed(() => projects[activeIndex.value]);
const activationProgress = ref(0);
const switchBufferRatio = 0.22;

// 处理滚动
const handleScroll = () => {
  if (!containerRef.value) return;

  const rect = containerRef.value.getBoundingClientRect();
  const viewportHeight = Math.max(window.innerHeight, 1);
  const totalScrollable = Math.max(rect.height - viewportHeight, 1);
  const sectionScroll = Math.min(Math.max(-rect.top, 0), totalScrollable);

  // 按区块内部滚动距离计算进度，避免进度突变导致详情突然消失
  const progress = sectionScroll / totalScrollable;
  activationProgress.value = Math.max(0, Math.min(progress, 1));

  // 按分段+缓冲切换人物：必须跨过缓冲区才切换，避免变化太快
  const sectionCount = projects.length;
  const segment = 1 / sectionCount;
  const normalized = progress / segment;
  let nextIndex = activeIndex.value;

  // 向下滚动时：超过当前分段末端并跨过缓冲区才切到下一位
  while (
    nextIndex < sectionCount - 1 &&
    normalized >= (nextIndex + 1) - switchBufferRatio
  ) {
    nextIndex += 1;
  }

  // 向上滚动时：回退到前一分段并跨过缓冲区才切回上一位
  while (
    nextIndex > 0 &&
    normalized <= (nextIndex - 1) + switchBufferRatio
  ) {
    nextIndex -= 1;
  }

  activeIndex.value = nextIndex;

};

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<style scoped>
/* ====================
   全局与布局样式
   ==================== */
.no-scroll-container {
  position: relative;
  width: 100vw;
  margin-left: calc(50% - 50vw);
  margin-right: calc(50% - 50vw);
  margin-top: -40px;
  margin-bottom: -40px;
  min-height: calc(100vh * 4.2);
  background:
    radial-gradient(1200px 650px at 10% -12%, rgba(170, 142, 112, 0.14), transparent 72%),
    radial-gradient(980px 520px at 88% 14%, rgba(129, 155, 136, 0.12), transparent 70%),
    linear-gradient(180deg, rgba(252, 248, 241, 0.84), rgba(243, 236, 225, 0.94)),
    #f3ece1;
  overflow-x: hidden;
}

.color-block-transition {
  position: fixed;
  top: 0;
  right: -100%;
  width: 200%;
  height: 100vh;
  clip-path: polygon(0 0, 100% 0, 70% 100%, 0% 100%);
  z-index: 650;
  pointer-events: none;
  will-change: transform, opacity;
}

/* ====================
   详情沉浸式展示区
   ==================== */
.detail-immerse-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 700;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 5vw;
  box-sizing: border-box;
  will-change: opacity, transform;
}

.detail-left {
  flex: 0 0 45%;
  height: 80vh;
  max-height: 600px;
  border-radius: 30px;
  overflow: hidden;
  box-shadow: 0 60px 100px rgba(0, 0, 0, 0.4);
  border: 3px solid var(--theme-color);
}

.detail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.detail-right {
  flex: 1;
  margin-left: 5vw;
  color: #4f3b2b;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 30px;
}

.era-badge-large {
  display: inline-block;
  width: fit-content;
  padding: 10px 20px;
  border-radius: 25px;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 1px;
  color: #fff;
}

.detail-title {
  font-size: 5.5rem;
  margin: 0;
  letter-spacing: 3px;
  background: linear-gradient(90deg, #5f4632, #9b7758);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1.1;
}

.detail-desc {
  font-size: 1.4rem;
  line-height: 2;
  color: #5e4a39;
  max-width: 600px;
  margin: 0;
}

.detail-divider {
  width: 100px;
  height: 3px;
  background: linear-gradient(90deg, var(--theme-color), transparent);
}

.detail-achievement {
  font-size: 1.1rem;
  line-height: 1.8;
  color: #7a6450;
  max-width: 700px;
  margin: 0;
  font-style: italic;
}

.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 10px;
}

.detail-tag {
  padding: 8px 16px;
  border: 2px solid rgba(84, 61, 43, 0.5);
  border-radius: 20px;
  font-size: 0.95rem;
  font-weight: 600;
  color: #3a281a;
  background: rgba(255, 252, 247, 0.96);
  box-shadow:
    0 2px 8px rgba(95, 70, 50, 0.12),
    inset 0 0 0 1px rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(2px);
  transition: all 0.3s ease;
  cursor: default;
}

.detail-tag:hover {
  border-color: var(--tag-accent);
  background: var(--tag-accent);
  color: #fff !important;
  transform: translateY(-3px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}

/* ====================
   交互提示与指示
   ==================== */

.scroll-indicator {
  position: fixed;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 3;
  text-align: center;
  animation: pulse-indicator 2s ease-in-out infinite;
}

.indicator-text {
  color: #7b6653;
  font-size: 0.95rem;
  margin-bottom: 12px;
  letter-spacing: 1px;
}

.indicator-arrow {
  width: 2px;
  height: 30px;
  background: linear-gradient(180deg, rgba(128, 102, 77, 0.78), transparent);
  margin: 0 auto;
  animation: scroll-arrow 1.5s ease-in-out infinite;
}

@keyframes pulse-indicator {
  0%, 100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}

@keyframes scroll-arrow {
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(12px);
  }
  100% {
    transform: translateY(0);
  }
}

/* ====================
   过渡动画
   ==================== */
.detail-immerse-enter-active,
.detail-immerse-leave-active {
  transition: all 0.8s cubic-bezier(0.25, 1, 0.5, 1);
}

.detail-immerse-enter-from,
.detail-immerse-leave-to {
  opacity: 0;
  transform: scale(0.85);
}

/* ====================
   响应式
   ==================== */
@media (max-width: 1200px) {
  .detail-immerse-container {
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 40px;
    padding: 5vh 5vw;
  }

  .detail-left {
    flex: 0 0 50vh;
    max-height: 50vh;
  }

  .detail-right {
    flex: 1;
    margin-left: 0;
    text-align: center;
  }

  .detail-title {
    font-size: 3.5rem;
  }
}

@media (max-width: 900px) {
  .detail-title {
    font-size: 2.5rem;
  }
}
</style>
