import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

export default forwardRef(function TextInput(
    { type = 'text', className = '', isFocused = false, ...props },
    ref,
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
            className={
                'rounded-sm border-hairline-cool bg-surface-input text-ink focus:border-accent-violet focus:ring-accent-violet dark:border-hairline-violet dark:bg-primary-deeper dark:text-white dark:focus:border-accent-violet dark:focus:ring-accent-violet ' +
                className
            }
            ref={localRef}
        />
    );
});
