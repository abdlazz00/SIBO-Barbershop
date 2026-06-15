<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Branch;
use App\Models\Product;
use App\Models\ProductStockMutation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductStockTest extends TestCase
{
    use RefreshDatabase;

    protected $owner;
    protected $cashier;
    protected $branch;
    protected $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branch = Branch::create([
            'name' => 'Kemang Branch',
            'address' => 'Kemang Raya No. 4',
            'phone' => '021123456',
        ]);

        $this->owner = User::factory()->create([
            'role' => 'owner',
            'branch_id' => null,
        ]);

        $this->cashier = User::factory()->create([
            'role' => 'cashier',
            'branch_id' => $this->branch->id,
        ]);

        $this->product = Product::create([
            'branch_id' => $this->branch->id,
            'name' => 'Pomade Classic',
            'category' => 'Pomade',
            'price' => 120000.00,
            'stock' => 10,
            'status' => 'active',
        ]);
    }

    public function test_owner_can_restock_product()
    {
        $response = $this->actingAs($this->owner)
            ->post(route('owner.products.restock', $this->product->id), [
                'qty' => 15,
                'notes' => 'Received from supplier A',
            ]);

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();

        // Check stock updated
        $this->product->refresh();
        $this->assertEquals(25, $this->product->stock);

        // Check mutation recorded
        $this->assertDatabaseHas('product_stock_mutations', [
            'product_id' => $this->product->id,
            'type' => 'in_restock',
            'qty' => 15,
            'stock_before' => 10,
            'stock_after' => 25,
            'notes' => 'Received from supplier A',
            'created_by' => $this->owner->id,
        ]);
    }

    public function test_owner_can_adjust_product_stock_opname_positive()
    {
        $response = $this->actingAs($this->owner)
            ->post(route('owner.products.adjust', $this->product->id), [
                'actual_stock' => 12,
                'notes' => 'Stock opname adjustment',
            ]);

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();

        // Check stock updated
        $this->product->refresh();
        $this->assertEquals(12, $this->product->stock);

        // Check mutation recorded
        $this->assertDatabaseHas('product_stock_mutations', [
            'product_id' => $this->product->id,
            'type' => 'in_opname_correction',
            'qty' => 2, // 12 - 10 = +2
            'stock_before' => 10,
            'stock_after' => 12,
            'notes' => 'Stock opname adjustment',
            'created_by' => $this->owner->id,
        ]);
    }

    public function test_owner_can_adjust_product_stock_opname_negative()
    {
        $response = $this->actingAs($this->owner)
            ->post(route('owner.products.adjust', $this->product->id), [
                'actual_stock' => 7,
                'notes' => 'Broken display item',
            ]);

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();

        // Check stock updated
        $this->product->refresh();
        $this->assertEquals(7, $this->product->stock);

        // Check mutation recorded
        $this->assertDatabaseHas('product_stock_mutations', [
            'product_id' => $this->product->id,
            'type' => 'out_opname_correction',
            'qty' => 3, // 10 - 7 = -3
            'stock_before' => 10,
            'stock_after' => 7,
            'notes' => 'Broken display item',
            'created_by' => $this->owner->id,
        ]);
    }

    public function test_owner_can_fetch_product_mutations_history()
    {
        // Create a mutation
        ProductStockMutation::create([
            'product_id' => $this->product->id,
            'type' => 'in_restock',
            'qty' => 5,
            'stock_before' => 10,
            'stock_after' => 15,
            'notes' => 'Supplier load',
            'created_by' => $this->owner->id,
        ]);

        $response = $this->actingAs($this->owner)
            ->get(route('owner.products.mutations', $this->product->id));

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'mutations');
        $response->assertJsonPath('mutations.0.type_label', 'Stok Masuk (Restock)');
        $response->assertJsonPath('mutations.0.qty', 5);
        $response->assertJsonPath('mutations.0.operator', $this->owner->name);
    }
}
