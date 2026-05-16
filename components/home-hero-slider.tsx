'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'

import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel'
import { HomepageSlide } from '@/lib/types'

const themeStyles = {
  atelier: {
    accent: '#f6d6a8',
    wash: 'rgba(246, 214, 168, 0.20)',
    label: 'мастерская',
  },
  'night-city': {
    accent: '#9db5c8',
    wash: 'rgba(157, 181, 200, 0.20)',
    label: 'ночной город',
  },
  pvz: {
    accent: '#d7c6ad',
    wash: 'rgba(215, 198, 173, 0.18)',
    label: 'логистика',
  },
  volga: {
    accent: '#b9c7b3',
    wash: 'rgba(185, 199, 179, 0.18)',
    label: 'волга',
  },
  dreams: {
    accent: '#c7bddf',
    wash: 'rgba(199, 189, 223, 0.18)',
    label: 'мир снов',
  },
}

interface HomeHeroSliderProps {
  slides: HomepageSlide[]
}

export function HomeHeroSlider({ slides }: HomeHeroSliderProps) {
  const [api, setApi] = useState<CarouselApi>()
  const [selectedIndex, setSelectedIndex] = useState(0)

  const selectedSlide = slides[selectedIndex] || slides[0]
  const currentTheme = themeStyles[selectedSlide?.theme || 'atelier']

  const onSelect = useCallback((carouselApi: CarouselApi) => {
    if (!carouselApi) return
    setSelectedIndex(carouselApi.selectedScrollSnap())
  }, [])

  useEffect(() => {
    if (!api) return

    onSelect(api)
    api.on('select', onSelect)
    api.on('reInit', onSelect)

    return () => {
      api.off('select', onSelect)
      api.off('reInit', onSelect)
    }
  }, [api, onSelect])

  useEffect(() => {
    if (!api || slides.length < 2) return

    const interval = window.setInterval(() => {
      if (api.canScrollNext()) {
        api.scrollNext()
      } else {
        api.scrollTo(0)
      }
    }, 8500)

    return () => window.clearInterval(interval)
  }, [api, slides.length])

  const slideNumbers = useMemo(
    () => slides.map((slide, index) => ({ id: slide.id, label: String(index + 1).padStart(2, '0') })),
    [slides],
  )

  return (
    <section className="relative overflow-hidden border-b border-[#f4efe5]/10 bg-[#111210]">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(244,239,229,0.035)_1px,transparent_1px),linear-gradient(180deg,rgba(244,239,229,0.025)_1px,transparent_1px)] bg-[size:64px_64px]" />
      <div
        className="absolute inset-0 transition-colors duration-500"
        style={{
          background: `radial-gradient(circle at 75% 22%, ${currentTheme.wash}, transparent 34%), linear-gradient(180deg, rgba(17,18,16,0.18), #111210 92%)`,
        }}
      />

      <Carousel setApi={setApi} opts={{ loop: true, align: 'start' }} className="relative">
        <CarouselContent className="ml-0">
          {slides.map((slide, index) => {
            const theme = themeStyles[slide.theme]
            const imageUrl = slide.background_image || slide.mobile_image
            const asideLabel = slide.aside_label?.trim() || 'Дополнения'
            const asideNumber =
              slide.aside_number?.trim() || String(index + 1).padStart(2, '0')
            const asideText = slide.aside_text?.trim()

            return (
              <CarouselItem key={slide.id} className="pl-0">
                <article className="relative min-h-[calc(100vh-108px)] overflow-hidden md:min-h-[680px]">
                  {imageUrl ? (
                    <div
                      className="absolute inset-0 bg-cover bg-center opacity-[0.58]"
                      style={{ backgroundImage: `url(${imageUrl})` }}
                    />
                  ) : (
                    <SlideAtmosphere theme={slide.theme} />
                  )}
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,#111210_0%,rgba(17,18,16,0.92)_34%,rgba(17,18,16,0.58)_62%,rgba(17,18,16,0.82)_100%)]" />
                  <div className="absolute inset-x-0 bottom-0 h-44 bg-[linear-gradient(180deg,transparent,#111210)]" />

                  <div className="relative mx-auto grid min-h-[calc(100vh-108px)] max-w-7xl items-center px-4 py-16 md:min-h-[680px] md:px-8 lg:grid-cols-[minmax(0,1fr)_360px]">
                    <div className="max-w-4xl">
                      <p
                        className="mb-5 inline-flex border-l px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em]"
                        style={{
                          borderColor: theme.accent,
                          backgroundColor: `${theme.accent}14`,
                          color: theme.accent,
                        }}
                      >
                        {slide.eyebrow || theme.label}
                      </p>
                      <h1 className="max-w-4xl text-5xl font-black uppercase leading-[0.88] tracking-normal text-[#fff8ea] text-balance md:text-6xl lg:text-8xl">
                        {slide.title}
                      </h1>
                      {slide.description ? (
                        <p className="mt-7 max-w-2xl text-lg leading-8 text-[#ddd5c8] md:text-xl">
                          {slide.description}
                        </p>
                      ) : null}
                      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                        {slide.primary_cta_label && slide.primary_cta_href ? (
                          <Link
                            href={slide.primary_cta_href}
                            className="inline-flex h-12 items-center justify-center gap-2 rounded-sm px-5 text-sm font-bold uppercase text-[#12120f] transition-transform hover:-translate-y-0.5"
                            style={{ backgroundColor: theme.accent }}
                          >
                            {slide.primary_cta_label}
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        ) : null}
                        {slide.secondary_cta_label && slide.secondary_cta_href ? (
                          <Link
                            href={slide.secondary_cta_href}
                            className="inline-flex h-12 items-center justify-center rounded-sm border border-[#f4efe5]/18 px-5 text-sm font-bold uppercase text-[#f4efe5] transition-colors hover:bg-[#f4efe5]/8"
                          >
                            {slide.secondary_cta_label}
                          </Link>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-10 hidden border-l border-[#f4efe5]/12 pl-6 lg:block">
                      <p className="text-xs uppercase tracking-[0.24em] text-[#9f978b]">{asideLabel}</p>
                      <p className="mt-4 text-7xl font-black leading-none text-[#f4efe5]/12">
                        {asideNumber}
                      </p>
                      {asideText ? (
                        <p className="mt-5 max-w-xs text-sm leading-6 text-[#b9b1a6]">{asideText}</p>
                      ) : null}
                    </div>
                  </div>
                </article>
              </CarouselItem>
            )
          })}
        </CarouselContent>

        <div className="absolute bottom-0 left-0 right-0 z-10 border-t border-[#f4efe5]/10 bg-[#111210]/88 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-8">
            <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
              {slideNumbers.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => api?.scrollTo(index)}
                  className={`h-12 min-w-14 border-b-2 px-3 text-left text-sm font-black transition-colors ${
                    selectedIndex === index
                      ? 'border-[#f6d6a8] text-[#f6d6a8]'
                      : 'border-transparent text-[#8f877c] hover:text-[#f4efe5]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => api?.scrollPrev()}
                className="flex h-10 w-10 items-center justify-center rounded-sm border border-[#f4efe5]/14 text-[#f4efe5] hover:bg-[#f4efe5]/8"
                aria-label="Предыдущий слайд"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => api?.scrollNext()}
                className="flex h-10 w-10 items-center justify-center rounded-sm border border-[#f4efe5]/14 text-[#f4efe5] hover:bg-[#f4efe5]/8"
                aria-label="Следующий слайд"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </Carousel>
    </section>
  )
}

function SlideAtmosphere({ theme }: { theme: HomepageSlide['theme'] }) {
  if (theme === 'night-city') {
    return (
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[#14191d]" />
        <div className="absolute left-[58%] top-20 h-[520px] w-[320px] border border-[#9db5c8]/20 bg-[#9db5c8]/8" />
        <div className="absolute bottom-24 right-16 h-3 w-80 bg-[#9db5c8]/24" />
        <div className="absolute bottom-32 right-28 h-24 w-44 border border-[#f4efe5]/12 bg-[#f4efe5]/8" />
      </div>
    )
  }

  if (theme === 'pvz') {
    return (
      <div className="absolute inset-0 bg-[#171613]">
        <div className="absolute right-20 top-20 grid grid-cols-4 gap-3 opacity-80">
          {Array.from({ length: 24 }).map((_, index) => (
            <span key={index} className="h-20 w-24 border border-[#d7c6ad]/18 bg-[#d7c6ad]/10" />
          ))}
        </div>
      </div>
    )
  }

  if (theme === 'volga') {
    return (
      <div className="absolute inset-0 bg-[#151a15]">
        <div className="absolute bottom-36 right-0 h-24 w-[58%] border-y border-[#b9c7b3]/16 bg-[#b9c7b3]/10" />
        <div className="absolute right-20 top-24 h-72 w-72 border border-[#b9c7b3]/20" />
      </div>
    )
  }

  if (theme === 'dreams') {
    return (
      <div className="absolute inset-0 bg-[#17141d]">
        <div className="absolute right-24 top-24 h-72 w-72 rounded-full border border-[#c7bddf]/20 bg-[#c7bddf]/8" />
        <div className="absolute bottom-24 right-40 h-44 w-28 border border-[#c7bddf]/18 bg-[#c7bddf]/10" />
      </div>
    )
  }

  return (
    <div className="absolute inset-0 bg-[#171411]">
      <div className="absolute right-20 top-16 h-[480px] w-[360px] border border-[#f6d6a8]/18 bg-[#f6d6a8]/10" />
      <div className="absolute bottom-24 right-32 h-28 w-64 border border-[#f6d6a8]/20 bg-[#f6d6a8]/12" />
      <div className="absolute right-44 top-48 h-80 w-px bg-[#f6d6a8]/35" />
    </div>
  )
}
