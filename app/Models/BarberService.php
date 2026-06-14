<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\Pivot;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['barber_id', 'service_id', 'price'])]
class BarberService extends Pivot
{
    protected $table = 'barber_services';

    public $incrementing = true;

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
}
