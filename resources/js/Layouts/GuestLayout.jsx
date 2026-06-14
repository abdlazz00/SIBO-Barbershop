import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="flex min-h-screen flex-col items-center bg-primary-deeper pt-6 sm:justify-center sm:pt-0">
            <div>
                <Link href="/">
                    <ApplicationLogo className="h-20 fill-current text-white" />
                </Link>
            </div>

            <div className="mt-6 w-full overflow-hidden bg-surface-card-dark px-8 py-6 border border-hairline-violet shadow-modal sm:max-w-md sm:rounded-card">
                {children}
            </div>
        </div>
    );
}
