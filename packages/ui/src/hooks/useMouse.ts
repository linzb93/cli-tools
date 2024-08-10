import useEventListener from "./useEventListener";
import { shallowRef } from "vue";
import { throttle } from "lodash-es";

export default (throttleTime = 150) => {
  const x = shallowRef(0);
  const y = shallowRef(0);
  useEventListener(
    window,
    "mousemove",
    throttle((e) => {
      x.value = e.pageX;
      y.value = e.pageY;
    }, throttleTime)
  );
  return {
    x,
    y,
  };
};
