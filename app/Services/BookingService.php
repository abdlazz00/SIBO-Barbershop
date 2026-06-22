<?php

namespace App\Services;

use App\Repositories\Interfaces\BranchRepositoryInterface;
use App\Repositories\Interfaces\BarberRepositoryInterface;
use App\Repositories\Interfaces\ServiceRepositoryInterface;
use App\Repositories\Interfaces\BookingRepositoryInterface;
use App\Services\ScheduleService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Exception;

class BookingService
{
    protected $branchRepo;
    protected $barberRepo;
    protected $serviceRepo;
    protected $bookingRepo;
    protected $scheduleService;

    public function __construct(
        BranchRepositoryInterface $branchRepo,
        BarberRepositoryInterface $barberRepo,
        ServiceRepositoryInterface $serviceRepo,
        BookingRepositoryInterface $bookingRepo,
        ScheduleService $scheduleService
    ) {
        $this->branchRepo = $branchRepo;
        $this->barberRepo = $barberRepo;
        $this->serviceRepo = $serviceRepo;
        $this->bookingRepo = $bookingRepo;
        $this->scheduleService = $scheduleService;
    }

    public function getAllBranches()
    {
        return $this->branchRepo->getActiveBranches();
    }

    public function getActiveServices()
    {
        return $this->serviceRepo->getActiveServices();
    }

    public function getBarbersForBranch(int $branchId)
    {
        return $this->barberRepo->getActiveBarbersByBranch($branchId);
    }

    public function getServicesForBarber(int $barberId)
    {
        return $this->serviceRepo->getServicesWithBarberPrice($barberId);
    }

    public function createBooking(array $data)
    {
        $service = $this->serviceRepo->findOrFail($data['service_id']);
        $duration = $service->duration_minutes;

        // Calculate slot start and end
        $slotStart = Carbon::parse($data['date'] . ' ' . $data['time']);
        $slotEnd = $slotStart->copy()->addMinutes($duration);

        // Check collision using Repository
        $collisions = $this->bookingRepo->getActiveOverlappingBookings($data['barber_id'], $slotStart, $slotEnd);
        if ($collisions->isNotEmpty()) {
            throw new Exception('Slot waktu terpilih sudah di-booking pelanggan lain baru saja. Silahkan pilih slot lain.');
        }

        // Verify available slot using ScheduleService
        $availableSlots = $this->scheduleService->getAvailableSlots(
            $data['barber_id'],
            $data['date'],
            $data['service_id']
        );

        if (!in_array($data['time'], $availableSlots)) {
            throw new Exception('Slot waktu terpilih tidak valid atau berada di luar jam kerja barber.');
        }

        // Save booking data
        $bookingData = [
            'branch_id' => $data['branch_id'],
            'barber_id' => $data['barber_id'],
            'service_id' => $data['service_id'],
            'slot_start' => $slotStart,
            'slot_end' => $slotEnd,
            'status' => 'confirmed',
        ];

        if (Auth::check()) {
            $bookingData['customer_id'] = Auth::id();
        } else {
            if (empty($data['guest_name']) || empty($data['guest_phone'])) {
                throw new Exception('Informasi nama tamu dan kontak whatsapp wajib diisi.');
            }
            $bookingData['guest_name'] = $data['guest_name'];
            $bookingData['guest_phone'] = $data['guest_phone'];
        }

        $booking = $this->bookingRepo->create($bookingData);

        try {
            $customerName = $booking->customer ? $booking->customer->name : $booking->guest_name;
            $serviceName = $booking->service ? $booking->service->name : 'layanan';
            $timeStr = $booking->slot_start->format('H:i');
            $message = "Booking baru dari {$customerName} untuk {$serviceName} pada pukul {$timeStr}";
            
            broadcast(new \App\Events\BookingEvent('booking.created', $booking, $message));
        } catch (\Exception $e) {
            logger()->error('Gagal melakukan broadcast event booking.created: ' . $e->getMessage());
        }

        return $booking;
    }

    public function getAvailableSlots(int $barberId, string $date, int $serviceId)
    {
        return $this->scheduleService->getAvailableSlots($barberId, $date, $serviceId);
    }

    public function getBookingDetailsForInvoice(string $uuid)
    {
        $booking = $this->bookingRepo->findByUuid($uuid, ['branch', 'service', 'barber.user', 'customer']);
        $servicesWithPrice = $this->serviceRepo->getServicesWithBarberPrice($booking->barber_id);
        $serviceObj = collect($servicesWithPrice)->firstWhere('id', $booking->service_id);
        $price = $serviceObj ? $serviceObj['price'] : $booking->service->default_price;

        return [
            'uuid' => $booking->uuid,
            'branch_name' => $booking->branch->name,
            'branch_address' => $booking->branch->address,
            'service_name' => $booking->service->name,
            'service_duration' => $booking->service->duration_minutes,
            'barber_name' => $booking->barber->user->name,
            'slot_start' => $booking->slot_start->format('d M Y, H:i'),
            'slot_end' => $booking->slot_end->format('H:i'),
            'price' => (float) $price,
            'customer_name' => $booking->customer ? $booking->customer->name : $booking->guest_name,
            'customer_phone' => $booking->customer ? $booking->customer->phone : $booking->guest_phone,
        ];
    }
}
