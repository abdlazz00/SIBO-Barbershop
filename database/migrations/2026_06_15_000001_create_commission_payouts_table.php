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
        Schema::create('commission_payouts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('barber_id')->constrained('barbers')->onDelete('restrict');
            $table->foreignId('paid_by')->constrained('users')->onDelete('restrict');
            $table->decimal('payout_amount', 12, 2);
            $table->string('payment_method'); // 'cash', 'bank_transfer'
            $table->string('reference_number')->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('paid_at')->useCurrent();
            $table->timestamps();
        });

        Schema::table('commission_records', function (Blueprint $table) {
            $table->foreignId('payout_id')->nullable()->constrained('commission_payouts')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('commission_records', function (Blueprint $table) {
            $table->dropForeign(['payout_id']);
            $table->dropColumn('payout_id');
        });

        Schema::dropIfExists('commission_payouts');
    }
};
