-- ============================================
-- HAPPY CLIENT - FULL DATABASE SCHEMA
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'member', 'viewer');
CREATE TYPE public.testimonial_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.testimonial_type AS ENUM ('text', 'video', 'audio');
CREATE TYPE public.campaign_status AS ENUM ('draft', 'scheduled', 'active', 'completed', 'paused');
CREATE TYPE public.campaign_type AS ENUM ('sms', 'email');
CREATE TYPE public.widget_type AS ENUM ('carousel', 'grid', 'single', 'popup', 'fomo', 'inline');
CREATE TYPE public.content_type AS ENUM ('twitter_thread', 'linkedin_post', 'instagram_carousel', 'email_snippet', 'case_study', 'quote_graphic', 'video_highlight', 'ai_avatar');
CREATE TYPE public.sentiment AS ENUM ('positive', 'neutral', 'negative');

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  company_name TEXT,
  company_logo TEXT,
  industry TEXT,
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================
-- USER ROLES TABLE (Security)
-- ============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, role)
);

-- ============================================
-- FORMS TABLE
-- ============================================
CREATE TABLE public.forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  welcome_title TEXT DEFAULT 'Share Your Experience',
  welcome_message TEXT,
  thank_you_title TEXT DEFAULT 'Thank You!',
  thank_you_message TEXT,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#F97316',
  collect_video BOOLEAN DEFAULT true,
  collect_audio BOOLEAN DEFAULT false,
  collect_text BOOLEAN DEFAULT true,
  require_rating BOOLEAN DEFAULT true,
  require_photo BOOLEAN DEFAULT false,
  custom_questions JSONB DEFAULT '[]'::jsonb,
  incentive_enabled BOOLEAN DEFAULT false,
  incentive_type TEXT,
  incentive_value TEXT,
  is_published BOOLEAN DEFAULT false,
  submission_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================
-- TESTIMONIALS TABLE
-- ============================================
CREATE TABLE public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  form_id UUID REFERENCES public.forms(id) ON DELETE SET NULL,
  type testimonial_type DEFAULT 'text',
  status testimonial_status DEFAULT 'pending',
  content TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  author_name TEXT NOT NULL,
  author_email TEXT,
  author_title TEXT,
  author_company TEXT,
  author_avatar TEXT,
  video_url TEXT,
  audio_url TEXT,
  thumbnail_url TEXT,
  source TEXT DEFAULT 'form',
  source_url TEXT,
  sentiment sentiment,
  ai_summary TEXT,
  tags TEXT[] DEFAULT '{}',
  revenue_attributed DECIMAL(10,2) DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  custom_fields JSONB DEFAULT '{}'::jsonb,
  collected_at TIMESTAMPTZ DEFAULT now(),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================
-- CAMPAIGNS TABLE
-- ============================================
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  form_id UUID REFERENCES public.forms(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  type campaign_type DEFAULT 'sms',
  status campaign_status DEFAULT 'draft',
  message_template TEXT,
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  recipients JSONB DEFAULT '[]'::jsonb,
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  completed_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================
-- WIDGETS TABLE
-- ============================================
CREATE TABLE public.widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type widget_type DEFAULT 'carousel',
  settings JSONB DEFAULT '{}'::jsonb,
  testimonial_ids UUID[] DEFAULT '{}',
  auto_rotate BOOLEAN DEFAULT true,
  show_rating BOOLEAN DEFAULT true,
  show_date BOOLEAN DEFAULT false,
  theme TEXT DEFAULT 'light',
  custom_css TEXT,
  embed_code TEXT,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue_attributed DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================
-- WALLS OF LOVE TABLE
-- ============================================
CREATE TABLE public.walls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  layout TEXT DEFAULT 'masonry',
  columns INTEGER DEFAULT 3,
  testimonial_ids UUID[] DEFAULT '{}',
  header_title TEXT,
  header_subtitle TEXT,
  logo_url TEXT,
  background_color TEXT DEFAULT '#FFFBF7',
  accent_color TEXT DEFAULT '#F97316',
  custom_domain TEXT,
  is_published BOOLEAN DEFAULT false,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================
-- GENERATED CONTENT TABLE
-- ============================================
CREATE TABLE public.generated_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  testimonial_ids UUID[] NOT NULL,
  type content_type NOT NULL,
  content TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  image_url TEXT,
  video_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================
-- REVENUE EVENTS TABLE
-- ============================================
CREATE TABLE public.revenue_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  testimonial_id UUID REFERENCES public.testimonials(id) ON DELETE SET NULL,
  widget_id UUID REFERENCES public.widgets(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  source TEXT,
  customer_email TEXT,
  stripe_payment_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  attributed_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================
-- ACTIVITY LOG TABLE
-- ============================================
CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================
-- INTEGRATIONS TABLE
-- ============================================
CREATE TABLE public.integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL,
  is_connected BOOLEAN DEFAULT false,
  access_token TEXT,
  refresh_token TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, provider)
);

