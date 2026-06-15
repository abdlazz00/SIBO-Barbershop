<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Create branch_product_stocks table
        Schema::create('branch_product_stocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->foreignId('branch_id')->constrained('branches')->onDelete('cascade');
            $table->integer('stock')->default(0);
            $table->timestamps();
            
            // Unique product per branch
            $table->unique(['product_id', 'branch_id']);
        });

        // 2. Add branch_id to product_stock_mutations table
        Schema::table('product_stock_mutations', function (Blueprint $table) {
            $table->foreignId('branch_id')->nullable()->constrained('branches')->onDelete('cascade');
        });

        // 3. Migrate data
        DB::transaction(function () {
            // Get all existing products (including soft-deleted ones)
            $existingProducts = DB::table('products')->get();

            // Group by name and category (case-insensitive trim)
            $groups = [];
            foreach ($existingProducts as $p) {
                $key = strtolower(trim($p->name)) . '|' . strtolower(trim($p->category));
                $groups[$key][] = $p;
            }

            foreach ($groups as $key => $group) {
                // The first product in the group will become the "global" product
                $globalProduct = $group[0];

                foreach ($group as $p) {
                    // Insert branch stock record
                    DB::table('branch_product_stocks')->insert([
                        'product_id' => $globalProduct->id,
                        'branch_id' => $p->branch_id,
                        'stock' => $p->stock,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);

                    // Update mutations that belonged to this product
                    DB::table('product_stock_mutations')
                        ->where('product_id', $p->id)
                        ->update([
                            'product_id' => $globalProduct->id,
                            'branch_id' => $p->branch_id,
                        ]);

                    // Update POS transaction items for this product
                    DB::table('transaction_items')
                        ->where('item_type', 'product')
                        ->where('reference_id', $p->id)
                        ->update([
                            'reference_id' => $globalProduct->id,
                        ]);

                    // If it is not the global product itself, we delete the duplicate product record
                    if ($p->id !== $globalProduct->id) {
                        DB::table('products')->where('id', $p->id)->delete();
                    }
                }
            }

            // Backfill branch_id for any mutations that might have missed it
            $orphanedMutations = DB::table('product_stock_mutations')->whereNull('branch_id')->get();
            foreach ($orphanedMutations as $mut) {
                $prod = DB::table('products')->where('id', $mut->product_id)->first();
                if ($prod && isset($prod->branch_id)) {
                    DB::table('product_stock_mutations')
                        ->where('id', $mut->id)
                        ->update(['branch_id' => $prod->branch_id]);
                } else {
                    $branch = DB::table('branches')->first();
                    if ($branch) {
                        DB::table('product_stock_mutations')
                            ->where('id', $mut->id)
                            ->update(['branch_id' => $branch->id]);
                    }
                }
            }
        });

        // 4. Modify branch_id in product_stock_mutations to be NOT NULL
        Schema::table('product_stock_mutations', function (Blueprint $table) {
            $table->unsignedBigInteger('branch_id')->change();
        });

        // 5. Drop branch_id and stock columns from products table
        Schema::table('products', function (Blueprint $table) {
            $table->dropForeign(['branch_id']);
            $table->dropColumn(['branch_id', 'stock']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Add back columns to products
        Schema::table('products', function (Blueprint $table) {
            $table->unsignedBigInteger('branch_id')->nullable();
            $table->integer('stock')->default(0);
        });

        // Restore foreign key
        Schema::table('products', function (Blueprint $table) {
            $table->foreign('branch_id')->references('id')->on('branches')->onDelete('restrict');
        });

        // Backfill data from branch_product_stocks to products
        $stocks = DB::table('branch_product_stocks')->get();
        foreach ($stocks as $s) {
            $prod = DB::table('products')->where('id', $s->product_id)->first();
            if ($prod) {
                if (is_null($prod->branch_id)) {
                    DB::table('products')
                        ->where('id', $prod->id)
                        ->update([
                            'branch_id' => $s->branch_id,
                            'stock' => $s->stock,
                        ]);
                } else {
                    DB::table('products')->insert([
                        'uuid' => (string) \Illuminate\Support\Str::uuid(),
                        'name' => $prod->name,
                        'category' => $prod->category,
                        'price' => $prod->price,
                        'photo_path' => $prod->photo_path,
                        'status' => $prod->status,
                        'branch_id' => $s->branch_id,
                        'stock' => $s->stock,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }

        // Drop branch_product_stocks table
        Schema::dropIfExists('branch_product_stocks');

        // Drop branch_id from mutations
        Schema::table('product_stock_mutations', function (Blueprint $table) {
            $table->dropForeign(['branch_id']);
            $table->dropColumn('branch_id');
        });
    }
};
