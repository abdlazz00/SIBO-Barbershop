<?php

namespace App\Events;

use App\Models\Booking;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class BookingEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Tipe event: booking.created, booking.updated, booking.completed, booking.cancelled
     */
    public string $type;

    /**
     * Model Booking yang terkait
     */
    public Booking $booking;

    /**
     * Pesan notifikasi ramah pengguna
     */
    public string $message;

    /**
     * Create a new event instance.
     */
    public function __construct(string $type, Booking $booking, string $message)
    {
        $this->type = $type;
        $this->message = $message;
        
        // Eager load relasi kunci agar data lengkap saat sampai di frontend
        $this->booking = $booking->load(['service', 'barber.user', 'customer']);
    }

    /**
     * Dapatkan channel tempat event ini disiarkan.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('branch.' . $this->booking->branch_id),
        ];
    }

    /**
     * Nama event yang disiarkan di frontend.
     */
    public function broadcastAs(): string
    {
        return 'BookingEvent';
    }
}
