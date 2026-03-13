interface StatusBadgeProps {
    success: boolean;
    /** Optional override labels. Defaults: 'Exitoso' / 'Fallido' */
    labels?: { success: string; failure: string };
}

/** Pill badge: green for success, red for failure. */
export default function StatusBadge({
    success,
    labels = { success: 'Exitoso', failure: 'Fallido' },
}: StatusBadgeProps) {
    return (
        <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${success
                    ? 'bg-success-50 border border-success-200 text-success-700'
                    : 'bg-danger-50 border border-danger-200 text-danger-700'
                }`}
        >
            {success ? labels.success : labels.failure}
        </span>
    );
}
