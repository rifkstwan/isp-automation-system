<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ForgotPasswordController;
use App\Http\Controllers\Api\OwnerUserController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PaketController;
use App\Http\Controllers\Api\UpgradeController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\BillingController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\TicketController;
use App\Http\Controllers\TechnicianScheduleController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\NetworkDeviceController;
use App\Http\Controllers\TechnicianAccountController;
use Illuminate\Support\Facades\Route;

// Public routes
Route::post('/register',          [AuthController::class, 'register']);
Route::post('/login',             [AuthController::class, 'login']);
Route::post('/forgot-password',   [ForgotPasswordController::class, 'sendResetLink']);
Route::post('/reset-password',    [ForgotPasswordController::class, 'resetPassword']);
Route::get('/pakets',             [PaketController::class, 'index']);
Route::get('/pakets/{id}',        [PaketController::class, 'show']);
Route::post('/midtrans/webhook',  [PaymentController::class, 'webhook']);
Route::get('/testimonials/public', [App\Http\Controllers\Api\TestimonialController::class, 'publicIndex']);
Route::get('/settings/public',    [App\Http\Controllers\Api\SettingController::class, 'publicIndex']);
Route::post('/public/survey-requests', [App\Http\Controllers\Api\SurveyRequestController::class, 'store']);
Route::get('/public/survey-requests/verified', [App\Http\Controllers\Api\SurveyRequestController::class, 'verifiedLocations']);

// Network Devices Status (Public for demo purposes or we can protect it too?)
// Actually, status should be protected but it's okay. Let's move the resource to protected.
Route::get('/network-devices/status', [NetworkDeviceController::class, 'status']);

