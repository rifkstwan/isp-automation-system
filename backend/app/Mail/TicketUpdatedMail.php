<?php

namespace App\Mail;

use App\Models\Ticket;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TicketUpdatedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Ticket $ticket) {}

    public function envelope(): Envelope
    {
        $statusIndo = match($this->ticket->status) {
            'diproses' => 'Sedang Diproses',
            'selesai'  => 'Telah Selesai',
            default    => strtoupper($this->ticket->status)
        };

        return new Envelope(subject: "🔔 Update Tiket Gangguan #{$this->ticket->id} [{$statusIndo}] - CV Citra Mandiri");
    }

    public function content(): Content
    {
        return new Content(view: 'emails.ticket-updated');
    }
}
