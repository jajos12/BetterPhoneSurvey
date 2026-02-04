'use client';

interface RadioGroupProps {
    name: string;
    options: { value: string; label: string }[];
    value: string | null;
    onChange: (value: string) => void;
}

export function RadioGroup({ name, options, value, onChange }: RadioGroupProps) {
    return (
        <div className="flex flex-col gap-4">
            {options.map((option) => (
                <div key={option.value} className="relative group">
                    <input
                        type="radio"
                        name={name}
                        id={`${name}-${option.value}`}
                        value={option.value}
                        checked={value === option.value}
                        onChange={(e) => onChange(e.target.value)}
                        className="peer absolute opacity-0 cursor-pointer w-full h-full z-10"
                    />
                    <label
                        htmlFor={`${name}-${option.value}`}
                        className="flex items-center gap-4 p-5 px-6 bg-white border-2 border-gray-100 rounded-2xl cursor-pointer transition-all duration-200 font-semibold text-text-primary hover:border-primary-light hover:bg-primary/5 peer-checked:bg-primary/10 peer-checked:border-primary peer-checked:shadow-lg peer-checked:shadow-primary/5"
                    >
                        <div className="w-6 h-6 border-2 border-gray-200 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-200 peer-checked:border-primary peer-checked:bg-primary">
                            <div className="w-2.5 h-2.5 bg-white rounded-full scale-0 transition-transform duration-200 peer-checked:scale-100" />
                        </div>
                        <span className="text-lg">{option.label}</span>
                    </label>
                </div>
            ))}
        </div>
    );
}
