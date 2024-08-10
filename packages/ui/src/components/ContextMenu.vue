<template>
  <div class="full-height" ref="menuContainer">
    <slot />
  </div>
  <ul
    class="context-menu"
    ref="contextMenu"
    v-if="visible"
    :style="{
      left: `${pageX}px`,
      top: `${pageY}px`,
    }"
  >
    <li
      v-for="menu in props.menus"
      :key="menu.title"
      @click="handleClick(menu)"
    >
      {{ menu.title }}
    </li>
  </ul>
</template>

<script setup>
import { ref, shallowRef, onMounted, watch, onUnmounted, nextTick } from "vue";
import useMouse from "@/hooks/useMouse";
import { getScrollLeft, getScrollTop } from "@/helpers/dom";
const props = defineProps({
  menus: Array,
  scaling: {
    type: Number,
    default: 1,
  },
});
const menuContainer = ref(null);
const contextMenu = ref(null);
const visible = shallowRef(false);

watch(visible, (value) => {
  if (value) {
    nextTick(() => {
      document.body.appendChild(contextMenu.value);
    });
  }
});

const showContextMenu = () => {
  visible.value = true;
};

const handleClick = (menu) => {
  typeof menu.onClick === "function" && menu.onClick();
  visible.value = false;
};
const pos = useMouse();
let pageX = shallowRef(0);
let pageY = shallowRef(0);
const onContextMenu = (e) => {
  if (!menuContainer.value || menuContainer.value.contains(e.target)) {
    e.preventDefault();
    showContextMenu();
    pageX.value = (pos.x.value - getScrollLeft()) * props.scaling;
    pageY.value = (pos.y.value - getScrollTop()) * props.scaling;
  }
};
const onLeaveContext = (e) => {
  if (!contextMenu.value || !contextMenu.value.contains(e.target)) {
    visible.value = false;
  }
};
onMounted(() => {
  document.addEventListener("contextmenu", onContextMenu);
  document.addEventListener("click", onLeaveContext);
});
onUnmounted(() => {
  document.removeEventListener("contextmenu", onContextMenu);
  document.removeEventListener("click", onLeaveContext);
});
</script>
<style lang="scss" scoped>
.context-menu {
  position: fixed;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
  width: 100px;
  background: #fff;
  z-index: 10;
  li {
    height: 30px;
    padding: 0 6px;
    font-size: 14px;
    line-height: 30px;
    cursor: pointer;
    &:hover {
      background: #e1e1e1;
    }
  }
}
</style>
