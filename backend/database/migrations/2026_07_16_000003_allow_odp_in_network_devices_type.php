<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Drop existing Postgres enum check constraint and re-add with 'ODP' included
        DB::statement("ALTER TABLE network_devices DROP CONSTRAINT IF EXISTS network_devices_type_check");
        DB::statement("ALTER TABLE network_devices ADD CONSTRAINT network_devices_type_check CHECK (type::text IN ('Router', 'Switch', 'OLT', 'ODP', 'Access Point', 'Server', 'Other'))");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE network_devices DROP CONSTRAINT IF EXISTS network_devices_type_check");
        DB::statement("ALTER TABLE network_devices ADD CONSTRAINT network_devices_type_check CHECK (type::text IN ('Router', 'Switch', 'OLT', 'Access Point', 'Server', 'Other'))");
    }
};
