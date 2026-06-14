<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['barber_id', 'day_of_week', 'start_time', 'end_time', 'is_off'])]
class WeeklySchedule extends Model
{
    use HasFactory;

    /**
     * Casting tipe boolean untuk is_off
     */
    protected function casts(): array
    {
        return [
            'is_off' => 'boolean',
        ];
    }

    /**
     * Relasi ke Barber
     */
    public function barber(): BelongsTo
    {
        return $this->belongsTo(Barber::class, 'barber_id');
    }
}
