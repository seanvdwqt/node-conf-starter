import { useState, useCallback } from 'react';
import CreateRequestStep from './steps/CreateRequestStep';

/** Step labels for the 5-step wizard */
const STEP_LABELS = [
  'Create Request',
  'Define Roles',
  'Recommendations',
  'Assemble Squad',
  'Review & Finalise',
] as const;

const TOTAL_STEPS = STEP_LABELS.length; // 5

/** Types for wizard data flowing between steps */
export interface SquadRequestData {
  title: string;
  businessUnit: string;
  objective: string;
  urgency: 'low' | 'medium' | 'high';
  startDate: string;
  durationWeeks: number | null;
  requiredCapacity: number | null;
}

export interface RoleSelection {
  roleId: string;
  candidateIds: string[];
}

export interface WizardState {
  currentStep: number;
  squadRequestId: string | null;
  requestData: SquadRequestData;
  selections: RoleSelection[];
}

const INITIAL_REQUEST_DATA: SquadRequestData = {
  title: '',
  businessUnit: 'Digital Platforms',
  objective: '',
  urgency: 'medium',
  startDate: '',
  durationWeeks: null,
  requiredCapacity: null,
};

const INITIAL_STATE: WizardState = {
  currentStep: 1,
  squadRequestId: null,
  requestData: INITIAL_REQUEST_DATA,
  selections: [],
};

export default function SquadWizard() {
  const [state, setState] = useState<WizardState>(INITIAL_STATE);

  const { currentStep } = state;

  const canGoBack = currentStep > 1;
  const isLastStep = currentStep === TOTAL_STEPS;

  const goNext = useCallback(() => {
    setState((prev) => {
      if (prev.currentStep >= TOTAL_STEPS) return prev;
      return { ...prev, currentStep: prev.currentStep + 1 };
    });
  }, []);

  const goBack = useCallback(() => {
    setState((prev) => {
      if (prev.currentStep <= 1) return prev;
      return { ...prev, currentStep: prev.currentStep - 1 };
    });
  }, []);

  // These setters will be passed to step components
  const setSquadRequestId = useCallback((id: string) => {
    setState((prev) => ({ ...prev, squadRequestId: id }));
  }, []);

  const _setRequestData = useCallback((data: Partial<SquadRequestData>) => {
    setState((prev) => ({
      ...prev,
      requestData: { ...prev.requestData, ...data },
    }));
  }, []);

  const _setSelections = useCallback((selections: RoleSelection[]) => {
    setState((prev) => ({ ...prev, selections }));
  }, []);

  // Expose setters for step components (suppresses unused-var warnings until wired up)
  void _setRequestData;
  void _setSelections;

  const handleRequestCreated = useCallback((id: string) => {
    setSquadRequestId(id);
    goNext();
  }, [setSquadRequestId, goNext]);

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <CreateRequestStep onCreated={handleRequestCreated} />;
      case 2:
        return (
          <div data-testid="step-2-placeholder" className="p-6 text-center text-gray-500">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Define Roles & Skills</h2>
            <p>Step 2: Select roles and skills with proficiency levels.</p>
          </div>
        );
      case 3:
        return (
          <div data-testid="step-3-placeholder" className="p-6 text-center text-gray-500">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Recommendations</h2>
            <p>Step 3: View scored candidate recommendations.</p>
          </div>
        );
      case 4:
        return (
          <div data-testid="step-4-placeholder" className="p-6 text-center text-gray-500">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Assemble Squad</h2>
            <p>Step 4: Select candidates to form your proposed squad.</p>
          </div>
        );
      case 5:
        return (
          <div data-testid="step-5-placeholder" className="p-6 text-center text-gray-500">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Review & Finalise</h2>
            <p>Step 5: Review your selections and finalise the squad.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6" data-testid="squad-wizard">
      {/* Step indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">
            Step {currentStep} of {TOTAL_STEPS}
          </span>
        </div>
        <div className="flex gap-2">
          {STEP_LABELS.map((label, index) => {
            const stepNum = index + 1;
            const isActive = stepNum === currentStep;
            const isCompleted = stepNum < currentStep;
            return (
              <div key={label} className="flex-1">
                <div
                  className={`h-2 rounded-full transition-colors ${
                    isActive
                      ? 'bg-indigo-600'
                      : isCompleted
                        ? 'bg-indigo-400'
                        : 'bg-gray-200'
                  }`}
                  data-testid={`step-indicator-${stepNum}`}
                />
                <p
                  className={`mt-1 text-xs truncate ${
                    isActive ? 'text-indigo-600 font-semibold' : 'text-gray-400'
                  }`}
                >
                  {label}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="bg-white rounded-lg shadow-md min-h-[300px]">
        {renderStepContent()}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between mt-6">
        <button
          onClick={goBack}
          disabled={!canGoBack}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            canGoBack
              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
          data-testid="wizard-back-btn"
        >
          Back
        </button>
        <button
          onClick={goNext}
          disabled={isLastStep}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            isLastStep
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
          data-testid="wizard-next-btn"
        >
          {isLastStep ? 'Finalise' : 'Next'}
        </button>
      </div>
    </div>
  );
}
