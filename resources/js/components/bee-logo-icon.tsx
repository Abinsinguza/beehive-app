export default function BeeLogoIcon({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 64 64"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Hive */}
            <g>
                <path d="M32 36c-8 0-14 4-14 10h28c0-6-6-10-14-10z" />
                <path d="M32 26c-6 0-10 3-10 8h20c0-5-4-8-10-8z" />
                <path d="M32 18c-4 0-6 2-6 6h12c0-4-2-6-6-6z" />
            </g>

            {/* Bee */}
            <g transform="translate(10,10)">
                <ellipse cx="10" cy="10" rx="6" ry="4" />
                <rect x="6" y="8" width="8" height="4" fill="white" />
                <circle cx="4" cy="10" r="2" />
                <path d="M10 4c2-3 4-3 6 0" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                <path d="M10 16c2 3 4 3 6 0" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            </g>
        </svg>
    );
}