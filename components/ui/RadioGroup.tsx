'use client';

interface RadioGroupProps {
    name: string;
    options: { value: string; label: string }[];
    value: string | null;
    onChange: (value: string) => void;
}

export function RadioGroup({ name, options, value, onChange }: RadioGroupProps) {
    return (
        <div className="flex flex-col gap-3">
            {options.map((option) => (
                <div key={option.value} className="relative">
                    <input
                        type="radio"
                        name={name}
                        id={`${name}-${option.value}`}
                        value={option.value}
                        checked={value === option.value}
                        onChange={(e) => onChange(e.target.value)}
                        className="peer absolute opacity-0 cursor-pointer w-full h-full"
                    />
                    <label
                        htmlFor={`${name}-${option.value}`}
                        className="flex items-center gap-4 p-4 px-6 bg-white/60 border-2 border-transparent rounded-xl cursor-pointer transition-all duration-150 font-medium hover:bg-primary/5 hover:border-primary-light peer-checked:bg-primary/10 peer-checked:border-primary"
                    >
                        <span className="w-5 h-5 border-2 border-text-muted rounded-full flex-shrink-0 peer-checked:border-primary peer-checked:bg-primary relative transition-all duration-150 before:content-[''] before:absolute before:inset-1 before:rounded-full before:bg-white before:scale-0 peer-checked:before:scale-100">
                        </span>
                        <span className="relative">
                            <span className="absolute -left-9 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-text-muted rounded-full transition-all duration-150 peer-checked:border-primary peer-checked:bg-primary peer-checked:shadow-[inset_0_0_0_3px_white]" />
                        </span>
                        {option.label}
                    </label>
                </div>
            ))}
        </div>
    );
}
