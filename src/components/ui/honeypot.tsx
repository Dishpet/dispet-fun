import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { Input } from './input';

interface HoneypotInputProps {
    fieldName?: string; // Name of the fake field, e.g., "confirm_email"
}

export interface HoneypotRef {
    isValid: () => boolean;
}

export const HoneypotInput = forwardRef<HoneypotRef, HoneypotInputProps>(
    ({ fieldName = "confirm_email" }, ref) => {
        const [value, setValue] = useState("");

        useImperativeHandle(ref, () => ({
            isValid: () => value === ""
        }));

        return (
            <div
                className="opacity-0 absolute top-0 left-0 h-0 w-0 z-[-1] overflow-hidden"
                aria-hidden="true"
            >
                <label htmlFor={fieldName}>Please leave this field blank</label>
                <Input
                    id={fieldName}
                    name={fieldName}
                    tabIndex={-1}
                    autoComplete="off"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                />
            </div>
        );
    }
);

HoneypotInput.displayName = "HoneypotInput";
