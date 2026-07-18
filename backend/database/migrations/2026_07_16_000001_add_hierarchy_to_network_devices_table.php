<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('network_devices', function (Blueprint $table) {
            $table->foreignId('parent_device_id')
                  ->nullable()
                  ->constrained('network_devices')
                  ->nullOnDelete()
                  ->after('last_seen_at');
            $table->string('wilayah')->nullable()->after('parent_device_id');
            $table->text('keterangan')->nullable()->after('wilayah');
        });
    }

    public function down(): void
    {
        Schema::table('network_devices', function (Blueprint $table) {
            $table->dropForeign(['parent_device_id']);
            $table->dropColumn(['parent_device_id', 'wilayah', 'keterangan']);
        });
    }
};
