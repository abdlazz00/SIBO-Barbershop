export default function InputLabel({
    value,
    className = '',
    children,
    ...props
}) {
    return (
        <label
            {...props}
            className={
                `block text-[13px] font-medium text-on-light-muted dark:text-on-dark-muted ` +
                className
            }
        >
            {value ? value : children}
        </label>
    );
}
