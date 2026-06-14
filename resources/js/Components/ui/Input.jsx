import React, { forwardRef, useEffect, useRef, useImperativeHandle } from 'react';

export default forwardRef(function Input(
    { type = 'text', className = '', isFocused = false, ...props },
    ref
) {
    const localRef = useRef(null);

    useImperativeHandle(ref, () => ({
        focus: () => localRef.current?.focus(),
    }));

    useEffect(() => {
        if (isFocused) {
            localRef.current?.focus();
        }
    }, [isFocused]);

    return (
        <input
            {...props}
            type={type}
            ref={localRef}
            className={`bg-surface-input text-ink font-sans text-sm border border-hairline-cool rounded-sm py-2 px-3 outline-none transition duration-200 focus:border-accent-violet focus:shadow-input-focus ${className}`}
        />
    );
});
