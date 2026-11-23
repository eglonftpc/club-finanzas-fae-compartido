"use client";

import type { PanelState } from "@/lib/commands/types";
import { DesPanel } from "@/components/panels/DesPanel";
import { FavPanel } from "@/components/panels/FavPanel";
import { GpPanel } from "@/components/panels/GpPanel";
import { HelpPanel } from "@/components/panels/HelpPanel";
import { NewsPanel } from "@/components/panels/NewsPanel";
import { TopPanel } from "@/components/panels/TopPanel";
import { WeiPanel } from "@/components/panels/WeiPanel";

export function PanelRouter({ panel }: { panel: PanelState }) {
  switch (panel.fn) {
    case "DES":
      return <DesPanel symbol={panel.symbol} />;
    case "GP":
      return (
        <GpPanel panelId={panel.id} symbol={panel.symbol} range={panel.range} />
      );
    case "N":
      return <NewsPanel symbol={panel.symbol} />;
    case "WEI":
      return <WeiPanel />;
    case "FAV":
      return <FavPanel />;
    case "TOP":
      return <TopPanel />;
    case "HELP":
      return <HelpPanel />;
    case "MAX":
    case "GRID":
      return <HelpPanel />;
    default:
      return <HelpPanel />;
  }
}