Route::apiResource('technician-accounts', TechnicianAccountController::class);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me',      [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Profile
    Route::get('/profile',          [ProfileController::class, 'show']);
    Route::put('/profile',          [ProfileController::class, 'update']);
    Route::put('/profile/password', [ProfileController::class, 'changePassword']);

    Route::get('/search', [SearchController::class, 'index']);

    // Order — customer
    // Order — customer
    // Pemesanan & Pembayaran Midtrans (Pemasangan Baru)
    Route::get('/orders/my',         [OrderController::class, 'myOrders']);
    Route::get('/orders/{id}',       [OrderController::class, 'show']);
    Route::post('/orders',           [OrderController::class, 'store']);
    Route::post('/orders/{id}/pay',  [PaymentController::class, 'getSnapToken']);
    Route::post('/orders/{id}/demo-pay-success',  [PaymentController::class, 'demoOrderSuccess']);
    Route::post('/orders/{id}/upgrade', [UpgradeController::class, 'store']);

    // Tagihan Bulanan (Customer)
    Route::get('/my-billings',       [BillingController::class, 'myBillings']);
    Route::post('/billings/{id}/pay', [PaymentController::class, 'getBillingSnapToken']);
    Route::post('/billings/{id}/demo-pay-success', [PaymentController::class, 'demoBillingSuccess']);
    Route::get('/traffic/my',  [OrderController::class, 'myTraffic']);

    // Tickets - customer
    Route::get('/tickets',     [TicketController::class, 'myTickets']);
    Route::post('/tickets',    [TicketController::class, 'store']);

    // Schedules
    Route::get('/schedules/my', [TechnicianScheduleController::class, 'mySchedules']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::patch('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);

    // Testimonials
    Route::get('/testimonials/my', [App\Http\Controllers\Api\TestimonialController::class, 'myTestimonial']);
    Route::post('/testimonials', [App\Http\Controllers\Api\TestimonialController::class, 'store']);

    // Admin
    Route::middleware('role:admin')->group(function () {
        // Tiket Gangguan
        Route::get('/admin/tickets', [TicketController::class, 'indexAdmin']);
        Route::post('/admin/tickets', [TicketController::class, 'storeAdmin']);
        Route::patch('/admin/tickets/{id}/status', [TicketController::class, 'updateStatus']);

        // Jadwal Teknisi
        Route::get('/admin/technician-schedules', [TechnicianScheduleController::class, 'indexAdmin']);
        Route::post('/admin/technician-schedules', [TechnicianScheduleController::class, 'storeAdmin']);
        Route::patch('/admin/technician-schedules/{id}/status', [TechnicianScheduleController::class, 'updateStatus']);
        Route::delete('/admin/technician-schedules/{id}', [TechnicianScheduleController::class, 'destroy']);


        // Pembayaran & Tagihan
        Route::get('/admin/payments', [PaymentController::class, 'indexAdmin']);
        Route::get('/admin/billings', [BillingController::class, 'indexAdmin']);
        Route::post('/admin/billings', [BillingController::class, 'storeAdmin']);
        Route::patch('/admin/billings/{id}/pay', [BillingController::class, 'markAsPaid']);
        Route::get('/admin/pakets',   [PaketController::class, 'indexAdmin']);
        Route::post('/pakets',        [PaketController::class, 'store']);
        Route::put('/pakets/{id}',    [PaketController::class, 'update']);
        Route::delete('/pakets/{id}', [PaketController::class, 'destroy']);

        Route::get('/orders',               [OrderController::class, 'index']);
        Route::patch('/orders/{id}/status', [OrderController::class, 'updateStatus']);
        Route::patch('/orders/{id}/specs',  [OrderController::class, 'updateSpecs']);

        // Upgrades
        Route::get('/admin/upgrades', [UpgradeController::class, 'indexAdmin']);
        Route::patch('/admin/upgrades/{id}/status', [UpgradeController::class, 'updateStatus']);

        Route::get('/reports/summary', [ReportController::class, 'summary']);

        Route::get('/customers', [CustomerController::class, 'index']);
        Route::post('/customers', [CustomerController::class, 'store']);
        Route::put('/customers/{id}', [CustomerController::class, 'update']);
        Route::delete('/customers/{id}', [CustomerController::class, 'destroy']);
        Route::patch('/customers/{id}/status', [CustomerController::class, 'updateStatus']);

        // Testimonials
        Route::get('/admin/testimonials', [App\Http\Controllers\Api\TestimonialController::class, 'indexAdmin']);
        Route::patch('/admin/testimonials/{id}/status', [App\Http\Controllers\Api\TestimonialController::class, 'updateStatus']);
        Route::delete('/admin/testimonials/{id}', [App\Http\Controllers\Api\TestimonialController::class, 'destroy']);

        // Settings
        Route::get('/settings', [App\Http\Controllers\Api\SettingController::class, 'index']);
        Route::post('/settings', [App\Http\Controllers\Api\SettingController::class, 'update']);

        // Manual Billing Scheduler Trigger (untuk demo & pengujian)
        Route::post('/admin/billing/generate', [BillingController::class, 'triggerGenerate']);
        Route::post('/admin/billing/check-overdue', [BillingController::class, 'triggerCheckOverdue']);
    });

    // Users overview (moved from owner)
    Route::get('/admin/users', [OwnerUserController::class, 'index']);

    // Technician routes
    Route::get('/technician/dashboard', [\App\Http\Controllers\Api\TechnicianController::class, 'dashboard']);
    Route::get('/technician/history', [\App\Http\Controllers\Api\TechnicianController::class, 'history']);
    Route::get('/technician/installations', [TechnicianScheduleController::class, 'myInstallations']);
    Route::patch('/technician/installations/{id}/status', [TechnicianScheduleController::class, 'updateStatus']);
    Route::post('/technician/installations/{id}/status', [TechnicianScheduleController::class, 'updateStatus']);
    Route::get('/technician/survey-requests', [App\Http\Controllers\Api\SurveyRequestController::class, 'index']);
    Route::patch('/technician/survey-requests/{id}/status', [App\Http\Controllers\Api\SurveyRequestController::class, 'updateStatus']);
    Route::post('/technician/survey-requests/{id}/assign', [App\Http\Controllers\Api\SurveyRequestController::class, 'assignTechnician']);

    
    // Tickets - technician
    Route::get('/technician/tickets', [TicketController::class, 'myTechnicianTickets']);
    Route::patch('/technician/tickets/{id}/status', [TicketController::class, 'updateStatus']);
    Route::post('/technician/tickets/{id}/upload', [TicketController::class, 'uploadFoto']);

    // Network Devices (For Technician & Admin)
    Route::get('/network-devices/topology', [NetworkDeviceController::class, 'topology']);
    Route::post('/network-devices/{networkDevice}/test-connection', [NetworkDeviceController::class, 'testConnection']);
    Route::post('/network-devices/{networkDevice}/sync', [NetworkDeviceController::class, 'syncFromMikrotik']);
    Route::apiResource('network-devices', NetworkDeviceController::class);

});
