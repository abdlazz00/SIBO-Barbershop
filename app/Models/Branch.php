<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

#[Fillable(['name', 'address', 'phone'])]
class Branch extends Model
{
    use HasFactory, SoftDeletes;

    protected static function booted(): void
    {
        static::creating(function ($branch) {
            if (empty($branch->uuid)) {
                $branch->uuid = (string) Str::uuid();
            }
        });
    }

    /**
     * Relasi ke barbers di cabang ini
     */
    public function barbers(): HasMany
    {
        return $this->hasMany(Barber::class, 'branch_id');
    }

    /**
     * Relasi ke products di cabang ini
     */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class, 'branch_id');
    }

    /**
     * Relasi ke bookings di cabang ini
     */
    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'branch_id');
    }
}
