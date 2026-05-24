// components/yandex-metrika.tsx
"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import ym, { YMInitializer } from "react-yandex-metrika";

const YM_COUNTER_ID = 42420764; // замените на ваш ID счётчика

function RouterTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname) {
      const url = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
      ym("hit", url);
    }
  }, [pathname, searchParams]);

  return null;
}

export const YandexMetrika = () => {
  return (
    <>
      <YMInitializer
        accounts={[YM_COUNTER_ID]}
        options={{
          defer: true,
          webvisor: true,
          clickmap: true,
          trackLinks: true,
          accurateTrackBounce: true,
        }}
        version="2"
      />
      <Suspense fallback={null}>
        <RouterTracker />
      </Suspense>
    </>
  );
};
