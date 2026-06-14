<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

#[Fillable(['invoice_number', 'booking_id', 'cashier_id', 'payment_type', 'total_service', 'total_product', 'grand_total'])]
class Transaction extends Model
{
    use HasFactory;

    protected static function booted(): void
    {
        static::creating(function ($transaction) {
            if (empty($transaction->uuid)) {
                $transaction->uuid = (string) Str::uuid();
            }
        });
    }

    /**
     * Relasi ke Booking terkait
     */
    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class, 'booking_id');
    }

    /**
     * Relasi ke User (Kasir yang melayani)
     */
    public function cashier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cashier_id');
    }

    /**
     * Relasi ke detail item transaksi (produk & service)
     */
    public function items(): HasMany
    {
        return $this->hasMany(TransactionItem::class, 'transaction_id');
    }

    /**
     * Relasi ke catatan komisi barber yang dihasilkan dari transaksi ini
     */
    public function commissionRecord(): HasOne
    {
        return $this->hasOne(CommissionRecord::class, 'transaction_id');
    }
}
