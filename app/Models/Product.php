<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

#[Fillable(['name', 'category', 'price', 'photo_path', 'status'])]
class Product extends Model
{
    use HasFactory, SoftDeletes;

    protected static function booted(): void
    {
        static::creating(function ($product) {
            if (empty($product->uuid)) {
                $product->uuid = (string) Str::uuid();
            }
        });
    }

    /**
     * Relasi ke Branch (Cabang tempat produk dijual)
     */
    public function branches()
    {
        return $this->belongsToMany(Branch::class, 'branch_product_stocks')
            ->withPivot('stock')
            ->withTimestamps();
    }

    /**
     * Relasi ke BranchProductStock
     */
    public function branchStocks()
    {
        return $this->hasMany(BranchProductStock::class, 'product_id');
    }

    /**
     * Relasi ke ProductStockMutation (riwayat stok)
     */
    public function stockMutations()
    {
        return $this->hasMany(ProductStockMutation::class, 'product_id');
    }
}
