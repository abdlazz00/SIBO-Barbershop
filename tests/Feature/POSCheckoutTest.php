<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Branch;
use App\Models\Barber;
use App\Models\Service;
use App\Models\Booking;
use App\Models\Product;
use App\Models\BranchProductStock;
use App\Models\ProductStockMutation;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\CommissionRecord;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class POSCheckoutTest extends TestCase
{
    use RefreshDatabase;

    protected $cashier;
    protected $barberUser;
    protected $barber;
    protected $branch;
    protected $service;
    protected $product;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Create a Branch
        $this->branch = Branch::create([
            'name' => 'Premium Howell Senopati',
            'address' => 'Senopati St. No. 12, Jakarta',
            'phone' => '08111222333',
        ]);

        // 2. Create a Cashier user assigned to this branch
        $this->cashier = User::factory()->create([
            'role' => 'cashier',
            'branch_id' => $this->branch->id,
        ]);

        // 3. Create a Barber user & profile
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

        // 4. Create a Service
        $this->service = Service::create([
            'name' => 'Signature Haircut',
            'category' => 'Haircut',
            'duration_minutes' => 45,
            'default_price' => 100000.00,
            'status' => 'active',
        ]);

        // 5. Create a Product and initialize branch stock
        $this->product = Product::create([
            'name' => 'Premium Strong Hold Pomade',
            'category' => 'Pomade',
            'price' => 120000.00,
            'status' => 'active',
        ]);

        BranchProductStock::create([
            'product_id' => $this->product->id,
            'branch_id' => $this->branch->id,
            'stock' => 10,
        ]);
    }

    /**
     * Test case 1: Cashier checkout of a haircut booking + added products
     */
    public function test_cashier_can_checkout_haircut_booking_with_products()
    {
        // Create an in_progress booking
        $booking = Booking::create([
            'branch_id' => $this->branch->id,
            'guest_name' => 'Customer Budi',
            'guest_phone' => '0812345678',
            'barber_id' => $this->barber->id,
            'service_id' => $this->service->id,
            'slot_start' => now()->subMinutes(45),
            'slot_end' => now(),
            'status' => 'in_progress',
        ]);

        $response = $this->actingAs($this->cashier)
            ->post(route('cashier.pos.checkout'), [
                'booking_id' => $booking->id,
                'payment_type' => 'cash',
                'products' => [
                    [
                        'id' => $this->product->id,
                        'qty' => 1,
                    ]
                ]
            ]);

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();

        // 1. Assert transaction is created in the database
        $transaction = Transaction::where('booking_id', $booking->id)->first();
        $this->assertNotNull($transaction);
        $this->assertEquals(100000.00, $transaction->total_service);
        $this->assertEquals(120000.00, $transaction->total_product);
        $this->assertEquals(220000.00, $transaction->grand_total);
        $this->assertEquals('cash', $transaction->payment_type);

        // 2. Assert transaction items are created
        $this->assertDatabaseHas('transaction_items', [
            'transaction_id' => $transaction->id,
            'item_type' => 'service',
            'reference_id' => $this->service->id,
            'qty' => 1,
            'unit_price' => 100000.00,
        ]);

        $this->assertDatabaseHas('transaction_items', [
            'transaction_id' => $transaction->id,
            'item_type' => 'product',
            'reference_id' => $this->product->id,
            'qty' => 1,
            'unit_price' => 120000.00,
        ]);

        // 3. Assert stock decrement and stock mutation record
        $this->assertEquals(9, BranchProductStock::where('product_id', $this->product->id)
            ->where('branch_id', $this->branch->id)->value('stock'));

        $this->assertDatabaseHas('product_stock_mutations', [
            'product_id' => $this->product->id,
            'branch_id' => $this->branch->id,
            'type' => 'out_sale',
            'reference_id' => $transaction->id,
            'qty' => 1,
            'stock_before' => 10,
            'stock_after' => 9,
        ]);

        // 4. Assert Barber commission record is created (40% of 100,000 = 40,000)
        $this->assertDatabaseHas('commission_records', [
            'transaction_id' => $transaction->id,
            'barber_id' => $this->barber->id,
            'service_amount' => 100000.00,
            'percentage' => 40.00,
            'commission_amount' => 40000.00,
        ]);

        // 5. Assert booking status is completed
        $this->assertEquals('completed', $booking->fresh()->status);
    }

    /**
     * Test case 2: Cashier checkout of products only (Direct Retail Purchase)
     */
    public function test_cashier_can_checkout_products_only()
    {
        $response = $this->actingAs($this->cashier)
            ->post(route('cashier.pos.checkout'), [
                'booking_id' => null,
                'payment_type' => 'qris',
                'products' => [
                    [
                        'id' => $this->product->id,
                        'qty' => 2,
                    ]
                ]
            ]);

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();

        // 1. Assert transaction is created
        $transaction = Transaction::whereNull('booking_id')->first();
        $this->assertNotNull($transaction);
        $this->assertEquals(0.00, $transaction->total_service);
        $this->assertEquals(240000.00, $transaction->total_product);
        $this->assertEquals(240000.00, $transaction->grand_total);
        $this->assertEquals('qris', $transaction->payment_type);

        // 2. Assert transaction items
        $this->assertDatabaseHas('transaction_items', [
            'transaction_id' => $transaction->id,
            'item_type' => 'product',
            'reference_id' => $this->product->id,
            'qty' => 2,
            'unit_price' => 120000.00,
        ]);

        // 3. Assert stock decrement and stock mutation
        $this->assertEquals(8, BranchProductStock::where('product_id', $this->product->id)
            ->where('branch_id', $this->branch->id)->value('stock'));

        $this->assertDatabaseHas('product_stock_mutations', [
            'product_id' => $this->product->id,
            'branch_id' => $this->branch->id,
            'type' => 'out_sale',
            'reference_id' => $transaction->id,
            'qty' => 2,
            'stock_before' => 10,
            'stock_after' => 8,
        ]);

        // 4. Assert no commission record exists (since no booking / service was purchased)
        $this->assertEquals(0, CommissionRecord::where('transaction_id', $transaction->id)->count());
    }

    /**
     * Test case 3: Cashier can view transaction history page and apply filters
     */
    public function test_cashier_can_view_transaction_history_and_apply_filters()
    {
        // Create a transaction
        $transaction = Transaction::create([
            'invoice_number' => 'TRX-20260615-001',
            'booking_id' => null,
            'cashier_id' => $this->cashier->id,
            'payment_type' => 'transfer',
            'total_service' => 0.00,
            'total_product' => 120000.00,
            'grand_total' => 120000.00,
        ]);

        $response = $this->actingAs($this->cashier)
            ->get(route('cashier.transactions.index', [
                'search' => 'TRX-20260615-001',
                'payment_type' => 'transfer'
            ]));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Cashier/Transactions')
            ->has('transactions', 1)
            ->where('transactions.0.invoice_number', 'TRX-20260615-001')
        );
    }

    /**
     * Test case 4: Owner can view transaction history page and filter across branches
     */
    public function test_owner_can_view_transaction_history_across_branches_and_apply_filters()
    {
        $owner = User::factory()->create([
            'role' => 'owner',
            'branch_id' => null,
        ]);

        // Create transaction in branch 1 (Senopati)
        $tx1 = Transaction::create([
            'invoice_number' => 'TRX-SENOPATI-01',
            'booking_id' => null,
            'cashier_id' => $this->cashier->id, // cashier branch is Senopati
            'payment_type' => 'cash',
            'total_service' => 0.00,
            'total_product' => 120000.00,
            'grand_total' => 120000.00,
        ]);

        // Create another branch & cashier
        $branch2 = Branch::create([
            'name' => 'Premium Howell Kemang',
            'address' => 'Kemang St. No. 12',
            'phone' => '08123456789',
        ]);
        $cashier2 = User::factory()->create([
            'role' => 'cashier',
            'branch_id' => $branch2->id,
        ]);

        // Create transaction in branch 2 (Kemang)
        $tx2 = Transaction::create([
            'invoice_number' => 'TRX-KEMANG-01',
            'booking_id' => null,
            'cashier_id' => $cashier2->id,
            'payment_type' => 'qris',
            'total_service' => 0.00,
            'total_product' => 120000.00,
            'grand_total' => 120000.00,
        ]);

        // Owner queries all
        $response = $this->actingAs($owner)
            ->get(route('owner.transactions.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Owner/Transactions')
            ->has('transactions', 2)
        );

        // Owner filters by Branch 2 (Kemang)
        $responseFiltered = $this->actingAs($owner)
            ->get(route('owner.transactions.index', [
                'branch_id' => $branch2->id
            ]));

        $responseFiltered->assertStatus(200);
        $responseFiltered->assertInertia(fn ($page) => $page
            ->component('Owner/Transactions')
            ->has('transactions', 1)
            ->where('transactions.0.invoice_number', 'TRX-KEMANG-01')
        );
    }

    /**
     * Test case 5: Owner can view transaction receipt page
     */
    public function test_owner_can_view_transaction_receipt()
    {
        $owner = User::factory()->create([
            'role' => 'owner',
            'branch_id' => null,
        ]);

        $transaction = Transaction::create([
            'invoice_number' => 'TRX-20260615-999',
            'booking_id' => null,
            'cashier_id' => $this->cashier->id,
            'payment_type' => 'qris',
            'total_service' => 0.00,
            'total_product' => 240000.00,
            'grand_total' => 240000.00,
        ]);

        $response = $this->actingAs($owner)
            ->get(route('owner.transactions.receipt', $transaction->uuid));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Cashier/Receipt')
            ->where('transaction.invoice_number', 'TRX-20260615-999')
            // Assert that cashier and branch names are resolved correctly
            ->where('transaction.cashier_name', $this->cashier->name)
            ->where('branch.name', 'Premium Howell Senopati')
        );
    }
}
