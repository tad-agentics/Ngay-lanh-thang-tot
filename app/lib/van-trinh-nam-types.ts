export type VanTrinhNamVerdictSignal = "thuan" | "than_trong" | "can_nang";
export type VanTrinhNamEmphasisSignal = "up" | "down" | "neutral";

export type VanTrinhNamDayRow = {
  date: string;
  date_vi: string;
  can_chi: string;
  grade: string;
  score: number;
  mitigation_tags?: string[];
};

export type VanTrinhNamMonthBlock = {
  month_num: number;
  target_month: string;
  title_vi: string;
  solar_range: string;
  b1_month_theme: {
    luu_nguyet_display: string;
    nap_am?: string;
    month_hanh?: string;
    element_relation_nhat_chu?: string;
    month_archetype?: string;
    fact_bullets_vi: string[];
  };
  b2_month_emphasis: Array<{
    aspect_id: string;
    label_vi: string;
    emphasis_signal: VanTrinhNamEmphasisSignal;
    fact_bullets_vi: string[];
  }>;
  b3_luu_nhat_calendar: {
    best_days: VanTrinhNamDayRow[];
    avoid_days: VanTrinhNamDayRow[];
    top_hours: string[];
    calendar_stats?: {
      grade_a: number;
      grade_b: number;
      total_days: number;
    };
  };
  b4_action: {
    action_tags_nen: string[];
    action_tags_tranh: string[];
  };
  qa_hints?: { target_word_band?: [number, number] };
};

export type VanTrinhNamLuanContext = {
  meta: {
    product_title_vi?: string;
    year: number;
    engine_version: string;
    computed_at?: string;
    disclaimers: string[];
  };
  part_a: {
    hook_year: {
      year: number;
      year_can_chi: string;
      year_hanh?: string;
      element_relation?: string;
      year_rating?: string;
      year_theme_signal?: string;
      fact_bullets_vi: string[];
    };
    you_this_year: {
      natal_facts_vi: string[];
      nhat_chu_hanh?: string;
      dung_than?: string;
      ky_than?: string;
      dai_van: {
        current: {
          display: string;
          can_hanh?: string;
          age_range?: string;
          relation_to_dung_than_signal?: string;
        };
        transition_in_year?: {
          from_display: string;
          to_display: string;
          applies_from_month: number;
        } | null;
        disclaimer_fact_vi?: string | null;
      };
    };
    four_aspects_year: Array<{
      aspect_id: string;
      label_vi: string;
      verdict_signal: VanTrinhNamVerdictSignal;
      fact_bullets_vi: string[];
    }>;
    year_aspect_ranking: string[];
  };
  part_b: { luu_nguyet_months: VanTrinhNamMonthBlock[] };
  part_c: {
    closing_hints: {
      synthesis_inputs: {
        archetype_counts?: Record<string, number>;
        strong_months?: number[];
        month_count?: number;
      };
    };
  };
  part_d: {
    mechanics: {
      natal?: Record<string, string>;
      dung_than?: string;
      ky_than?: string;
      dai_van_current?: string;
      luu_nien_pillar?: string;
      luu_nguyet_sample_pillar?: string;
      framework_line_vi?: string;
    };
  };
  writing_brief?: {
    forbidden_response_keys?: string[];
    render_order?: string[];
    rules?: Record<string, string>;
  };
};
