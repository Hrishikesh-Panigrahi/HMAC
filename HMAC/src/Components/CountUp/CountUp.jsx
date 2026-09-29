import { useEffect, useLayoutEffect, useRef } from "react";
import { animate, useReducedMotion } from "framer-motion";

// Animates a number up to `value`. Writes straight to the DOM so it doesn't re-render per frame.
const CountUp = ({ value, decimals = 0, suffix = "", duration = 1.2, delay = 0, className }) => {
  const ref = useRef(null);
  const fromRef = useRef(0);
  const reduceMotion = useReducedMotion();
  const target = Number.isFinite(Number(value)) ? Number(value) : 0;
  const format = (n) => `${n.toFixed(decimals)}${suffix}`;

  useLayoutEffect(() => {
    if (ref.current && !ref.current.textContent) ref.current.textContent = format(0);
  });

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    if (reduceMotion) {
      node.textContent = format(target);
      fromRef.current = target;
      return undefined;
    }

    const controls = animate(fromRef.current, target, {
      duration,
      delay,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => {
        node.textContent = format(latest);
      },
    });
    fromRef.current = target;
    return () => controls.stop();
    // format depends only on decimals/suffix
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, decimals, suffix, duration, delay, reduceMotion]);

  return <span ref={ref} className={className} />;
};

export default CountUp;
