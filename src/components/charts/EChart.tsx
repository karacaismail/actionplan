import type { EChartsOption } from "echarts";
import * as echarts from "echarts";
import { useEffect, useRef } from "react";

/** ECharts sarmalayıcı — SVG renderer (hafif, ölçeklenir, export edilebilir). */
export function EChart({
  option,
  height = 280,
  ariaLabel,
}: {
  option: EChartsOption;
  height?: number;
  ariaLabel?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current, undefined, { renderer: "svg" });
    chart.setOption(option);
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(ref.current);
    return () => {
      ro.disconnect();
      chart.dispose();
    };
  }, [option]);

  return <div ref={ref} style={{ height, width: "100%" }} role="img" aria-label={ariaLabel} />;
}
