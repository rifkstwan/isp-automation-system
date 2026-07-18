<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('survey_requests', function (Blueprint $table) {
            if (!Schema::hasColumn('survey_requests', 'email')) {
                $table->string('email')->nullable()->after('phone');
            }
        });
    }

    public function down(): void
    {
        Schema::table('survey_requests', function (Blueprint $table) {
            if (Schema::hasColumn('survey_requests', 'email')) {
                $table->dropColumn('email');
            }
        });
    }
};
