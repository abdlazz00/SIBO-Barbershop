export default function ApplicationLogo(props) {
    return (
        <span {...props} className={`font-display font-bold text-3xl tracking-wider uppercase text-white ${props.className || ''}`}>
            Howell<span className="text-accent-lime">.</span>
        </span>
    );
}
