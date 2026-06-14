import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Button from '@/Components/ui/Button';
import Input from '@/Components/ui/Input';
import Modal from '@/Components/Modal';
import { useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';

export default function DeleteUserForm({ className = '' }) {
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef();

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);

        clearErrors();
        reset();
    };

    return (
        <section className={`space-y-6 ${className}`}>
            <header className="mb-6">
                <h3 className="font-display font-bold text-lg text-ink-deep">
                    Hapus Akun
                </h3>

                <p className="text-xs text-on-light-muted mt-1">
                    Setelah akun Anda dihapus, semua sumber daya dan data terkait akan dihapus secara permanen. Sebelum menghapus akun, mohon unduh data atau informasi yang ingin Anda simpan.
                </p>
            </header>

            <Button variant="danger" onClick={confirmUserDeletion} className="px-5 py-2.5">
                Hapus Akun Saya
            </Button>

            <Modal show={confirmingUserDeletion} onClose={closeModal}>
                <form onSubmit={deleteUser} className="p-6 bg-white rounded-lg">
                    <h3 className="font-display font-bold text-lg text-ink-deep">
                        Apakah Anda yakin ingin menghapus akun?
                    </h3>

                    <p className="text-xs text-on-light-muted mt-2">
                        Setelah akun Anda dihapus, semua data akan hilang secara permanen. Silakan masukkan kata sandi Anda untuk mengonfirmasi tindakan ini.
                    </p>

                    <div className="mt-6">
                        <InputLabel
                            htmlFor="password"
                            value="Password"
                            className="sr-only"
                        />

                        <Input
                            id="password"
                            type="password"
                            name="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={(e) =>
                                setData('password', e.target.value)
                            }
                            className="mt-1.5 block w-full sm:w-3/4"
                            isFocused
                            placeholder="Kata Sandi Anda"
                        />

                        <InputError
                            message={errors.password}
                            className="mt-1.5"
                        />
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="btn-outline px-5 py-2.5 rounded-md text-xs font-bold uppercase tracking-wider"
                        >
                            Batal
                        </button>

                        <Button variant="danger" type="submit" disabled={processing} className="px-6 py-2.5">
                            Ya, Hapus Permanen
                        </Button>
                    </div>
                </form>
            </Modal>
        </section>
    );
}
