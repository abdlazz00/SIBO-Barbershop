import { useState, useEffect } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import axios from 'axios';

export default function Wizard({ branches = [], services = [], auth }) {
    const [step, setStep] = useState(1);
    
    // Selections
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [selectedService, setSelectedService] = useState(null);
    const [selectedBarber, setSelectedBarber] = useState(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState(null);

    // API Data
    const [barbers, setBarbers] = useState([]);
    const [loadingBarbers, setLoadingBarbers] = useState(false);
    const [servicesList, setServicesList] = useState([]);
    const [loadingServices, setLoadingServices] = useState(false);
    const [slots, setSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    // Form inputs
    const [guestName, setGuestName] = useState('');
    const [guestPhone, setGuestPhone] = useState('');
    
    // Validation / Submission
    const { post, processing, errors, clearErrors, setError } = useForm({
        branch_id: '',
        service_id: '',
        barber_id: '',
        date: '',
        time: '',
        guest_name: '',
        guest_phone: '',
    });

    // 1. Get query param branch if redirected from homepage
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const preselectedBranchId = urlParams.get('branch_id');
        if (preselectedBranchId) {
            const branch = branches.find(b => b.id == preselectedBranchId);
            if (branch) {
                setSelectedBranch(branch);
                setStep(2);
            }
        }
    }, [branches]);

    // 2. Fetch Barbers when branch is selected
    useEffect(() => {
        if (selectedBranch) {
            setLoadingBarbers(true);
            setBarbers([]);
            setSelectedBarber(null);
            setSelectedService(null);
            setServicesList([]);
            
            axios.post(route('booking.barbers'), {
                branch_id: selectedBranch.id
            })
            .then(response => {
                setBarbers(response.data.barbers || []);
            })
            .catch(err => {
                console.error(err);
            })
            .finally(() => {
                setLoadingBarbers(false);
            });
        }
    }, [selectedBranch]);

    // 2b. Fetch Services when barber is selected
    useEffect(() => {
        if (selectedBarber) {
            setLoadingServices(true);
            setServicesList([]);
            setSelectedService(null);
            
            axios.post(route('booking.services'), {
                barber_id: selectedBarber.id
            })
            .then(response => {
                setServicesList(response.data.services || []);
            })
            .catch(err => {
                console.error(err);
            })
            .finally(() => {
                setLoadingServices(false);
            });
        }
    }, [selectedBarber]);

    // 3. Fetch Slots when barber and date are selected
    useEffect(() => {
        if (selectedBarber && selectedDate && selectedService) {
            setLoadingSlots(true);
            setSlots([]);
            setSelectedTime(null);

            axios.post(route('booking.slots'), {
                barber_id: selectedBarber.id,
                date: selectedDate,
                service_id: selectedService.id
            })
            .then(response => {
                setSlots(response.data.slots || []);
            })
            .catch(err => {
                console.error(err);
            })
            .finally(() => {
                setLoadingSlots(false);
            });
        }
    }, [selectedBarber, selectedDate, selectedService]);

    // Get 7 days list starting from today
    const getNext7Days = () => {
        const days = [];
        const today = new Date();
        const locale = 'id-ID';

        for (let i = 0; i < 7; i++) {
            const dateObj = new Date(today);
            dateObj.setDate(today.getDate() + i);
            
            const yyyy = dateObj.getFullYear();
            const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
            const dd = String(dateObj.getDate()).padStart(2, '0');
            const formatted = `${yyyy}-${mm}-${dd}`;

            const dayName = dateObj.toLocaleDateString(locale, { weekday: 'short' });
            const dateNum = dateObj.getDate();
            const monthName = dateObj.toLocaleDateString(locale, { month: 'short' });

            days.push({
                value: formatted,
                dayName,
                dateNum,
                monthName,
                isToday: i === 0
            });
        }
        return days;
    };

    const nextDays = getNext7Days();

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
            clearErrors();
        }
    };

    const handleNext = () => {
        // Step Validation
        if (step === 1 && !selectedBranch) {
            setError('branch_id', 'Silahkan pilih cabang terlebih dahulu.');
            return;
        }
        if (step === 2 && !selectedBarber) {
            setError('barber_id', 'Silahkan pilih barber terlebih dahulu.');
            return;
        }
        if (step === 3 && !selectedService) {
            setError('service_id', 'Silahkan pilih layanan terlebih dahulu.');
            return;
        }
        if (step === 4 && (!selectedDate || !selectedTime)) {
            setError('time', 'Silahkan pilih tanggal dan jam slot booking.');
            return;
        }

        clearErrors();
        setStep(step + 1);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Prepare data inside Inertia hook/request manually to match state
        const data = {
            branch_id: selectedBranch?.id || '',
            service_id: selectedService?.id || '',
            barber_id: selectedBarber?.id || '',
            date: selectedDate || '',
            time: selectedTime || '',
        };

        if (!auth.user) {
            data.guest_name = guestName;
            data.guest_phone = guestPhone;
        }

        // Call post helper from useForm (requires setting it directly or pass data to post)
        post(route('booking.store'), {
            data: data, // Inertia v2 requires passing it directly or via useForm keys
            // But since we are using useForm, we should sync it:
            onBefore: () => {
                // sync useForm keys
                clearErrors();
            },
            // Fallback for custom state submission
            preserveState: true,
            // Custom payload mapping
            ...{
                queryStringArrayFormat: 'indices',
            }
        });
    };

    // Alternative submit using Inertia router direct if useForm state sync is complex
    const handleDirectSubmit = (e) => {
        e.preventDefault();
        
        clearErrors();
        
        if (!auth.user && (!guestName || !guestPhone)) {
            setError('guest_name', 'Nama dan No Handphone wajib diisi.');
            return;
        }

        // We can use the useForm's setData to update keys
        const formPayload = {
            branch_id: selectedBranch.id,
            service_id: selectedService.id,
            barber_id: selectedBarber.id,
            date: selectedDate,
            time: selectedTime,
            guest_name: guestName,
            guest_phone: guestPhone,
        };

        // Custom AJAX post submission to route booking.store
        axios.post(route('booking.store'), formPayload)
            .then(res => {
                // If redirect returned (Inertia handles redirects automatically if using Inertia.post)
                // Since this is custom axios, let's use Inertia.post for clean session/view redirection:
                window.location.href = res.request.responseURL;
            })
            .catch(err => {
                if (err.response && err.response.data && err.response.data.errors) {
                    const validationErrors = err.response.data.errors;
                    Object.keys(validationErrors).forEach(key => {
                        setError(key, validationErrors[key][0]);
                    });
                } else {
                    setError('time', 'Terjadi kesalahan saat memproses booking.');
                }
            });
    };

    return (
        <>
            <Head title="Booking Online | Howell Barbershop" />
            <div className="min-h-screen bg-primary-deeper text-white font-sans flex flex-col justify-between selection:bg-accent-lime selection:text-ink-deep">
                
                {/* Header */}
                <header className="border-b border-hairline-violet bg-primary-deeper/90 sticky top-0 z-40">
                    <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                        <Link href="/" className="flex items-center space-x-2">
                            <span className="font-display font-bold text-sm tracking-widest text-on-dark-muted">
                                ← KEMBALI
                            </span>
                        </Link>
                        <span className="font-display font-bold tracking-tight text-sm text-center">
                            HOWELL BARBERSHOP <span className="text-accent-lime">WIZARD</span>
                        </span>
                        <div className="w-16 h-1" />
                    </div>
                </header>

                {/* Progress bar */}
                <div className="w-full bg-primary-dark h-1">
                    <div 
                        className="bg-accent-lime h-full transition-all duration-300"
                        style={{ width: `${(step / 5) * 100}%` }}
                    />
                </div>

                {/* Main Content */}
                <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
                    <div className="mb-6 flex justify-between text-xs text-on-dark-muted font-bold tracking-widest uppercase">
                        <span>Langkah {step} dari 5</span>
                        <span>
                            {step === 1 && "PILIH CABANG"}
                            {step === 2 && "PILIH BARBER"}
                            {step === 3 && "PILIH LAYANAN"}
                            {step === 4 && "PILIH JADWAL"}
                            {step === 5 && "KONFIRMASI DATA"}
                        </span>
                    </div>

                    {/* Step 1: Branch Selector */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="text-center md:text-left">
                                <h2 className="font-display font-semibold text-2xl md:text-3xl text-white mb-2">Pilih Cabang Terdekat</h2>
                                <p className="text-sm text-on-dark-muted">Silahkan pilih cabang Howell Barbershop untuk memesan slot grooming Anda.</p>
                            </div>

                            {errors.branch_id && (
                                <div className="p-3 bg-status-danger/10 border border-status-danger/30 rounded text-status-danger text-sm">
                                    {errors.branch_id}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {branches.map((branch) => {
                                    const isSelected = selectedBranch?.id === branch.id;
                                    return (
                                        <div
                                            key={branch.id}
                                            onClick={() => {
                                                setSelectedBranch(branch);
                                                clearErrors('branch_id');
                                            }}
                                            className={`rounded-card p-6 border cursor-pointer transition duration-200 relative overflow-hidden ${
                                                isSelected 
                                                ? 'bg-primary border-accent-lime shadow-lg shadow-accent-lime/10' 
                                                : 'bg-primary-dark/40 border-hairline-violet hover:border-accent-violet'
                                            }`}
                                        >
                                            {isSelected && (
                                                <div className="absolute top-0 right-0 bg-accent-lime text-ink-deep text-[10px] font-bold px-3 py-1 rounded-bl">
                                                    TERPILIH
                                                </div>
                                            )}
                                            <h3 className="font-display font-semibold text-lg text-white mb-3">{branch.name}</h3>
                                            <div className="space-y-2 text-sm text-on-dark-muted">
                                                <p className="flex items-start">
                                                    <span className="text-accent-lime mr-2 shrink-0">📍</span>
                                                    <span>{branch.address}</span>
                                                </p>
                                                <p className="flex items-center">
                                                    <span className="text-accent-lime mr-2 shrink-0">📞</span>
                                                    <span>{branch.phone}</span>
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Barber Selector */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="text-center md:text-left">
                                <h2 className="font-display font-semibold text-2xl md:text-3xl text-white mb-2">Pilih Barber Terfavorit</h2>
                                <p className="text-sm text-on-dark-muted">Silahkan pilih barber yang siap merapikan gaya rambut Anda.</p>
                            </div>

                            {errors.barber_id && (
                                <div className="p-3 bg-status-danger/10 border border-status-danger/30 rounded text-status-danger text-sm">
                                    {errors.barber_id}
                                </div>
                            )}

                            {loadingBarbers ? (
                                <div className="text-center py-12">
                                    <div className="w-8 h-8 border-4 border-accent-lime border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                    <p className="text-sm text-on-dark-muted">Mencari barber yang tersedia...</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                                    {barbers.length > 0 ? (
                                        barbers.map((barber) => {
                                            const isSelected = selectedBarber?.id === barber.id;
                                            return (
                                                <div
                                                    key={barber.id}
                                                    onClick={() => {
                                                        setSelectedBarber(barber);
                                                        clearErrors('barber_id');
                                                    }}
                                                    className="cursor-pointer transition duration-200 flex flex-col relative group"
                                                >
                                                    {/* Photo container */}
                                                    <div className={`w-full aspect-[4/5] bg-[#1A0F3D] rounded-card flex items-center justify-center shrink-0 overflow-hidden relative mb-3 transition duration-200 ${
                                                        isSelected 
                                                        ? 'ring-2 ring-accent-lime shadow-lg shadow-accent-lime/20' 
                                                        : 'ring-1 ring-hairline-violet/30 group-hover:ring-accent-violet'
                                                    }`}>
                                                        {isSelected && (
                                                            <div className="absolute top-2 right-2 bg-accent-lime text-ink-deep text-[9px] font-bold px-2 py-0.5 rounded shadow-sm z-10">
                                                                TERPILIH
                                                            </div>
                                                        )}
                                                        {barber.photo_path ? (
                                                            <img 
                                                                src={`/storage/${barber.photo_path}`} 
                                                                alt={barber.name} 
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => { e.target.src = ''; }}
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex flex-col items-center justify-center bg-[#1A0F3D]">
                                                                <span className="text-3xl font-display font-bold text-accent-lime">{barber.name.substring(0, 1)}</span>
                                                                <span className="text-[9px] text-on-dark-muted mt-1.5">NO PHOTO</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col items-start px-0.5">
                                                        <h3 className="font-display font-semibold text-sm md:text-base text-white mb-0.5 line-clamp-1">{barber.name}</h3>
                                                        <p className="text-xs text-on-dark-muted">
                                                            {barber.commission_percentage >= 45 ? 'Senior Barber' : 'Junior Barber'}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="col-span-full text-center py-12 text-on-dark-muted">
                                            Maaf, tidak ada barber aktif di cabang ini.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3: Service Selector */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <div className="text-center md:text-left">
                                <h2 className="font-display font-semibold text-2xl md:text-3xl text-white mb-2">Pilih Layanan Grooming</h2>
                                <p className="text-sm text-on-dark-muted">Harga yang tertera merupakan harga final untuk barber <strong>{selectedBarber?.name}</strong>.</p>
                            </div>

                            {errors.service_id && (
                                <div className="p-3 bg-status-danger/10 border border-status-danger/30 rounded text-status-danger text-sm">
                                    {errors.service_id}
                                </div>
                            )}

                            {loadingServices ? (
                                <div className="text-center py-12">
                                    <div className="w-8 h-8 border-4 border-accent-lime border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                    <p className="text-sm text-on-dark-muted">Mengambil daftar layanan dan penyesuaian tarif...</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {servicesList.map((service) => {
                                        const isSelected = selectedService?.id === service.id;
                                        return (
                                            <div
                                                key={service.id}
                                                onClick={() => {
                                                    setSelectedService(service);
                                                    clearErrors('service_id');
                                                }}
                                                className={`rounded-card p-5 border cursor-pointer transition duration-200 flex flex-col sm:flex-row gap-4 relative overflow-hidden ${
                                                    isSelected 
                                                    ? 'bg-primary border-accent-lime shadow-lg shadow-accent-lime/10' 
                                                    : 'bg-primary-dark/40 border-hairline-violet hover:border-accent-violet'
                                                }`}
                                            >
                                                {isSelected && (
                                                    <div className="absolute top-0 right-0 bg-accent-lime text-ink-deep text-[10px] font-bold px-3 py-1 rounded-bl z-10">
                                                        TERPILIH
                                                    </div>
                                                )}
                                                {/* Service Image */}
                                                <div className="w-full sm:w-28 h-28 rounded-lg overflow-hidden bg-primary-deeper border border-hairline-violet shrink-0 flex items-center justify-center">
                                                    {service.photo_path ? (
                                                        <img 
                                                            src={`/storage/${service.photo_path}`} 
                                                            alt={service.name} 
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <span className="text-3xl">✂️</span>
                                                    )}
                                                </div>
                                                <div className="flex-1 flex flex-col justify-between">
                                                    <div>
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="px-2 py-0.5 rounded bg-primary-deeper border border-hairline-violet text-[9px] uppercase font-bold text-accent-lime tracking-wider">
                                                                {service.category}
                                                            </span>
                                                            <span className="text-xs text-on-dark-muted flex items-center">
                                                                ⏱ {service.duration_minutes} Min
                                                            </span>
                                                        </div>
                                                        <h3 className="font-display font-semibold text-base text-white mb-1">{service.name}</h3>
                                                        <p className="text-xs text-on-dark-muted line-clamp-2 leading-relaxed mb-2">{service.description}</p>
                                                    </div>
                                                    <div className="border-t border-hairline-violet/30 pt-2 flex items-center justify-between text-xs">
                                                        <span className="text-on-dark-muted">Harga Layanan (Final)</span>
                                                        <span className="font-display font-bold text-sm text-accent-lime">
                                                            Rp {new Intl.NumberFormat('id-ID').format(service.price)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 4: DateTime Slot Selector */}
                    {step === 4 && (
                        <div className="space-y-6">
                            <div className="text-center md:text-left">
                                <h2 className="font-display font-semibold text-2xl md:text-3xl text-white mb-2">Pilih Tanggal & Waktu</h2>
                                <p className="text-sm text-on-dark-muted">Pilih tanggal dalam 7 hari mendatang, lalu pilih slot jam yang tersedia.</p>
                            </div>

                            {errors.time && (
                                <div className="p-3 bg-status-danger/10 border border-status-danger/30 rounded text-status-danger text-sm">
                                    {errors.time}
                                </div>
                            )}

                            {/* Date Selector List */}
                            <div className="space-y-2">
                                <span className="text-xs font-bold text-on-dark-muted uppercase tracking-widest block">1. PILIH TANGGAL</span>
                                <div className="flex space-x-3 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-hairline-violet">
                                    {nextDays.map((day) => {
                                        const isSelected = selectedDate === day.value;
                                        return (
                                            <button
                                                key={day.value}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedDate(day.value);
                                                    setSelectedTime(null);
                                                    clearErrors('time');
                                                }}
                                                className={`flex-shrink-0 w-20 py-3 rounded-lg border text-center transition duration-200 ${
                                                    isSelected
                                                    ? 'bg-accent-lime text-ink-deep border-accent-lime shadow-lg'
                                                    : 'bg-primary-dark/40 border-hairline-violet text-on-dark-muted hover:border-accent-violet hover:text-white'
                                                }`}
                                            >
                                                <span className="block text-[10px] font-bold uppercase tracking-wider">{day.dayName}</span>
                                                <span className="block text-xl font-display font-bold my-1">{day.dateNum}</span>
                                                <span className="block text-[9px] uppercase tracking-wider">{day.monthName}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Timeslot Grid */}
                            {selectedDate && (
                                <div className="space-y-3">
                                    <span className="text-xs font-bold text-on-dark-muted uppercase tracking-widest block">2. PILIH JAM SLOT</span>
                                    
                                    {loadingSlots ? (
                                        <div className="text-center py-8">
                                            <div className="w-6 h-6 border-4 border-accent-lime border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                                            <p className="text-xs text-on-dark-muted">Menghitung ketersediaan slot...</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                                            {slots.length > 0 ? (
                                                slots.map((slotTime) => {
                                                    const isSelected = selectedTime === slotTime;
                                                    return (
                                                        <button
                                                            key={slotTime}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedTime(slotTime);
                                                                clearErrors('time');
                                                            }}
                                                            className={`py-2 px-3 rounded-md text-sm font-semibold border transition duration-200 ${
                                                                isSelected
                                                                ? 'bg-accent-lime border-accent-lime text-ink-deep'
                                                                : 'bg-primary-dark/40 border-hairline-violet text-white hover:border-accent-violet'
                                                            }`}
                                                        >
                                                            {slotTime}
                                                        </button>
                                                    );
                                                })
                                            ) : (
                                                <div className="col-span-full text-center py-6 text-sm text-status-warning bg-status-warning/10 border border-status-warning/20 rounded">
                                                    Tidak ada slot kosong yang cocok untuk durasi {selectedService?.duration_minutes} menit pada tanggal ini. Barber libur atau semua jam telah penuh di-booking.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 5: Data Confirmation & Form Inputs */}
                    {step === 5 && (
                        <div className="space-y-8">
                            <div className="text-center md:text-left">
                                <h2 className="font-display font-semibold text-2xl md:text-3xl text-white mb-2">Konfirmasi & Kirim Pesanan</h2>
                                <p className="text-sm text-on-dark-muted">Silahkan periksa ringkasan booking Anda dan lengkapi data kontak di bawah ini.</p>
                            </div>

                            {/* Ticket Summary */}
                            <div className="rounded-card border border-hairline-violet bg-primary-dark/50 p-6 space-y-4">
                                <h3 className="font-display font-bold text-lg text-accent-lime border-b border-hairline-violet/30 pb-3">Ringkasan Janji</h3>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                                    <div>
                                        <span className="text-xs text-on-dark-muted uppercase tracking-wider font-bold block mb-1">Outlet Cabang</span>
                                        <span className="font-semibold text-white">{selectedBranch?.name}</span>
                                    </div>
                                    <div>
                                        <span className="text-xs text-on-dark-muted uppercase tracking-wider font-bold block mb-1">Layanan</span>
                                        <span className="font-semibold text-white">{selectedService?.name}</span>
                                        <span className="block text-xs text-on-dark-muted">({selectedService?.duration_minutes} Menit)</span>
                                    </div>
                                    <div>
                                        <span className="text-xs text-on-dark-muted uppercase tracking-wider font-bold block mb-1">Barber</span>
                                        <span className="font-semibold text-white">{selectedBarber?.name}</span>
                                    </div>
                                    <div>
                                        <span className="text-xs text-on-dark-muted uppercase tracking-wider font-bold block mb-1">Waktu</span>
                                        <span className="font-semibold text-white">
                                            {new Date(selectedDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </span>
                                        <span className="block font-semibold text-accent-lime text-base mt-0.5">{selectedTime} WIB</span>
                                    </div>
                                </div>

                                <div className="border-t border-hairline-violet/30 pt-4 flex justify-between items-center bg-primary-deeper/30 -mx-6 -mb-6 p-6 rounded-b-card">
                                    <span className="text-sm font-semibold text-on-dark-muted">Total Pembayaran (Bayar di Tempat)</span>
                                    <span className="font-display font-bold text-2xl text-accent-lime">
                                        Rp {new Intl.NumberFormat('id-ID').format(selectedService?.price)}
                                    </span>
                                </div>
                            </div>

                            {/* Contact Form */}
                            <form onSubmit={handleDirectSubmit} className="space-y-4 max-w-md">
                                <h3 className="font-display font-semibold text-lg text-white">Informasi Kontak</h3>
                                
                                {auth.user ? (
                                    <div className="bg-primary-dark/30 border border-hairline-violet p-4 rounded-md space-y-2 text-sm">
                                        <p className="text-on-dark-muted font-medium">Anda terautentikasi sebagai:</p>
                                        <p className="text-white font-bold text-base">{auth.user.name}</p>
                                        <p className="text-on-dark-muted">No HP: {auth.user.phone}</p>
                                        <p className="text-on-dark-muted">Email: {auth.user.email}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div>
                                            <label htmlFor="guest_name" className="block text-xs font-semibold text-on-dark-muted uppercase tracking-wider mb-2">Nama Lengkap</label>
                                            <input 
                                                type="text" 
                                                id="guest_name"
                                                value={guestName}
                                                onChange={(e) => setGuestName(e.target.value)}
                                                className="w-full bg-primary-deeper border border-hairline-violet rounded-md px-3.5 py-2.5 text-white placeholder-on-dark-muted/50 focus:border-accent-violet focus:ring-2 focus:ring-accent-violet/30 outline-none transition duration-150"
                                                placeholder="Masukkan nama lengkap"
                                                required
                                            />
                                            {errors.guest_name && <p className="text-xs text-status-danger mt-1">{errors.guest_name}</p>}
                                        </div>
                                        <div>
                                            <label htmlFor="guest_phone" className="block text-xs font-semibold text-on-dark-muted uppercase tracking-wider mb-2">Nomor WhatsApp / HP</label>
                                            <input 
                                                type="text" 
                                                id="guest_phone"
                                                value={guestPhone}
                                                onChange={(e) => setGuestPhone(e.target.value)}
                                                className="w-full bg-primary-deeper border border-hairline-violet rounded-md px-3.5 py-2.5 text-white placeholder-on-dark-muted/50 focus:border-accent-violet focus:ring-2 focus:ring-accent-violet/30 outline-none transition duration-150"
                                                placeholder="Contoh: 08123456789"
                                                required
                                            />
                                            {errors.guest_phone && <p className="text-xs text-status-danger mt-1">{errors.guest_phone}</p>}
                                        </div>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full mt-6 py-4 rounded-md bg-accent-lime text-ink-deep font-display font-bold text-base hover:bg-accent-lime-muted active:scale-98 transition duration-200 shadow-lg shadow-accent-lime/10 flex items-center justify-center space-x-2"
                                >
                                    {processing ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-ink-deep border-t-transparent rounded-full animate-spin" />
                                            <span>MEMPROSES...</span>
                                        </>
                                    ) : (
                                        <span>KONFIRMASI BOOKING</span>
                                    )}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Step Navigation Buttons */}
                    {step < 5 && (
                        <div className="mt-12 flex justify-between items-center border-t border-hairline-violet/30 pt-6">
                            <button
                                type="button"
                                onClick={handleBack}
                                disabled={step === 1}
                                className={`px-5 py-2.5 rounded-md font-medium text-sm border transition duration-200 ${
                                    step === 1
                                    ? 'border-hairline-violet/30 text-on-dark-muted/30 cursor-not-allowed'
                                    : 'border-hairline-violet text-white hover:bg-white/5'
                                }`}
                            >
                                KEMBALI
                            </button>
                            
                            <button
                                type="button"
                                onClick={handleNext}
                                className="px-6 py-2.5 rounded-md bg-white text-ink-deep font-display font-bold text-sm hover:bg-on-dark-muted active:scale-98 transition duration-200 shadow-md"
                            >
                                LANJUT
                            </button>
                        </div>
                    )}
                </main>

                {/* Footer */}
                <footer className="border-t border-hairline-violet bg-primary-deeper py-6 text-center text-xs text-on-dark-muted">
                    &copy; {new Date().getFullYear()} Howell Barbershop. Keamanan transaksi terjamin & bayar di tempat.
                </footer>
            </div>
        </>
    );
}
