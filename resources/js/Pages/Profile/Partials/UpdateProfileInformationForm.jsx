import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Button from '@/Components/ui/Button';
import Input from '@/Components/ui/Input';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';
import { useState, useRef } from 'react';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}) {
    const user = usePage().props.auth.user;
    const fileInputRef = useRef(null);
    const [preview, setPreview] = useState(null);

    const { data, setData, post, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            photo: null,
            _method: 'PATCH',
        });

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        setData('photo', file);
        if (file) {
            setPreview(URL.createObjectURL(file));
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('profile.update'));
    };

    return (
        <section className={className}>
            <header className="mb-6">
                <h3 className="font-display font-bold text-lg text-ink-deep">
                    Informasi Profil
                </h3>
                <p className="text-xs text-on-light-muted mt-1">
                    Perbarui nama lengkap, alamat email, nomor handphone, dan foto profil Anda.
                </p>
            </header>

            <form onSubmit={submit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    
                    {/* Left Column: Profile Picture */}
                    <div className="md:col-span-1 flex flex-col items-center p-4 border border-hairline-cloud/50 rounded-lg bg-surface-card/50">
                        <span className="text-[10px] font-bold text-on-light-muted uppercase tracking-widest mb-4 block">Foto Profil</span>
                        
                        <div className="relative w-full max-w-[200px] aspect-square group cursor-pointer" onClick={triggerFileInput}>
                            {preview ? (
                                <img 
                                    src={preview} 
                                    alt="Preview" 
                                    className="w-full h-full rounded-lg object-cover border border-hairline-cool shadow"
                                />
                            ) : user.photo_path ? (
                                <img 
                                    src={`/storage/${user.photo_path}`} 
                                    alt={user.name} 
                                    className="w-full h-full rounded-lg object-cover border border-hairline-cool shadow"
                                />
                            ) : (
                                <div className="w-full h-full rounded-lg bg-[#7C5CBF] flex items-center justify-center font-bold text-5xl text-white shadow">
                                    {user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                                </div>
                            )}
                            
                            {/* Pencil Button overlay */}
                            <div className="absolute bottom-2 right-2 p-2 rounded-full bg-primary text-white shadow hover:bg-primary-dark transition duration-200">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                                </svg>
                            </div>
                        </div>

                        {/* Hidden File Input */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handlePhotoChange}
                            accept="image/*"
                        />

                        <InputError className="mt-2 text-center" message={errors.photo} />

                        {/* User Display Info */}
                        <div className="text-center mt-4">
                            <h4 className="font-bold text-sm text-ink-deep">{user.name}</h4>
                            <p className="text-xs text-on-light-muted mt-0.5">{user.email}</p>
                            <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                                {user.role}
                            </span>
                        </div>
                    </div>

                    {/* Right Column: User Details */}
                    <div className="md:col-span-2 space-y-4">
                        <div>
                            <InputLabel htmlFor="name" value="Nama Lengkap" />
                            <Input
                                id="name"
                                type="text"
                                className="mt-1.5 block w-full"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                required
                                autoComplete="name"
                            />
                            <InputError className="mt-1.5" message={errors.name} />
                        </div>

                        <div>
                            <InputLabel htmlFor="email" value="Alamat Email" />
                            <Input
                                id="email"
                                type="email"
                                className="mt-1.5 block w-full"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                required
                                autoComplete="username"
                            />
                            <InputError className="mt-1.5" message={errors.email} />
                        </div>

                        <div>
                            <InputLabel htmlFor="phone" value="Nomor HP" />
                            <Input
                                id="phone"
                                type="text"
                                className="mt-1.5 block w-full"
                                value={data.phone}
                                onChange={(e) => setData('phone', e.target.value)}
                                required
                                autoComplete="tel"
                            />
                            <InputError className="mt-1.5" message={errors.phone} />
                        </div>

                        {mustVerifyEmail && user.email_verified_at === null && (
                            <div className="p-3 bg-status-warning/10 border border-status-warning/30 rounded text-xs text-on-light-muted mt-4">
                                Alamat email Anda belum diverifikasi.
                                <Link
                                    href={route('verification.send')}
                                    method="post"
                                    as="button"
                                    className="ml-1 text-primary underline hover:text-primary-dark font-medium"
                                >
                                    Klik di sini untuk mengirim ulang email verifikasi.
                                </Link>
                                {status === 'verification-link-sent' && (
                                    <div className="mt-1.5 font-semibold text-status-success">
                                        Link verifikasi baru telah dikirimkan ke alamat email Anda.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Row: Actions */}
                <div className="flex items-center justify-end space-x-3 pt-6 border-t border-hairline-cloud mt-6">
                    <Link
                        href={route('dashboard')}
                        className="btn-outline px-5 py-2.5 rounded-md text-xs font-bold uppercase tracking-wider text-center"
                    >
                        Batal
                    </Link>

                    <Button type="submit" disabled={processing} className="px-6 py-2.5">
                        Simpan Perubahan
                    </Button>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-xs font-bold text-status-success">
                            Profil Berhasil Disimpan!
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
