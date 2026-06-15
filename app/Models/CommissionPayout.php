<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['barber_id', 'paid_by', 'payout_amount', 'payment_method', 'reference_number', 'notes', 'paid_at'])]
class CommissionPayout extends Model
{
    /**
     * Relasi ke Barber
     */
    public function barber(): BelongsTo
    {
        return $this->belongsTo(Barber::class, 'barber_id');
    }

    /**
     * Relasi ke User (Owner/Kasir yang membayar)
     */
    public function paidBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'paid_by');
    }

    /**
     * Relasi ke CommissionRecords yang dibayarkan
     */
    public function commissionRecords(): HasMany
    {
        return $this->hasMany(CommissionRecord::class, 'payout_id');
    }

    /**
     * Casting format kolom datetime
     */
    protected function casts(): array
    {
        return [
            'paid_at' => 'datetime',
        ];
    }
}
