<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

use App\Http\Controllers\BookingController;
use App\Http\Controllers\OwnerController;
use App\Http\Controllers\CashierController;
use App\Http\Controllers\BarberController;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
        'branches' => \App\Models\Branch::whereNull('deleted_at')->get(),
        'services' => \App\Models\Service::where('status', 'active')->whereNull('deleted_at')->get(),
        'barbers' => \App\Models\Barber::with(['user', 'branch'])
            ->where('status', 'active')
            ->whereNull('deleted_at')
            ->get()
            ->map(function ($b) {
                return [
                    'id' => $b->id,
                    'name' => $b->user->name,
                    'photo_path' => $b->photo_path ?? $b->user->photo_path,
                    'branch_name' => $b->branch->name ?? '-',
                    'commission_percentage' => $b->commission_percentage,
                ];
            }),
    ]);
});

Route::get('/booking', [BookingController::class, 'index'])->name('booking.index');
Route::post('/booking/barbers', [BookingController::class, 'getBarbers'])->name('booking.barbers');
Route::post('/booking/slots', [BookingController::class, 'getSlots'])->name('booking.slots');
Route::post('/booking', [BookingController::class, 'store'])->name('booking.store');
Route::get('/booking/success/{uuid}', [BookingController::class, 'success'])->name('booking.success');

Route::get('/dashboard', function () {
    $user = auth()->user();
    return match ($user->role) {
        'owner' => redirect('/owner/dashboard'),
        'cashier' => redirect('/cashier/dashboard'),
        'barber' => redirect('/barber/dashboard'),
        default => redirect('/'),
    };
})->middleware(['auth', 'verified'])->name('dashboard');

// Route Groups for Specific Roles
Route::middleware(['auth', 'role:owner'])->group(function () {
    Route::get('/owner/dashboard', [OwnerController::class, 'dashboard'])->name('owner.dashboard');

    // Staff CRUD
    Route::get('/owner/staff', [OwnerController::class, 'listStaff'])->name('owner.staff.index');
    Route::post('/owner/staff', [OwnerController::class, 'storeStaff'])->name('owner.staff.store');
    Route::patch('/owner/staff/{user}', [OwnerController::class, 'updateStaff'])->name('owner.staff.update');
    Route::delete('/owner/staff/{user}', [OwnerController::class, 'deleteStaff'])->name('owner.staff.destroy');

    // Services CRUD & Override Pricing
    Route::get('/owner/services', [OwnerController::class, 'listServices'])->name('owner.services.index');
    Route::post('/owner/services', [OwnerController::class, 'storeService'])->name('owner.services.store');
    Route::patch('/owner/services/{service}', [OwnerController::class, 'updateService'])->name('owner.services.update');
    Route::delete('/owner/services/{service}', [OwnerController::class, 'deleteService'])->name('owner.services.destroy');
    Route::post('/owner/services/override', [OwnerController::class, 'storeOverridePrice'])->name('owner.services.override.store');
    Route::delete('/owner/services/override', [OwnerController::class, 'deleteOverridePrice'])->name('owner.services.override.destroy');

    // Products CRUD
    Route::get('/owner/products', [OwnerController::class, 'listProducts'])->name('owner.products.index');
    Route::post('/owner/products', [OwnerController::class, 'storeProduct'])->name('owner.products.store');
    Route::patch('/owner/products/{product}', [OwnerController::class, 'updateProduct'])->name('owner.products.update');
    Route::delete('/owner/products/{product}', [OwnerController::class, 'deleteProduct'])->name('owner.products.destroy');

    // Schedules & Leaves
    Route::get('/owner/schedules', [OwnerController::class, 'listSchedules'])->name('owner.schedules.index');
    Route::post('/owner/schedules/weekly', [OwnerController::class, 'updateWeeklySchedule'])->name('owner.schedules.weekly.update');
    Route::post('/owner/schedules/leave', [OwnerController::class, 'storeLeaveSchedule'])->name('owner.schedules.leave.store');
    Route::delete('/owner/schedules/leave/{leaveSchedule}', [OwnerController::class, 'deleteLeaveSchedule'])->name('owner.schedules.leave.destroy');

    // Commissions Report
    Route::get('/owner/commissions', [OwnerController::class, 'reportCommissions'])->name('owner.commissions.index');
});

Route::middleware(['auth', 'role:cashier'])->group(function () {
    Route::get('/cashier/dashboard', [CashierController::class, 'dashboard'])->name('cashier.dashboard');
    Route::post('/cashier/bookings/{booking}/status', [CashierController::class, 'updateStatus'])->name('cashier.bookings.status');
    Route::post('/cashier/bookings/store', [CashierController::class, 'storeBooking'])->name('cashier.bookings.store');
    Route::post('/cashier/customers/search', [CashierController::class, 'searchCustomer'])->name('cashier.customers.search');
    Route::get('/cashier/pos/{booking?}', [CashierController::class, 'posIndex'])->name('cashier.pos.index');
    Route::post('/cashier/pos/checkout', [CashierController::class, 'checkout'])->name('cashier.pos.checkout');
    Route::get('/cashier/transactions/{transaction}/receipt', [CashierController::class, 'receipt'])->name('cashier.transactions.receipt');
});

Route::middleware(['auth', 'role:barber'])->group(function () {
    Route::get('/barber/dashboard', [BarberController::class, 'dashboard'])->name('barber.dashboard');
    Route::get('/barber/commissions', [BarberController::class, 'commissions'])->name('barber.commissions.index');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
