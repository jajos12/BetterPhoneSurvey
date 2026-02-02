'use client';

interface CheckboxGroupProps {
    name: string;
    options: { value: string; label: string }[];
    values: string[];
    onChange: (values: string[]) => void;
    maxSelections?: number;
}

export function CheckboxGroup({ name, options, values, onChange, maxSelections }: CheckboxGroupProps) {
    const handleChange = (value: string, checked: boolean) => {
        if (checked) {
            if (maxSelections && values.length >= maxSelections) {
                return;
            }
            onChange([...values, value]);
        } else {
            onChange(values.filter(v => v !== value));
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {options.map((option) => {
                const isChecked = values.includes(option.value);
                const isDisabled = Boolean(maxSelections && values.length >= maxSelections && !isChecked);

                return (
                    <div key={option.value} className="relative group">
                        <input
                            type="checkbox"
                            name={name}
                            id={`${name}-${option.value}`}
                            value={option.value}
                            checked={isChecked}
                            disabled={isDisabled}
                            onChange={(e) => handleChange(option.value, e.target.checked)}
                            className="peer absolute opacity-0 cursor-pointer w-full h-full disabled:cursor-not-allowed z-10"
                        />
                        <label
                            htmlFor={`${name}-${option.value}`}
                            className={`
                                flex items-center gap-4 p-4 rounded-2xl cursor-pointer
                                transition-all duration-300 font-medium
                                bg-white/70 border-2
                                ${isChecked
                                    ? 'border-accent bg-accent/10 shadow-md'
                                    : 'border-transparent hover:border-primary/30 hover:bg-white/90'
                                }
                                peer-disabled:opacity-50 peer-disabled:cursor-not-allowed
                            `}
                        >
                            {/* Custom checkbox */}
                            <span className={`
                                w-6 h-6 rounded-lg flex-shrink-0
                                transition-all duration-300 flex items-center justify-center
                                ${isChecked
                                    ? 'bg-gradient-to-br from-accent to-accent-light shadow-sm'
                                    : 'border-2 border-text-muted/40 bg-white'
                                }
                            `}>
                                {isChecked && (
                                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </span>

                            {/* Label text */}
                            <span className={`text-sm ${isChecked ? 'text-text-primary font-semibold' : 'text-text-secondary'}`}>
                                {option.label}
                            </span>
                        </label>
                    </div>
                );
            })}
        </div>
    );
}
