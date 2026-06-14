<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['transaction_id', 'item_type', 'reference_id', 'qty', 'unit_price', 'subtotal'])]
class TransactionItem extends Model
{
    // Non-incrementing / timestamps manual jika tidak diisi lengkap
    public $timestamps = false;

    /**
     * Relasi ke Transaction induk
     */
    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class, 'transaction_id');
    }

    /**
     * Relasi ke Service (jika item_type = 'service')
     */
    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class, 'reference_id');
    }

    /**
     * Relasi ke Product (jika item_type = 'product')
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'reference_id');
    }
}
