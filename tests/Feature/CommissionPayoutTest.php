<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Branch;
use App\Models\Barber;
use App\Models\Service;
use App\Models\Booking;
use App\Models\Transaction;
use App\Models\CommissionRecord;
use App\Models\CommissionPayout;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Carbon\Carbon;

class CommissionPayoutTest extends TestCase
{
    use RefreshDatabase;

    protected $owner;
    protected $cashier;
    protected $barberUser;
    protected $barber;
    protected $branch;
    protected $service;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Create a Branch
        $this->branch = Branch::create([
            'name' => 'Premium Howell Branch',
            'address' => 'Sudirman St. No. 12, Jakarta',
            'phone' => '08111222333',
        ]);

        // 2. Create an Owner user
        $this->owner = User::factory()->create([
            'role' => 'owner',
            'branch_id' => null,
        ]);

        // 3. Create a Cashier user
        $this->cashier = User::factory()->create([
            'role' => 'cashier',
            'branch_id' => $this->branch->id,
        ]);

        // 4. Create a Barber user & profile
        $this->barberUser = User::factory()->create([
            'role' => 'barber',
            'branch_id' => $this->branch->id,
        ]);

        $this->barber = Barber::create([
            'user_id' => $this->barberUser->id,
            'branch_id' => $this->branch->id,
            'commission_percentage' => 40.00,
            'status' => 'active',
        ]);

        // 5. Create a Service
        $this->service = Service::create([
            'name' => 'Premium Haircut',
            'category' => 'Haircut',
            'duration_minutes' => 45,
            'default_price' => 100000.00,
            'status' => 'active',
        ]);
    }

    /**
     * Helper to create a complete completed transaction and commission record.
     */
    protected function createCommissionRecord($amount, $invoiceNo)
    {
        $booking = Booking::create([
            'branch_id' => $this->branch->id,
            'guest_name' => 'John Doe',
            'guest_phone' => '0812345678',
            'barber_id' => $this->barber->id,
            'service_id' => $this->service->id,
            'slot_start' => now()->subHours(2),
            'slot_end' => now()->subHours(1)->subMinutes(15),
            'status' => 'completed',
        ]);

        $transaction = Transaction::create([
            'invoice_number' => $invoiceNo,
            'booking_id' => $booking->id,
            'cashier_id' => $this->cashier->id,
            'payment_type' => 'cash',
            'total_service' => $amount,
            'total_product' => 0.00,
            'grand_total' => $amount,
        ]);

        return CommissionRecord::create([
            'transaction_id' => $transaction->id,
            'barber_id' => $this->barber->id,
            'service_amount' => $amount,
            'percentage' => $this->barber->commission_percentage,
            'commission_amount' => $amount * ($this->barber->commission_percentage / 100),
            'created_at' => now(),
        ]);
    }

    public function test_owner_can_access_commissions_index()
    {
        $this->createCommissionRecord(100000.00, 'INV-001');

        $response = $this->actingAs($this->owner)
            ->get(route('owner.commissions.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Owner/Commissions')
            ->has('records')
            ->has('unpaidGrouped')
        );
    }

    public function test_non_owner_cannot_access_commissions_index()
    {
        $response = $this->actingAs($this->barberUser)
            ->get(route('owner.commissions.index'));

        $response->assertRedirect('/barber/dashboard');
    }

    public function test_owner_can_get_unpaid_commissions_for_barber()
    {
        $rec1 = $this->createCommissionRecord(100000.00, 'INV-001');
        $rec2 = $this->createCommissionRecord(150000.00, 'INV-002');

        $response = $this->actingAs($this->owner)
            ->get(route('owner.commissions.unpaid', $this->barber->id));

        $response->assertStatus(200);
        $response->assertJsonCount(2, 'records');
        $response->assertJsonPath('records.0.invoice_number', 'INV-001');
        $response->assertJsonPath('records.1.invoice_number', 'INV-002');
    }

    public function test_owner_can_store_commission_payout()
    {
        $rec1 = $this->createCommissionRecord(100000.00, 'INV-001'); // commission = 40,000
        $rec2 = $this->createCommissionRecord(150000.00, 'INV-002'); // commission = 60,000

        // Total expected payout amount = 100,000
        $response = $this->actingAs($this->owner)
            ->post(route('owner.commissions.payout.store', $this->barber->id), [
                'record_ids' => [$rec1->id, $rec2->id],
                'payment_method' => 'bank_transfer',
                'reference_number' => 'REF-XYZ123',
                'notes' => 'Weekly payout for haircut services',
            ]);

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();

        // Assert payout record created
        $this->assertDatabaseHas('commission_payouts', [
            'barber_id' => $this->barber->id,
            'paid_by' => $this->owner->id,
            'payout_amount' => 100000.00,
            'payment_method' => 'bank_transfer',
            'reference_number' => 'REF-XYZ123',
            'notes' => 'Weekly payout for haircut services',
        ]);

        $payout = CommissionPayout::first();

        // Assert commission records are marked as paid
        $this->assertDatabaseHas('commission_records', [
            'id' => $rec1->id,
            'payout_id' => $payout->id,
        ]);
        $this->assertDatabaseHas('commission_records', [
            'id' => $rec2->id,
            'payout_id' => $payout->id,
        ]);
    }

    public function test_owner_can_view_payout_history()
    {
        $rec1 = $this->createCommissionRecord(100000.00, 'INV-001');
        
        $payout = CommissionPayout::create([
            'barber_id' => $this->barber->id,
            'paid_by' => $this->owner->id,
            'payout_amount' => 40000.00,
            'payment_method' => 'cash',
            'reference_number' => null,
            'notes' => 'Cash payout',
            'paid_at' => now(),
        ]);

        $rec1->update(['payout_id' => $payout->id]);

        $response = $this->actingAs($this->owner)
            ->get(route('owner.commissions.payouts', $this->barber->id));

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'payouts');
        $response->assertJsonPath('payouts.0.payout_amount', 40000);
        $response->assertJsonPath('payouts.0.payment_method', 'Tunai');
    }

    public function test_validation_fails_for_empty_record_ids()
    {
        $response = $this->actingAs($this->owner)
            ->post(route('owner.commissions.payout.store', $this->barber->id), [
                'record_ids' => [],
                'payment_method' => 'cash',
            ]);

        $response->assertSessionHasErrors('record_ids');
    }
}
