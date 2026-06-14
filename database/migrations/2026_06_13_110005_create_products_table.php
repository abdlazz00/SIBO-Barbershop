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
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            $table->foreignId('branch_id')->constrained('branches')->onDelete('restrict');
            $table->string('name', 100);
            $table->string('category', 50); // Pomade, Vitamin, Shampoo, Aksesoris
            $table->decimal('price', 12, 2);
            $table->integer('stock')->default(0);
            $table->string('photo_path')->nullable();
            $table->string('status', 20)->default('active'); // active, inactive
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
