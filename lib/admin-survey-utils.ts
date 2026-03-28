import { CONDENSED_STEPS, CONDENSED_VARIANT } from '@/config/condensed-parent-survey';
import { ADMIN_STEPS } from '@/config/school-admin-steps';
import { STEPS } from '@/config/steps';
import type { AdminSurveyView, ParentSurveyVariant } from '@/types/admin';
import type { StepConfig } from '@/types/survey';

type AdminStepDefinition = Pick<StepConfig, 'id' | 'path' | 'title' | 'description'>;

type ResponseLike = {
  survey_type?: string | null;
  current_step?: string | null;
  is_completed?: boolean | null;
  form_data?: Record<string, unknown> | null;
};

const VIEW_META: Record<
  AdminSurveyView,
  {
    label: string;
    shortLabel: string;
    description: string;
    audienceLabel: string;
  }
> = {
  all: {
    label: 'All Surveys',
    shortLabel: 'All Surveys',
    description: 'Combined response activity across every BetterPhone intake.',
    audienceLabel: 'all survey responses',
  },
  parent_long: {
    label: 'Parent Long-Form',
    shortLabel: 'Parents (Long)',
    description: 'Legacy parent funnel with pain-check, benefits, and the full 12-step journey.',
    audienceLabel: 'legacy parent long-form responses',
  },
  parent_condensed: {
    label: 'Parent Condensed',
    shortLabel: 'Parents (Condensed)',
    description: 'New condensed parent survey focused on one narrative question, issues, pricing, and opt-in.',
    audienceLabel: 'condensed parent responses',
  },
  school_admin: {
    label: 'School Admin',
    shortLabel: 'School Admins',
    description: 'School administrator survey responses about device disruption, policy, and pilot interest.',
    audienceLabel: 'school administrator responses',
  },
};

export const DEFAULT_ADMIN_SURVEY_VIEW: AdminSurveyView = 'parent_condensed';

export const ADMIN_SURVEY_VIEW_OPTIONS = [
  { id: 'parent_condensed', label: VIEW_META.parent_condensed.shortLabel },
  { id: 'parent_long', label: VIEW_META.parent_long.shortLabel },
  { id: 'school_admin', label: VIEW_META.school_admin.shortLabel },
] as const;

export function normalizeAdminSurveyView(value?: string | null): AdminSurveyView {
  switch (value) {
    case 'all':
      return 'all';
    case 'parent':
    case 'parent_long':
      return 'parent_long';
    case 'parent_condensed':
      return 'parent_condensed';
    case 'school_admin':
      return 'school_admin';
    default:
      return DEFAULT_ADMIN_SURVEY_VIEW;
  }
}

export function getParentSurveyVariant(formData?: Record<string, unknown> | null): ParentSurveyVariant {
  return formData?.surveyVariant === CONDENSED_VARIANT ? 'condensed_v6' : 'long_form';
}

export function isCondensedParentVariant(formData?: Record<string, unknown> | null): boolean {
  return getParentSurveyVariant(formData) === 'condensed_v6';
}

export function getAdminSurveyViewFromResponse(response: ResponseLike): Exclude<AdminSurveyView, 'all'> {
  if (response.survey_type === 'school_admin') {
    return 'school_admin';
  }

  return isCondensedParentVariant(response.form_data) ? 'parent_condensed' : 'parent_long';
}

export function matchesAdminSurveyView(response: ResponseLike, view: AdminSurveyView): boolean {
  if (view === 'all') {
    return true;
  }

  return getAdminSurveyViewFromResponse(response) === view;
}

export function getAdminSurveyViewLabel(view: AdminSurveyView): string {
  return VIEW_META[view].label;
}

export function getAdminSurveyViewShortLabel(view: AdminSurveyView): string {
  return VIEW_META[view].shortLabel;
}

export function getAdminSurveyViewDescription(view: AdminSurveyView): string {
  return VIEW_META[view].description;
}

export function getAdminSurveyAudienceLabel(view: AdminSurveyView): string {
  return VIEW_META[view].audienceLabel;
}

export function getResponseSurveyLabel(response: ResponseLike): string {
  return getAdminSurveyViewLabel(getAdminSurveyViewFromResponse(response));
}

export function getStepConfigForSurveyView(view: AdminSurveyView): readonly AdminStepDefinition[] {
  switch (view) {
    case 'school_admin':
      return ADMIN_STEPS;
    case 'parent_condensed':
      return CONDENSED_STEPS;
    case 'parent_long':
    case 'all':
    default:
      return STEPS;
  }
}

export function getVisibleStepsForSurveyView(view: AdminSurveyView): readonly AdminStepDefinition[] {
  return getStepConfigForSurveyView(view).filter((step) => step.id !== 'thank-you');
}

export function getDefaultStepIdForSurveyView(view: AdminSurveyView): string {
  switch (view) {
    case 'school_admin':
      return 'disruption-gate';
    case 'parent_condensed':
      return '1';
    case 'all':
    case 'parent_long':
    default:
      return 'pain-check';
  }
}

export function getAdminStepTitle(view: AdminSurveyView, stepId?: string | null): string {
  if (!stepId || stepId === 'intro') {
    return 'Intro';
  }

  if (stepId === 'thank-you') {
    return 'Completed';
  }

  const matchingStep = getStepConfigForSurveyView(view).find((step) => step.id === stepId);
  if (matchingStep) {
    return matchingStep.title;
  }

  return stepId;
}

export function getResponseCurrentStepTitle(response: ResponseLike): string {
  const view = getAdminSurveyViewFromResponse(response);

  if (response.is_completed) {
    return 'Completed';
  }

  if (!response.current_step || response.current_step === 'unknown' || response.current_step === 'intro') {
    return getAdminStepTitle(view, getDefaultStepIdForSurveyView(view));
  }

  return getAdminStepTitle(view, response.current_step);
}

export function getResponseProgressPercent(response: ResponseLike): number {
  const view = getAdminSurveyViewFromResponse(response);
  const steps = getVisibleStepsForSurveyView(view);

  if (steps.length === 0) {
    return 0;
  }

  if (response.is_completed || response.current_step === 'thank-you') {
    return 100;
  }

  const fallbackStep = getDefaultStepIdForSurveyView(view);
  const currentStep =
    response.current_step && response.current_step !== 'unknown' && response.current_step !== 'intro'
      ? response.current_step
      : fallbackStep;

  const index = steps.findIndex((step) => step.id === currentStep);
  if (index === -1) {
    return 5;
  }

  return Math.max(5, Math.round(((index + 1) / steps.length) * 100));
}

export function hasPainCheckFilter(view: AdminSurveyView): boolean {
  return view === 'all' || view === 'parent_long';
}
