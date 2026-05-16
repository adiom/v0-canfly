-- Homepage hero slider managed from the admin panel.

DO $$
BEGIN
  CREATE TYPE public.homepage_slide_theme AS ENUM ('atelier', 'night-city', 'pvz', 'volga', 'dreams');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.homepage_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  eyebrow TEXT,
  description TEXT,
  background_image TEXT,
  mobile_image TEXT,
  primary_cta_label TEXT,
  primary_cta_href TEXT,
  secondary_cta_label TEXT,
  secondary_cta_href TEXT,
  theme public.homepage_slide_theme NOT NULL DEFAULT 'atelier',
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_homepage_slides_active_order
  ON public.homepage_slides(is_active, display_order);

DROP TRIGGER IF EXISTS update_homepage_slides_updated_at ON public.homepage_slides;
CREATE TRIGGER update_homepage_slides_updated_at
  BEFORE UPDATE ON public.homepage_slides
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.homepage_slides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Homepage slides are viewable by everyone" ON public.homepage_slides;
CREATE POLICY "Homepage slides are viewable by everyone"
  ON public.homepage_slides FOR SELECT USING (true);
