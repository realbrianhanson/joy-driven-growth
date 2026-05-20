-- Tighten Part 1 helper grants
REVOKE EXECUTE ON FUNCTION public.is_team_member_of(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_my_team_owner() FROM PUBLIC, anon;

-- TESTIMONIALS
DROP POLICY "Users can view own testimonials" ON public.testimonials;
DROP POLICY "Users can create testimonials" ON public.testimonials;
DROP POLICY "Users can update own testimonials" ON public.testimonials;
DROP POLICY "Users can delete own testimonials" ON public.testimonials;
CREATE POLICY "team can read testimonials" ON public.testimonials FOR SELECT TO authenticated USING (public.is_team_member_of(user_id));
CREATE POLICY "team can insert testimonials" ON public.testimonials FOR INSERT TO authenticated WITH CHECK (public.is_team_member_of(user_id));
CREATE POLICY "team can update testimonials" ON public.testimonials FOR UPDATE TO authenticated USING (public.is_team_member_of(user_id)) WITH CHECK (public.is_team_member_of(user_id));
CREATE POLICY "owner can delete testimonials" ON public.testimonials FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- FORMS (keep "Anyone can view published forms by slug")
DROP POLICY "Users can view own forms" ON public.forms;
DROP POLICY "Users can create own forms" ON public.forms;
DROP POLICY "Users can update own forms" ON public.forms;
DROP POLICY "Users can delete own forms" ON public.forms;
CREATE POLICY "team can read forms" ON public.forms FOR SELECT TO authenticated USING (public.is_team_member_of(user_id));
CREATE POLICY "team can insert forms" ON public.forms FOR INSERT TO authenticated WITH CHECK (public.is_team_member_of(user_id));
CREATE POLICY "team can update forms" ON public.forms FOR UPDATE TO authenticated USING (public.is_team_member_of(user_id)) WITH CHECK (public.is_team_member_of(user_id));
CREATE POLICY "owner can delete forms" ON public.forms FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- WALLS (keep "Anyone can view published walls")
DROP POLICY "Users can view own walls" ON public.walls;
DROP POLICY "Users can create walls" ON public.walls;
DROP POLICY "Users can update own walls" ON public.walls;
DROP POLICY "Users can delete own walls" ON public.walls;
CREATE POLICY "team can read walls" ON public.walls FOR SELECT TO authenticated USING (public.is_team_member_of(user_id));
CREATE POLICY "team can insert walls" ON public.walls FOR INSERT TO authenticated WITH CHECK (public.is_team_member_of(user_id));
CREATE POLICY "team can update walls" ON public.walls FOR UPDATE TO authenticated USING (public.is_team_member_of(user_id)) WITH CHECK (public.is_team_member_of(user_id));
CREATE POLICY "owner can delete walls" ON public.walls FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- WIDGETS
DROP POLICY "Users can view own widgets" ON public.widgets;
DROP POLICY "Users can create widgets" ON public.widgets;
DROP POLICY "Users can update own widgets" ON public.widgets;
DROP POLICY "Users can delete own widgets" ON public.widgets;
CREATE POLICY "team can read widgets" ON public.widgets FOR SELECT TO authenticated USING (public.is_team_member_of(user_id));
CREATE POLICY "team can insert widgets" ON public.widgets FOR INSERT TO authenticated WITH CHECK (public.is_team_member_of(user_id));
CREATE POLICY "team can update widgets" ON public.widgets FOR UPDATE TO authenticated USING (public.is_team_member_of(user_id)) WITH CHECK (public.is_team_member_of(user_id));
CREATE POLICY "owner can delete widgets" ON public.widgets FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- CAMPAIGNS
DROP POLICY "Users can view own campaigns" ON public.campaigns;
DROP POLICY "Users can create campaigns" ON public.campaigns;
DROP POLICY "Users can update own campaigns" ON public.campaigns;
DROP POLICY "Users can delete own campaigns" ON public.campaigns;
CREATE POLICY "team can read campaigns" ON public.campaigns FOR SELECT TO authenticated USING (public.is_team_member_of(user_id));
CREATE POLICY "team can insert campaigns" ON public.campaigns FOR INSERT TO authenticated WITH CHECK (public.is_team_member_of(user_id));
CREATE POLICY "team can update campaigns" ON public.campaigns FOR UPDATE TO authenticated USING (public.is_team_member_of(user_id)) WITH CHECK (public.is_team_member_of(user_id));
CREATE POLICY "owner can delete campaigns" ON public.campaigns FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- GENERATED_CONTENT (no UPDATE policy existed previously; add for team consistency)
DROP POLICY "Users can view own content" ON public.generated_content;
DROP POLICY "Users can create content" ON public.generated_content;
DROP POLICY "Users can delete own content" ON public.generated_content;
CREATE POLICY "team can read generated_content" ON public.generated_content FOR SELECT TO authenticated USING (public.is_team_member_of(user_id));
CREATE POLICY "team can insert generated_content" ON public.generated_content FOR INSERT TO authenticated WITH CHECK (public.is_team_member_of(user_id));
CREATE POLICY "team can update generated_content" ON public.generated_content FOR UPDATE TO authenticated USING (public.is_team_member_of(user_id)) WITH CHECK (public.is_team_member_of(user_id));
CREATE POLICY "owner can delete generated_content" ON public.generated_content FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- REVENUE_EVENTS — replace SELECT only; leave INSERT owner-only
DROP POLICY "Users can view own revenue" ON public.revenue_events;
CREATE POLICY "team can read revenue_events" ON public.revenue_events FOR SELECT TO authenticated USING (public.is_team_member_of(user_id));

-- ACTIVITY_LOG — replace SELECT only; leave INSERT owner-only
DROP POLICY "Users can view own activity" ON public.activity_log;
CREATE POLICY "team can read activity_log" ON public.activity_log FOR SELECT TO authenticated USING (public.is_team_member_of(user_id));