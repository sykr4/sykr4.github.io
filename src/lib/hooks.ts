import { useEffect, useRef, useState, type RefObject } from "react";

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMatches(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [query]);
  return matches;
}

/** IntersectionObserver: carga diferida y pausa de render fuera de pantalla. */
export function useInView<T extends Element>(ref: RefObject<T | null>, rootMargin = "0px", once = false) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting && once) io.disconnect();
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin, once]);
  return inView;
}

/** Igual que useInView pero en un ref (sin re-render), para bucles de animación. */
export function useInViewRef<T extends Element>(ref: RefObject<T | null>, rootMargin = "0px") {
  const visible = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => (visible.current = entry.isIntersecting), { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin]);
  return visible;
}

const timeFmt = new Intl.DateTimeFormat("es-ES", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  timeZone: "Europe/Madrid",
});

export function useLocalTime() {
  const [time, setTime] = useState(() => timeFmt.format(new Date()));
  useEffect(() => {
    const id = window.setInterval(() => setTime(timeFmt.format(new Date())), 1000);
    return () => window.clearInterval(id);
  }, []);
  return time;
}
