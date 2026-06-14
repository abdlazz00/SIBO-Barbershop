<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('weekly_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('barber_id')->constrained('barbers')->onDelete('cascade');
            $table->integer('day_of_week'); // 0 = Minggu, 1 = Senin, dst.
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->boolean('is_off')->default(false);
            $table->timestamps();

            $table->unique(['barber_id', 'day_of_week']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('weekly_schedules');
    }
};
