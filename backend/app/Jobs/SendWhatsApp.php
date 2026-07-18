<?php

namespace App\Jobs;

use App\Services\WhatsAppService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendWhatsApp implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public string $phone;
    public string $message;

    /**
     * Create a new job instance.
     */
    public function __construct(string $phone, string $message)
    {
        $this->phone = $phone;
        $this->message = $message;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        Log::channel('single')->info("Processing queued WhatsApp message to {$this->phone}");
        
        $success = WhatsAppService::sendMessageDirectly($this->phone, $this->message);
        
        if ($success) {
            Log::channel('single')->info("Queued WhatsApp message to {$this->phone} successfully sent.");
        } else {
            Log::channel('single')->error("Failed to send queued WhatsApp message to {$this->phone}.");
            throw new \Exception("Failed to send WhatsApp message via provider.");
        }
    }
}
