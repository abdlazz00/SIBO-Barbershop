<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

#[Fillable(['branch_id', 'customer_id', 'guest_name', 'guest_phone', 'barber_id', 'service_id', 'slot_start', 'slot_end', 'status'])]
class Booking extends Model
{
    use HasFactory;

    protected static function booted(): void
    {
        static::creating(function ($booking) {
            if (empty($booking->uuid)) {
                $booking->uuid = (string) Str::uuid();
            }
        });
    }

    /**
     * Casting format kolom datetime
     */
    protected function casts(): array
    {
        return [
            'slot_start' => 'datetime',
            'slot_end' => 'datetime',
        ];
    }

    /**
     * Relasi ke Branch
     */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    /**
     * Relasi ke User sebagai Customer (null jika Guest)
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    /**
     * Relasi ke Barber
     */
    public function barber(): BelongsTo
    {
        return $this->belongsTo(Barber::class, 'barber_id');
    }

    /**
     * Relasi ke Service
     */
    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class, 'service_id');
    }

    /**
     * Relasi ke transaksi kasir terkait booking ini
     */
    public function transaction(): HasOne
    {
        return $this->hasOne(Transaction::class, 'booking_id');
    }
}
