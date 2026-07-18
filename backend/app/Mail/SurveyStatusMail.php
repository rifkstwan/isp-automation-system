<?php

namespace App\Mail;

use App\Models\SurveyRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SurveyStatusMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public SurveyRequest $survey) {}

    public function envelope(): Envelope
    {
        $subject = match ($this->survey->status) {
            'layak'       => '✅ Lokasi Anda Verified LAYAK & Terjangkau - CV Citra Mandiri',
            'ditolak'     => '❌ Pemberitahuan Hasil Survey Lokasi - CV Citra Mandiri',
            'dijadwalkan' => '📅 Jadwal Kunjungan Survey Lokasi - CV Citra Mandiri',
            default       => 'ℹ️ Pembaruan Permohonan Survey Lokasi - CV Citra Mandiri',
        };

        return new Envelope(subject: $subject);
    }

    public function content(): Content
    {
        return new Content(view: 'emails.survey-status');
    }
}
