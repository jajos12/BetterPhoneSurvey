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
                return; // Don't add more if at max
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
                const isDisabled = maxSelections && values.length >= maxSelections && !isChecked;

                return (
                    <div key={option.value} className="relative">
                        <input
                            type="checkbox"
                            name={name}
                            id={`${name}-${option.value}`}
                            value={option.value}
                            checked={isChecked}
                            disabled={isDisabled}
                            onChange={(e) => handleChange(option.value, e.target.checked)}
                            className="peer absolute opacity-0 cursor-pointer w-full h-full disabled:cursor-not-allowed"
                        />
                        <label
                            htmlFor={`${name}-${option.value}`}
                            className={`flex items-center gap-3 p-3 px-4 bg-white/60 border-2 border-transparent rounded-xl cursor-pointer transition-all duration-150 font-medium text-sm
                            hover:bg-primary/5 hover:border-primary-light
                            peer-checked:bg-primary/10 peer-checked:border-primary
                            peer-disabled:opacity-50 peer-disabled:cursor-not-allowed`}
                        >
                            <span className={`w-5 h-5 border-2 rounded-md flex-shrink-0 transition-all duration-150 flex items-center justify-center
                                ${isChecked ? 'border-primary bg-primary' : 'border-text-muted'}`}
                            >
                                {isChecked && (
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </span>
                            {option.label}
                        </label>
                    </div>
                );
            })}
        </div>
    );
}
