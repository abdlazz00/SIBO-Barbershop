import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({ mustVerifyEmail, status }) {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-bold font-sans text-ink leading-tight">
                    Pengaturan Profil Saya
                </h2>
            }
        >
            <Head title="Profil Saya" />

            <div className="py-6 px-4 sm:px-6 lg:px-8 bg-surface-canvas-light text-ink min-h-screen">
                <div className="mx-auto max-w-7xl space-y-6">
                    <div className="bg-white p-6 sm:p-8 border border-hairline-cloud rounded-card shadow-card">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            className="w-full"
                        />
                    </div>

                    <div className="bg-white p-6 sm:p-8 border border-hairline-cloud rounded-card shadow-card">
                        <UpdatePasswordForm className="w-full" />
                    </div>

                    <div className="bg-white p-6 sm:p-8 border border-hairline-cloud rounded-card shadow-card">
                        <DeleteUserForm className="w-full" />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
