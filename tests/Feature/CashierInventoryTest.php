<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Branch;
use App\Models\Product;
use App\Models\BranchProductStock;
use App\Models\ProductStockMutation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CashierInventoryTest extends TestCase
{
    use RefreshDatabase;

    protected $cashier;
    protected $branch;
    protected $product;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Create a Branch
        $this->branch = Branch::create([
            'name' => 'Senopati Branch',
            'address' => 'Senopati Raya No. 4',
            'phone' => '021999888',
        ]);

        // 2. Create a Cashier user assigned to the branch
        $this->cashier = User::factory()->create([
            'role' => 'cashier',
            'branch_id' => $this->branch->id,
        ]);

        // 3. Create a Product and initialize branch stock
        $this->product = Product::create([
            'name' => 'Pomade Extreme Hold',
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

    public function test_cashier_can_list_products()
    {
        $response = $this->actingAs($this->cashier)
            ->get(route('cashier.products.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Cashier/Products')
            ->has('products', 1)
            ->where('products.0.name', 'Pomade Extreme Hold')
        );
    }

    public function test_cashier_can_register_new_product_and_set_initial_stock()
    {
        $response = $this->actingAs($this->cashier)
            ->post(route('cashier.products.store'), [
                'name' => 'Hair Tonic Ginseng',
                'category' => 'Tonic',
                'price' => 150000.00,
                'stock' => 15,
            ]);

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();

        // Assert global product created
        $product = Product::where('name', 'Hair Tonic Ginseng')->first();
        $this->assertNotNull($product);

        // Assert stock initialized for cashier's branch
        $stock = BranchProductStock::where('product_id', $product->id)
            ->where('branch_id', $this->branch->id)
            ->value('stock');
        $this->assertEquals(15, $stock);

        // Assert mutation logged
        $this->assertDatabaseHas('product_stock_mutations', [
            'product_id' => $product->id,
            'branch_id' => $this->branch->id,
            'type' => 'in_restock',
            'qty' => 15,
            'stock_before' => 0,
            'stock_after' => 15,
            'notes' => 'Registrasi produk & stok awal (Kasir)',
            'created_by' => $this->cashier->id,
        ]);
    }

    public function test_cashier_can_restock_product()
    {
        $response = $this->actingAs($this->cashier)
            ->post(route('cashier.products.restock', $this->product->id), [
                'qty' => 5,
                'notes' => 'Restock from center supplier',
            ]);

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();

        // Assert stock updated
        $stock = BranchProductStock::where('product_id', $this->product->id)
            ->where('branch_id', $this->branch->id)
            ->value('stock');
        $this->assertEquals(15, $stock);

        // Assert mutation logged
        $this->assertDatabaseHas('product_stock_mutations', [
            'product_id' => $this->product->id,
            'branch_id' => $this->branch->id,
            'type' => 'in_restock',
            'qty' => 5,
            'stock_before' => 10,
            'stock_after' => 15,
            'notes' => 'Restock from center supplier',
        ]);
    }

    public function test_cashier_can_adjust_product_stock_opname()
    {
        $response = $this->actingAs($this->cashier)
            ->post(route('cashier.products.adjust', $this->product->id), [
                'actual_stock' => 8,
                'notes' => 'Damaged item correction',
            ]);

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();

        // Assert stock updated
        $stock = BranchProductStock::where('product_id', $this->product->id)
            ->where('branch_id', $this->branch->id)
            ->value('stock');
        $this->assertEquals(8, $stock);

        // Assert mutation logged
        $this->assertDatabaseHas('product_stock_mutations', [
            'product_id' => $this->product->id,
            'branch_id' => $this->branch->id,
            'type' => 'out_opname_correction',
            'qty' => 2,
            'stock_before' => 10,
            'stock_after' => 8,
            'notes' => 'Damaged item correction',
        ]);
    }

    public function test_cashier_can_bulk_restock_products()
    {
        $product2 = Product::create([
            'name' => 'Hair Clay Matt',
            'category' => 'Pomade',
            'price' => 135000.00,
            'status' => 'active',
        ]);

        BranchProductStock::create([
            'product_id' => $product2->id,
            'branch_id' => $this->branch->id,
            'stock' => 5,
        ]);

        $response = $this->actingAs($this->cashier)
            ->post(route('cashier.products.restock.bulk'), [
                'items' => [
                    ['product_id' => $this->product->id, 'qty' => 5],
                    ['product_id' => $product2->id, 'qty' => 10],
                ],
                'notes' => 'Weekly Restock arrival',
            ]);

        $response->assertRedirect(route('cashier.products.index'));
        $response->assertSessionHasNoErrors();

        // Assert stock updated
        $this->assertEquals(15, BranchProductStock::where('product_id', $this->product->id)->where('branch_id', $this->branch->id)->value('stock'));
        $this->assertEquals(15, BranchProductStock::where('product_id', $product2->id)->where('branch_id', $this->branch->id)->value('stock'));
    }

    public function test_cashier_can_bulk_adjust_products()
    {
        $product2 = Product::create([
            'name' => 'Hair Clay Matt',
            'category' => 'Pomade',
            'price' => 135000.00,
            'status' => 'active',
        ]);

        BranchProductStock::create([
            'product_id' => $product2->id,
            'branch_id' => $this->branch->id,
            'stock' => 5,
        ]);

        $response = $this->actingAs($this->cashier)
            ->post(route('cashier.products.adjust.bulk'), [
                'items' => [
                    ['product_id' => $this->product->id, 'actual_stock' => 8, 'notes' => 'Audit loss'],
                    ['product_id' => $product2->id, 'actual_stock' => 7, 'notes' => 'Audit surplus'],
                ],
            ]);

        $response->assertRedirect(route('cashier.products.index'));
        $response->assertSessionHasNoErrors();

        // Assert stock updated
        $this->assertEquals(8, BranchProductStock::where('product_id', $this->product->id)->where('branch_id', $this->branch->id)->value('stock'));
        $this->assertEquals(7, BranchProductStock::where('product_id', $product2->id)->where('branch_id', $this->branch->id)->value('stock'));
    }
}
