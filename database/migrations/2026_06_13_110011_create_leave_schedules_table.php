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
        Schema::create('leave_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('barber_id')->constrained('barbers')->onDelete('cascade');
            $table->date('leave_date');
            $table->string('notes')->nullable();
            $table->timestamps();

            $table->unique(['barber_id', 'leave_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leave_schedules');
    }
};
