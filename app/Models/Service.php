<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

#[Fillable(['name', 'category', 'description', 'duration_minutes', 'default_price', 'photo_path', 'status'])]
class Service extends Model
{
    use HasFactory, SoftDeletes;

    protected static function booted(): void
    {
        static::creating(function ($service) {
            if (empty($service->uuid)) {
                $service->uuid = (string) Str::uuid();
            }
        });
    }

    /**
     * Relasi ke barbers yang menyediakan layanan ini
     */
    public function barbers(): BelongsToMany
    {
        return $this->belongsToMany(Barber::class, 'barber_services')
                    ->withPivot('price')
                    ->withTimestamps();
    }

    /**
     * Relasi ke bookings yang menggunakan layanan ini
     */
    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'service_id');
    }
}
