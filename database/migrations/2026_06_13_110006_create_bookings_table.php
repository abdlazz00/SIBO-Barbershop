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
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            $table->foreignId('branch_id')->constrained('branches')->onDelete('restrict');
            $table->foreignId('customer_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('guest_name', 100)->nullable();
            $table->string('guest_phone', 20)->nullable();
            $table->foreignId('barber_id')->constrained('barbers')->onDelete('restrict');
            $table->foreignId('service_id')->constrained('services')->onDelete('restrict');
            $table->timestamp('slot_start');
            $table->timestamp('slot_end');
            $table->string('status', 20)->default('confirmed'); // confirmed, in_progress, completed, cancelled
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