-- ============================================
-- SECURITY DEFINER FUNCTION FOR ROLES
-- ============================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- ============================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  -- Assign default member role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'member');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply updated_at triggers
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_forms_updated_at BEFORE UPDATE ON public.forms FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_testimonials_updated_at BEFORE UPDATE ON public.testimonials FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_campaigns_updated_at BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_widgets_updated_at BEFORE UPDATE ON public.widgets FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_walls_updated_at BEFORE UPDATE ON public.walls FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_integrations_updated_at BEFORE UPDATE ON public.integrations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.walls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - PROFILES
-- ============================================
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - USER ROLES (read-only for users)
-- ============================================
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - FORMS
-- ============================================
CREATE POLICY "Users can view own forms" ON public.forms
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own forms" ON public.forms
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own forms" ON public.forms
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own forms" ON public.forms
  FOR DELETE USING (auth.uid() = user_id);

-- Public form access for submissions
CREATE POLICY "Anyone can view published forms by slug" ON public.forms
  FOR SELECT USING (is_published = true);

-- ============================================
-- RLS POLICIES - TESTIMONIALS
-- ============================================
CREATE POLICY "Users can view own testimonials" ON public.testimonials
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create testimonials" ON public.testimonials
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own testimonials" ON public.testimonials
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own testimonials" ON public.testimonials
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - CAMPAIGNS
-- ============================================
CREATE POLICY "Users can view own campaigns" ON public.campaigns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create campaigns" ON public.campaigns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own campaigns" ON public.campaigns
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own campaigns" ON public.campaigns
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - WIDGETS
-- ============================================
CREATE POLICY "Users can view own widgets" ON public.widgets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create widgets" ON public.widgets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own widgets" ON public.widgets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own widgets" ON public.widgets
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - WALLS
-- ============================================
CREATE POLICY "Users can view own walls" ON public.walls
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create walls" ON public.walls
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own walls" ON public.walls
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own walls" ON public.walls
  FOR DELETE USING (auth.uid() = user_id);

-- Public wall access
CREATE POLICY "Anyone can view published walls" ON public.walls
  FOR SELECT USING (is_published = true);

-- ============================================
-- RLS POLICIES - GENERATED CONTENT
-- ============================================
CREATE POLICY "Users can view own content" ON public.generated_content
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create content" ON public.generated_content
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own content" ON public.generated_content
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - REVENUE EVENTS
-- ============================================
CREATE POLICY "Users can view own revenue" ON public.revenue_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create revenue events" ON public.revenue_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - ACTIVITY LOG
-- ============================================
CREATE POLICY "Users can view own activity" ON public.activity_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create activity" ON public.activity_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - INTEGRATIONS
-- ============================================
CREATE POLICY "Users can view own integrations" ON public.integrations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create integrations" ON public.integrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own integrations" ON public.integrations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own integrations" ON public.integrations
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- ENABLE REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.testimonials;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaigns;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_log;
ALTER PUBLICATION supabase_realtime ADD TABLE public.revenue_events;

-- ============================================
-- STORAGE BUCKETS
-- ============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('videos', 'videos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('exports', 'exports', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true);

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload avatars" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own avatars" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own avatars" ON storage.objects
  FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for videos
CREATE POLICY "Videos are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'videos');

CREATE POLICY "Users can upload videos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own videos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own videos" ON storage.objects
  FOR DELETE USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for logos
CREATE POLICY "Logos are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'logos');

CREATE POLICY "Users can upload logos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own logos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for exports (private)
CREATE POLICY "Users can view own exports" ON storage.objects
  FOR SELECT USING (bucket_id = 'exports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can create exports" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'exports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own exports" ON storage.objects
  FOR DELETE USING (bucket_id = 'exports' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_testimonials_user_id ON public.testimonials(user_id);
CREATE INDEX idx_testimonials_status ON public.testimonials(status);
CREATE INDEX idx_testimonials_rating ON public.testimonials(rating);
CREATE INDEX idx_testimonials_created_at ON public.testimonials(created_at DESC);
CREATE INDEX idx_forms_user_id ON public.forms(user_id);
CREATE INDEX idx_forms_slug ON public.forms(slug);
CREATE INDEX idx_campaigns_user_id ON public.campaigns(user_id);
CREATE INDEX idx_campaigns_status ON public.campaigns(status);
CREATE INDEX idx_widgets_user_id ON public.widgets(user_id);
CREATE INDEX idx_walls_user_id ON public.walls(user_id);
CREATE INDEX idx_walls_slug ON public.walls(slug);
CREATE INDEX idx_revenue_events_user_id ON public.revenue_events(user_id);
CREATE INDEX idx_revenue_events_created_at ON public.revenue_events(created_at DESC);
CREATE INDEX idx_activity_log_user_id ON public.activity_log(user_id);
CREATE INDEX idx_activity_log_created_at ON public.activity_log(created_at DESC);