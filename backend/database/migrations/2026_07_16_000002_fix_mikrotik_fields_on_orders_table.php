<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Only add columns if they don't exist yet (safe re-run)
        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'mikrotik_username')) {
                $table->string('mikrotik_username')->nullable()->after('total_harga');
            }
            if (!Schema::hasColumn('orders', 'mikrotik_password')) {
                $table->string('mikrotik_password')->nullable()->after('mikrotik_username');
            }
            if (!Schema::hasColumn('orders', 'network_device_id')) {
                $table->foreignId('network_device_id')
                      ->nullable()
                      ->constrained('network_devices')
                      ->nullOnDelete()
                      ->after('mikrotik_password');
            }
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (Schema::hasColumn('orders', 'network_device_id')) {
                $table->dropForeign(['network_device_id']);
                $table->dropColumn('network_device_id');
            }
            if (Schema::hasColumn('orders', 'mikrotik_username')) {
                $table->dropColumn('mikrotik_username');
            }
            if (Schema::hasColumn('orders', 'mikrotik_password')) {
                $table->dropColumn('mikrotik_password');
            }
        });
    }
};
