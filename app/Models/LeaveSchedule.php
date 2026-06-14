<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['barber_id', 'leave_date', 'notes'])]
class LeaveSchedule extends Model
{
    use HasFactory;

    /**
     * Casting format leave_date menjadi objek Date/Carbon
     */
    protected function casts(): array
    {
        return [
            'leave_date' => 'date',
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
