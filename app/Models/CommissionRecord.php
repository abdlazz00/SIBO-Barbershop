<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['transaction_id', 'barber_id', 'service_amount', 'percentage', 'commission_amount'])]
class CommissionRecord extends Model
{
    // PostgreSQL timestamps manual
    public $timestamps = false;

    /**
     * Relasi ke Transaction
     */
    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class, 'transaction_id');
    }

    /**
     * Relasi ke Barber
     */
    public function barber(): BelongsTo
    {
        return $this->belongsTo(Barber::class, 'barber_id');
    }

    /**
     * Casting format kolom datetime
     */
    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
        ];
    }
}
