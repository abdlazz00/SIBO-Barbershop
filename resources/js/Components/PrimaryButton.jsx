export default function PrimaryButton({
    className = '',
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            className={
                `inline-flex items-center justify-center rounded-md border border-transparent bg-primary px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-on-primary transition duration-150 ease-in-out hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-accent-violet focus:ring-offset-2 dark:bg-accent-lime dark:text-ink-deep dark:hover:bg-accent-lime-muted ${
                    disabled && 'opacity-25'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
