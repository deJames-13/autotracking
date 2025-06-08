import React from 'react';
import { CheckIcon, ChevronRightIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Step {
    id: string;
    name: string;
    icon?: React.ReactNode;
    description?: string;
}

interface StepIndicatorProps {
    steps: Step[];
    currentStep: string;
    completedSteps: string[];
}

export function StepIndicator({ steps, currentStep, completedSteps }: StepIndicatorProps) {
    return (
        <nav aria-label="Progress">
            <ol role="list" className="space-y-4 md:flex md:space-x-8 md:space-y-0">
                {steps.map((step, stepIdx) => {
                    const isCurrentStep = step.id === currentStep;
                    const isCompleted = completedSteps.includes(step.id);

                    return (
                        <li key={step.id} className="md:flex-1">
                            <div
                                className={cn(
                                    "flex flex-col border-l-4 py-2 pl-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4",
                                    isCurrentStep ? "border-primary" :
                                        isCompleted ? "border-primary/40" : "border-border"
                                )}
                            >
                                <span className="flex items-center text-sm font-medium">
                                    <span
                                        className={cn(
                                            "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full",
                                            isCurrentStep ? "bg-primary text-primary-foreground" :
                                                isCompleted ? "bg-primary/40 text-primary-foreground" : "bg-muted text-muted-foreground"
                                        )}
                                    >
                                        {isCompleted ? (
                                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                        ) : step.icon ? (
                                            step.icon
                                        ) : (
                                            stepIdx + 1
                                        )}
                                    </span>
                                    <span className="ml-3">{step.name}</span>
                                </span>
                                {step.description && (
                                    <span className="mt-0.5 ml-12 text-sm text-muted-foreground">
                                        {step.description}
                                    </span>
                                )}
                            </div>

                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
