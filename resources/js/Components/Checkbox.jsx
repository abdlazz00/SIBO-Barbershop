export default function Checkbox({ className = '', ...props }) {
    return (
        <input
            {...props}
            type="checkbox"
            className={
                'rounded border-hairline-cool text-accent-violet focus:ring-accent-violet dark:border-hairline-violet dark:bg-primary-deeper dark:focus:ring-offset-primary-deeper ' +
                className
            }
        />
    );
}
