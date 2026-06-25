export function Toggle({
    on,
    onChange,
}: {
    on: boolean;
    onChange: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onChange}
            className="relative inline-flex h-5 w-10 shrink-0 rounded-full transition-colors"
            style={{ backgroundColor: on ? '#f5a623' : '#d1d5db' }}
        >
            <span
                className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform"
                style={{ transform: on ? 'translateX(20px)' : 'translateX(0)' }}
            />
        </button>
    );
}
