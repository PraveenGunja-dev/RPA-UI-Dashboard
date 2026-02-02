import React from 'react';

interface Step {
  id: string;
  title: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
}

const Stepper: React.FC<StepperProps> = ({ steps, currentStep }) => {
  return (
    <div className="mb-8">
      <div className="flex justify-between relative">
        {/* Progress line background */}
        <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 -z-10 rounded-full"></div>
        {/* Progress line fill */}
        <div 
          className="absolute top-5 left-0 h-1 bg-blue-500 -z-10 rounded-full transition-all duration-500 ease-in-out"
          style={{ 
            width: `${steps.length > 1 ? ((currentStep) / (steps.length - 1)) * 100 : 0}%`,
            maxWidth: '100%'
          }}
        ></div>
        
        {steps.map((step, index) => (
          <div key={step.id} className="flex flex-col items-center relative">
            <div 
              className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${
                index < currentStep
                  ? 'bg-green-500 text-white border-0'
                  : index === currentStep
                  ? 'bg-blue-500 text-white border-4 border-blue-200'
                  : 'bg-white text-gray-400 border-2 border-gray-300'
              }`}
              style={{
                boxShadow: index === currentStep ? '0 0 0 4px rgba(59, 130, 246, 0.3)' : 'none'
              }}
            >
              {index < currentStep ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="font-semibold">{index + 1}</span>
              )}
            </div>
            <span 
              className={`text-xs font-medium text-center w-24 transition-colors duration-300 ${
                index === currentStep ? 'text-blue-600 font-semibold' : 'text-gray-500'
              }`}
            >
              {step.title}
            </span>
          </div>
        ))}
      </div>
      
      {/* Progress text */}
      <div className="text-center mt-4 text-sm text-gray-500">
        Step {currentStep + 1} of {steps.length}
      </div>
    </div>
  );
};

export default Stepper;