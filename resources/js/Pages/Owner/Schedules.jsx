import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function Schedules({ barbers = [] }) {
    const [selectedBarber, setSelectedBarber] = useState(barbers[0] || null);

    // Weekly schedule form states
    const [weeklySchedules, setWeeklySchedules] = useState([]);
    
    // Leave date states
    const [leaveDate, setLeaveDate] = useState('');
    const [leaveNotes, setLeaveNotes] = useState('');
    const [errors, setErrors] = useState({});

    // Days mapping helper
    const daysName = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    // Update form when selected barber changes
    useEffect(() => {
        if (selectedBarber) {
            // Populate form with current schedules
            const schedulesMap = [];
            for (let i = 0; i <= 6; i++) {
                const existing = selectedBarber.weekly_schedules?.find(s => s.day_of_week === i);
                schedulesMap.push({
                    day_of_week: i,
                    is_off: existing ? existing.is_off : (i === 0),
                    start_time: existing && existing.start_time ? existing.start_time.substring(0, 5) : '09:00',
                    end_time: existing && existing.end_time ? existing.end_time.substring(0, 5) : '17:00',
                });
            }
            setWeeklySchedules(schedulesMap);
            setErrors({});
            setLeaveDate('');
            setLeaveNotes('');
        }
    }, [selectedBarber]);

    const handleWeeklyChange = (dayIndex, field, value) => {
        setWeeklySchedules(weeklySchedules.map((s, idx) => 
            idx === dayIndex ? { ...s, [field]: value } : s
        ));
    };

    const handleWeeklySubmit = (e) => {
        e.preventDefault();
        setErrors({});

        router.post(route('owner.schedules.weekly.update'), {
            barber_id: selectedBarber.id,
            schedules: weeklySchedules,
        }, {
            onSuccess: (page) => {
                // Refresh active barber references
                const updated = page.props.barbers.find(b => b.id === selectedBarber.id);
                if (updated) setSelectedBarber(updated);
            },
            onError: (errs) => setErrors(errs)
        });
    };

    const handleLeaveSubmit = (e) => {
        e.preventDefault();
        setErrors({});

        router.post(route('owner.schedules.leave.store'), {
            barber_id: selectedBarber.id,
            leave_date: leaveDate,
            notes: leaveNotes
        }, {
            onSuccess: (page) => {
                setLeaveDate('');
                setLeaveNotes('');
                const updated = page.props.barbers.find(b => b.id === selectedBarber.id);
                if (updated) setSelectedBarber(updated);
            },
            onError: (errs) => setErrors(errs)
        });
    };

    const handleDeleteLeave = (leaveId) => {
        if (confirm('Apakah Anda yakin ingin membatalkan jadwal libur/cuti ini?')) {
            router.delete(route('owner.schedules.leave.destroy', leaveId), {
                onSuccess: (page) => {
                    const updated = page.props.barbers.find(b => b.id === selectedBarber.id);
                    if (updated) setSelectedBarber(updated);
                }
            });
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-bold font-sans text-ink leading-tight">
                    Pengaturan Jadwal Shift & Cuti Barber
                </h2>
            }
        >
            <Head title="Kelola Jadwal Barber" />

            <div className="py-6 px-4 sm:px-6 lg:px-8 bg-surface-canvas-light text-ink min-h-screen">
                <div className="max-w-7xl mx-auto space-y-6">

                    {/* Barber Selection Bar */}
                    <div className="bg-white p-4 border border-hairline-cloud rounded-card shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center space-x-3">
                            <span className="text-xs font-bold text-on-light-muted uppercase tracking-wider">Pilih Barber:</span>
                            <select
                                value={selectedBarber?.id || ''}
                                onChange={(e) => {
                                    const b = barbers.find(item => item.id == e.target.value);
                                    if (b) setSelectedBarber(b);
                                }}
                                className="input-field text-sm min-w-[200px]"
                            >
                                {barbers.map(b => (
                                    <option key={b.id} value={b.id}>{b.user.name}</option>
                                ))}
                            </select>
                        </div>
                        {selectedBarber && (
                            <span className="text-xs font-semibold px-3 py-1 bg-primary/5 rounded text-accent-violet border border-hairline-cool">
                                Cabang: {selectedBarber.branch?.name || '-'}
                            </span>
                        )}
                    </div>

                    {selectedBarber ? (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            
                            {/* Left Panel: Weekly shift editor */}
                            <form onSubmit={handleWeeklySubmit} className="lg:col-span-2 bg-white border border-hairline-cloud rounded-card shadow-card p-6 space-y-6">
                                <div>
                                    <h3 className="font-display font-bold text-lg text-ink-deep">Jadwal Shift Mingguan Default</h3>
                                    <p className="text-xs text-on-light-muted mt-1">Atur jam mulai dan jam selesai kerja rutin barber per hari.</p>
                                </div>

                                {Object.keys(errors).length > 0 && errors.schedules && (
                                    <div className="p-3 bg-status-danger/10 border border-status-danger/30 rounded text-status-danger text-xs font-semibold">
                                        Format jam kerja tidak valid. Periksa kembali input Anda.
                                    </div>
                                )}

                                <div className="space-y-4">
                                    {weeklySchedules.map((daySched, idx) => (
                                        <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-hairline-cloud rounded-lg bg-surface-card/40 text-xs">
                                            <div className="w-24 shrink-0 font-bold text-ink-deep text-sm">
                                                {daysName[daySched.day_of_week]}
                                            </div>
                                            
                                            {/* Status off toggle */}
                                            <div className="flex items-center space-x-2 shrink-0">
                                                <input
                                                    type="checkbox"
                                                    id={`off-day-${idx}`}
                                                    checked={daySched.is_off}
                                                    onChange={(e) => handleWeeklyChange(idx, 'is_off', e.target.checked)}
                                                    className="rounded border-hairline-cool text-primary focus:ring-primary"
                                                />
                                                <label htmlFor={`off-day-${idx}`} className="font-semibold text-on-light-muted cursor-pointer">
                                                    Libur Rutin
                                                </label>
                                            </div>

                                            {/* Start and end hours */}
                                            {!daySched.is_off ? (
                                                <div className="flex items-center space-x-2">
                                                    <input
                                                        type="time"
                                                        value={daySched.start_time}
                                                        onChange={(e) => handleWeeklyChange(idx, 'start_time', e.target.value)}
                                                        className="input-field text-xs py-1"
                                                        required
                                                    />
                                                    <span className="text-on-light-muted font-bold">s.d</span>
                                                    <input
                                                        type="time"
                                                        value={daySched.end_time}
                                                        onChange={(e) => handleWeeklyChange(idx, 'end_time', e.target.value)}
                                                        className="input-field text-xs py-1"
                                                        required
                                                    />
                                                </div>
                                            ) : (
                                                <span className="text-status-danger font-bold italic shrink-0 pr-10">Barber Libur</span>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-end pt-3 border-t border-hairline-cloud">
                                    <button
                                        type="submit"
                                        className="btn-primary px-6 py-2.5 text-xs font-bold shadow"
                                    >
                                        SIMPAN JADWAL MINGGUAN
                                    </button>
                                </div>
                            </form>

                            {/* Right Panel: Leave Date scheduler */}
                            <div className="space-y-6">
                                
                                {/* Add Leave Date */}
                                <form onSubmit={handleLeaveSubmit} className="bg-white border border-hairline-cloud rounded-card shadow-card p-6 space-y-4">
                                    <div>
                                        <h3 className="font-display font-bold text-base text-ink-deep">Tandai Cuti / Libur Barber</h3>
                                        <p className="text-[11px] text-on-light-muted mt-0.5">Memblokir ketersediaan booking pada tanggal tertentu.</p>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-on-light-muted uppercase tracking-wider mb-2">Tanggal Cuti</label>
                                        <input
                                            type="date"
                                            value={leaveDate}
                                            onChange={(e) => setLeaveDate(e.target.value)}
                                            className="input-field w-full text-xs"
                                            min={new Date().toISOString().split('T')[0]}
                                            required
                                        />
                                        {errors.leave_date && <p className="text-xs text-status-danger mt-1">{errors.leave_date}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-on-light-muted uppercase tracking-wider mb-2">Keterangan / Alasan</label>
                                        <input
                                            type="text"
                                            value={leaveNotes}
                                            onChange={(e) => setLeaveNotes(e.target.value)}
                                            className="input-field w-full text-xs"
                                            placeholder="Contoh: Cuti Tahunan, Sakit..."
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full btn-accent py-2 text-xs font-bold"
                                    >
                                        SIMPAN CUTI
                                    </button>
                                </form>

                                {/* List Cuti Aktif */}
                                <div className="bg-white border border-hairline-cloud rounded-card shadow-card overflow-hidden">
                                    <div className="p-4 border-b border-hairline-cloud bg-surface-card">
                                        <h3 className="font-display font-bold text-sm text-ink-deep">Daftar Libur / Cuti Barber</h3>
                                    </div>

                                    <div className="divide-y divide-hairline-cloud max-h-56 overflow-y-auto">
                                        {selectedBarber.leave_schedules && selectedBarber.leave_schedules.length > 0 ? (
                                            selectedBarber.leave_schedules.map((leave) => (
                                                <div key={leave.id} className="p-3.5 flex justify-between items-center text-xs">
                                                    <div>
                                                        <span className="font-bold text-ink-deep">
                                                            {new Date(leave.leave_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </span>
                                                        <p className="text-on-light-muted text-[10px] mt-0.5">{leave.notes || 'Cuti'}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteLeave(leave.id)}
                                                        className="text-status-danger hover:text-red-600 p-1 font-bold text-sm"
                                                        title="Batalkan Cuti"
                                                    >
                                                        &times;
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-xs text-on-light-muted italic text-center py-6">
                                                Belum ada cuti terdaftar.
                                            </p>
                                        )}
                                    </div>
                                </div>

                            </div>

                        </div>
                    ) : (
                        <p className="text-center text-on-light-muted py-12 italic border border-dashed rounded bg-white">
                            Tidak ada barber terdaftar untuk dikelola jadwalnya.
                        </p>
                    )}

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
