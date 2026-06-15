import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Schedules({ barber }) {
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1); // 1-indexed
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [selectedDate, setSelectedDate] = useState(today.toISOString().split('T')[0]);
    const [loading, setLoading] = useState(true);
    const [daysData, setDaysData] = useState([]);

    // Fetch calendar data when month/year changes
    useEffect(() => {
        setLoading(true);
        axios.get(route('barber.schedules.data'), {
            params: {
                month: currentMonth,
                year: currentYear
            }
        })
        .then(res => {
            setDaysData(res.data.days || []);
        })
        .catch(err => {
            console.error('Gagal mengambil data jadwal:', err);
            alert('Gagal memuat jadwal tugas.');
        })
        .finally(() => {
            setLoading(false);
        });
    }, [currentMonth, currentYear]);

    // Handle Month Navigation
    const handlePrevMonth = () => {
        if (currentMonth === 1) {
            setCurrentMonth(12);
            setCurrentYear(prev => prev - 1);
        } else {
            setCurrentMonth(prev => prev - 1);
        }
    };

    const handleNextMonth = () => {
        if (currentMonth === 12) {
            setCurrentMonth(1);
            setCurrentYear(prev => prev + 1);
        } else {
            setCurrentMonth(prev => prev + 1);
        }
    };

    // Calculate grid cells for rendering
    const firstDayIndex = new Date(currentYear, currentMonth - 1, 1).getDay(); // Sunday = 0
    const totalDays = new Date(currentYear, currentMonth, 0).getDate();
    const prevMonthDays = new Date(currentYear, currentMonth - 1, 0).getDate();

    const cells = [];
    // Prev Month Trailing Days (faded and disabled)
    for (let i = firstDayIndex - 1; i >= 0; i--) {
        const dayNum = prevMonthDays - i;
        cells.push({
            dayNum,
            isCurrentMonth: false,
            dateString: `${currentMonth === 1 ? currentYear - 1 : currentYear}-${String(currentMonth === 1 ? 12 : currentMonth - 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
        });
    }

    // Current Month Days
    for (let i = 1; i <= totalDays; i++) {
        const dateString = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const matchData = daysData.find(d => d.date === dateString) || {
            is_off: false,
            off_reason: null,
            shift_hours: null,
            bookings: []
        };
        cells.push({
            dayNum: i,
            isCurrentMonth: true,
            dateString,
            ...matchData
        });
    }

    // Next Month Leading Days
    const remaining = 42 - cells.length;
    for (let i = 1; i <= remaining; i++) {
        cells.push({
            dayNum: i,
            isCurrentMonth: false,
            dateString: `${currentMonth === 12 ? currentYear + 1 : currentYear}-${String(currentMonth === 12 ? 1 : currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
        });
    }

    // Helper: format month name in Indonesian
    const getMonthName = (m) => {
        const months = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        return months[m - 1];
    };

    // Helper: get formatted day in Indonesian
    const getIndonesianDateLabel = (dateStr) => {
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const months = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        const dateObj = new Date(dateStr);
        if (isNaN(dateObj)) return dateStr;
        return `${days[dateObj.getDay()]}, ${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
    };

    // Find data for the currently selected date
    const selectedDayData = daysData.find(d => d.date === selectedDate) || {
        is_off: false,
        off_reason: null,
        shift_hours: null,
        bookings: []
    };

    const todayStr = today.toISOString().split('T')[0];

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h2 className="text-xl font-bold font-sans text-ink leading-tight">
                        Jadwal & Tugas Barber
                    </h2>
                    <p className="text-xs text-on-light-muted mt-1">
                        Pantau hari kerja, hari libur, dan daftar booking layanan Anda.
                    </p>
                </div>
            }
        >
            <Head title="Jadwal Saya" />

            <div className="py-6 px-4 sm:px-6 lg:px-8 bg-surface-canvas-light text-ink min-h-screen">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        
                        {/* Calendar Column */}
                        <div className="lg:col-span-2 bg-white border border-hairline-cloud rounded-card shadow-card overflow-hidden">
                            {/* Calendar Header */}
                            <div className="p-5 border-b border-hairline-cloud flex items-center justify-between">
                                <h3 className="font-display font-bold text-lg text-ink-deep">
                                    {getMonthName(currentMonth)} {currentYear}
                                </h3>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={handlePrevMonth}
                                        className="px-3 py-1.5 border border-hairline-cool rounded text-xs font-semibold hover:bg-surface-card transition active:scale-95"
                                    >
                                        Bulan Sebelumnya
                                    </button>
                                    <button
                                        onClick={handleNextMonth}
                                        className="px-3 py-1.5 border border-hairline-cool rounded text-xs font-semibold hover:bg-surface-card transition active:scale-95"
                                    >
                                        Bulan Berikutnya
                                    </button>
                                </div>
                            </div>

                            {/* Calendar Grid */}
                            <div className="p-5">
                                <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-on-light-muted uppercase tracking-wider mb-2">
                                    <div>Min</div>
                                    <div>Sen</div>
                                    <div>Sel</div>
                                    <div>Rab</div>
                                    <div>Kam</div>
                                    <div>Jum</div>
                                    <div>Sab</div>
                                </div>

                                {loading ? (
                                    <div className="py-32 flex flex-col justify-center items-center">
                                        <div className="w-8 h-8 border-4 border-accent-violet border-t-transparent rounded-full animate-spin mb-4" />
                                        <p className="text-sm text-on-light-muted">Memuat kalender jadwal...</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-7 gap-1.5">
                                        {cells.map((cell, idx) => {
                                            const isSelected = cell.dateString === selectedDate;
                                            const isToday = cell.dateString === todayStr;

                                            if (!cell.isCurrentMonth) {
                                                return (
                                                    <div
                                                        key={`prev-next-${idx}`}
                                                        className="aspect-square bg-surface-card/25 border border-hairline-cloud/30 rounded-card p-1 text-on-light-faint/65 text-xs text-left cursor-not-allowed select-none"
                                                    >
                                                        <span className="font-medium">{cell.dayNum}</span>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <button
                                                    key={`current-${idx}`}
                                                    onClick={() => setSelectedDate(cell.dateString)}
                                                    type="button"
                                                    className={`aspect-square border text-left p-1.5 rounded-card flex flex-col justify-between transition cursor-pointer select-none relative group ${
                                                        cell.is_off 
                                                            ? 'bg-red-50/70 border-red-100 hover:bg-red-100/50' 
                                                            : 'bg-white border-hairline-cloud hover:border-accent-violet'
                                                    } ${
                                                        isSelected 
                                                            ? 'ring-2 ring-accent-violet border-transparent bg-surface-press-light/35' 
                                                            : ''
                                                    }`}
                                                >
                                                    <div className="flex justify-between items-start w-full">
                                                        <span className={`text-xs font-bold ${
                                                            isToday 
                                                                ? 'w-5 h-5 bg-[#2D1B69] text-white rounded-full flex items-center justify-center font-display font-medium shrink-0' 
                                                                : 'text-ink-deep'
                                                        }`}>
                                                            {cell.dayNum}
                                                        </span>
                                                        {cell.is_off && (
                                                            <span className="sm:inline-block hidden text-[8px] bg-red-100 border border-red-300 text-status-danger px-1 rounded font-bold uppercase tracking-wide">
                                                                Libur
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Booking Indicator */}
                                                    {!cell.is_off && cell.bookings && cell.bookings.length > 0 && (
                                                        <div className="w-full text-right">
                                                            {/* Desktop Badge */}
                                                            <span className="hidden lg:inline-block bg-[#2D1B69]/10 text-[#2D1B69] text-[9px] font-bold px-1.5 py-0.5 rounded-[4px] border border-[#2D1B69]/20">
                                                                {cell.bookings.length} Slot
                                                            </span>
                                                            {/* Mobile Dot Indicator */}
                                                            <div className="lg:hidden flex justify-end space-x-0.5 mt-1">
                                                                {cell.bookings.slice(0, 3).map((_, bIdx) => (
                                                                    <span key={bIdx} className="w-1.5 h-1.5 rounded-full bg-accent-violet-deep inline-block" />
                                                                ))}
                                                                {cell.bookings.length > 3 && (
                                                                    <span className="text-[7px] font-bold text-accent-violet-deep leading-none">+</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Split Detail Panel Column */}
                        <div className="bg-white border border-hairline-cloud rounded-card shadow-card overflow-hidden h-fit">
                            <div className="p-5 border-b border-hairline-cloud bg-surface-card">
                                <h3 className="font-display font-bold text-base text-ink-deep">
                                    Detail Tanggal
                                </h3>
                                <p className="text-xs text-on-light-muted mt-0.5 font-medium">
                                    {getIndonesianDateLabel(selectedDate)}
                                </p>
                            </div>

                            {loading ? (
                                <div className="p-8 text-center text-xs text-on-light-muted">
                                    Memuat rincian hari...
                                </div>
                            ) : (
                                <div className="p-5 space-y-6">
                                    {/* Work Status Banner */}
                                    <div className={`p-4 rounded-lg border flex flex-col space-y-1 ${
                                        selectedDayData.is_off
                                            ? 'bg-red-50 border-red-200 text-status-danger'
                                            : 'bg-green-50 border-green-200 text-status-success'
                                    }`}>
                                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">
                                            Status Kehadiran
                                        </span>
                                        <span className="text-sm font-bold">
                                            {selectedDayData.is_off 
                                                ? 'LIBUR TUGAS' 
                                                : `MASUK KERJA (${selectedDayData.shift_hours || '-'})`
                                            }
                                        </span>
                                        {selectedDayData.is_off && selectedDayData.off_reason && (
                                            <p className="text-xs mt-1 opacity-90 italic">
                                                Keterangan: {selectedDayData.off_reason}
                                            </p>
                                        )}
                                    </div>

                                    {/* Bookings List */}
                                    <div>
                                        <h4 className="text-[10px] font-bold text-on-light-muted uppercase tracking-wider mb-3">
                                            Daftar Antrean Tugas ({selectedDayData.bookings ? selectedDayData.bookings.length : 0})
                                        </h4>

                                        {selectedDayData.is_off ? (
                                            <p className="text-xs text-on-light-muted italic text-center py-6 bg-surface-card/50 rounded border border-dashed border-hairline-cloud">
                                                Anda sedang libur hari ini. Tidak ada tugas haircut.
                                            </p>
                                        ) : selectedDayData.bookings && selectedDayData.bookings.length > 0 ? (
                                            <div className="space-y-3">
                                                {selectedDayData.bookings.map((booking) => (
                                                    <div 
                                                        key={booking.id} 
                                                        className="p-3 border border-hairline-cloud rounded-lg hover:border-hairline-cool transition bg-white"
                                                    >
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <span className="text-xs font-bold font-display text-ink-deep">
                                                                    {booking.slot_start} - {booking.slot_end}
                                                                </span>
                                                                <h5 className="font-bold text-ink-deep text-xs mt-1">
                                                                    {booking.customer_name}
                                                                </h5>
                                                                <p className="text-[11px] text-on-light-muted">
                                                                    {booking.customer_phone}
                                                                </p>
                                                            </div>
                                                            <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-bold uppercase border ${
                                                                booking.status === 'confirmed' ? 'bg-blue-50 border-blue-200 text-booking-confirmed' :
                                                                booking.status === 'in_progress' ? 'bg-amber-50 border-amber-200 text-booking-in-progress' :
                                                                'bg-green-50 border-green-200 text-booking-completed'
                                                            }`}>
                                                                {booking.status === 'in_progress' ? 'In-Progress' : booking.status}
                                                            </span>
                                                        </div>
                                                        <div className="border-t border-hairline-cloud/50 mt-2.5 pt-2.5 flex justify-between items-center text-[10px]">
                                                            <span className="font-medium text-on-light-muted">
                                                                Layanan: {booking.service_name}
                                                            </span>
                                                            <span className="text-on-light-muted">
                                                                ⏱ {booking.duration} Menit
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-on-light-muted italic text-center py-8 bg-surface-card/50 rounded border border-dashed border-hairline-cloud">
                                                Tidak ada antrean tugas pada tanggal ini.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
