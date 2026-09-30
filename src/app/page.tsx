'use client';

import { SpiroCanvas } from '@/components/canvas/SpiroCanvas';
import { TopBar } from '@/components/layout/TopBar';
import { ModeToggle } from '@/components/controls/ModeToggle';
import { TextControls } from '@/components/controls/TextControls';
import { GeometryControls } from '@/components/controls/GeometryControls';
import { ColorControls } from '@/components/controls/ColorControls';
import { ExportControls } from '@/components/controls/ExportControls';

export default function Home() {
  return (
    <div className="flex h-dvh flex-col bg-app">
      <TopBar />

      <div className="flex min-h-0 flex-1 flex-col-reverse md:flex-row">
        <aside className="flex w-full shrink-0 flex-col border-t border-white/[0.06] bg-sidebar md:h-full md:w-[300px] md:border-t-0 md:border-r">
          <div className="spiro-scroll min-h-0 flex-1 overflow-y-auto px-4">
            <div className="flex flex-col divide-y divide-white/[0.06]">
              <ModeToggle />
              <TextControls />
              <GeometryControls />
              <ColorControls />
            </div>
          </div>

          <div className="shrink-0 border-t border-white/[0.06] bg-sidebar px-4 py-3.5">
            <ExportControls />
          </div>
        </aside>

        <main className="flex min-h-0 flex-1 items-center justify-center p-5">
          <SpiroCanvas />
        </main>
      </div>
    </div>
  );
}
