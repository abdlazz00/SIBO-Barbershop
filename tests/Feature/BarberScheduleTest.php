<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Branch;
use App\Models\Barber;
use App\Models\Booking;
use App\Models\Service;
use App\Models\WeeklySchedule;
use App\Models\LeaveSchedule;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Carbon\Carbon;

class BarberScheduleTest extends TestCase
{
    use RefreshDatabase;

    protected $barberUser;
    protected $barber;
    protected $branch;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branch = Branch::create([
            'name' => 'Kemang Branch',
            'address' => 'Kemang Raya No. 4',
            'phone' => '021123456',
        ]);

        $this->barberUser = User::factory()->create([
            'role' => 'barber',
            'name' => 'Cecep Barber',
            'branch_id' => $this->branch->id,
        ]);

        $this->barber = Barber::create([
            'user_id' => $this->barberUser->id,
            'branch_id' => $this->branch->id,
            'name' => 'Cecep Barber',
            'commission_percentage' => 40,
            'status' => 'active',
        ]);
    }

    public function test_barber_can_access_schedule_page()
    {
        $response = $this->actingAs($this->barberUser)
            ->get(route('barber.schedules.index'));

        $response->assertStatus(200);
    }

    public function test_barber_can_fetch_schedule_calendar_data()
    {
        // 1. Create weekly schedule template (make Monday a working day)
        WeeklySchedule::create([
            'barber_id' => $this->barber->id,
            'day_of_week' => 1, // Monday
            'start_time' => '09:00:00',
            'end_time' => '17:00:00',
            'is_off' => false,
        ]);

        // 2. Create leave schedule on a specific date (e.g. 2026-06-15, which is a Monday)
        LeaveSchedule::create([
            'barber_id' => $this->barber->id,
            'leave_date' => '2026-06-15',
            'notes' => 'Cuti sakit',
        ]);

        // 3. Create a booking on another date (e.g. 2026-06-22, which is also a Monday)
        $service = Service::create([
            'name' => 'Gentlemens Cut',
            'category' => 'Haircut',
            'duration_minutes' => 45,
            'default_price' => 80000,
        ]);

        Booking::create([
            'branch_id' => $this->branch->id,
            'barber_id' => $this->barber->id,
            'service_id' => $service->id,
            'guest_name' => 'Andi Customer',
            'guest_phone' => '08123456789',
            'slot_start' => Carbon::parse('2026-06-22 10:00:00'),
            'slot_end' => Carbon::parse('2026-06-22 10:45:00'),
            'status' => 'confirmed',
        ]);

        // Fetch calendar data for June 2026
        $response = $this->actingAs($this->barberUser)
            ->get(route('barber.schedules.data', [
                'month' => 6,
                'year' => 2026,
            ]));

        $response->assertStatus(200);
        
        // Assertions on the days array
        $days = $response->json('days');
        $this->assertCount(30, $days); // June has 30 days

        // Day 15 (Index 14): Leave day
        $day15 = $days[14];
        $this->assertEquals('2026-06-15', $day15['date']);
        $this->assertTrue($day15['is_off']);
        $this->assertStringContainsString('Cuti sakit', $day15['off_reason']);

        // Day 22 (Index 21): Working day with booking
        $day22 = $days[21];
        $this->assertEquals('2026-06-22', $day22['date']);
        $this->assertFalse($day22['is_off']);
        $this->assertEquals('09:00 - 17:00', $day22['shift_hours']);
        $this->assertCount(1, $day22['bookings']);
        $this->assertEquals('Andi Customer', $day22['bookings'][0]['customer_name']);
        $this->assertEquals('Gentlemens Cut', $day22['bookings'][0]['service_name']);
    }

    public function test_non_barber_cannot_access_barber_schedule_page()
    {
        $cashierUser = User::factory()->create([
            'role' => 'cashier',
            'branch_id' => $this->branch->id,
        ]);

        $response = $this->actingAs($cashierUser)
            ->get(route('barber.schedules.index'));

        $response->assertRedirect('/cashier/dashboard');
    }
}
