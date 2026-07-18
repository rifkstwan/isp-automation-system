<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('survey_requests', function (Blueprint $table) {
            if (!Schema::hasColumn('survey_requests', 'nama_teknisi')) {
                $table->string('nama_teknisi')->nullable()->after('catatan');
            }
            if (!Schema::hasColumn('survey_requests', 'tanggal_survey')) {
                $table->dateTime('tanggal_survey')->nullable()->after('nama_teknisi');
            }
        });

        // Change status column type or drop check constraint if PostgreSQL enum constraint exists
        try {
            DB::statement("ALTER TABLE survey_requests DROP CONSTRAINT IF EXISTS survey_requests_status_check;");
            DB::statement("ALTER TABLE survey_requests ALTER COLUMN status TYPE VARCHAR(255);");
        } catch (\Exception $e) {
            \Log::info("Migration status update info: " . $e->getMessage());
        }
    }

    public function down(): void
    {
        Schema::table('survey_requests', function (Blueprint $table) {
            if (Schema::hasColumn('survey_requests', 'nama_teknisi')) {
                $table->dropColumn('nama_teknisi');
            }
            if (Schema::hasColumn('survey_requests', 'tanggal_survey')) {
                $table->dropColumn('tanggal_survey');
            }
        });
    }
};
