<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

#[Fillable(['user_id', 'branch_id', 'commission_percentage', 'status', 'photo_path'])]
class Barber extends Model
{
    use HasFactory, SoftDeletes;

    protected static function booted(): void
    {
        static::creating(function ($barber) {
            if (empty($barber->uuid)) {
                $barber->uuid = (string) Str::uuid();
            }
        });
    }

    /**
     * Relasi ke User (kredensial login)
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Relasi ke Branch (Cabang tempat bekerja)
     */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    /**
     * Relasi ke services (layanan yang disediakan barber dengan harga override)
     */
    public function services(): BelongsToMany
    {
        return $this->belongsToMany(Service::class, 'barber_services')
                    ->withPivot('price')
                    ->withTimestamps();
    }

    /**
     * Relasi ke template jadwal mingguan
     */
    public function weeklySchedules(): HasMany
    {
        return $this->hasMany(WeeklySchedule::class, 'barber_id');
    }

    /**
     * Relasi ke jadwal cuti/libur insidental
     */
    public function leaveSchedules(): HasMany
    {
        return $this->hasMany(LeaveSchedule::class, 'barber_id');
    }

    /**
     * Relasi ke bookings yang ditugaskan ke barber ini
     */
    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'barber_id');
    }

    /**
     * Relasi ke histori komisi pendapatan barber
     */
    public function commissions(): HasMany
    {
        return $this->hasMany(CommissionRecord::class, 'barber_id');
    }
}
